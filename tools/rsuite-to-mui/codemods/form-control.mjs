/**
 * rsuite `Form.Group` + `Form.Label` + `Form.Control` -> MUI `TextField`.
 *
 *   <Form.Group controlId="code">
 *     <Form.Label>{t('x')} <InfoTooltip … /></Form.Label>
 *     <Form.Control name="code" value={v} onChange={(code: string) => f(code)} />
 *   </Form.Group>
 *     ->
 *   <TextField
 *     label={<>{t('x')} <InfoTooltip … /></>}
 *     name="code"
 *     value={v}
 *     onChange={event => f(event.target.value)}
 *   />
 *
 * Only groups holding ONE `Form.Control` with no `accepter`, or an accepter of
 * `NumberInput` / `Textarea` / `Input`, are converted. Everything else (the
 * pickers, `RichTextBlock`, `DateTimePicker`, `Toggle`, `Checkbox`) is left
 * alone — those are not native inputs and need `<Controller>`.
 *
 * The `onChange` signature changes from `(value) => …` to `(event) => …`,
 * which TypeScript *can* see, so run `tsc` afterwards and fix what it flags.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import {
  findElementEnd,
  findTagEnd,
  parseAttrs,
  rewriteHandler,
  SPREAD,
} from './jsx-utils.mjs';

/** Accepters that map onto a plain `TextField`. */
const TEXT_ACCEPTERS = {
  Input: {},
  Textarea: { multiline: true },
  NumberInput: { type: 'number' },
};

let converted = 0;
const skipped = [];

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  for (let guard = 0; guard < 200; guard++) {
    // Work from the end so earlier indices stay valid.
    let last = -1;
    for (const m of src.matchAll(/<Form\.Group(?=[\s/>])/g)) {
      if (m.index > last) last = m.index;
    }
    if (last === -1) break;

    const groupEnd = findElementEnd(src, last, 'Form.Group');
    if (groupEnd === -1) break;
    const group = src.slice(last, groupEnd);

    // Mark it seen so the loop makes progress even when we skip it.
    const keep = () => {
      src =
        src.slice(0, last) +
        group.replace(/Form\.Group/g, 'FormGroupKEEP') +
        src.slice(groupEnd);
    };

    const controls = [...group.matchAll(/<Form\.Control(?=[\s/>])/g)];
    if (controls.length !== 1) {
      skipped.push(`${file} (${controls.length} controls in one group)`);
      keep();
      continue;
    }

    // A group whose body picks between two different inputs cannot be folded
    // into one `TextField`. Doing so once silently dropped a `CurrencyInput`
    // — and with it the cents-to-francs conversion the record depends on.
    const body = group.slice(group.indexOf('</Form.Label>') + 1);
    if (/\{\s*\w[\w.?[\]]*\s*\?/.test(body) || /&&\s*</.test(body)) {
      skipped.push(`${file} (conditional body)`);
      keep();
      continue;
    }

    const controlStart = controls[0].index;
    const controlAttrsFrom = controlStart + '<Form.Control'.length;
    const controlTagEnd = findTagEnd(group, controlAttrsFrom);
    if (controlTagEnd === -1) {
      keep();
      continue;
    }

    const selfClosing = group[controlTagEnd - 1] === '/';
    if (!selfClosing) {
      // `<Form.Control …>children</Form.Control>` is a checkbox or similar.
      skipped.push(`${file} (control with children)`);
      keep();
      continue;
    }

    const attrs = parseAttrs(
      group.slice(controlAttrsFrom, controlTagEnd - (selfClosing ? 1 : 0))
    );

    const accepter = attrs.find(([name]) => name === 'accepter')?.[1];
    const accepterName = accepter?.replace(/[{}\s]/g, '');
    if (accepter && !(accepterName in TEXT_ACCEPTERS)) {
      skipped.push(`${file} (accepter=${accepterName})`);
      keep();
      continue;
    }

    const labelMatch = group.match(
      /<Form\.Label[^>]*>([\s\S]*?)<\/Form\.Label>/
    );
    const label = labelMatch?.[1].trim();

    const indent = src.slice(0, last).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    const extra = TEXT_ACCEPTERS[accepterName ?? 'Input'] ?? {};

    const lines = [];
    if (label) {
      // Labels often hold an InfoTooltip next to the text, so wrap in a
      // fragment rather than assuming a bare string.
      lines.push(
        `${indent}  label={\n${indent}    <>\n${indent}      ${label}\n${indent}    </>\n${indent}  }`
      );
    }
    for (const [key, value] of Object.entries(extra)) {
      lines.push(
        `${indent}  ${key}${value === true ? '' : `=${JSON.stringify(value)}`}`
      );
    }

    let bailed = false;
    for (const [name, value] of attrs) {
      if (name === SPREAD) {
        lines.push(`${indent}  ${value}`);
        continue;
      }
      if (name === 'accepter') continue;
      if (name === 'onChange') {
        const rewritten = rewriteHandler(value);
        if (!rewritten) {
          skipped.push(`${file} (onChange not a simple arrow)`);
          bailed = true;
          break;
        }
        lines.push(`${indent}  onChange=${rewritten}`);
        continue;
      }
      if (name === 'errorMessage') {
        lines.push(`${indent}  error={Boolean(${value.slice(1, -1)})}`);
        lines.push(`${indent}  helperText=${value}`);
        continue;
      }
      lines.push(
        value === undefined ?
          `${indent}  ${name}`
        : `${indent}  ${name}=${value}`
      );
    }

    if (bailed) {
      keep();
      continue;
    }

    lines.push(`${indent}  fullWidth`);

    src =
      src.slice(0, last) +
      `<TextField\n${lines.join('\n')}\n${indent}/>` +
      src.slice(groupEnd);
    converted++;
  }

  src = src.replace(/FormGroupKEEP/g, 'Form.Group');

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} form controls`);
if (skipped.length) {
  const counts = {};
  for (const reason of skipped) {
    const key = reason.replace(/^.*\((.*)\)$/, '$1');
    counts[key] = (counts[key] ?? 0) + 1;
  }
  console.log('\nleft alone:');
  for (const [reason, count] of Object.entries(counts).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${count}  ${reason}`);
  }
}
