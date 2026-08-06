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

export function decodeUrlComponentLayers(value) {
  let current = value;
  for (let depth = 0; depth <= value.length; depth += 1) {
    let decoded;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      throw new Error('malformed URL encoding');
    }
    if (decoded === current) return current;
    current = decoded;
  }
  throw new Error('URL encoding depth exceeds input length');
}
