/**
 * Click-triggered rsuite `Whisper` -> the editor's `ClickPopover`.
 *
 *   <Whisper trigger="click" placement="bottomEnd" speaker={<Popover>X</Popover>}>
 *     <trigger />
 *   </Whisper>
 *     -> <ClickPopover trigger={<trigger />} anchorOrigin={…}>X</ClickPopover>
 *
 * Hover Whispers are handled by `whisper.mjs`; this one only takes the rest.
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** rsuite placement -> MUI anchor/transform origin pair. */
const ORIGINS = {
  top: ['{ vertical: "top", horizontal: "center" }', '{ vertical: "bottom", horizontal: "center" }'],
  bottom: ['{ vertical: "bottom", horizontal: "center" }', '{ vertical: "top", horizontal: "center" }'],
  left: ['{ vertical: "center", horizontal: "left" }', '{ vertical: "center", horizontal: "right" }'],
  right: ['{ vertical: "center", horizontal: "right" }', '{ vertical: "center", horizontal: "left" }'],
  topStart: ['{ vertical: "top", horizontal: "left" }', '{ vertical: "bottom", horizontal: "left" }'],
  topEnd: ['{ vertical: "top", horizontal: "right" }', '{ vertical: "bottom", horizontal: "right" }'],
  bottomStart: ['{ vertical: "bottom", horizontal: "left" }', '{ vertical: "top", horizontal: "left" }'],
  bottomEnd: ['{ vertical: "bottom", horizontal: "right" }', '{ vertical: "top", horizontal: "right" }'],
  leftStart: ['{ vertical: "top", horizontal: "left" }', '{ vertical: "top", horizontal: "right" }'],
  leftEnd: ['{ vertical: "bottom", horizontal: "left" }', '{ vertical: "bottom", horizontal: "right" }'],
  rightStart: ['{ vertical: "top", horizontal: "right" }', '{ vertical: "top", horizontal: "left" }'],
  rightEnd: ['{ vertical: "bottom", horizontal: "right" }', '{ vertical: "bottom", horizontal: "left" }'],
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

/** Strip an outer `<Popover …>…</Popover>` wrapper from the speaker. */
const popoverBody = speaker => {
  const m = speaker.match(/^<Popover\b[^>]*>([\s\S]*)<\/Popover>$/);
  return m ? m[1] : speaker;
};

let converted = 0;

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

    const triggerChild = src.slice(end + 1, closeIdx).trim();
    const tagEnd = closeIdx + '</Whisper>'.length;

    let span = src.slice(attrsFrom, end);
    let speaker;
    let placement;
    [span, speaker] = takeAttr(span, 'speaker');
    [span, placement] = takeAttr(span, 'placement');
    [span] = takeAttr(span, 'trigger');
    [span] = takeAttr(span, 'controlId');
    [span] = takeAttr(span, 'ref');
    [span] = takeAttr(span, 'enterable');

    if (!speaker) break;

    const indent = src.slice(0, last).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const [anchor, transform] = ORIGINS[placement] ?? ORIGINS.bottomStart;

    const replacement =
      `<ClickPopover\n` +
      `${indent}  trigger={${triggerChild}}\n` +
      `${indent}  anchorOrigin={${anchor.replace(/"/g, "'")}}\n` +
      `${indent}  transformOrigin={${transform.replace(/"/g, "'")}}\n` +
      `${indent}>\n` +
      `${indent}  ${popoverBody(speaker).trim()}\n` +
      `${indent}</ClickPopover>`;

    src = src.slice(0, last) + replacement + src.slice(tagEnd);
    converted++;
  }

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} click popovers`);
