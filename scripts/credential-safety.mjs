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
      if (/\s/.test(char) || char === '<' || char === '>' || char === '`' || char === '"') break;
      if (char === '\\' && end + 1 < source.length) {
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
