import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import matter from '@11ty/gray-matter';
import sax from 'sax';
import {requiredDocIds} from './docs-manifest.mjs';
import {publicDocUrl} from './generate-ai-discovery.mjs';
import {loadDocArticleExpected, loadDocNavigationTitle, loadDocTitle} from './verify-production.mjs';
import {jsonLdHasType, normalizeJsonLd, validateBreadcrumbList, validateFaqPage, validateTechArticle} from './structured-data-validation.mjs';

export function validateFreshnessRecords(records, expected, now = new Date()) {
  if (records.length !== expected.size) throw new Error(`freshness record count expected=${expected.size} actual=${records.length}`);
  const seen = new Set();
  for (const {loc, lastmod} of records) {
    if (seen.has(loc)) throw new Error(`duplicate freshness URL: ${loc}`);
    seen.add(loc);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod ?? '')) throw new Error(`invalid lastmod URL=${loc} actual=${lastmod ?? '<missing>'}`);
    if (lastmod > now.toISOString().slice(0, 10)) throw new Error(`future lastmod URL=${loc} actual=${lastmod}`);
    const expectedDate = expected.get(loc);
    if (expectedDate === undefined) throw new Error(`unexpected freshness URL=${loc}`);
    if (lastmod !== expectedDate) throw new Error(`lastmod mismatch URL=${loc} expected=${expectedDate} actual=${lastmod}`);
  }
  for (const loc of expected.keys()) if (!seen.has(loc)) throw new Error(`missing freshness URL=${loc}`);
  if (records.length > 1 && new Set(records.map(({lastmod}) => lastmod)).size === 1) {
    throw new Error(`all document lastmod values are identical: ${records[0].lastmod}`);
  }
}

export function parseSitemapFreshness(xml, docUrls) {
  const wanted = new Set(docUrls);
  const records = [];
  let inUrl = false;
  let field = null;
  let loc = '';
  let lastmod = '';
  const parser = sax.parser(true);
  parser.onerror = (error) => { throw error; };
  parser.onopentag = ({name}) => {
    if (name === 'url') { inUrl = true; loc = ''; lastmod = ''; }
    if (inUrl && (name === 'loc' || name === 'lastmod')) field = name;
  };
  parser.ontext = (text) => {
    if (field === 'loc') loc += text;
    if (field === 'lastmod') lastmod += text;
  };
  parser.onclosetag = (name) => {
    if (name === field) field = null;
    if (name === 'url') {
      if (wanted.has(loc.trim())) records.push({loc: loc.trim(), lastmod: lastmod.trim()});
      inUrl = false;
    }
  };
  parser.write(xml).close();
  return records;
}

function gitLastmod(projectRoot, id) {
  const output = execFileSync('git', ['log', '-1', '--format=%cI', '--', `docs/${id}.mdx`], {cwd: projectRoot, encoding: 'utf8'}).trim();
  const parsed = new Date(output);
  if (!output || Number.isNaN(parsed.getTime())) throw new Error(`missing git history for docs/${id}.mdx`);
  return parsed.toISOString().slice(0, 10);
}

function parseJsonLd(html, path) {
  const values = [];
  for (const match of html.matchAll(/<script[^>]+type=(?:["']application\/ld\+json["']|application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
    try { values.push(JSON.parse(match[1])); } catch (error) { throw new Error(`invalid JSON-LD ${path}: ${error.message}`); }
  }
  return values;
}

export function verifyBuiltStructuredData(projectRoot) {
  const expected = new Map(requiredDocIds.map((id) => [publicDocUrl(id), gitLastmod(projectRoot, id)]));
  const xml = readFileSync(join(projectRoot, 'build', 'sitemap.xml'), 'utf8');
  const records = parseSitemapFreshness(xml, [...expected.keys()]);
  validateFreshnessRecords(records, expected);
  for (const id of requiredDocIds) {
    const canonical = publicDocUrl(id);
    const htmlPath = join(projectRoot, 'build', canonical.replace('https://docs.certi.life/', ''), 'index.html');
    const fallbackPath = htmlPath.replace(/\/index\.html$/, '.html');
    let html;
    try { html = readFileSync(htmlPath, 'utf8'); } catch { html = readFileSync(fallbackPath, 'utf8'); }
    const values = normalizeJsonLd(parseJsonLd(html, id));
    const articles = values.filter((value) => jsonLdHasType(value, 'TechArticle'));
    const breadcrumbs = values.filter((value) => jsonLdHasType(value, 'BreadcrumbList'));
    const faqs = values.filter((value) => jsonLdHasType(value, 'FAQPage'));
    if (articles.length !== 1) throw new Error(`TechArticle count URL=${canonical} expected=1 actual=${articles.length}`);
    if (breadcrumbs.length !== 1) throw new Error(`BreadcrumbList count URL=${canonical} expected=1 actual=${breadcrumbs.length}`);
    validateBreadcrumbList(breadcrumbs[0], {url: canonical, navigationTitle: loadDocNavigationTitle(projectRoot, id)});
    const frontMatter = matter(readFileSync(join(projectRoot, 'docs', `${id}.mdx`), 'utf8')).data;
    const expectsFaq = frontMatter.structured_data === 'faq';
    if (faqs.length !== (expectsFaq ? 1 : 0)) {
      throw new Error(`FAQPage count URL=${canonical} expected=${expectsFaq ? 1 : 0} actual=${faqs.length}`);
    }
    if (expectsFaq) validateFaqPage(faqs[0], frontMatter.faq_items);
    const article = articles[0];
    validateTechArticle(article, {title: loadDocTitle(projectRoot, id), url: canonical, ...loadDocArticleExpected(projectRoot, id)});
  }
  console.log(`Structured data and git freshness passed: ${requiredDocIds.length} documents`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  verifyBuiltStructuredData(join(dirname(fileURLToPath(import.meta.url)), '..'));
}
