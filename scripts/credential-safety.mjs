const IDENTIFIER_DASHES = /[‐‑‒–—―⁃−﹘﹣－⁄∕／\/\\╱⧵⧸⧹]/gu;
const IDENTIFIER_DOTS = /[․‧·•∙⋅。．｡]/gu;
const IDENTIFIER_COLONS = /[꞉ː∶︰：]/gu;

export function normalizeInvisibleCharacters(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/\p{Default_Ignorable_Code_Point}/gu, '')
    .replace(/\p{M}/gu, '')
    .normalize('NFKC');
}

export function normalizeIpSurface(value) {
  return normalizeInvisibleCharacters(value)
    .replace(IDENTIFIER_DOTS, '.')
    .replace(IDENTIFIER_COLONS, ':');
}

export function normalizeIdentifierSurface(value) {
  return normalizeIpSurface(value)
    .replace(IDENTIFIER_DASHES, '-')
    .replace(/(?<=[0-9a-f])\p{Pd}+(?=[0-9a-f])/giu, '-');
}

export function maskExplicitPublicVersions(value) {
  return normalizeInvisibleCharacters(value).replace(
    /(^|[\p{White_Space}([{"'`])v\d+(?:\.\d+){3}(?=(?:은|는|이|가|을|를|과|와|의|에|에서|으로|로|입니다)?(?:[\s.,!?。,:;)\]}"'`]|$))/giu,
    '$1PUBLIC_VERSION',
  );
}

const ASSIGNMENT_FIELD = /(?<![\p{L}\p{N}])([\p{L}\p{N}_ -]{1,128})\s*(?::|(?:[+\-*/%&|^?<>]{0,3})=)/gu;

export function hasConfusableAssignmentField(value) {
  const normalized = normalizeInvisibleCharacters(value);
  for (const match of normalized.matchAll(ASSIGNMENT_FIELD)) {
    if (/[A-Za-z]/.test(match[1]) && /[\p{Script=Cyrillic}\p{Script=Greek}]/u.test(match[1])) return true;
  }
  return false;
}

export function hasUnclosedBlockComment(value) {
  let index = 0;
  while (index < value.length) {
    const start = value.indexOf('/*', index);
    if (start === -1) return false;
    const end = value.indexOf('*/', start + 2);
    if (end === -1) return true;
    index = end + 2;
  }
  return false;
}

const MAX_URL_COMPONENT_LENGTH = 4096;
const MAX_URL_DECODE_DEPTH = 64;
const URL_WHITESPACE = /\p{White_Space}/u;

export function extractHttpUrls(value) {
  const source = String(value);
  const starts = /https?:\/\//gi;
  const urls = [];
  let match;
  while ((match = starts.exec(source)) !== null) {
    let end = starts.lastIndex;
    let parentheses = 0;
    while (end < source.length) {
      const char = source[end];
      if (URL_WHITESPACE.test(char) || char === '<' || char === '>' || char === '`' || char === '"') break;
      if (char === '\\' && end + 1 < source.length) {
        const escaped = source[end + 1];
        if (URL_WHITESPACE.test(escaped)) break;
        end += 2;
        continue;
      }
      if (char === '(') {
        parentheses += 1;
      } else if (char === ')') {
        if (parentheses === 0) break;
        parentheses -= 1;
      }
      end += 1;
    }
    urls.push({url: source.slice(match.index, end), start: match.index, end});
    starts.lastIndex = Math.max(end, starts.lastIndex);
  }
  return urls;
}

export function replaceHttpUrls(value, replacement = 'PUBLIC_URL') {
  const source = String(value);
  const urls = extractHttpUrls(source);
  let result = '';
  let cursor = 0;
  for (const {start, end} of urls) {
    result += source.slice(cursor, start) + replacement;
    cursor = end;
  }
  return result + source.slice(cursor);
}

export function decodeUrlComponentLayers(value) {
  if (value.length > MAX_URL_COMPONENT_LENGTH) throw new Error('URL component exceeds maximum length');
  let current = value;
  for (let depth = 0; depth < MAX_URL_DECODE_DEPTH; depth += 1) {
    if (/%(?![0-9a-f]{2})/i.test(current)) {
      const onlyTrailingLiteralPercent = depth > 0 && current.endsWith('%') && current.indexOf('%') === current.length - 1;
      if (onlyTrailingLiteralPercent) return current;
      throw new Error('URL component contains malformed percent encoding');
    }
    let decoded;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      throw new Error('URL component contains malformed percent encoding');
    }
    if (decoded === current) return current;
    current = decoded;
  }
  throw new Error('URL encoding exceeds maximum depth');
}
