/**
 * rsuite `Stack` -> MUI `Stack`.
 *
 * Two traps make this more than a rename:
 *
 *  1. rsuite's `spacing` is a pixel value; MUI's is a multiple of the theme
 *     spacing unit (8px). `spacing={8}` must become `spacing={1}`.
 *  2. rsuite's Stack defaults to `direction="row"`, MUI's defaults to
 *     `"column"`. Every converted Stack without an explicit direction gets
 *     `direction="row"` or the layout silently flips.
 *
 * MUI v9's Stack also takes only direction/spacing/divider/useFlexGap as real
 * props — `alignItems`, `justifyContent` and `flexWrap` move into `sx`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SX_PROPS = ['alignItems', 'justifyContent', 'flexWrap', 'alignSelf', 'flex'];

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
  for (const m of src.matchAll(/<Stack(?=[\s/>])/g)) {
    const from = m.index + m[0].length;
    const end = findTagEnd(src, from);
    if (end === -1) continue;

    let span = src.slice(from, end);
    // Leave Stacks that are already MUI-shaped (they carry an sx prop) alone.
    if (/(^|\s)sx=/.test(span)) continue;

    const selfClosing = span.trimEnd().endsWith('/');
    if (selfClosing) span = span.trimEnd().slice(0, -1);

    const baseIndent = src.slice(0, m.index).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const indent = baseIndent + '  ';

    // px -> theme units
    span = span.replace(
      /(^|\s)spacing=\{(\d+(?:\.\d+)?)\}/,
      (full, lead, px) => `${lead}spacing={${Number(px) / 8}}`
    );

    // rsuite's `wrap` boolean
    const hadWrap = /(^|\s)wrap(?![\w$-])/.test(span);
    span = span.replace(/(^|\s)wrap(?![\w$-])/g, '');

    // Layout props belong in sx on MUI v9's Stack.
    const sx = [];
    if (hadWrap) sx.push("flexWrap: 'wrap'");
    for (const prop of SX_PROPS) {
      const re = new RegExp(
        `(^|\\s)${prop}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^{}]*)\\})`
      );
      const hit = span.match(re);
      if (!hit) continue;
      const literal = hit[2] ?? hit[3];
      sx.push(`${prop}: ${literal !== undefined ? `'${literal}'` : hit[4].trim()}`);
      span = span.replace(re, '');
    }

    const hasDirection = /(^|\s)direction\s*=/.test(span);

    const additions = [];
    // rsuite laid Stacks out horizontally by default; MUI does not.
    if (!hasDirection) additions.push('direction="row"');
    if (sx.length) additions.push(`sx={{ ${sx.join(', ')} }}`);

    if (!additions.length && span === src.slice(from, end)) continue;

    // Rebuild the attribute span, dropping lines emptied by the moves.
    const multiline = span.includes('\n');
    if (multiline) {
      const lines = span.split('\n');
      const tail = lines.pop();
      const head = lines.shift() ?? '';
      const kept = lines.filter(l => l.trim().length);
      span =
        (head.trim() ? head.trimEnd() : '') +
        [...additions.map(a => indent + a), ...kept].map(l => '\n' + l).join('') +
        '\n' + tail;
    } else {
      const inline = span.trim();
      span =
        ' ' +
        [...additions, ...(inline ? [inline] : [])].join(' ') +
        (selfClosing ? ' ' : '');
    }

    if (selfClosing) span += '/';

    edits.push({ from, to: end, span });
  }

  for (const e of edits.reverse()) {
    src = src.slice(0, e.from) + e.span + src.slice(e.to);
    converted++;
  }

  // `Stack.Item` has no MUI equivalent; a Box is just the flex child.
  src = src.split('<Stack.Item').join('<Box').split('</Stack.Item>').join('</Box>');

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} Stack tags`);
