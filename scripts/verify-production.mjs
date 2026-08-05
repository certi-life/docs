import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'parse5';
import matter from '@11ty/gray-matter';
import {requiredDocIds} from './docs-manifest.mjs';
import {cleanMarkdownUrl, publicDocUrl} from './generate-ai-discovery.mjs';
import {projectCleanMarkdownArtifacts} from './generate-clean-markdown.mjs';
import {gitLastModifiedIso, jsonLdHasType, normalizeJsonLd, validateBreadcrumbList, validateFaqPage, validateTechArticle} from './structured-data-validation.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const diagnostic = (url, expected, actual) => `URL=${url} expected=${expected} actual=${actual}`;

export async function fetchWithRetry(url, {fetchImpl = fetch, retries = 3, delayMs = 500} = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        redirect: 'follow',
        headers: {'user-agent': 'CertiLife-Docs-Synthetic/1.0'},
        signal: AbortSignal.timeout(15_000),
      });
      const transient = response.status === 429 || response.status >= 500;
      if (!transient || attempt === retries) return response;
      await response.body?.cancel();
      lastError = new Error(diagnostic(url, 'HTTP < 500 or 2xx', `HTTP ${response.status} attempt=${attempt}/${retries}`));
      const retryAfter = response.headers.get('retry-after');
      const retryAfterMs = retryAfter === null
        ? 0
        : /^\d+(?:\.\d+)?$/.test(retryAfter)
          ? Number(retryAfter) * 1000
          : Math.max(0, Date.parse(retryAfter) - Date.now());
      await sleep(Math.min(5_000, Math.max(delayMs * attempt, retryAfterMs)));
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await sleep(delayMs * attempt);
    }
  }
  throw new Error(diagnostic(url, `reachable within ${retries} attempts`, lastError?.message ?? 'network error'));
}

export async function verifyResponse(url, response, expected) {
  if (response.status !== expected.status) {
    throw new Error(diagnostic(url, `status ${expected.status}`, `status ${response.status}`));
  }
  const actualType = (response.headers.get('content-type') ?? '').toLowerCase();
  if (expected.contentType && !actualType.startsWith(expected.contentType.toLowerCase())) {
    throw new Error(diagnostic(url, `content-type ${expected.contentType}`, actualType || '<missing>'));
  }
  const body = await response.arrayBuffer();
  const bytes = Buffer.from(body);
  if (expected.body !== undefined) {
    const wanted = Buffer.isBuffer(expected.body) ? expected.body : Buffer.from(expected.body);
    if (!bytes.equals(wanted)) {
      throw new Error(diagnostic(url, `body sha256 ${sha256(wanted)}`, sha256(bytes)));
    }
  }
  if (expected.check) expected.check(bytes.toString('utf8'));
}

function attr(node, name) {
  return node.attrs?.find((entry) => entry.name === name)?.value;
}

function descendants(node, result = []) {
  result.push(node);
  for (const child of node.childNodes ?? []) descendants(child, result);
  return result;
}

function textContent(node) {
  if (node.nodeName === '#text') return node.value ?? '';
  return (node.childNodes ?? []).map(textContent).join('');
}

function normalizeVisibleText(value) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

function visibleFaqEntries(nodes) {
  const article = nodes.find((node) => node.nodeName === 'article');
  if (!article) return [];
  return descendants(article, [])
    .filter((node) => node.nodeName === 'h2')
    .map((heading) => {
      const siblings = heading.parentNode?.childNodes ?? [];
      const position = siblings.indexOf(heading);
      const answer = siblings.slice(position + 1).find((node) => node.nodeName === 'p');
      return {
        question: normalizeVisibleText(textContent(heading)),
        answer: normalizeVisibleText(answer ? textContent(answer) : ''),
      };
    });
}

export function validateHtmlBody(url, title, body, navigationTitle = title, articleExpected, faqExpected = []) {
  const nodes = descendants(parse(body));
  const canonicals = nodes.filter((node) => node.nodeName === 'link' && (attr(node, 'rel') ?? '').split(/\s+/).includes('canonical'));
  if (canonicals.length !== 1 || attr(canonicals[0], 'href') !== url) {
    throw new Error(diagnostic(url, `one canonical link href=${url}`, canonicals.map((node) => attr(node, 'href') ?? '<missing>').join(',') || '<missing>'));
  }
  const headings = nodes.filter((node) => node.nodeName === 'h1').map((node) => textContent(node).trim());
  if (headings.length !== 1 || headings[0] !== title) {
    throw new Error(diagnostic(url, `one visible H1=${title}`, headings.join(',') || '<missing>'));
  }
  const jsonLdRoots = [];
  for (const script of nodes.filter((node) => node.nodeName === 'script' && attr(node, 'type') === 'application/ld+json')) {
    try {
      jsonLdRoots.push(JSON.parse(textContent(script)));
    } catch (error) {
      throw new Error(diagnostic(url, 'valid application/ld+json', error instanceof Error ? error.message : String(error)));
    }
  }
  const jsonLd = normalizeJsonLd(jsonLdRoots);
  const faqs = jsonLd.filter((entry) => jsonLdHasType(entry, 'FAQPage'));
  if (faqExpected.length > 0) {
    if (faqs.length !== 1) throw new Error(diagnostic(url, 'one FAQPage', `count=${faqs.length}`));
    const visibleFaq = visibleFaqEntries(nodes);
    const normalizedExpected = faqExpected.map(({question, answer}) => ({
      question: normalizeVisibleText(question),
      answer: normalizeVisibleText(answer),
    }));
    if (JSON.stringify(visibleFaq) !== JSON.stringify(normalizedExpected)) {
      throw new Error(diagnostic(url, `visible FAQ entries=${JSON.stringify(normalizedExpected)}`, JSON.stringify(visibleFaq)));
    }
    try {
      validateFaqPage(faqs[0], faqExpected);
    } catch (error) {
      throw new Error(diagnostic(url, `valid FAQPage entries=${faqExpected.length}`, error instanceof Error ? error.message : String(error)));
    }
  } else if (faqs.length > 0) {
    throw new Error(diagnostic(url, 'no FAQPage JSON-LD', `count=${faqs.length}`));
  }
  const articles = jsonLd.filter((entry) => jsonLdHasType(entry, 'TechArticle'));
  if (articles.length !== 1) {
    throw new Error(diagnostic(url, 'one TechArticle', `count=${articles.length}`));
  }
  if (!articleExpected) {
    throw new Error(diagnostic(url, 'complete expected TechArticle metadata', '<missing>'));
  }
  try {
    validateTechArticle(articles[0], {title, url, ...articleExpected});
  } catch (error) {
    throw new Error(diagnostic(url, `valid TechArticle headline=${title} url=${url}`, error instanceof Error ? error.message : String(error)));
  }
  const breadcrumbLists = jsonLd.filter((entry) => jsonLdHasType(entry, 'BreadcrumbList'));
  if (breadcrumbLists.length !== 1) {
    throw new Error(diagnostic(url, 'one BreadcrumbList', `count=${breadcrumbLists.length}`));
  }
  try {
    validateBreadcrumbList(breadcrumbLists[0], {url, navigationTitle});
  } catch (error) {
    throw new Error(diagnostic(url, `valid BreadcrumbList ending name=${navigationTitle} item=${url}`, error instanceof Error ? error.message : String(error)));
  }
}

function htmlCheck(url, title, navigationTitle, articleExpected, faqExpected) {
  return (body) => validateHtmlBody(url, title, body, navigationTitle, articleExpected, faqExpected);
}

export function loadDocTitle(projectRoot, id) {
  const sourcePath = join(projectRoot, 'docs', `${id}.mdx`);
  const parsed = matter(readFileSync(sourcePath, 'utf8'));
  const explicitHeading = parsed.content.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, '').trim();
  const title = explicitHeading || parsed.data.title;
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error(`missing frontmatter title: ${sourcePath}`);
  }
  return title.trim();
}

export function loadDocNavigationTitle(projectRoot, id) {
  const sourcePath = join(projectRoot, 'docs', `${id}.mdx`);
  const title = matter(readFileSync(sourcePath, 'utf8')).data.title;
  if (typeof title !== 'string' || !title.trim()) throw new Error(`missing frontmatter title: ${sourcePath}`);
  return title.trim();
}

export function loadDocArticleExpected(projectRoot, id) {
  const sourcePath = join(projectRoot, 'docs', `${id}.mdx`);
  const description = matter(readFileSync(sourcePath, 'utf8')).data.description;
  if (typeof description !== 'string' || !description.trim()) throw new Error(`missing frontmatter description: ${sourcePath}`);
  return {description: description.trim(), dateModified: gitLastModifiedIso(projectRoot, id)};
}

export function loadDocFaqExpected(projectRoot, id) {
  const sourcePath = join(projectRoot, 'docs', `${id}.mdx`);
  const data = matter(readFileSync(sourcePath, 'utf8')).data;
  if (data.structured_data !== 'faq') return [];
  if (!Array.isArray(data.faq_items) || data.faq_items.length === 0) {
    throw new Error(`missing faq_items for structured FAQ document: ${sourcePath}`);
  }
  return data.faq_items;
}

async function runInBatches(tasks, size = 8) {
  for (let index = 0; index < tasks.length; index += size) {
    await Promise.all(tasks.slice(index, index + size).map((task) => task()));
  }
}

export async function verifyProduction({
  projectRoot,
  baseUrl = 'https://docs.certi.life',
  fetchImpl = fetch,
  retries = 3,
  delayMs = 500,
} = {}) {
  if (!projectRoot) throw new Error('projectRoot is required');
  const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const artifacts = projectCleanMarkdownArtifacts(projectRoot);
  const artifactById = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
  const checks = [
    ['robots.txt', 'text/plain', readFileSync(join(projectRoot, 'build', 'robots.txt'))],
    ['llms.txt', 'text/plain', readFileSync(join(projectRoot, 'build', 'llms.txt'))],
    ['sitemap.xml', 'application/xml', readFileSync(join(projectRoot, 'build', 'sitemap.xml'))],
  ];
  const tasks = checks.map(([path, contentType, body]) => async () => {
    const url = new URL(path, root).href;
    const response = await fetchWithRetry(url, {fetchImpl, retries, delayMs});
    await verifyResponse(url, response, {status: 200, contentType, body});
  });
  for (const id of requiredDocIds) {
    const canonical = publicDocUrl(id).replace('https://docs.certi.life', root.replace(/\/$/, ''));
    const markdown = cleanMarkdownUrl(id).replace('https://docs.certi.life', root.replace(/\/$/, ''));
    const title = loadDocTitle(projectRoot, id);
    const navigationTitle = loadDocNavigationTitle(projectRoot, id);
    const articleExpected = loadDocArticleExpected(projectRoot, id);
    const faqExpected = loadDocFaqExpected(projectRoot, id);
    tasks.push(async () => {
      const response = await fetchWithRetry(canonical, {fetchImpl, retries, delayMs});
      await verifyResponse(canonical, response, {status: 200, contentType: 'text/html', check: htmlCheck(canonical, title, navigationTitle, articleExpected, faqExpected)});
    });
    tasks.push(async () => {
      const response = await fetchWithRetry(markdown, {fetchImpl, retries, delayMs});
      await verifyResponse(markdown, response, {status: 200, contentType: 'text/markdown', body: artifactById.get(id).content});
    });
  }
  await runInBatches(tasks);
}

async function main() {
  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  try {
    await verifyProduction({projectRoot});
  } catch (error) {
    console.error(`PRODUCTION SYNTHETIC FAILED: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Recovery: inspect the reported URL, compare it with the current main build artifact, then rerun npm run production:verify.');
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
