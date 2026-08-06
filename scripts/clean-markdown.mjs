import matter from '@11ty/gray-matter';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {isIP} from 'node:net';
import {join, posix, relative, resolve} from 'node:path';
import GithubSlugger from 'github-slugger';
import {unified} from 'unified';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import {decodeUrlComponentLayers, hasUnclosedBlockComment} from './credential-safety.mjs';

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkDirective).use(remarkGfm);
const stringifier = unified().use(remarkParse).use(remarkGfm).use(remarkStringify, {
  bullet: '-',
  fences: true,
  listItemIndent: 'one',
});
const KNOWN_DIRECTIVES = new Set(['note', 'tip', 'info', 'caution', 'warning', 'danger']);
const PORTABLE_TYPES = new Set([
  'root', 'paragraph', 'text', 'heading', 'blockquote', 'strong', 'emphasis', 'delete',
  'link', 'image', 'list', 'listItem', 'table', 'tableRow', 'tableCell', 'thematicBreak',
  'break', 'inlineCode', 'code', 'html', 'definition', 'footnoteDefinition', 'footnoteReference',
]);

function textValue(node) {
  if (typeof node?.value === 'string') return node.value;
  return (node?.children ?? []).map(textValue).join('');
}

function codeTuples(tree) {
  const values = [];
  walk(tree, (node) => {
    if (node.type === 'inlineCode') values.push(['inline', node.value]);
    if (node.type === 'code') values.push(['block', node.value, node.lang ?? null, node.meta ?? null]);
  });
  return values;
}

function walk(node, visitor) {
  visitor(node);
  for (const child of node.children ?? []) walk(child, visitor);
}

function literalAttribute(node, name) {
  const attributes = (node.attributes ?? []).filter((item) => item.type === 'mdxJsxAttribute' && item.name === name);
  if (attributes.length > 1) throw new Error(`${node.name}: duplicate ${name} attribute`);
  const attribute = attributes[0];
  if (!attribute) return undefined;
  if (typeof attribute.value !== 'string') throw new Error(`${node.name}: ${name} must be a literal string`);
  return attribute.value;
}

function assertOnlyLiteralAttributes(node, allowedNames) {
  for (const attribute of node.attributes ?? []) {
    if (attribute.type !== 'mdxJsxAttribute' || typeof attribute.name !== 'string') {
      throw new Error(`${node.name}: spread or computed attributes cannot be preserved safely`);
    }
    if (!allowedNames.has(attribute.name)) throw new Error(`${node.name}: unsupported attribute ${attribute.name}`);
    if (typeof attribute.value !== 'string') throw new Error(`${node.name}: ${attribute.name} must be a literal string`);
  }
}

function resolveLink(url, {id, canonicalUrl, routeMap}) {
  if (/^(?:javascript|data|vbscript):/i.test(url)) throw new Error(`dangerous link scheme: ${url}`);
  if (/^[a-z][a-z+.-]*:/i.test(url)) {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`unsupported link scheme: ${parsed.protocol}`);
    if (parsed.username || parsed.password) throw new Error(`URL credentials are not allowed: ${url}`);
    return url;
  }
  const [rawPath, rawFragment = ''] = url.split('#', 2);
  if (!rawPath) {
    if (rawFragment && !routeMap.get(id)?.fragments?.has(decodeURIComponent(rawFragment))) {
      throw new Error(`missing fragment ${rawFragment} in ${id}`);
    }
    return `${canonicalUrl}${rawFragment ? `#${rawFragment}` : ''}`;
  }
  let targetId;
  if (rawPath.startsWith('/')) {
    const pathOnly = rawPath.replace(/^\/guide\/?/, '').replace(/\.(?:md|mdx)$/, '').replace(/\/$/, '');
    targetId = [...routeMap.entries()].find(([, entry]) => new URL(entry.url).pathname.replace(/^\/guide\/?/, '') === pathOnly)?.[0];
  } else {
    targetId = posix.normalize(posix.join(posix.dirname(id), rawPath.replace(/\.(?:md|mdx)$/, ''))).replace(/^\.\//, '');
  }
  const target = routeMap.get(targetId);
  if (!target) throw new Error(`unknown internal link target: ${url} from ${id}`);
  if (rawFragment && !target.fragments?.has(decodeURIComponent(rawFragment))) {
    throw new Error(`missing fragment ${rawFragment} in ${targetId}`);
  }
  return `${target.url}${rawFragment ? `#${rawFragment}` : ''}`;
}

function sanitizeNode(node, context) {
  if (node.type === 'mdxjsEsm' || node.type === 'yaml') return [];
  if (node.type === 'html') {
    if (/^<!--[\s\S]*-->$/.test(node.value.trim())) return [];
    throw new Error('raw HTML is not portable clean Markdown');
  }
  if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
    if (/^\s*\/\*[\s\S]*\*\/\s*$/.test(node.value)) return [];
    throw new Error('non-comment MDX expression cannot be preserved safely');
  }
  if (node.type === 'containerDirective' || node.type === 'leafDirective' || node.type === 'textDirective') {
    if (!KNOWN_DIRECTIVES.has(node.name)) throw new Error(`unknown directive: ${node.name}`);
    if (node.type !== 'containerDirective') throw new Error(`unsupported directive form: ${node.type}`);
    const children = node.children ?? [];
    const label = children[0]?.data?.directiveLabel ? children[0] : null;
    const body = label ? children.slice(1) : children;
    const labelText = textValue(label) || node.name;
    const converted = body.flatMap((child) => sanitizeNode(child, context));
    return [{
      type: 'blockquote',
      children: [
        {type: 'paragraph', children: [{type: 'strong', children: [{type: 'text', value: labelText}]}]},
        ...converted,
      ],
    }];
  }
  if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
    if (node.name === 'a') {
      const url = literalAttribute(node, 'href');
      if (!url) throw new Error('MDX <a> requires a literal href');
      return [{type: 'link', url: resolveLink(url, context), children: (node.children ?? []).flatMap((child) => sanitizeNode(child, context))}];
    }
    if (node.name === 'img') {
      const url = literalAttribute(node, 'src');
      const alt = literalAttribute(node, 'alt');
      if (!url || alt === undefined) throw new Error('MDX <img> requires literal src and alt');
      return [{type: 'image', url: resolveLink(url, context), alt}];
    }
    if (node.name === 'Tabs') {
      if (context.inTabs || context.inTabItem) throw new Error('nested Tabs cannot be preserved safely');
      assertOnlyLiteralAttributes(node, new Set());
      const meaningfulChildren = (node.children ?? []).filter((child) => child.type !== 'text' || child.value.trim());
      if (meaningfulChildren.length === 0 || meaningfulChildren.some((child) => !['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(child.type) || child.name !== 'TabItem')) {
        throw new Error('Tabs may contain only paired TabItem components');
      }
      return meaningfulChildren.flatMap((child) => sanitizeNode(child, {...context, inTabs: true}));
    }
    if (node.name === 'TabItem') {
      if (!context.inTabs) throw new Error('TabItem must be nested directly inside Tabs');
      assertOnlyLiteralAttributes(node, new Set(['label', 'value']));
      const label = literalAttribute(node, 'label');
      const value = literalAttribute(node, 'value');
      if (!label?.trim() || !value?.trim()) throw new Error('TabItem requires non-empty literal label and value');
      if ((node.children ?? []).length === 0) throw new Error('TabItem content cannot be empty');
      return [
        {type: 'heading', depth: 2, children: [{type: 'text', value: label.trim()}]},
        ...(node.children ?? []).flatMap((child) => sanitizeNode(child, {...context, inTabs: false, inTabItem: true})),
      ];
    }
    if ((node.children ?? []).length === 0) throw new Error(`self-closing MDX component cannot be preserved safely: ${node.name}`);
    throw new Error(`unknown paired MDX component: ${node.name}`);
  }
  if (!PORTABLE_TYPES.has(node.type)) throw new Error(`unsupported Markdown AST node: ${node.type}`);
  const clean = {...node};
  delete clean.position;
  delete clean.data;
  if (node.type === 'link' || node.type === 'image') clean.url = resolveLink(node.url, context);
  if (node.children) clean.children = node.children.flatMap((child) => sanitizeNode(child, context));
  return [clean];
}

function normalizeBodyHeadings(children, title) {
  return children.flatMap((node) => {
    if (node.type !== 'heading' || node.depth !== 1) return [node];
    if (textValue(node).trim() === title.trim()) return [];
    return [{...node, depth: 2}];
  });
}

export function renderCleanMarkdown(source, {id, canonicalUrl, routeMap}) {
  const parsedMatter = matter(String(source).normalize('NFC'));
  const {title, description} = parsedMatter.data;
  if (typeof title !== 'string' || !title.trim()) throw new Error(`${id}: frontmatter title must be a non-empty string`);
  if (typeof description !== 'string' || !description.trim()) throw new Error(`${id}: frontmatter description must be a non-empty string`);
  const originalTree = parser.parse(parsedMatter.content);
  const originalCode = codeTuples(originalTree);
  const body = normalizeBodyHeadings(
    originalTree.children.flatMap((node) => sanitizeNode(node, {id, canonicalUrl, routeMap})),
    title,
  );
  const tree = {
    type: 'root',
    children: [
      {type: 'heading', depth: 1, children: [{type: 'text', value: title.trim()}]},
      {type: 'blockquote', children: [{type: 'paragraph', children: [{type: 'text', value: description.trim()}]}]},
      {type: 'paragraph', children: [{type: 'link', url: canonicalUrl, children: [{type: 'text', value: '사람이 읽는 원문'}]}]},
      ...body,
    ],
  };
  const output = `${stringifier.stringify(tree).trim()}\n`;
  const reparsed = unified().use(remarkParse).use(remarkGfm).parse(output);
  walk(reparsed, (node) => {
    if (!PORTABLE_TYPES.has(node.type)) throw new Error(`${id}: generated output contains non-portable node ${node.type}`);
  });
  const headings = [];
  walk(reparsed, (node) => { if (node.type === 'heading' && node.depth === 1) headings.push(node); });
  if (headings.length !== 1 || textValue(headings[0]) !== title.trim()) throw new Error(`${id}: generated output must contain exactly one title H1`);
  assertDeepEqual(codeTuples(reparsed), originalCode, `${id}: code content changed during Markdown rendering`);
  return output;
}

const LEAK_PATTERNS = [
  /\bWORK-\d+\b/i,
  /\bplane\.certi\b/i,
  /\b(?:localhost|127\.0\.0\.1)\b/i,
  /\b(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)\d{1,3}\.\d{1,3}\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,255}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,255}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]{16,}?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}\b/i,
  /https?:\/\/[^\s/@]+:[^\s/@]+@/i,
  /[\u200B-\u200D\u2060\uFEFF]/,
];
const IDENTIFIER_PATTERNS = [
  /(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)/,
  /[0-9a-f]{8}[-_]?[0-9a-f]{4}[-_]?[0-9a-f]{4}[-_]?[0-9a-f]{4}[-_]?[0-9a-f]{12}/i,
  /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/,
  /(?:\(?0\d{1,3}\)?[ .-]?\d{3,4}[ .-]?\d{4})/,
  /(?:\+82[ .-]?(?:\(0\)[ .-]?)?\(?\d{1,3}\)?[ .-]?\d{3,4}[ .-]?\d{4})/,
  /\b1[5-8]\d{2}[ .-]?\d{4}\b/,
];
const CREDENTIAL_FIELD_SOURCE = '(?:(?:[\\p{L}\\p{N}]+[ _-])*(?:api[ _-]?key|token|secret|authorization|password|passwd|pwd))';
const CREDENTIAL_ASSIGNMENT = new RegExp(`(?<![\\p{L}\\p{N}])(${CREDENTIAL_FIELD_SOURCE})(?:["']|\\s)*(?::|(?:(?:\\*\\*|>>>|<<|>>|\\|\\||&&|\\?\\?|[+\\-*/%&|^]))?\\s*=)\\s*(?:"([^"\\r\\n]*)"|'([^'\\r\\n]*)'|\\x60([^\\x60\\r\\n]*)\\x60|([^\\s,;)\\]\\x60.!?]+))`, 'giu');
const SAFE_NON_SECRET_FIELD = /^(?:CSS[ _-]+)?(?:design|custom|color|theme)[ _-]token$/i;
const SAFE_CREDENTIAL_PLACEHOLDER = /^(?:<YOUR_[A-Z0-9_]+>|\$\{[A-Z_][A-Z0-9_]*\}|\{\{[A-Z_][A-Z0-9_]*\}\}|%[A-Z_][A-Z0-9_]*%|\$[A-Z_][A-Z0-9_]*|(?:YOUR|REPLACE|CHANGE|INSERT)_[A-Z0-9_]+|REDACTED|MASKED|PLACEHOLDER|NONE|NULL|UNSET|CHANGEME|X{3,}|\*{3}|(?:EXAMPLE|SAMPLE|DUMMY|FAKE)(?:_(?:VALUE|SECRET|TOKEN|KEY|PASSWORD))?)(?:은|는|이|가|을|를|과|와|의|에|에서|으로|로|입니다)?[.!?。]?$/;
const SAFE_CREDENTIAL_FINAL_TAIL = /^(?:[ \t]*[`.,!?。,:;)]*[ \t]*|(?:은|는|이|가|을|를|과|와|의|에|에서|으로|로)(?:[ \t]+(?:입력|사용|확인|설정)합니다)?[.!?。]?|입니다[.!?。]?|[ \t]+(?:for\s+(?:local\s+)?testing|when\s+testing|in\s+(?:an?\s+)?(?:example|documentation)|(?:입력|사용|확인|설정)(?:합니다)?|입니다)[.!?。]?)$/i;
const EXPLICIT_BEARER_PLACEHOLDER_SOURCE = '(?:<YOUR_[A-Z0-9_]+>|REPLACE_ME|REDACTED|MASKED|\\*{3}|\\$\\{[A-Z_][A-Z0-9_]*\\})';

function normalizeCredentialMarkdown(value) {
  const strong = new RegExp(`(?:\\*\\*|__)(${CREDENTIAL_FIELD_SOURCE})(?:\\*\\*|__)`, 'giu');
  const code = new RegExp('`(' + CREDENTIAL_FIELD_SOURCE + ')`', 'giu');
  const link = new RegExp(`\\[(${CREDENTIAL_FIELD_SOURCE})\\]\\([^)]+\\)`, 'giu');
  return value
    .replace(/[`\\]+/g, '')
    .replace(/(?<=[\p{L}\p{N}_])\*+(?=[\p{L}\p{N}_:]|$)/gu, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(strong, '$1')
    .replace(code, '$1')
    .replace(link, '$1')
    .replace(/`([^`\r\n]+)`/g, '$1');
}

function credentialCommentVariants(value) {
  let stripped = '';
  let preserved = '';
  let quote = null;
  for (let index = 0; index < value.length;) {
    const char = value[index];
    if (quote) {
      stripped += char;
      preserved += char;
      if (char === '\\' && index + 1 < value.length) {
        stripped += value[index + 1];
        preserved += value[index + 1];
        index += 2;
        continue;
      }
      if (char === quote) quote = null;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      stripped += char;
      preserved += char;
      index += 1;
      continue;
    }
    if (char === '/' && value[index + 1] === '*') {
      const end = value.indexOf('*/', index + 2);
      if (end === -1) {
        stripped += value.slice(index);
        preserved += value.slice(index);
        break;
      }
      preserved += ` ${value.slice(index + 2, end)} `;
      index = end + 2;
      continue;
    }
    stripped += char;
    preserved += char;
    index += 1;
  }
  return [...new Set([stripped, preserved])];
}

function assertNoLeaks(value, label, {allowGeneratedMarkdownEscapes = false} = {}) {
  if (hasUnclosedBlockComment(value)) {
    throw new Error(`${label}: private or credential-like content detected`);
  }
  for (const pattern of LEAK_PATTERNS) {
    if (pattern.test(value)) throw new Error(`${label}: private or credential-like content detected`);
  }
  const publicUrls = [...value.matchAll(/https?:\/\/[^\s)<>"']+/gi)];
  const decodedUrlSurfaces = [];
  for (const match of publicUrls) {
    let parsed;
    try {
      parsed = new URL(match[0]);
    } catch {
      throw new Error(`${label}: private or credential-like content detected`);
    }
    const host = parsed.hostname.replace(/^\[|\]$/g, '').toLocaleLowerCase('en-US');
    if (isIP(host) === 6 && (host === '::' || host === '::1' || /^(?:f[cd]|fe[89ab])/i.test(host))) {
      throw new Error(`${label}: private or credential-like content detected`);
    }
    try {
      decodedUrlSurfaces.push(decodeUrlComponentLayers(`${parsed.pathname}${parsed.search}${parsed.hash}`));
    } catch {
      throw new Error(`${label}: private or credential-like content detected`);
    }
  }
  const proseWithoutUrls = value.replace(/https?:\/\/[^\s)<>"']+/gi, 'PUBLIC_URL');
  for (const pattern of IDENTIFIER_PATTERNS) {
    if (pattern.test(proseWithoutUrls)) throw new Error(`${label}: private or credential-like content detected`);
  }
  for (const match of proseWithoutUrls.matchAll(/[0-9a-f:]{2,}/gi)) {
    if (isIP(match[0]) === 6) throw new Error(`${label}: private or credential-like content detected`);
  }
  const unescaped = [value, ...decodedUrlSurfaces].join('\n').replace(/\\+(?=["'])/g, '');
  const variants = credentialCommentVariants(unescaped)
    .map(normalizeCredentialMarkdown)
    .map((candidate) => candidate.replace(/([*?<>|&])(?:[ \t]+\1){1,2}(?=[ \t]*=)/g, (operator) => operator.replace(/[ \t]/g, '')))
    .map((candidate) => candidate.replace(/\bCSS\s+--[\w-]*token[\w-]*\s*:/gi, 'CSS variable:'));
  for (const variant of variants) {
    const scanValue = allowGeneratedMarkdownEscapes ? variant.replace(/\\([_*])/g, '$1') : variant;
    CREDENTIAL_ASSIGNMENT.lastIndex = 0;
    const matches = [...scanValue.matchAll(CREDENTIAL_ASSIGNMENT)];
    for (const [index, match] of matches.entries()) {
      const field = match[1];
      if (SAFE_NON_SECRET_FIELD.test(field)) continue;
      const quoted = match[2] !== undefined || match[3] !== undefined || match[4] !== undefined;
      const candidate = match[2] ?? match[3] ?? match[4] ?? match[5] ?? '';
      const checkedCandidate = allowGeneratedMarkdownEscapes ? candidate.replace(/\\_/g, '_') : candidate;
      let matchEnd = match.index + match[0].length;
      if (!quoted && /authorization$/i.test(field) && /^Bearer$/i.test(checkedCandidate)) {
        const bearer = scanValue.slice(matchEnd).match(new RegExp(`^[ \\t]+(${EXPLICIT_BEARER_PLACEHOLDER_SOURCE})`));
        const bearerCandidate = allowGeneratedMarkdownEscapes ? bearer?.[1].replace(/\\_/g, '_') : bearer?.[1];
        if (!bearer || !SAFE_CREDENTIAL_PLACEHOLDER.test(bearerCandidate)) throw new Error(`${label}: private or credential-like content detected`);
        matchEnd += bearer[0].length;
      } else if (!SAFE_CREDENTIAL_PLACEHOLDER.test(checkedCandidate)) {
        throw new Error(`${label}: private or credential-like content detected`);
      }
      const nextMatch = matches[index + 1];
      if (nextMatch) {
        const separator = scanValue.slice(matchEnd, nextMatch.index);
        if (!/^[ \t]*(?:[,;][ \t]*|\r?\n[ \t]*)$/.test(separator)) throw new Error(`${label}: private or credential-like content detected`);
        continue;
      }
      const tail = scanValue.slice(matchEnd).split(/\r?\n/, 1)[0];
      if (!SAFE_CREDENTIAL_FINAL_TAIL.test(tail)) throw new Error(`${label}: private or credential-like content detected`);
    }
  }
}

function fragmentsFromSource(source) {
  const parsed = matter(String(source).normalize('NFC'));
  const tree = parser.parse(parsed.content);
  const slugger = new GithubSlugger();
  const fragments = new Set();
  walk(tree, (node) => {
    if (node.type === 'heading') fragments.add(slugger.slug(textValue(node)));
  });
  return fragments;
}

function endpointPath(canonicalUrl) {
  const url = new URL(canonicalUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'docs.certi.life') {
    throw new Error(`clean Markdown canonical URL must use https://docs.certi.life: ${canonicalUrl}`);
  }
  if (!url.pathname.startsWith('/guide/') || url.pathname.endsWith('/')) {
    throw new Error(`unsupported canonical route for clean Markdown endpoint: ${canonicalUrl}`);
  }
  return `${url.pathname.slice(1)}.md`;
}

export function createCleanMarkdownArtifacts(documents) {
  const ids = new Set();
  const paths = new Set();
  const routeMap = new Map();
  for (const document of documents) {
    if (ids.has(document.id)) throw new Error(`duplicate public document id: ${document.id}`);
    ids.add(document.id);
    assertNoLeaks(document.source, document.id);
    const path = endpointPath(document.canonicalUrl);
    if (paths.has(path)) throw new Error(`duplicate clean Markdown endpoint: ${path}`);
    paths.add(path);
    routeMap.set(document.id, {url: document.canonicalUrl, fragments: fragmentsFromSource(document.source)});
  }
  const seenSemanticHashes = new Map();
  const artifacts = documents.map((document) => {
    const path = endpointPath(document.canonicalUrl);
    const content = renderCleanMarkdown(document.source, {
      id: document.id,
      canonicalUrl: document.canonicalUrl,
      routeMap,
    });
    assertNoLeaks(content, path, {allowGeneratedMarkdownEscapes: true});
    const semantic = content.replace(document.canonicalUrl, 'https://docs.certi.life/guide/__CANONICAL__');
    const hash = createHash('sha256').update(semantic).digest('hex');
    const previous = seenSemanticHashes.get(hash);
    if (previous) throw new Error(`identical clean Markdown output: ${previous} and ${path}`);
    seenSemanticHashes.set(hash, path);
    return {id: document.id, canonicalUrl: document.canonicalUrl, path, content};
  });
  return artifacts.sort((left, right) => left.path.localeCompare(right.path, 'en'));
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walkFiles(path) : [path];
  });
}

function normalizeArtifactPath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') || value.includes('%')) {
    throw new Error(`invalid clean Markdown artifact path: ${String(value)}`);
  }
  if (value.startsWith('/') || /^[A-Za-z]:/.test(value)) throw new Error(`invalid clean Markdown artifact path: ${value}`);
  const normalized = posix.normalize(value.normalize('NFC'));
  if (posix.normalize(value) !== value || !normalized.startsWith('guide/') || normalized === 'guide/' || !normalized.endsWith('.md')) {
    throw new Error(`invalid clean Markdown artifact path: ${value}`);
  }
  return normalized;
}

const PORTABLE_PATH_COLLATOR = new Intl.Collator('und', {
  usage: 'search',
  sensitivity: 'base',
  ignorePunctuation: false,
  numeric: false,
});

function validatedArtifacts(artifacts) {
  if (!Array.isArray(artifacts)) throw new Error('clean Markdown artifacts must be an array');
  const seenPortablePaths = [];
  return artifacts.map((artifact) => {
    const path = normalizeArtifactPath(artifact?.path);
    if (seenPortablePaths.some((seenPath) => PORTABLE_PATH_COLLATOR.compare(seenPath, path) === 0)) {
      throw new Error(`colliding clean Markdown artifact path: ${path}`);
    }
    if (typeof artifact.content !== 'string') throw new Error(`invalid clean Markdown artifact content: ${path}`);
    seenPortablePaths.push(path);
    return {...artifact, path};
  });
}

export function writeCleanMarkdownArtifacts(projectRoot, artifacts) {
  const safeArtifacts = validatedArtifacts(artifacts);
  const staticRoot = join(projectRoot, 'static');
  mkdirSync(staticRoot, {recursive: true});
  const temporaryRoot = mkdtempSync(join(projectRoot, '.clean-markdown-'));
  const temporaryGuide = join(temporaryRoot, 'guide');
  const finalGuide = join(staticRoot, 'guide');
  const backupGuide = join(temporaryRoot, 'previous-guide');
  let backupMoved = false;
  try {
    for (const artifact of safeArtifacts) {
      const destination = resolve(temporaryRoot, artifact.path);
      const containment = relative(temporaryGuide, destination);
      if (!containment || containment.startsWith('..') || resolve(temporaryGuide, containment) !== destination) {
        throw new Error(`invalid clean Markdown artifact path: ${artifact.path}`);
      }
      mkdirSync(join(destination, '..'), {recursive: true});
      writeFileSync(destination, artifact.content, 'utf8');
    }
    if (existsSync(finalGuide)) {
      renameSync(finalGuide, backupGuide);
      backupMoved = true;
    }
    renameSync(temporaryGuide, finalGuide);
    rmSync(backupGuide, {recursive: true, force: true});
  } catch (error) {
    if (backupMoved && !existsSync(finalGuide) && existsSync(backupGuide)) renameSync(backupGuide, finalGuide);
    throw error;
  } finally {
    rmSync(temporaryRoot, {recursive: true, force: true});
  }
}

export function verifyCleanMarkdownArtifacts(projectRoot, artifacts, {buildRoot} = {}) {
  const expected = new Map(artifacts.map((artifact) => [artifact.path, artifact.content]));
  const staticRoot = join(projectRoot, 'static');
  for (const artifact of artifacts) {
    const path = join(staticRoot, artifact.path);
    if (!existsSync(path)) throw new Error(`missing clean Markdown artifact: ${artifact.path}`);
    if (readFileSync(path, 'utf8') !== artifact.content) throw new Error(`stale clean Markdown artifact: ${artifact.path}`);
    if (buildRoot) {
      const built = join(buildRoot, artifact.path);
      if (!existsSync(built)) throw new Error(`missing built clean Markdown artifact: ${artifact.path}`);
      if (!readFileSync(built).equals(Buffer.from(artifact.content))) throw new Error(`built clean Markdown artifact differs: ${artifact.path}`);
    }
  }
  for (const file of walkFiles(join(staticRoot, 'guide')).filter((path) => path.endsWith('.md'))) {
    const artifactPath = relative(staticRoot, file).split('\\').join('/');
    if (!expected.has(artifactPath)) throw new Error(`orphan clean Markdown artifact: ${artifactPath}`);
  }
  return true;
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message);
}
