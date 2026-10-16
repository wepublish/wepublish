/**
 * The short-list `SelectPicker` -> MUI `TextField select` + `MenuItem`.
 *
 *   <SelectPicker
 *     data={Object.values(Role).map(role => ({label: t(role), value: role}))}
 *     value={value} onChange={v => set(v)} cleanable={false} />
 *     ->
 *   <TextField select value={value ?? ''} onChange={event => set(…)}>
 *     {Object.values(Role).map(role => (
 *       <MenuItem key={role} value={role}>{t(role)}</MenuItem>
 *     ))}
 *   </TextField>
 *
 * This is the right shape when the options are a fixed, short list — an
 * `Autocomplete` is for lists worth searching. It also sidesteps what stopped
 * `picker.mjs` on these: the options are built inline, and a select renders
 * them once instead of needing a second pass to look the value back up.
 *
 * Only `data={<source>.map(<param> => ({label: …, value: …}))}` is converted;
 * anything else is reported and left.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { findTagEnd, parseAttrs, SPREAD } from './jsx-utils.mjs';

/** rsuite props with no counterpart on a select. */
const DROPPED = new Set([
  'block',
  'virtualized',
  'searchable',
  'cleanable',
  'preventOverflow',
  'menuMaxHeight',
  'size',
  'container',
  'labelKey',
  'valueKey',
  'onClean',
  'onSelect',
  'onOpen',
  'onExit',
  'style',
  'placement',
]);

/** Splits a `{...}, {...}` run into its top-level entries. */
const splitEntries = body => {
  const entries = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === '"' || c === "'" || c === '`') {
      const q = c;
      i++;
      while (i < body.length && body[i] !== q) {
        if (body[i] === '\\') i++;
        i++;
      }
    } else if (c === ',' && depth === 0) {
      entries.push(body.slice(from, i).trim());
      from = i + 1;
    }
  }
  const last = body.slice(from).trim();
  if (last) entries.push(last);
  return entries;
};

/** Reads one key out of an object-literal body, honouring nesting. */
const readKey = (body, key) => {
  for (const entry of splitEntries(body)) {
    const at = entry.indexOf(':');
    if (at !== -1 && entry.slice(0, at).trim() === key) {
      return entry.slice(at + 1).trim();
    }
    // `{ value }` is shorthand for `{ value: value }`.
    if (at === -1 && entry === key) return key;
  }
  return undefined;
};

/** `[{label: L, value: V}, …]` -> [{label, value}, …] */
const splitOptionList = raw => {
  const inner = raw?.startsWith('{') ? raw.slice(1, -1).trim() : undefined;
  if (!inner?.startsWith('[') || !inner.endsWith(']')) return undefined;

  const options = [];
  for (const entry of splitEntries(inner.slice(1, -1))) {
    if (!entry.startsWith('{') || !entry.endsWith('}')) return undefined;
    const body = entry.slice(1, -1);
    const label = readKey(body, 'label');
    const value = readKey(body, 'value');
    if (!label || !value) return undefined;
    options.push({ label, value });
  }
  return options.length ? options : undefined;
};

/** `SRC.map(x => ({label: L, value: V}))` -> {source, param, label, value} */
const splitOptionMap = raw => {
  const inner = raw?.startsWith('{') ? raw.slice(1, -1).trim() : undefined;
  const match = inner?.match(
    /^([\s\S]+?)\.map\(\s*\(?\s*([A-Za-z_$][\w$]*)\s*(?::\s*[^)=]+)?\s*\)?\s*=>\s*\(\s*\{([\s\S]*)\}\s*\)\s*\)$/
  );
  if (!match) return undefined;

  const [, source, param, body] = match;
  const label = readKey(body, 'label');
  const value = readKey(body, 'value');
  return label && value ? { source: source.trim(), param, label, value } : undefined;
};

let converted = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (let guard = 0; guard < 40; guard++) {
    const at = src.search(/<SelectPicker(?=[\s/>])/);
    if (at === -1) break;

    const attrsFrom = at + '<SelectPicker'.length;
    const tagEnd = findTagEnd(src, attrsFrom);
    if (tagEnd === -1) break;

    const selfClosing = src[tagEnd - 1] === '/';
    const end =
      selfClosing ? tagEnd + 1
      : src.indexOf('</SelectPicker>', tagEnd) + '</SelectPicker>'.length;

    const park = () => {
      src = src.slice(0, at) + '<PickerKEEP' + src.slice(attrsFrom);
    };

    const attrs = parseAttrs(
      src.slice(attrsFrom, selfClosing ? tagEnd - 1 : tagEnd)
    );
    const data = attrs.find(([n]) => n === 'data')?.[1];
    const option = splitOptionMap(data);
    const list = option ? undefined : splitOptionList(data);
    if ((!option && !list) || !selfClosing) {
      skipped.push(`${file} (data is not a plain option map)`);
      park();
      continue;
    }

    const indent = src.slice(0, at).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const lines = ['select'];
    let placeholder;
    for (const [name, raw] of attrs) {
      if (DROPPED.has(name) || name === 'data') continue;
      if (name === SPREAD) {
        lines.push(raw);
        continue;
      }
      if (name === 'value') {
        // `value={x ?? null}` already had a fallback; a select wants '' for
        // "nothing chosen", so the `?? null` is replaced rather than stacked.
        const inner = raw.slice(1, -1).replace(/\s*\?\?\s*null\s*$/, '');
        lines.push(`value={${inner} ?? ''}`);
        continue;
      }
      if (name === 'placeholder') {
        // A select never shows a placeholder; the stand-in is an empty entry
        // at the top of the menu, which `displayEmpty` keeps visible.
        placeholder = raw;
        continue;
      }
      if (name === 'onChange') {
        // A select hands back the event; rsuite handed back the key.
        const arrow = raw.match(
          /^\{\s*\(?\s*([A-Za-z_$][\w$]*)\s*(?::\s*[^)=]+)?\s*\)?\s*=>\s*([\s\S]*)\}$/
        );
        lines.push(
          arrow ?
            `onChange={event => {\n${indent}    const ${arrow[1]} = event.target.value;\n${indent}    ${arrow[2].replace(/^\{|\}$/g, '').trim().replace(/;$/, '')};\n${indent}  }}`
          : `onChange={event => (${raw.slice(1, -1)})(event.target.value)}`
        );
        continue;
      }
      lines.push(raw === undefined ? name : `${name}=${raw}`);
    }
    lines.push('fullWidth');
    if (placeholder) {
      lines.push('slotProps={{ select: { displayEmpty: true } }}');
    }

    const item = (label, value, extraIndent) =>
      `${indent}${extraIndent}<MenuItem\n` +
      `${indent}${extraIndent}  key={${value}}\n` +
      `${indent}${extraIndent}  value={${value}}\n` +
      `${indent}${extraIndent}>\n` +
      `${indent}${extraIndent}  {${label}}\n` +
      `${indent}${extraIndent}</MenuItem>`;

    const empty =
      placeholder ?
        `${indent}  <MenuItem value="">{${placeholder.slice(1, -1)}}</MenuItem>\n\n`
      : '';

    const body =
      option ?
        `${indent}  {${option.source}.map(${option.param} => (\n` +
        item(option.label, option.value, '    ') +
        `\n${indent}  ))}\n`
      : list
          .map(entry => `${item(entry.label, entry.value, '  ')}\n`)
          .join('\n');

    const replacement =
      `<TextField\n` +
      lines.map(line => `${indent}  ${line}`).join('\n') +
      `\n${indent}>\n` +
      empty +
      body +
      `${indent}</TextField>`;

    src = src.slice(0, at) + replacement + src.slice(end);
    converted++;
  }

  src = src.replace(/<PickerKEEP/g, '<SelectPicker');
  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} select pickers`);
if (skipped.length) console.log(`left alone: ${skipped.length}`);
