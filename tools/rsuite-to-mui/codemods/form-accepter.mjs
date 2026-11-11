/**
 * `<Form.Control accepter={X} …>` -> `<X …>`.
 *
 * rsuite's `Form.Control` was a wiring shim: it read the value out of the
 * form's `formValue` by `name` and handed it to the `accepter`. Nothing in the
 * editor leans on that any more — the surrounding components already pass
 * `value`/`onChange` explicitly — so the shim can simply go away and the
 * accepter can be rendered on its own.
 *
 * `accepter={Checkbox}` is the exception: its children were the label, which
 * in MUI belongs to a `FormControlLabel` around it.
 *
 * `name` is dropped with the shim; `plaintext`, `readOnly` and `errorMessage`
 * are rsuite-form concepts and are dropped too.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { findTagEnd, parseAttrs, SPREAD } from './jsx-utils.mjs';

const DROPPED = new Set([
  'accepter',
  'name',
  'plaintext',
  'readOnly',
  'errorMessage',
]);

let converted = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (let guard = 0; guard < 40; guard++) {
    const at = src.search(/<R?Form\.Control(?=[\s/>])/);
    if (at === -1) break;

    const tag = src.slice(at).match(/^<(R?Form\.Control)/)[1];
    const attrsFrom = at + tag.length + 1;
    const tagEnd = findTagEnd(src, attrsFrom);
    if (tagEnd === -1) break;

    const selfClosing = src[tagEnd - 1] === '/';
    const closeTag = `</${tag}>`;
    const end =
      selfClosing ? tagEnd + 1 : src.indexOf(closeTag, tagEnd) + closeTag.length;
    const children =
      selfClosing ? '' : src.slice(tagEnd + 1, end - closeTag.length).trim();

    const attrs = parseAttrs(
      src.slice(attrsFrom, selfClosing ? tagEnd - 1 : tagEnd)
    );
    const accepter = attrs
      .find(([name]) => name === 'accepter')?.[1]
      ?.match(/^\{\s*([A-Za-z][\w.]*)\s*\}$/)?.[1];

    if (!accepter) {
      skipped.push(`${file} (no plain accepter)`);
      // Park it so the next pass finds a different one.
      src = src.slice(0, at) + '<ControlKEEP' + src.slice(at + tag.length + 1);
      continue;
    }

    const indent = src.slice(0, at).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const lines = [];
    for (const [name, value] of attrs) {
      if (DROPPED.has(name)) continue;
      if (name === SPREAD) {
        lines.push(`${indent}  ${value}`);
        continue;
      }
      lines.push(
        value === undefined ? `${indent}  ${name}` : `${indent}  ${name}=${value}`
      );
    }

    let replacement;
    if (accepter === 'Checkbox' && children) {
      replacement =
        `<FormControlLabel\n${indent}  control={\n` +
        `${indent}    <Checkbox\n` +
        lines.map(line => `  ${line}`).join('\n') +
        `\n${indent}    />\n${indent}  }\n` +
        `${indent}  label={${
          children.startsWith('{') ? children.slice(1, -1).trim() : children
        }}\n${indent}/>`;
    } else if (children) {
      replacement =
        `<${accepter}\n${lines.join('\n')}\n${indent}>${
          src.slice(tagEnd + 1, end - closeTag.length)
        }${indent}</${accepter}>`;
    } else {
      replacement = `<${accepter}\n${lines.join('\n')}\n${indent}/>`;
    }

    src = src.slice(0, at) + replacement + src.slice(end);
    converted++;
  }

  src = src.replace(/<ControlKEEP/g, '<Form.Control');

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} accepters`);
if (skipped.length) console.log(`left alone: ${skipped.length}`);
