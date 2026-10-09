/**
 * rsuite `Panel` -> MUI.
 *
 *   plain              -> <Card variant="outlined"><CardContent>…</CardContent></Card>
 *   with `header`      -> … plus <CardHeader title={…} />
 *   with `collapsible` -> <Accordion><AccordionSummary>…</AccordionSummary>
 *                         <AccordionDetails>…</AccordionDetails></Accordion>
 *
 * `bodyFill` means "no padding around the body", which is a `CardContent` with
 * its padding removed.
 *
 * Panels nest, so the last match in the file is always the innermost one;
 * rewriting from the back means a replacement is never rescanned.
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

/** The matching `</Panel>` for an opening tag that ends at `from`. */
const closeOf = (src, from, tag) => {
  let depth = 1;
  const re = new RegExp(`<(\\/?)${tag}(?=[\\s/>])`, 'g');
  re.lastIndex = from;
  let m;
  while ((m = re.exec(src))) {
    if (m[1] === '/') {
      if (--depth === 0) {
        return { start: m.index, end: m.index + `</${tag}>`.length };
      }
    } else {
      const e = findTagEnd(src, m.index);
      if (e !== -1 && !src.slice(m.index, e).trimEnd().endsWith('/')) depth++;
    }
  }
  return null;
};

/**
 * Pull one attribute out of the span, returning [rest, value, present].
 *
 * Scans at brace depth 0 only. A plain regex would happily match `expanded`
 * inside `style={expanded ? … : …}` and tear a hole in that expression.
 */
const takeAttr = (span, name) => {
  let depth = 0;
  for (let i = 0; i < span.length; i++) {
    const c = span[i];
    if (c === '{') {
      depth++;
      continue;
    }
    if (c === '}') {
      depth--;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < span.length && span[i] !== q) {
        if (span[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (depth !== 0) continue;

    // Candidate attribute start: preceded by whitespace or the span start.
    if (i !== 0 && !/\s/.test(span[i - 1])) continue;
    if (!span.startsWith(name, i)) continue;
    const after = span[i + name.length];
    if (after !== undefined && /[\w$-]/.test(after)) continue;

    let j = i + name.length;
    while (j < span.length && /\s/.test(span[j])) j++;

    if (span[j] !== '=') {
      // Boolean attribute.
      return [span.slice(0, i) + span.slice(i + name.length), undefined, true];
    }

    j++;
    while (j < span.length && /\s/.test(span[j])) j++;

    let value;
    let valueEnd;
    if (span[j] === '"' || span[j] === "'") {
      const q = span[j];
      let k = j + 1;
      while (k < span.length && span[k] !== q) k++;
      value = `"${span.slice(j + 1, k)}"`;
      valueEnd = k + 1;
    } else if (span[j] === '{') {
      let d = 0;
      let k = j;
      for (; k < span.length; k++) {
        if (span[k] === '{') d++;
        else if (span[k] === '}' && --d === 0) break;
      }
      value = span.slice(j, k + 1);
      valueEnd = k + 1;
    } else {
      continue;
    }

    return [span.slice(0, i) + span.slice(valueEnd), value, true];
  }

  return [span, undefined, false];
};

/** Index of the last opening tag for `tag`, or -1. */
const lastPanel = (src, tag) => {
  let found = -1;
  for (const m of src.matchAll(new RegExp(`<${tag}(?=[\\s/>])`, 'g')))
    found = m.index;
  return found;
};

let converted = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  // Many blocks declare their own `const Panel = styled(RPanel)` carrying
  // layout CSS. There `<Panel>` is the local component, not rsuite's, and
  // rewriting it to a Card would silently drop that styling — the wrapper is
  // rebased onto Card instead (see README). The alias form is always rsuite's.
  // A local wrapper is rebased onto Card elsewhere, so `<Panel>` keeps its
  // name here — but its rsuite props (header/bordered/bodyFill) still have to
  // become CardHeader/CardContent.
  const shadowed = /^(?:export\s+)?const Panel\s*=/m.test(src);

  // Local wrappers over MUI's Card are panels too — they still carry rsuite's
  // `bordered`/`header`/`bodyFill` props at their call sites.
  // Matches the wrapper before and after `styled-rebase.mjs` has run, since
  // the two codemods can execute in either order.
  const wrappers = [
    ...src.matchAll(
      /^(?:export\s+)?const (\w+)\s*=\s*styled\((?:MuiCard|Card|RPanel|Panel)\b/gm
    ),
  ].map(m => m[1]);

  const tags = ['Panel', 'RPanel', ...wrappers.filter(w => w !== 'Panel')];

  for (const tag of tags) {
  for (let guard = 0; guard < 200; guard++) {
    const start = lastPanel(src, tag);
    if (start === -1) break;

    const attrsFrom = start + `<${tag}`.length;
    const end = findTagEnd(src, attrsFrom);
    if (end === -1) break;

    let span = src.slice(attrsFrom, end);
    const selfClosing = span.trimEnd().endsWith('/');
    if (selfClosing) span = span.trimEnd().slice(0, -1);

    const close = selfClosing ? null : closeOf(src, end, tag);
    const body = close ? src.slice(end + 1, close.start) : '';
    const tagEnd = close ? close.end : end + 1;

    const indent = src.slice(0, start).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';

    let header;
    let collapsible;
    let bodyFill;
    let defaultExpanded;
    let expanded;
    [span, header] = takeAttr(span, 'header');
    [span, , collapsible] = takeAttr(span, 'collapsible');
    [span, , bodyFill] = takeAttr(span, 'bodyFill');
    [span, defaultExpanded] = takeAttr(span, 'defaultExpanded');
    [span, expanded] = takeAttr(span, 'expanded');
    // Styling rsuite expressed as flags; MUI gets it from the variant.
    [span] = takeAttr(span, 'bordered');
    [span] = takeAttr(span, 'shaded');
    [span] = takeAttr(span, 'onSelect');
    [span] = takeAttr(span, 'eventKey');
    const isWrapper = tag !== 'Panel' && tag !== 'RPanel';
    const keepName = (isWrapper || (shadowed && tag === 'Panel')) && !collapsible;

    // `isEmpty`/`showGrabCursor` are rsuite Panel props, but local wrappers
    // redeclare them as their own required props — only strip them when the
    // tag really is becoming a plain MUI Card.
    if (!keepName) {
      [span] = takeAttr(span, 'isEmpty');
      [span] = takeAttr(span, 'showGrabCursor');
    }
    const rest = span.replace(/\s+/g, ' ').trim();
    const attrs = rest ? ' ' + rest : '';
    const outer = keepName ? `${tag}TMP` : 'Card';
    const variant = keepName ? '' : ' variant="outlined"';

    let replacement;
    if (collapsible) {
      const exp =
        expanded ? ` expanded=${expanded}`
        : defaultExpanded ? ` defaultExpanded=${defaultExpanded}`
        : '';
      const title = header ? header.replace(/^\{|\}$/g, '').trim() : '';
      replacement =
        `<Accordion${exp}${attrs}>\n` +
        `${indent}  <AccordionSummary expandIcon={<MdExpandMore />}>\n` +
        `${indent}    ${title}\n` +
        `${indent}  </AccordionSummary>\n\n` +
        `${indent}  <AccordionDetails>${body}</AccordionDetails>\n` +
        `${indent}</Accordion>`;
    } else {
      const content =
        bodyFill ?
          `<CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>${body}</CardContent>`
        : `<CardContent>${body}</CardContent>`;
      replacement =
        `<${outer}${variant}${attrs}>\n` +
        (header ? `${indent}  <CardHeader title=${header} />\n\n` : '') +
        `${indent}  ${content}\n` +
        `${indent}</${outer}>`;
    }

    src = src.slice(0, start) + replacement + src.slice(tagEnd);
    converted++;
  }
  }

  for (const tag of tags) {
    src = src
      .split(`<${tag}TMP`).join(`<${tag}`)
      .split(`</${tag}TMP>`).join(`</${tag}>`);
  }

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} panels`);
