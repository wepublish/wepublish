/**
 * rsuite `Loader` -> MUI `CircularProgress`.
 *
 * rsuite sizes are named; MUI takes pixels. `center` centres the spinner in its
 * parent, which MUI expresses as a flex Box, and `content` is a label beside
 * the spinner.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SIZE_PX = { xs: 16, sm: 20, md: 28, lg: 40 };

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

  const edits = [];
  for (const m of src.matchAll(/<Loader(?=[\s/>])/g)) {
    const from = m.index + m[0].length;
    const end = findTagEnd(src, from);
    if (end === -1) continue;

    let span = src.slice(from, end);
    const selfClosing = span.trimEnd().endsWith('/');
    if (selfClosing) span = span.trimEnd().slice(0, -1);

    const baseIndent = src.slice(0, m.index).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';

    const sizeHit = span.match(/(^|\s)size\s*=\s*(?:"(\w+)"|\{\s*'(\w+)'\s*\})/);
    const size = SIZE_PX[sizeHit?.[2] ?? sizeHit?.[3]];
    if (sizeHit) span = span.replace(sizeHit[0], '');

    const centered = /(^|\s)center(?![\w$-])/.test(span);
    span = span.replace(/(^|\s)center(?![\w$-])/g, '');

    const contentHit = span.match(
      /(^|\s)content\s*=\s*(?:"([^"]*)"|\{((?:[^{}]|\{[^{}]*\})*)\})/
    );
    const content =
      contentHit ? (contentHit[2] !== undefined ? `'${contentHit[2]}'` : contentHit[3].trim())
      : null;
    if (contentHit) span = span.replace(contentHit[0], '');

    // Anything left (className, style, …) rides along on the spinner.
    const rest = span.replace(/\s+/g, ' ').trim();
    const spinnerProps = [size ? `size={${size}}` : '', rest].filter(Boolean).join(' ');
    const spinner = `<CircularProgress${spinnerProps ? ' ' + spinnerProps : ''} />`;

    let replacement;
    if (centered || content) {
      const inner = content
        ? `\n${baseIndent}    ${spinner}\n${baseIndent}    <span>{${content}}</span>\n${baseIndent}  `
        : `\n${baseIndent}    ${spinner}\n${baseIndent}  `;
      replacement =
        `<Box\n${baseIndent}  sx={{\n${baseIndent}    display: 'flex',\n` +
        `${baseIndent}    gap: 1,\n${baseIndent}    alignItems: 'center',\n` +
        `${baseIndent}    justifyContent: 'center',\n${baseIndent}  }}\n${baseIndent}>` +
        inner +
        `</Box>`;
    } else {
      replacement = spinner;
    }

    const tagEnd = selfClosing ? end + 1 : src.indexOf('</Loader>', end) + '</Loader>'.length;
    edits.push({ from: m.index, to: tagEnd, replacement });
  }

  for (const e of edits.reverse()) {
    src = src.slice(0, e.from) + e.replacement + src.slice(e.to);
    converted++;
  }

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} loaders`);
