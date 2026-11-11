/**
 * rsuite `CheckPicker` / `TagPicker` -> MUI `Autocomplete multiple`, over the
 * raw keys rather than option objects.
 *
 *   <CheckPicker data={pages.map(p => ({value: p.id, label: p.title}))}
 *                value={ids} onChange={next => set(next)} />
 *     ->
 *   <Autocomplete
 *     multiple
 *     options={pages.map(p => p.id)}
 *     getOptionLabel={id => pages.find(p => p.id === id)?.title ?? id}
 *     value={ids}
 *     onChange={(_event, next) => set(next)}
 *     renderInput={params => <TextField {...params} />}
 *   />
 *
 * Keys rather than objects because rsuite's `value` was already the keys, so
 * nothing downstream has to change — and the source list is read once for the
 * options and once inside the label callback, never mapped twice per render.
 *
 * `TagPicker creatable` becomes `freeSolo`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { findTagEnd, parseAttrs, SPREAD } from './jsx-utils.mjs';

const DROPPED = new Set([
  'block',
  'virtualized',
  'searchable',
  'cleanable',
  'countable',
  'preventOverflow',
  'menuMaxHeight',
  'size',
  'container',
  'labelKey',
  'valueKey',
  'onClean',
  'onSelect',
  'onSearch',
  'onOpen',
  'onExit',
  'placement',
  'style',
  'sticky',
  'name',
]);

/** `SRC.map(x => ({label: L, value: V}))` -> {source, param, label, value} */
const splitOptionMap = raw => {
  const inner = raw?.startsWith('{') ? raw.slice(1, -1).trim() : undefined;
  const match = inner?.match(
    /^([\s\S]+?)\.map\(\s*\(?\s*([A-Za-z_$][\w$]*)\s*(?::\s*[^)=]+)?\s*\)?\s*=>\s*\(\s*\{([\s\S]*)\}\s*\)\s*\)$/
  );
  if (!match) return undefined;

  const [, source, param, body] = match;
  const read = key => {
    let depth = 0;
    let from = 0;
    const entries = [];
    for (let i = 0; i <= body.length; i++) {
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
      } else if ((c === ',' && depth === 0) || i === body.length) {
        entries.push(body.slice(from, i).trim());
        from = i + 1;
      }
    }
    for (const entry of entries) {
      const at = entry.indexOf(':');
      if (at !== -1 && entry.slice(0, at).trim() === key) {
        return entry.slice(at + 1).trim();
      }
      // `{ value }` is shorthand for `{ value: value }`.
      if (at === -1 && entry === key) return key;
    }
    return undefined;
  };

  const label = read('label');
  const value = read('value');
  return label && value ?
      { source: source.trim(), param, label, value }
    : undefined;
};

let converted = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (const tag of ['CheckPicker', 'TagPicker']) {
    for (let guard = 0; guard < 20; guard++) {
      const at = src.search(new RegExp(`<${tag}(?=[\\s/>])`));
      if (at === -1) break;

      const attrsFrom = at + `<${tag}`.length;
      const tagEnd = findTagEnd(src, attrsFrom);
      if (tagEnd === -1 || src[tagEnd - 1] !== '/') break;

      const attrs = parseAttrs(src.slice(attrsFrom, tagEnd - 1));
      const option = splitOptionMap(attrs.find(([n]) => n === 'data')?.[1]);

      if (!option) {
        skipped.push(`${file}: <${tag}> (data is not a plain option map)`);
        src = src.slice(0, at) + `<${tag}KEEP` + src.slice(attrsFrom);
        continue;
      }

      const indent = src.slice(0, at).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
      const { source, param, label, value: optionValue } = option;
      const lines = [
        'multiple',
        'disableCloseOnSelect',
        `options={${source}.map(${param} => ${optionValue})}`,
        // filter+map rather than find+member access: the label can be any
        // expression over the option, not just a property of it.
        `getOptionLabel={option =>`,
        `  ${source}`,
        `    .filter(${param} => ${optionValue} === option)`,
        `    .map(${param} => ${label})[0] ?? option`,
        `}`,
      ];
      let placeholder;
      for (const [name, raw] of attrs) {
        if (DROPPED.has(name) || name === 'data') continue;
        if (name === SPREAD) {
          lines.push(raw);
          continue;
        }
        if (name === 'placeholder') {
          placeholder = raw;
          continue;
        }
        if (name === 'creatable') {
          lines.push('freeSolo');
          continue;
        }
        if (name === 'onChange') {
          const arrow = raw.match(
            /^\{\s*\(?\s*([A-Za-z_$][\w$]*)\s*(?::\s*[^)=]+)?\s*\)?\s*=>\s*([\s\S]*)\}$/
          );
          lines.push(
            arrow ?
              `onChange={(_event, ${arrow[1]}) => ${arrow[2]}}`
            : `onChange={(_event, value) => (${raw.slice(1, -1)})(value)}`
          );
          continue;
        }
        lines.push(raw === undefined ? name : `${name}=${raw}`);
      }
      lines.push(
        `renderInput={params => (`,
        `  <TextField`,
        `    {...params}`,
        ...(placeholder ? [`    placeholder=${placeholder}`] : []),
        `  />`,
        `)}`
      );

      src =
        src.slice(0, at) +
        `<Autocomplete\n` +
        lines.map(line => `${indent}  ${line}`).join('\n') +
        `\n${indent}/>` +
        src.slice(tagEnd + 1);
      converted++;
    }

    src = src.replace(new RegExp(`<${tag}KEEP`, 'g'), `<${tag}`);
  }

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} multi pickers`);
if (skipped.length) {
  console.log('\nleft for manual conversion:');
  for (const reason of [...new Set(skipped)]) console.log(`  ${reason}`);
}
