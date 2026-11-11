/**
 * rsuite `DatePicker` -> `@mui/x-date-pickers` `DatePicker` / `DateTimePicker`.
 *
 * A `format` with hours picks the DateTimePicker; everything else is a plain
 * date. rsuite's tokens are date-fns tokens already, so the format carries
 * over as written.
 *
 * Dropped: `block` (a picker is full width via its text field), `oneTap`,
 * `isoWeek`, `limitEndYear`, `cleanable` and `onSelect` — `onSelect` fired
 * alongside `onChange` with the same value, which MUI reports once.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { findTagEnd, parseAttrs, SPREAD } from './jsx-utils.mjs';

const DROPPED = new Set([
  'block',
  'oneTap',
  'isoWeek',
  'limitEndYear',
  'cleanable',
  'onSelect',
  'editable',
  'placement',
  'container',
  'size',
]);

let converted = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (let guard = 0; guard < 20; guard++) {
    const at = src.search(/<DatePicker(?=[\s/>])/);
    if (at === -1) break;

    const attrsFrom = at + '<DatePicker'.length;
    const tagEnd = findTagEnd(src, attrsFrom);
    if (tagEnd === -1 || src[tagEnd - 1] !== '/') break;

    const attrs = parseAttrs(src.slice(attrsFrom, tagEnd - 1));
    const format = attrs.find(([n]) => n === 'format')?.[1] ?? '';
    const withTime = /[Hhm]/.test(format.replace(/^["'{]|["'}]$/g, ''));
    const tag = withTime ? 'DateTimePicker' : 'DatePicker';

    const indent = src.slice(0, at).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const lines = [];
    const textField = [];
    for (const [name, raw] of attrs) {
      if (DROPPED.has(name)) continue;
      if (name === SPREAD) {
        lines.push(`${indent}  ${raw}`);
        continue;
      }
      if (name === 'placeholder') {
        // A picker's text field shows its format mask where a placeholder
        // would go, so rsuite's placeholder becomes the label instead.
        textField.push(`label: ${raw.replace(/^\{|\}$/g, '')}`);
        continue;
      }
      if (name === 'value') {
        // MUI reads `null` as empty; `undefined` makes the field uncontrolled.
        lines.push(`${indent}  value={${raw.slice(1, -1)} ?? null}`);
        continue;
      }
      lines.push(raw === undefined ? `${indent}  ${name}` : `${indent}  ${name}=${raw}`);
    }
    lines.push(
      `${indent}  slotProps={{\n${indent}    textField: { fullWidth: true${
        textField.length ? `, ${textField.join(', ')}` : ''
      } },\n${indent}  }}`
    );

    // Parked under a name the search cannot match: a plain `DatePicker` keeps
    // its tag, and without this it would be converted again every pass until
    // the guard ran out, stacking `?? null` and `slotProps` as it went.
    src =
      src.slice(0, at) +
      `<${tag}KEEP\n${lines.join('\n')}\n${indent}/>` +
      src.slice(tagEnd + 1);
    converted++;
  }

  src = src.replace(/<(Date(?:Time)?Picker)KEEP/g, '<$1');

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} date pickers`);
