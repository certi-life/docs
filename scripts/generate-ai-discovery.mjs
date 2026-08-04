import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join, posix} from 'node:path';
import matter from '@11ty/gray-matter';
import {docsSections} from './docs-manifest.mjs';
import {readDocusaurusPublicConfig} from './read-docusaurus-config.mjs';

const scriptsRoot = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptsRoot, '..');
const docsRoot = join(projectRoot, 'docs');
const staticRoot = join(projectRoot, 'static');
const publicConfig = readDocusaurusPublicConfig(projectRoot);
if (
  !publicConfig.url ||
  !publicConfig.baseUrl ||
  !publicConfig.docsRouteBasePath ||
  typeof publicConfig.trailingSlash !== 'boolean'
) {
  throw new Error('url, baseUrl, docs routeBasePath, and trailingSlash must be static literals');
}
const siteRoot = new URL(publicConfig.baseUrl, `${publicConfig.url}/`);
const sitemapUrl = new URL('sitemap.xml', siteRoot).href;

function parseFrontmatter(id) {
  const source = readFileSync(join(docsRoot, `${id}.mdx`), 'utf8');
  const data = matter(source).data;
  const {title, description, slug, id: explicitId} = data;
  if (typeof title !== 'string' || typeof description !== 'string') {
    throw new Error(`missing string title or description: ${id}`);
  }
  if (explicitId !== undefined) throw new Error(`custom frontmatter id is unsupported; use slug instead: ${id}`);
  if (slug !== undefined && typeof slug !== 'string') throw new Error(`frontmatter slug must be a string: ${id}`);
  if (slug === '') throw new Error(`frontmatter slug must not be empty: ${id}`);
  if (/[\[\]\n\r]/.test(title) || /[\n\r]/.test(description)) {
    throw new Error(`frontmatter is not safe for a Markdown link: ${id}`);
  }
  return {title, description, slug};
}

export function publicDocUrl(id) {
  const {slug} = parseFrontmatter(id);
  const sourceDir = posix.dirname(id);
  const fileName = posix.basename(id).toLowerCase();
  const directoryName = sourceDir === '.' ? undefined : posix.basename(sourceDir).toLowerCase();
  const isCategoryIndex = ['index', 'readme', directoryName].filter(Boolean).includes(fileName);
  let route;
  if (slug?.startsWith('/')) {
    route = slug.replace(/^\/+/, '');
  } else if (slug !== undefined) {
    route = posix.join(sourceDir, slug);
  } else if (isCategoryIndex) {
    route = sourceDir === '.' ? '' : `${sourceDir}/`;
  } else {
    route = id;
  }
  const url = new URL(`${publicConfig.docsRouteBasePath}/${route}`, siteRoot);
  if (publicConfig.trailingSlash) {
    if (!url.pathname.endsWith('/')) url.pathname += '/';
  } else if (url.pathname !== '/') {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }
  return url.href;
}

export function publicDocUrls() {
  return docsSections.flatMap((section) => section.docs.map(publicDocUrl));
}

export function cleanMarkdownUrl(id) {
  const canonical = publicDocUrl(id);
  if (canonical.endsWith('/')) throw new Error(`clean Markdown endpoint requires a non-directory canonical route: ${id}`);
  return `${canonical}.md`;
}

export function cleanMarkdownUrls() {
  return docsSections.flatMap((section) => section.docs.map(cleanMarkdownUrl));
}

export function renderRobotsTxt() {
  return [
    '# CertiLife public documentation',
    `# LLM-readable documentation index: ${new URL('llms.txt', siteRoot).href}`,
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${sitemapUrl}`,
    '',
  ].join('\n');
}

export function renderLlmsTxt() {
  const lines = [
    '# CertiLife Docs',
    '',
    '> 디지털 인증서부터 등록 자료 기반 AI 상담, CRM 메시징, 이벤트 마케팅까지 안내하는 CertiLife 공식 공개 사용 가이드입니다.',
    '',
    'CertiLife Docs는 Hospital·Manufacturer·Studio 사용자와 도입 검토자가 공개적으로 확인할 수 있는 서비스 설명, 시작 경로, 운영 체크리스트, 문제 해결 정보를 제공합니다. 로그인 이후 메뉴·권한·업무 흐름은 공개적으로 검증된 범위만 다루며, AI 상담 안내는 의료진의 판단이나 진단을 대체하지 않습니다.',
    '',
    '핵심 용어: CertiLife, 서티라이프, 디지털 인증서, AI 상담, 상담원 연결, CRM 메시징, 고객 세그먼트, 이벤트 마케팅, Hospital, Manufacturer, Studio',
  ];

  for (const section of docsSections) {
    lines.push('', `## ${section.label}`, '', section.description, '');
    for (const id of section.docs) {
      const {title, description} = parseFrontmatter(id);
      lines.push(`- [${title}](${cleanMarkdownUrl(id)}): ${description}`);
    }
  }

  lines.push(
    '',
    '## 추가 공개 경로',
    '',
    `- [CertiLife Docs 홈](${siteRoot.href}): 제품과 역할별 공개 문서의 시작점입니다.`,
    `- [문서 Sitemap](${sitemapUrl}): 검색엔진용 공개 URL 목록입니다.`,
    '- [CertiLife 홈페이지](https://certi.life/): 서비스 소개와 공식 도입 문의 경로입니다.',
    '',
  );
  return lines.join('\n');
}

export function expectedAiDiscoveryFiles() {
  return new Map([
    ['robots.txt', renderRobotsTxt()],
    ['llms.txt', renderLlmsTxt()],
  ]);
}

function generate() {
  for (const [name, content] of expectedAiDiscoveryFiles()) {
    writeFileSync(join(staticRoot, name), content, 'utf8');
    console.log(`generated static/${name}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) generate();
