/**
 * rsuite `Radio`/`RadioGroup` -> MUI.
 *
 *   <Radio value={x}>Label</Radio>
 *     -> <FormControlLabel value={x} control={<Radio />} label={Label} />
 *
 * `RadioGroup`'s handler arguments swap the same way `Toggle`'s do: rsuite
 * calls `onChange(value, event)`, MUI calls `onChange(event, value)`.
 * `inline` becomes `row`.
 */
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

const braceEnd = (src, from) => {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
};

let radios = 0;
let groups = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  // --- RadioGroup --------------------------------------------------------
  const groupEdits = [];
  for (const m of src.matchAll(/<RadioGroup(?=[\s/>])/g)) {
    const from = m.index + m[0].length;
    const end = findTagEnd(src, from);
    if (end === -1) continue;

    let span = src.slice(from, end);
    const before = span;

    span = span.replace(/(^|\s)inline(?![\w$-])/g, '$1row');
    span = span.replace(/(^|\s)appearance\s*=\s*"[^"]*"/g, '');

    const at = span.search(/(^|\s)onChange\s*=\s*\{/);
    if (at !== -1) {
      const open = span.indexOf('{', at);
      const close = braceEnd(span, open);
      const handler = span.slice(open + 1, close).trim();
      const arrow = handler.match(/^\(?\s*([A-Za-z_$][\w$]*)(\s*:\s*[^),]+)?\s*\)?\s*=>/);
      if (arrow) {
        span =
          span.slice(0, open + 1) +
          handler.replace(
            /^\(?\s*[A-Za-z_$][\w$]*(\s*:\s*[^),]+)?\s*\)?\s*=>/,
            `(_event, ${arrow[1]}${arrow[2] ?? ''}) =>`
          ) +
          span.slice(close);
      }
    }

    if (span !== before) groupEdits.push({ from, to: end, span });
  }
  for (const e of groupEdits.reverse()) {
    src = src.slice(0, e.from) + e.span + src.slice(e.to);
    groups++;
  }

  // --- Radio -------------------------------------------------------------
  for (;;) {
    const open = /<Radio(?=[\s>])/g;
    let hit = null;
    let m;
    while ((m = open.exec(src))) {
      const from = m.index + m[0].length;
      const end = findTagEnd(src, from);
      if (end === -1) continue;
      const span = src.slice(from, end);
      if (span.trimEnd().endsWith('/')) continue;
      const close = src.indexOf('</Radio>', end);
      if (close === -1) continue;
      hit = { start: m.index, from, end, span, close };
      break;
    }
    if (!hit) break;

    const body = src.slice(hit.end + 1, hit.close).trim();
    // A single `{expr}` is already an expression; anything else (plain text,
    // or several elements) has to be wrapped, in a fragment when it has more
    // than one root.
    let label;
    if (body.startsWith('{') && body.endsWith('}')) {
      let depth = 0;
      let single = true;
      for (let i = 0; i < body.length - 1; i++) {
        if (body[i] === '{') depth++;
        else if (body[i] === '}' && --depth === 0) { single = false; break; }
      }
      label = single ? body : `{<>${body}</>}`;
    } else if (/>\s*</.test(body)) {
      label = `{<>${body}</>}`;
    } else {
      label = `{${body}}`;
    }
    const baseIndent = src.slice(0, hit.start).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';

    const attrs = hit.span.replace(/\s+/g, ' ').trim();
    const replacement =
      `<FormControlLabel\n${baseIndent}  ${attrs}\n` +
      `${baseIndent}  control={<Radio />}\n` +
      `${baseIndent}  label=${label}\n${baseIndent}/>`;

    src =
      src.slice(0, hit.start) + replacement + src.slice(hit.close + '</Radio>'.length);
    radios++;
  }

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${groups} radio groups, ${radios} radios`);
