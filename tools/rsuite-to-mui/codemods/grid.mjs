/**
 * rsuite `Grid`/`Row`/`Col` -> MUI `Grid`.
 *
 * rsuite lays out on 24 columns, MUI v9 on 12, so every span is halved.
 * Spans that do not halve cleanly (5, 7, …) are rounded up, which keeps the
 * column from collapsing; those are reported so they can be eyeballed.
 *
 *   <Grid fluid>        -> <Grid container spacing={2}>
 *   <Row>               -> <Grid container spacing={2}>
 *   <Col xs={24}>       -> <Grid size={{ xs: 12 }}>
 *   <Col xs={24} xl={6}>-> <Grid size={{ xs: 12, xl: 3 }}>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

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

const inexact = [];

/** 24-column span -> 12-column span. */
const halve = (span, file) => {
  const n = Number(span);
  if (!Number.isFinite(n)) return null;
  if (n % 2 !== 0) inexact.push(`${file}: xs={${n}} -> ${Math.ceil(n / 2)}`);
  return Math.min(12, Math.max(1, Math.ceil(n / 2)));
};

let converted = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  // --- Col (and its `Col as RCol` alias) --------------------------------
  for (const colTag of ['Col', 'RCol']) {
  for (let guard = 0; guard < 300; guard++) {
    let last = -1;
    for (const m of src.matchAll(new RegExp(`<${colTag}(?=[\\s/>])`, 'g')))
      last = m.index;
    if (last === -1) break;

    const attrsFrom = last + `<${colTag}`.length;
    const end = findTagEnd(src, attrsFrom);
    if (end === -1) break;

    let span = src.slice(attrsFrom, end);
    const selfClosing = span.trimEnd().endsWith('/');
    if (selfClosing) span = span.trimEnd().slice(0, -1);

    const sizes = [];
    for (const bp of BREAKPOINTS) {
      const re = new RegExp(`(^|\\s)${bp}(?![\\w$-])\\s*=\\s*\\{(\\d+)\\}`);
      const hit = span.match(re);
      if (!hit) continue;
      const value = halve(hit[2], file);
      if (value !== null) sizes.push(`${bp === 'xxl' ? 'xl' : bp}: ${value}`);
      span = span.replace(hit[0], '');
    }

    const rest = span.replace(/\s+/g, ' ').trim();
    const attrs = [sizes.length ? `size={{ ${sizes.join(', ')} }}` : '', rest]
      .filter(Boolean)
      .join(' ');

    const openTag = `<GridTMP${attrs ? ' ' + attrs : ''}${selfClosing ? ' /' : ''}>`;
    const colClose = `</${colTag}>`;
    const tagEnd =
      selfClosing ? end + 1 : src.indexOf(colClose, end) + colClose.length;
    const body =
      selfClosing ? '' : src.slice(end + 1, src.indexOf(colClose, end));

    src =
      src.slice(0, last) +
      openTag +
      (selfClosing ? '' : body + '</GridTMP>') +
      src.slice(tagEnd);
    converted++;
  }
  }

  // --- Row / Grid ------------------------------------------------------
  for (const tag of ['Row', 'RRow', 'Grid', 'RGrid']) {
    for (let guard = 0; guard < 300; guard++) {
      let last = -1;
      for (const m of src.matchAll(new RegExp(`<${tag}(?=[\\s/>])`, 'g')))
        last = m.index;
      if (last === -1) break;

      const attrsFrom = last + `<${tag}`.length;
      const end = findTagEnd(src, attrsFrom);
      if (end === -1) break;

      let span = src.slice(attrsFrom, end);
      const selfClosing = span.trimEnd().endsWith('/');
      if (selfClosing) span = span.trimEnd().slice(0, -1);

      const closingTag = `</${tag}>`;
      const closeIdx = src.indexOf(closingTag, end);
      if (!selfClosing && closeIdx === -1) break;

      // Already a MUI Grid? park it so the scan can move on.
      if (/(^|\s)(container|size)\s*[=>]/.test(span) || /(^|\s)container(?![\w$-])/.test(span)) {
        const parkEnd = selfClosing ? end + 1 : closeIdx + closingTag.length;
        src =
          src.slice(0, last) +
          `<${tag}KEEP` +
          src
            .slice(last + `<${tag}`.length, parkEnd)
            .replace(closingTag, `</${tag}KEEP>`) +
          src.slice(parkEnd);
        continue;
      }

      // `fluid` means full width, which MUI containers already are.
      span = span.replace(/(^|\s)fluid(?![\w$-])/g, '');
      span = span.replace(/(^|\s)gutter\s*=\s*\{[^}]*\}/g, '');

      const rest = span.replace(/\s+/g, ' ').trim();
      const attrs = ['container', 'spacing={2}', rest].filter(Boolean).join(' ');

      const tagEnd = selfClosing ? end + 1 : closeIdx + closingTag.length;
      const body = selfClosing ? '' : src.slice(end + 1, closeIdx);

      src =
        src.slice(0, last) +
        `<GridTMP ${attrs}${selfClosing ? ' /' : ''}>` +
        (selfClosing ? '' : body + '</GridTMP>') +
        src.slice(tagEnd);
      converted++;
    }
  }

  for (const tag of ['Row', 'RRow', 'Grid', 'RGrid']) {
    src = src
      .split(`<${tag}KEEP`).join(`<${tag}`)
      .split(`</${tag}KEEP>`).join(`</${tag}>`);
  }
  src = src.split('<GridTMP').join('<Grid').split('</GridTMP>').join('</Grid>');

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} grid elements`);
if (inexact.length) {
  console.log(`\nspans that did not halve evenly (${inexact.length}) — worth a look:`);
  [...new Set(inexact)].forEach(i => console.log('  ' + i));
}
