/**
 * rsuite `Checkbox` -> MUI `Checkbox` inside a `FormControlLabel`.
 *
 *   <Checkbox checked={v} onChange={(_, checked) => set(checked)}>
 *     {t('label')}
 *   </Checkbox>
 *     ->
 *   <FormControlLabel
 *     control={<Checkbox checked={v} onChange={(_event, checked) => set(checked)} />}
 *     label={t('label')}
 *   />
 *
 * rsuite put the label in the children and handed `onChange` the *value* first
 * and the checked state second; MUI takes the label as a prop and hands the
 * handler the event first. The parameter order is the same shape either way,
 * so only the first name changes, to `_event`.
 *
 * A `Checkbox` with no children is already label-less and only needs the
 * handler rename.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { findTagEnd, parseAttrs, SPREAD } from './jsx-utils.mjs';

/** True when the children are one `{...}` and not several side by side. */
const singleExpression = children => {
  if (!children.startsWith('{') || !children.endsWith('}')) return false;
  let depth = 0;
  for (let i = 0; i < children.length; i++) {
    const c = children[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i === children.length - 1;
    }
  }
  return false;
};

let converted = 0;
let bare = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (let guard = 0; guard < 40; guard++) {
    const at = src.search(/<Checkbox(?=[\s/>])/);
    if (at === -1) break;

    const attrsFrom = at + '<Checkbox'.length;
    const tagEnd = findTagEnd(src, attrsFrom);
    if (tagEnd === -1) break;

    const selfClosing = src[tagEnd - 1] === '/';
    const end =
      selfClosing ? tagEnd + 1
      : src.indexOf('</Checkbox>', tagEnd) + '</Checkbox>'.length;
    const children =
      selfClosing ? '' : src.slice(tagEnd + 1, end - '</Checkbox>'.length).trim();

    const attrs = parseAttrs(
      src.slice(attrsFrom, selfClosing ? tagEnd - 1 : tagEnd)
    );
    const indent = src.slice(0, at).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const inner = children ? `${indent}    ` : `${indent}  `;

    const lines = [];
    for (const [name, raw] of attrs) {
      if (name === SPREAD) {
        lines.push(`${inner}${raw}`);
        continue;
      }
      if (name === 'onChange') {
        lines.push(
          `${inner}onChange=${raw.replace(
            /^\{\s*\(\s*(?:_|value|_value)\s*,/,
            '{(_event,'
          )}`
        );
        continue;
      }
      lines.push(raw === undefined ? `${inner}${name}` : `${inner}${name}=${raw}`);
    }

    const checkbox = `<CheckboxKEEP\n${lines.join('\n')}\n${inner.slice(2)}/>`;

    if (!children) {
      src = src.slice(0, at) + checkbox + src.slice(end);
      bare++;
      continue;
    }

    src =
      src.slice(0, at) +
      `<FormControlLabel\n` +
      `${indent}  control={\n${indent}    ${checkbox.split('\n').join('\n')}\n${indent}  }\n` +
      `${indent}  label={${
        singleExpression(children) ? children.slice(1, -1).trim() : (
          `<>${children}</>`
        )
      }}\n` +
      `${indent}/>` +
      src.slice(end);
    converted++;
  }

  src = src.replace(/CheckboxKEEP/g, 'Checkbox');
  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} labelled and ${bare} bare checkboxes`);
