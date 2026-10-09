/**
 * rsuite `Whisper` -> MUI `Tooltip`, for the hover/focus case.
 *
 *   <Whisper trigger="hover" placement="top" speaker={<Tooltip>X</Tooltip>}>
 *     <child />
 *   </Whisper>
 *     -> <Tooltip title={X} placement="top"><child /></Tooltip>
 *
 * Click-triggered Whispers open a Popover and need real open/anchor state, so
 * they are left alone and reported — convert those by hand.
 *
 * rsuite's placements are camelCase (`bottomEnd`); MUI's are hyphenated
 * (`bottom-end`).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const PLACEMENTS = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  topStart: 'top-start',
  topEnd: 'top-end',
  bottomStart: 'bottom-start',
  bottomEnd: 'bottom-end',
  leftStart: 'left-start',
  leftEnd: 'left-end',
  rightStart: 'right-start',
  rightEnd: 'right-end',
  auto: 'top',
};

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
    if (i !== 0 && !/\s/.test(span[i - 1])) continue;
    if (!span.startsWith(name, i)) continue;
    const after = span[i + name.length];
    if (after !== undefined && /[\w$-]/.test(after)) continue;

    let j = i + name.length;
    while (j < span.length && /\s/.test(span[j])) j++;
    if (span[j] !== '=') {
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
      value = span.slice(j + 1, k);
      valueEnd = k + 1;
    } else if (span[j] === '{') {
      let d = 0;
      let k = j;
      for (; k < span.length; k++) {
        if (span[k] === '{') d++;
        else if (span[k] === '}' && --d === 0) break;
      }
      value = span.slice(j + 1, k).trim();
      valueEnd = k + 1;
    } else {
      continue;
    }
    return [span.slice(0, i) + span.slice(valueEnd), value, true];
  }
  return [span, undefined, false];
};

/**
 * `<Tooltip>X</Tooltip>` -> an expression usable as MUI's `title`.
 *
 * A lone `{expr}` passes through; anything else (plain text, or several
 * children) is wrapped, in a fragment when it has more than one root.
 */
const tooltipBody = speaker => {
  const m = speaker.match(/^<Tooltip\s*>([\s\S]*)<\/Tooltip>$/);
  if (!m) return null;
  const body = m[1].trim();
  if (!body) return null;

  if (body.startsWith('{') && body.endsWith('}')) {
    let depth = 0;
    let single = true;
    for (let i = 0; i < body.length - 1; i++) {
      if (body[i] === '{') depth++;
      else if (body[i] === '}' && --depth === 0) {
        single = false;
        break;
      }
    }
    if (single) return body.slice(1, -1).trim();
  }

  if (/^<[A-Za-z]/.test(body) && !/>\s*</.test(body)) return body;

  return `<>${body}</>`;
};

let converted = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (let guard = 0; guard < 100; guard++) {
    let last = -1;
    for (const m of src.matchAll(/<Whisper(?=[\s/>])/g)) last = m.index;
    if (last === -1) break;

    const attrsFrom = last + '<Whisper'.length;
    const end = findTagEnd(src, attrsFrom);
    if (end === -1) break;

    const closeIdx = src.indexOf('</Whisper>', end);
    if (closeIdx === -1) break;
    const body = src.slice(end + 1, closeIdx);
    const tagEnd = closeIdx + '</Whisper>'.length;

    let span = src.slice(attrsFrom, end);
    let speaker;
    let placement;
    let trigger;
    [span, speaker] = takeAttr(span, 'speaker');
    [span, placement] = takeAttr(span, 'placement');
    [span, trigger] = takeAttr(span, 'trigger');
    [span] = takeAttr(span, 'controlId');
    [span] = takeAttr(span, 'ref');
    [span] = takeAttr(span, 'enterable');

    const title = speaker ? tooltipBody(speaker) : null;
    const isClick = (trigger ?? '').includes('click');

    if (!title || isClick) {
      // Leave it; renaming it would lose the popover behaviour.
      skipped.push(`${file}: ${(trigger ?? 'hover')} / ${speaker?.slice(0, 40)}`);
      // Park it so the scan moves on, then restore at the end.
      src =
        src.slice(0, last) +
        '<WhisperKEEP' +
        src.slice(last + '<Whisper'.length, tagEnd).replace('</Whisper>', '</WhisperKEEP>') +
        src.slice(tagEnd);
      continue;
    }

    const indent = src.slice(0, last).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const mapped = placement ? PLACEMENTS[placement] : undefined;
    const rest = span.replace(/\s+/g, ' ').trim();

    const attrs = [
      `title={${title}}`,
      mapped ? `placement="${mapped}"` : '',
      rest,
    ]
      .filter(Boolean)
      .map(a => `\n${indent}  ${a}`)
      .join('');

    const replacement = `<Tooltip${attrs}\n${indent}>${body}</Tooltip>`;
    src = src.slice(0, last) + replacement + src.slice(tagEnd);
    converted++;
  }

  src = src.split('<WhisperKEEP').join('<Whisper').split('</WhisperKEEP>').join('</Whisper>');

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} whispers`);
if (skipped.length) {
  console.log(`\nleft for manual conversion (${skipped.length}):`);
  skipped.forEach(s => console.log('  ' + s));
}
