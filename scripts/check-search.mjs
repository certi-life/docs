import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join, relative} from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const buildRoot = join(root, 'build');
const failures = [];

const config = readFileSync(join(root, 'docusaurus.config.ts'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const translations = JSON.parse(readFileSync(join(root, 'i18n/ko/code.json'), 'utf8'));
const requiredConfig = [
  "'@easyops-cn/docusaurus-search-local'",
  "language: 'ko'",
  "docsRouteBasePath: 'guide'",
  "hashed: 'filename'",
  'indexBlog: false',
  'indexPages: false',
  'highlightSearchTermsOnTargetPage: true',
  'explicitSearchResultPath: true',
];
for (const setting of requiredConfig) {
  if (!config.includes(setting)) failures.push(`missing search config: ${setting}`);
}
if (config.includes('askAi:')) failures.push('Ask AI must remain disabled for local-only search');
if (!packageJson.dependencies?.['@easyops-cn/docusaurus-search-local']) {
  failures.push('Search plugin dependency is missing');
}
if (packageJson.engines?.node !== '>=20.18.1') {
  failures.push('Node engine must satisfy the search dependency requirement: >=20.18.1');
}
if (translations['theme.SearchBar.label']?.message !== '문서 검색') {
  failures.push('Search input placeholder is not localized as "문서 검색"');
}
if (translations['theme.SearchPage.documentsFound.plurals']?.message !== '{count}개 결과를 찾았습니다') {
  failures.push('Search result count does not describe section-level results accurately');
}

const searchBarWrapperPath = join(root, 'src/theme/SearchBar/index.tsx');
if (!existsSync(searchBarWrapperPath)) {
  failures.push('Korean SearchBar accessibility wrapper is missing');
} else {
  const wrapper = readFileSync(searchBarWrapperPath, 'utf8');
  if (!wrapper.includes("setAttribute('aria-label', '문서 검색')")) {
    failures.push('SearchBar accessibility label is not localized as "문서 검색"');
  }
}

const searchPageWrapperPath = join(root, 'src/theme/SearchPage/index.tsx');
if (!existsSync(searchPageWrapperPath)) {
  failures.push('search page accessibility wrapper is missing');
} else {
  const wrapper = readFileSync(searchPageWrapperPath, 'utf8');
  if (!wrapper.includes("setAttribute('role', 'main')")) {
    failures.push('search page must expose one main landmark');
  }
  if (!wrapper.includes('<meta name="description"')) {
    failures.push('search page must provide a meta description');
  }
}

if (!existsSync(buildRoot)) {
  failures.push('production build is missing; run npm run build first');
}

const indexFiles = existsSync(buildRoot)
  ? readdirSync(buildRoot).filter((name) => /^search-index.*\.json$/.test(name))
  : [];

if (indexFiles.length !== 1) {
  failures.push(`expected exactly one search index, found ${indexFiles.length}`);
}

let wrappedIndexes = [];
if (indexFiles.length === 1) {
  try {
    wrappedIndexes = JSON.parse(readFileSync(join(buildRoot, indexFiles[0]), 'utf8'));
  } catch (error) {
    failures.push(`search index is not valid JSON: ${error.message}`);
  }
}

const documents = wrappedIndexes.flatMap((entry) => entry.documents ?? []);
const normalizeRoute = (route) => route?.split(/[?#]/, 1)[0].replace(/\/$/, '');
const indexedRoutes = new Set(documents.map((doc) => normalizeRoute(doc.u)).filter(Boolean));
const indexedTerms = new Set(
  wrappedIndexes.flatMap((entry) => (entry.index?.invertedIndex ?? []).map(([term]) => term)),
);

const requiredRoutes = [
  '/docs/guide/intro',
  '/docs/guide/help/troubleshooting',
  '/docs/guide/hospital/account-access',
  '/docs/guide/manufacturer/account-access',
  '/docs/guide/studio/scenario-and-handoff',
];
for (const route of requiredRoutes) {
  if (![...indexedRoutes].some((indexed) => indexed === route || indexed.startsWith(`${route}#`))) {
    failures.push(`search index missing route: ${route}`);
  }
}

function walk(dir) {
  return readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const builtGuideRoot = join(buildRoot, 'guide');
const builtRoutes = new Set(
  existsSync(builtGuideRoot)
    ? walk(builtGuideRoot)
        .filter((path) => path.endsWith('.html'))
        .map((path) => `/docs/guide/${relative(builtGuideRoot, path).replace(/\.html$/, '')}`)
    : [],
);
for (const route of builtRoutes) {
  if (!indexedRoutes.has(route)) failures.push(`built document missing from search index: ${route}`);
}
for (const route of indexedRoutes) {
  if (!builtRoutes.has(route)) failures.push(`search index route has no built document: ${route}`);
}
if (builtRoutes.size !== 34) {
  failures.push(`expected 34 built guide routes, found ${builtRoutes.size}`);
}

const requiredTerms = ['로그인', '비밀번호', '인증서', '제조사', '상담원'];
for (const term of requiredTerms) {
  if (!indexedTerms.has(term)) failures.push(`search index missing Korean term: ${term}`);
}

for (const route of indexedRoutes) {
  if (!route.startsWith('/docs/guide/')) failures.push(`unexpected public search route: ${route}`);
}

if (failures.length) {
  console.error(`Search quality gate failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Search quality gate passed: ${indexFiles[0]}, ${indexedRoutes.size}/${builtRoutes.size} routes, ${requiredTerms.length} Korean terms`,
);
