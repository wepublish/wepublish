/** MUI's Chip takes `label`, not children: <Chip …>X</Chip> -> <Chip … label={X} /> */
import { readFileSync, writeFileSync } from 'node:fs';

const findTagEnd = (src, from) => {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
    } else if (c === '>' && depth === 0) return i;
  }
  return -1;
};

let converted = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (;;) {
    const open = /<Chip(?=[\s>])/g;
    let found = null;
    let m;
    while ((m = open.exec(src))) {
      const from = m.index + m[0].length;
      const end = findTagEnd(src, from);
      if (end === -1) continue;
      const span = src.slice(from, end);
      if (span.trimEnd().endsWith('/')) continue;
      if (/(^|\s)label=/.test(span)) continue;
      const close = src.indexOf('</Chip>', end);
      if (close === -1) continue;
      found = { start: m.index, from, end, span, close };
      break;
    }
    if (!found) break;

    const body = src.slice(found.end + 1, found.close).trim();
    const label =
      body.startsWith('{') && body.endsWith('}') ? body : `{${body}}`;

    const multiline = found.span.includes('\n');
    const indent = found.span.match(/\n([ \t]+)\S/)?.[1] ?? '  ';
    const span = multiline
      ? found.span.replace(/\n([ \t]*)$/, `\n${indent}label=${label}\n$1`)
      : `${found.span.trimEnd()} label=${label} `;

    src =
      src.slice(0, found.from) +
      span +
      '/>' +
      src.slice(found.close + '</Chip>'.length);
    converted++;
  }

  if (src !== original) writeFileSync(file, src);
}

console.log(`moved ${converted} chip labels`);
