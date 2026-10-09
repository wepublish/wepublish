/**
 * rsuite `SelectPicker`/`CheckPicker`/`TagPicker` -> MUI `Autocomplete`.
 *
 * The semantic gap: rsuite's `value` is the raw key of the chosen option and
 * `onChange` hands back that key, while MUI's value *is* the option object.
 * Every converted site therefore gains a lookup on the way in and a `.value`
 * on the way out — written out inline rather than hidden behind a helper.
 *
 *   <SelectPicker data={opts} value={v} onChange={next => …} />
 *     -> <Autocomplete
 *          options={opts}
 *          getOptionLabel={option => option.label}
 *          isOptionEqualToValue={(option, selected) => option.value === selected.value}
 *          value={opts.find(option => option.value === v) ?? null}
 *          onChange={(_event, option) => { const next = option?.value ?? null; … }}
 *          renderInput={params => <TextField {...params} />}
 *        />
 *
 * Sites whose `data`/`onChange` are not straightforward are left alone and
 * reported.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const MULTI = new Set(['CheckPicker', 'TagPicker']);

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
      return [span.slice(0, i) + span.slice(i + name.length), true, true];
    }
    j++;
    while (j < span.length && /\s/.test(span[j])) j++;

    let value;
    let valueEnd;
    if (span[j] === '"' || span[j] === "'") {
      const q = span[j];
      let k = j + 1;
      while (k < span.length && span[k] !== q) k++;
      value = `'${span.slice(j + 1, k)}'`;
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

/** `next => body` / `(next: T) => body` -> [param, body] */
const splitArrow = handler => {
  const m = handler.match(
    /^\(?\s*([A-Za-z_$][\w$]*)\s*(?::\s*[^)]+)?\s*\)?\s*=>\s*([\s\S]*)$/
  );
  return m ? [m[1], m[2].trim()] : null;
};

let converted = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (const tag of ['SelectPicker', 'CheckPicker', 'TagPicker']) {
    for (let guard = 0; guard < 100; guard++) {
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
      const closing = `</${tag}>`;
      const tagEnd =
        selfClosing ? end + 1 : src.indexOf(closing, end) + closing.length;

      let data;
      let value;
      let onChange;
      let placeholder;
      let cleanable;
      let disabled;
      let className;
      [span, data] = takeAttr(span, 'data');
      [span, value] = takeAttr(span, 'value');
      [span, onChange] = takeAttr(span, 'onChange');
      [span, placeholder] = takeAttr(span, 'placeholder');
      [span, cleanable] = takeAttr(span, 'cleanable');
      [span, disabled] = takeAttr(span, 'disabled');
      [span, className] = takeAttr(span, 'className');
      // Props with no MUI counterpart.
      for (const dead of [
        'searchable',
        'block',
        'virtualized',
        'preventOverflow',
        'size',
        'menuMaxHeight',
        'defaultValue',
        'name',
        'style',
        'sticky',
        'labelKey',
        'valueKey',
        'renderMenuItem',
        'renderValue',
        'groupBy',
        'onClean',
        'onSelect',
        'onSearch',
        'container',
      ]) {
        [span] = takeAttr(span, dead);
      }

      const arrow = onChange ? splitArrow(onChange) : null;

      // `data` is referenced twice (options + the value lookup), so only
      // convert when it is a plain reference — inlining a `.map(...)` twice
      // would rebuild the list on every render in two places.
      const simpleData = data && /^[A-Za-z_$][\w$.?[\]']*$/.test(data.trim());

      if (!data || !arrow || !simpleData) {
        skipped.push(
          `${file}: <${tag}> (${!arrow ? 'onChange not a plain arrow' : 'data is an inline expression'})`
        );
        src =
          src.slice(0, last) +
          `<${tag}KEEP` +
          src
            .slice(last + `<${tag}`.length, tagEnd)
            .replace(closing, `</${tag}KEEP>`) +
          src.slice(tagEnd);
        continue;
      }

      const [param, body] = arrow;
      const multiple = MULTI.has(tag);
      const indent = src.slice(0, last).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
      const i2 = indent + '  ';
      const rest = span.replace(/\s+/g, ' ').trim();

      const valueExpr =
        multiple ?
          `${data}.filter(option => (${value ?? '[]'}).includes(option.value))`
        : `${data}.find(option => option.value === ${value ?? 'null'}) ?? null`;

      const handler =
        multiple ?
          `(_event, options) => {\n${i2}  const ${param} = options.map(option => option.value);\n${i2}  ${(body.startsWith('{') ? body.slice(1, -1).trim() : body).replace(/;$/, '')};\n${i2}}`
        : `(_event, option) => {\n${i2}  const ${param} = option?.value ?? null;\n${i2}  ${(body.startsWith('{') ? body.slice(1, -1).trim() : body).replace(/;$/, '')};\n${i2}}`;

      const lines = [
        multiple ? 'multiple' : '',
        `options={${data}}`,
        'getOptionLabel={option => option.label}',
        'isOptionEqualToValue={(option, selected) =>',
        '  option.value === selected.value',
        '}',
        `value={${valueExpr}}`,
        `onChange={${handler}}`,
        cleanable === 'false' || cleanable === false ? 'disableClearable' : '',
        disabled !== undefined ? `disabled={${disabled}}` : '',
        className !== undefined ? `className={${className}}` : '',
        rest,
        `renderInput={params => (`,
        `  <TextField`,
        `    {...params}`,
        placeholder !== undefined ? `    placeholder={${placeholder}}` : '',
        `  />`,
        `)}`,
      ].filter(Boolean);

      const replacement =
        `<Autocomplete\n` +
        lines.map(l => `${i2}${l}`).join('\n') +
        `\n${indent}/>`;

      src = src.slice(0, last) + replacement + src.slice(tagEnd);
      converted++;
    }

    src = src
      .split(`<${tag}KEEP`).join(`<${tag}`)
      .split(`</${tag}KEEP>`).join(`</${tag}>`);
  }

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} pickers`);
if (skipped.length) {
  console.log(`\nleft for manual conversion (${skipped.length}):`);
  [...new Set(skipped)].forEach(s => console.log('  ' + s));
}
