import {readFileSync, existsSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {inflateSync} from 'node:zlib';
import {requiredDocIds, requiredDocs} from './docs-manifest.mjs';
import {cleanMarkdownUrls, expectedAiDiscoveryFiles} from './generate-ai-discovery.mjs';
import {verifyCleanMarkdownArtifacts} from './clean-markdown.mjs';
import {projectCleanMarkdownArtifacts} from './generate-clean-markdown.mjs';
import {readDocusaurusPublicConfig} from './read-docusaurus-config.mjs';

const root = new URL('..', import.meta.url).pathname;
const docsRoot = join(root, 'docs');

const actionableDocs = requiredDocs.filter((path) =>
  path.includes('/') && !path.endsWith('overview.mdx') && !path.endsWith('quick-tour.mdx'),
);
const failures = [];

try {
  verifyCleanMarkdownArtifacts(root, projectCleanMarkdownArtifacts(root));
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
}

for (const path of requiredDocs) {
  const absolute = join(docsRoot, path);
  if (!existsSync(absolute)) {
    failures.push(`missing document: ${path}`);
    continue;
  }
  const content = readFileSync(absolute, 'utf8');
  if (!/^---[\s\S]*?description:\s*.+?[\s\S]*?---/m.test(content)) {
    failures.push(`missing frontmatter description: ${path}`);
  }
  if (!/^#\s+.+/m.test(content)) failures.push(`missing H1: ${path}`);
  if (actionableDocs.includes(path) && content.length < 900) {
    failures.push(`guide is too shallow (<900 chars): ${path}`);
  }
}

const sidebar = readFileSync(join(root, 'sidebars.ts'), 'utf8');
for (const id of requiredDocIds) {
  if (!sidebar.includes(`'${id}'`)) failures.push(`sidebar missing: ${id}`);
}

const publicConfig = readDocusaurusPublicConfig(root);
if (publicConfig.url !== 'https://docs.certi.life') {
  failures.push('site URL must be https://docs.certi.life for the custom-domain deployment');
}
if (publicConfig.baseUrl !== '/') {
  failures.push("baseUrl must be '/' when the custom domain serves the site root");
}
if (publicConfig.trailingSlash !== false) {
  failures.push('trailingSlash must remain false so generated canonical URLs match Docusaurus');
}
if (publicConfig.docsRouteBasePath !== 'guide') {
  failures.push("classic docs routeBasePath must be 'guide'");
}
if (!publicConfig.sitemapEnabled) {
  failures.push('classic preset sitemap configuration must remain enabled');
}
if (
  publicConfig.source.includes('https://certi-life.github.io') ||
  publicConfig.source.includes("baseUrl: '/docs/'")
) {
  failures.push('legacy GitHub project-page deployment remains in config');
}
if (publicConfig.editUrl !== 'https://github.com/certi-life/docs/edit/develop/') {
  failures.push('docs must expose per-page GitHub edit links against the develop branch');
}
const koreanTranslations = JSON.parse(readFileSync(join(root, 'i18n', 'ko', 'code.json'), 'utf8'));
if (koreanTranslations['theme.common.editThisPage']?.message !== '이 페이지 개선하기') {
  failures.push('the per-page edit link must use the approved Korean label');
}
const cnamePath = join(root, 'static', 'CNAME');
if (existsSync(cnamePath)) failures.push('static/CNAME is unnecessary for the GitHub Actions Pages deployment');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readPngDimensions(buffer) {
  if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return null;
  let offset = 8;
  let dimensions = null;
  let bitDepth = null;
  let colorType = null;
  let interlaceMethod = null;
  let paletteEntries = 0;
  let hasTransparency = false;
  const imageData = [];
  let imageDataEnded = false;
  let ended = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > buffer.length) return null;
    const typeAndData = buffer.subarray(offset + 4, offset + 8 + length);
    if (crc32(typeAndData) !== buffer.readUInt32BE(offset + 8 + length)) return null;
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    if (!/^[A-Za-z]{4}$/.test(type) || !/[A-Z]/.test(type[2])) return null;
    if (imageData.length > 0 && type !== 'IDAT' && type !== 'IEND') imageDataEnded = true;
    if (/^[A-Z]/.test(type) && !['IHDR', 'PLTE', 'IDAT', 'IEND'].includes(type)) return null;
    if (type === 'IHDR') {
      if (offset !== 8 || length !== 13 || dimensions) return null;
      dimensions = {width: buffer.readUInt32BE(offset + 8), height: buffer.readUInt32BE(offset + 12)};
      if (dimensions.width === 0 || dimensions.height === 0) return null;
      bitDepth = buffer[offset + 16];
      colorType = buffer[offset + 17];
      if (buffer[offset + 18] !== 0 || buffer[offset + 19] !== 0) return null;
      interlaceMethod = buffer[offset + 20];
    }
    if (type === 'PLTE') {
      if (!dimensions || paletteEntries || imageData.length || [0, 4].includes(colorType) || length === 0 || length % 3 !== 0 || length > 768) return null;
      paletteEntries = length / 3;
    }
    if (type === 'tRNS') {
      if (!dimensions || hasTransparency || imageData.length || [4, 6].includes(colorType)) return null;
      if ((colorType === 0 && length !== 2) || (colorType === 2 && length !== 6)) return null;
      if (colorType === 3 && (paletteEntries === 0 || length === 0 || length > paletteEntries)) return null;
      hasTransparency = true;
    }
    if (type === 'IDAT') {
      if (!dimensions || imageDataEnded) return null;
      imageData.push(buffer.subarray(offset + 8, offset + 8 + length));
    }
    if (type === 'IEND') {
      ended = length === 0 && end === buffer.length;
      break;
    }
    offset = end;
  }
  if (!ended || !dimensions || imageData.length === 0 || interlaceMethod !== 0) return null;
  const validBitDepths = new Map([[0, [1, 2, 4, 8, 16]], [2, [8, 16]], [3, [1, 2, 4, 8]], [4, [8, 16]], [6, [8, 16]]]);
  if (!validBitDepths.get(colorType)?.includes(bitDepth)) return null;
  if (colorType === 3 && (paletteEntries === 0 || paletteEntries > 2 ** bitDepth)) return null;
  const channels = new Map([[0, 1], [2, 3], [3, 1], [4, 2], [6, 4]]).get(colorType);
  if (!channels) return null;
  try {
    const decoded = inflateSync(Buffer.concat(imageData), {maxOutputLength: 100_000});
    const rowBytes = Math.ceil((dimensions.width * channels * bitDepth) / 8);
    if (decoded.length !== dimensions.height * (rowBytes + 1)) return null;
    const bytesPerPixel = Math.max(1, Math.ceil((channels * bitDepth) / 8));
    const pixels = Buffer.alloc(rowBytes * dimensions.height);
    const paeth = (left, up, upLeft) => {
      const estimate = left + up - upLeft;
      const leftDistance = Math.abs(estimate - left);
      const upDistance = Math.abs(estimate - up);
      const upLeftDistance = Math.abs(estimate - upLeft);
      if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
      return upDistance <= upLeftDistance ? up : upLeft;
    };
    for (let row = 0; row < dimensions.height; row += 1) {
      const encodedOffset = row * (rowBytes + 1);
      const filterType = decoded[encodedOffset];
      if (filterType > 4) return null;
      const rowOffset = row * rowBytes;
      for (let column = 0; column < rowBytes; column += 1) {
        const raw = decoded[encodedOffset + 1 + column];
        const left = column >= bytesPerPixel ? pixels[rowOffset + column - bytesPerPixel] : 0;
        const up = row > 0 ? pixels[rowOffset - rowBytes + column] : 0;
        const upLeft = row > 0 && column >= bytesPerPixel
          ? pixels[rowOffset - rowBytes + column - bytesPerPixel]
          : 0;
        const predictor = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, upLeft)][filterType];
        pixels[rowOffset + column] = (raw + predictor) & 0xff;
      }
    }
    if (colorType === 3) {
      const mask = (1 << bitDepth) - 1;
      for (let row = 0; row < dimensions.height; row += 1) {
        const rowOffset = row * rowBytes;
        for (let column = 0; column < dimensions.width; column += 1) {
          const bitOffset = column * bitDepth;
          const byte = pixels[rowOffset + Math.floor(bitOffset / 8)];
          const shift = 8 - bitDepth - (bitOffset % 8);
          if (((byte >>> shift) & mask) >= paletteEntries) return null;
        }
      }
    }
  } catch {
    return null;
  }
  return dimensions;
}

const navbarLogoPath = join(root, 'static', 'img', 'certilife-logo-172.png');
if (!existsSync(navbarLogoPath)) {
  failures.push('missing optimized navbar logo: static/img/certilife-logo-172.png');
} else {
  const navbarLogo = readFileSync(navbarLogoPath);
  const dimensions = readPngDimensions(navbarLogo);
  if (dimensions?.width !== 172 || dimensions?.height !== 60) {
    failures.push(`optimized navbar logo must remain a valid 172x60 PNG (found ${dimensions?.width ?? 0}x${dimensions?.height ?? 0})`);
  }
  if (navbarLogo.length > 2500) {
    failures.push(`optimized navbar logo must remain <=2500 bytes (found ${navbarLogo.length})`);
  }
}
for (const [name, expected] of expectedAiDiscoveryFiles()) {
  const path = join(root, 'static', name);
  if (!existsSync(path)) {
    failures.push(`missing AI discovery file: static/${name}`);
    continue;
  }
  const actual = readFileSync(path, 'utf8');
  if (actual !== expected) {
    failures.push(`stale AI discovery file: static/${name}; run npm run ai-discovery:generate`);
  }
  if (/WORK-\d+|plane\.certi|127\.0\.0\.1|localhost|api[_-]?key|secret[_-]?key/i.test(actual)) {
    failures.push(`internal or secret-like content in static/${name}`);
  }
}

const robotsPath = join(root, 'static', 'robots.txt');
if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, 'utf8');
  if (!/^User-agent: \*$/m.test(robots) || !/^Allow: \/$/m.test(robots)) {
    failures.push('robots.txt must explicitly allow public documentation crawling');
  }
  if (!/^Sitemap: https:\/\/docs\.certi\.life\/sitemap\.xml$/m.test(robots)) {
    failures.push('robots.txt must name the production sitemap');
  }
}

const llmsPath = join(root, 'static', 'llms.txt');
if (existsSync(llmsPath)) {
  const llms = readFileSync(llmsPath, 'utf8');
  if (!/^# CertiLife Docs$/m.test(llms) || !/^> .+$/m.test(llms)) {
    failures.push('llms.txt must include the standard H1 and blockquote summary');
  }
  const listedDocUrls = [...llms.matchAll(/^- \[[^\]]+\]\((https:\/\/docs\.certi\.life\/[^)]+)\):/gm)]
    .map((match) => match[1])
    .filter((url) => url !== 'https://docs.certi.life/' && !url.endsWith('/sitemap.xml'));
  const expectedUrls = cleanMarkdownUrls();
  const expectedUrlSet = new Set(expectedUrls);
  const actualUrlSet = new Set(listedDocUrls);
  if (listedDocUrls.length !== expectedUrls.length || actualUrlSet.size !== expectedUrls.length) {
    failures.push(`llms.txt guide coverage must contain ${expectedUrls.length} unique links (found ${listedDocUrls.length}/${actualUrlSet.size})`);
  }
  for (const url of expectedUrls) {
    if (!actualUrlSet.has(url)) failures.push(`llms.txt missing guide URL: ${url}`);
  }
  for (const url of actualUrlSet) {
    if (!expectedUrlSet.has(url)) failures.push(`llms.txt contains unknown guide URL: ${url}`);
  }
}

const readme = readFileSync(join(root, 'README.md'), 'utf8');
if (!readme.includes('https://docs.certi.life')) {
  failures.push('README must name the current https://docs.certi.life deployment');
}
if (readme.includes('https://certi-life.github.io/docs/') || readme.includes('http://localhost:3000/docs/')) {
  failures.push('README still describes the legacy /docs/ deployment path');
}
if (readme.includes('커스텀 도메인은 아직 연결하지 않았습니다')) {
  failures.push('README still says the active custom domain is not connected');
}

const downloadsGuide = readFileSync(join(docsRoot, 'getting-started', 'downloads.mdx'), 'utf8');
const requiredDownloadsGuidance =
  '공식 다운로드 페이지에서 다운로드를 시작했는지 확인합니다. 공식 버튼은 데스크톱 설치 파일용 클라우드 저장소나 Google Play·App Store로 연결될 수 있습니다.';
if (!downloadsGuide.includes(requiredDownloadsGuidance)) {
  failures.push('downloads guide must preserve the approved official-source and external-destination guidance');
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const discoveredDocs = walk(docsRoot)
  .filter((path) => path.endsWith('.mdx'))
  .map((path) => relative(docsRoot, path));
const requiredDocSet = new Set(requiredDocs);
for (const path of discoveredDocs) {
  if (!requiredDocSet.has(path)) failures.push(`AI discovery manifest missing public document: ${path}`);
}
if (discoveredDocs.length !== requiredDocs.length) {
  failures.push(`AI discovery manifest coverage mismatch: ${requiredDocs.length} listed, ${discoveredDocs.length} discovered`);
}

const banned = [
  /WORK-\d+/i,
  /plane\.certi/i,
  /127\.0\.0\.1/,
  /localhost/i,
  /develop\s*(브랜치|branch)/i,
  /내부\s*(로드맵|문서화 계획|운영 지표)/i,
];

function stripFrontmatterAndFencedCode(content) {
  return content
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/```[\s\S]*?```/g, '');
}

function stripValidMarkdownLinks(content) {
  return content
    .replace(/!?\[([^\]]*)\]\(https?:\/\/[^)\s]+(?:\s+["'][^"']*["'])?\)/g, '$1')
    .replace(/<https?:\/\/[^>]+>/g, '');
}

for (const file of walk(docsRoot).filter((path) => path.endsWith('.mdx'))) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of banned) {
    if (pattern.test(content)) failures.push(`public-content violation ${pattern}: ${relative(root, file)}`);
  }

  const linkProse = stripFrontmatterAndFencedCode(content);
  const autolink = linkProse.match(/<https?:\/\/[^>]+>/);
  if (autolink) {
    failures.push(`external URL autolink must use descriptive link text (${autolink[0]}): ${relative(root, file)}`);
  }
  const urlAsLabel = linkProse.match(/\[\s*https?:\/\/[^\]]+\]\(https?:\/\/[^)\s]+\)/);
  if (urlAsLabel) {
    failures.push(`external link text must describe its destination: ${relative(root, file)}`);
  }
  const vagueLink = linkProse.match(/\[\s*(?:여기|링크|클릭)\s*\]\(https?:\/\/[^)\s]+\)/);
  if (vagueLink) {
    failures.push(`external link text is too vague (${vagueLink[0]}): ${relative(root, file)}`);
  }

  const prose = stripValidMarkdownLinks(linkProse);
  const rawUrl = prose.match(/https?:\/\/[^\s)`>]+/);
  if (rawUrl) {
    failures.push(`plain-text external URL must be a descriptive link (${rawUrl[0]}): ${relative(root, file)}`);
  }
  const copyNavigation = prose.match(
    /(?:브라우저\s*)?(?:주소창|주소 표시줄)(?:에|으로)[^\n]{0,100}(?:직접\s*)?(?:입력(?:하거나)?|복사|붙여넣기)/,
  );
  if (copyNavigation) {
    failures.push(`replace copy/paste navigation with a direct link: ${relative(root, file)}`);
  }
}

if (failures.length) {
  console.error(`Docs quality gate failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Docs quality gate passed: ${requiredDocs.length} required documents`);
