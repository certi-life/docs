import {execFileSync} from 'node:child_process';

function structuredDataError(type, expected, actual) {
  throw new Error(`${type} expected=${expected} actual=${actual}`);
}

const gitHistoryCache = new Map();

function gitFileLastModifiedMap(projectRoot) {
  if (gitHistoryCache.has(projectRoot)) return gitHistoryCache.get(projectRoot);
  const output = execFileSync('git', ['--no-pager', '-c', 'log.showSignature=false', 'log', '--format=@@%ct', '--name-status'], {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  const result = new Map();
  let timestamp;
  for (const line of output.split('\n')) {
    if (line.startsWith('@@')) {
      timestamp = Number(line.slice(2));
      continue;
    }
    const tab = line.lastIndexOf('\t');
    if (tab === -1 || !Number.isFinite(timestamp)) continue;
    const path = line.slice(tab + 1);
    if (!result.has(path)) result.set(path, new Date(timestamp * 1000).toISOString());
  }
  gitHistoryCache.set(projectRoot, result);
  return result;
}

export function gitLastModifiedIso(projectRoot, id) {
  const path = `docs/${id}.mdx`;
  const value = gitFileLastModifiedMap(projectRoot).get(path);
  if (!value) throw new Error(`missing git history for ${path}`);
  return value;
}

export function normalizeJsonLd(values) {
  const normalized = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== 'object') return;
    normalized.push(value);
    if ('@graph' in value) visit(value['@graph']);
  };
  visit(values);
  return normalized;
}

export function jsonLdHasType(value, type) {
  return value?.['@type'] === type || (Array.isArray(value?.['@type']) && value['@type'].includes(type));
}

export function validateTechArticle(value, expected) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    structuredDataError('TechArticle', 'object', value === null ? 'null' : typeof value);
  }
  const exact = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: expected.title,
    description: expected.description,
    url: expected.url,
    mainEntityOfPage: expected.url,
    inLanguage: 'ko-KR',
    dateModified: expected.dateModified,
  };
  for (const [field, wanted] of Object.entries(exact)) {
    if (value[field] !== wanted) {
      structuredDataError('TechArticle', `${field}=${JSON.stringify(wanted)}`, `${field}=${JSON.stringify(value[field] ?? '<missing>')}`);
    }
  }
  if (typeof value.description !== 'string' || !value.description.trim()) {
    structuredDataError('TechArticle', 'description nonempty', JSON.stringify(value.description ?? '<missing>'));
  }
  const modified = new Date(value.dateModified);
  if (Number.isNaN(modified.getTime()) || modified.toISOString() !== value.dateModified) {
    structuredDataError('TechArticle', 'dateModified canonical ISO timestamp', JSON.stringify(value.dateModified));
  }
  return value;
}

export function validateBreadcrumbList(value, {url, navigationTitle}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    structuredDataError('BreadcrumbList', 'object', value === null ? 'null' : typeof value);
  }
  if (value['@context'] !== 'https://schema.org') {
    structuredDataError('BreadcrumbList', '@context=https://schema.org', JSON.stringify(value['@context'] ?? '<missing>'));
  }
  if (value['@type'] !== 'BreadcrumbList') {
    structuredDataError('BreadcrumbList', '@type=BreadcrumbList', JSON.stringify(value['@type'] ?? '<missing>'));
  }
  const crumbs = value.itemListElement;
  if (!Array.isArray(crumbs) || crumbs.length === 0) {
    structuredDataError('BreadcrumbList', 'nonempty itemListElement array', Array.isArray(crumbs) ? 'empty array' : typeof crumbs);
  }
  if (crumbs.length !== 1) {
    structuredDataError('BreadcrumbList', 'exact current navigation hierarchy with one item', `itemListElement.length=${crumbs.length}`);
  }
  crumbs.forEach((crumb, index) => {
    const expectedPosition = index + 1;
    if (!crumb || typeof crumb !== 'object' || Array.isArray(crumb)) {
      structuredDataError('BreadcrumbList', `itemListElement[${index}] object`, crumb === null ? 'null' : typeof crumb);
    }
    if (crumb['@type'] !== 'ListItem') {
      structuredDataError('BreadcrumbList', `itemListElement[${index}].@type=ListItem`, JSON.stringify(crumb['@type'] ?? '<missing>'));
    }
    if (!Number.isInteger(crumb.position) || crumb.position !== expectedPosition) {
      structuredDataError('BreadcrumbList', `itemListElement[${index}].position=${expectedPosition}`, JSON.stringify(crumb.position ?? '<missing>'));
    }
    if (typeof crumb.name !== 'string' || !crumb.name.trim()) {
      structuredDataError('BreadcrumbList', `itemListElement[${index}].name nonempty`, JSON.stringify(crumb.name ?? '<missing>'));
    }
    if (typeof crumb.item !== 'string' || !crumb.item.trim()) {
      structuredDataError('BreadcrumbList', `itemListElement[${index}].item nonempty URL`, JSON.stringify(crumb.item ?? '<missing>'));
    }
    let crumbUrl;
    try { crumbUrl = new URL(crumb.item); } catch { structuredDataError('BreadcrumbList', `itemListElement[${index}].item absolute URL`, JSON.stringify(crumb.item)); }
    if (crumbUrl.origin !== new URL(url).origin || crumbUrl.username || crumbUrl.password) {
      structuredDataError('BreadcrumbList', `itemListElement[${index}].item same-origin URL`, JSON.stringify(crumb.item));
    }
  });
  const finalCrumb = crumbs.at(-1);
  if (finalCrumb.item !== url || finalCrumb.name !== navigationTitle) {
    structuredDataError('BreadcrumbList', `final item=${url} name=${navigationTitle}`, `item=${JSON.stringify(finalCrumb.item ?? '<missing>')} name=${JSON.stringify(finalCrumb.name ?? '<missing>')}`);
  }
  return value;
}
