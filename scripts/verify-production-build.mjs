import {readFileSync, existsSync, readdirSync, statSync} from 'node:fs';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {requiredDocIds} from './docs-manifest.mjs';
import {parse} from 'parse5';
import {verifyProduction} from './verify-production.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const buildRoot = join(projectRoot, 'build');

function buildFixtureFetch(url) {
  const {pathname} = new URL(url);
  let relativePath;
  let contentType;
  if (pathname === '/robots.txt' || pathname === '/llms.txt') {
    relativePath = pathname.slice(1);
    contentType = 'text/plain; charset=utf-8';
  } else if (pathname === '/sitemap.xml') {
    relativePath = 'sitemap.xml';
    contentType = 'application/xml';
  } else if (pathname.endsWith('.md')) {
    relativePath = pathname.slice(1);
    contentType = 'text/markdown; charset=utf-8';
  } else if (pathname.startsWith('/guide/')) {
    relativePath = `${pathname.slice(1)}.html`;
    contentType = 'text/html; charset=utf-8';
  } else {
    return Promise.resolve(new Response('not found', {status: 404, headers: {'content-type': 'text/plain'}}));
  }
  try {
    return Promise.resolve(new Response(readFileSync(join(buildRoot, relativePath)), {status: 200, headers: {'content-type': contentType}}));
  } catch {
    return Promise.resolve(new Response('not found', {status: 404, headers: {'content-type': 'text/plain'}}));
  }
}

await verifyProduction({projectRoot, fetchImpl: buildFixtureFetch, retries: 1, delayMs: 0});
const homeDocument = parse(readFileSync(join(buildRoot, 'index.html'), 'utf8'));
const navbarLogoImages = [];
const optimizedLogoImages = [];
const attrsOf = (node) => Object.fromEntries((node.attrs ?? []).map(({name, value}) => [name, value]));
const hasClass = (attrs, name) => (attrs.class ?? '').split(/\s+/).includes(name);
function collectImages(node, ancestors = []) {
  const attrs = attrsOf(node);
  if (node.nodeName === 'img') {
    if (attrs.src === '/img/certilife-logo-172.png') optimizedLogoImages.push({attrs, ancestors});
    const [navbar, inner, items, brand, logo] = ancestors.slice(-5);
    if (
      navbar?.nodeName === 'nav' && hasClass(navbar.attrs, 'navbar') &&
      inner?.nodeName === 'div' && hasClass(inner.attrs, 'navbar__inner') &&
      items?.nodeName === 'div' && hasClass(items.attrs, 'navbar__items') &&
      brand?.nodeName === 'a' && hasClass(brand.attrs, 'navbar__brand') && brand.attrs.href === '/' &&
      logo?.nodeName === 'div' && hasClass(logo.attrs, 'navbar__logo')
    ) navbarLogoImages.push(attrs);
  }
  const nextAncestors = [...ancestors, {nodeName: node.nodeName, attrs}];
  for (const child of node.childNodes ?? []) collectImages(child, nextAncestors);
}
collectImages(homeDocument);
const themeVariants = navbarLogoImages.map((image) =>
  (image.class ?? '').split(/\s+/).flatMap((name) => {
    const match = name.match(/^themedComponent--(light|dark)_/);
    return match ? [match[1]] : [];
  }),
);
const themeVariantCounts = new Map(['light', 'dark'].map((variant) => [
  variant,
  themeVariants.filter((variants) => variants.length === 1 && variants[0] === variant).length,
]));
if (
  navbarLogoImages.length !== 2 ||
  optimizedLogoImages.length !== 2 ||
  themeVariants.some((variants) => variants.length !== 1) ||
  themeVariantCounts.get('light') !== 1 ||
  themeVariantCounts.get('dark') !== 1 ||
  navbarLogoImages.some((image) =>
    image.alt !== 'CertiLife' ||
    image.src !== '/img/certilife-logo-172.png' ||
    image.width !== '86' ||
    image.height !== '30'
  )
) {
  throw new Error('Built navbar must use the optimized 172x60 logo at its 86x30 rendered size');
}

function walkFiles(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

const clientBundles = walkFiles(buildRoot).filter((path) => /\.(?:[cm]?js)$/.test(path));
const largeClientBundles = clientBundles.filter((path) => statSync(path).size >= 100_000);
if (largeClientBundles.length === 0) {
  throw new Error('Production source-map check found no large client bundle');
}
const referencedSourceMaps = new Set();
for (const bundlePath of clientBundles) {
  const bundle = relative(buildRoot, bundlePath).replaceAll('\\', '/');
  const source = readFileSync(bundlePath, 'utf8');
  const match = source.match(/\/\/# sourceMappingURL=([^\s]+)\s*$/);
  if (!match) {
    if (statSync(bundlePath).size >= 1_000) {
      throw new Error(`Non-trivial client bundle is missing sourceMappingURL: ${bundle}`);
    }
    continue;
  }
  const expectedSourceMap = `${bundle.split('/').at(-1)}.map`;
  if (match[1] !== expectedSourceMap) {
    throw new Error(`Client bundle must reference its matching source map: ${bundle} -> ${match[1]}`);
  }
  const sourceMapPath = `${bundlePath}.map`;
  if (!existsSync(sourceMapPath)) {
    throw new Error(`Client bundle source map is missing: ${bundle} -> ${match[1]}`);
  }
  referencedSourceMaps.add(sourceMapPath);
}
const sourceMapPaths = walkFiles(buildRoot).filter((path) => path.endsWith('.map'));
for (const sourceMapPath of sourceMapPaths) {
  const sourceMapFile = relative(buildRoot, sourceMapPath).replaceAll('\\', '/');
  if (!referencedSourceMaps.has(sourceMapPath)) {
    throw new Error(`Orphan source map would be publicly deployed: ${sourceMapFile}`);
  }
  const sourceMap = JSON.parse(readFileSync(sourceMapPath, 'utf8'));
  const expectedFile = sourceMapFile.slice(0, -4);
  if (
    sourceMap.version !== 3 ||
    sourceMap.file !== expectedFile ||
    Object.hasOwn(sourceMap, 'sourceRoot') ||
    typeof sourceMap.mappings !== 'string' ||
    !Array.isArray(sourceMap.names) ||
    sourceMap.names.some((name) => typeof name !== 'string')
  ) {
    throw new Error(`Production source-map metadata is invalid: ${sourceMapFile}`);
  }
  if (!Array.isArray(sourceMap.sources) || sourceMap.sources.length === 0) {
    throw new Error(`Production source map must name at least one source: ${sourceMapFile}`);
  }
  const unsafeSource = sourceMap.sources.find((entry) => {
    const namespace = 'webpack://@certi-life/docs/';
    if (typeof entry !== 'string' || !entry.startsWith(namespace)) return true;
    const rawPortablePath = entry.slice(namespace.length).replaceAll('\\', '/');
    let portablePath;
    try {
      portablePath = decodeURIComponent(rawPortablePath);
    } catch {
      return true;
    }
    if (portablePath !== rawPortablePath || /[%?#\u0000-\u001f\u007f]/.test(portablePath)) return true;
    if (portablePath === 'generated/rspack-runtime') return false;
    const segments = portablePath.split('/');
    return (
      portablePath.length === 0 ||
      portablePath.startsWith('/') ||
      /^[A-Za-z]:\//.test(portablePath) ||
      segments.includes('..') ||
      segments.includes('.') ||
      segments.includes('')
    );
  });
  if (unsafeSource) {
    throw new Error(`Production source-map source name is not portable: ${sourceMapFile} -> ${unsafeSource}`);
  }
  if (Object.hasOwn(sourceMap, 'sourcesContent')) {
    throw new Error(`Production source map must not embed source contents: ${sourceMapFile}`);
  }
}
if (sourceMapPaths.length !== referencedSourceMaps.size) {
  throw new Error(`Production source-map coverage mismatch: ${sourceMapPaths.length} maps for ${referencedSourceMaps.size} references`);
}
console.log(`Production verifier build fixture passed: ${requiredDocIds.length} HTML + ${requiredDocIds.length} Markdown routes`);
