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
