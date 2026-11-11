/**
 * The `Form.Group`s that hold something other than a single `Form.Control`.
 *
 *   <Form.Group controlId="tags">
 *     <Form.ControlLabel>{t('tags')}</Form.ControlLabel>
 *     <SelectTags … />
 *   </Form.Group>
 *     ->
 *   <FormControl fullWidth sx={{ marginBottom: 3 }}>
 *     <FormLabel>{t('tags')}</FormLabel>
 *     <SelectTags … />
 *   </FormControl>
 *
 * A group with no label is only there for the 24px rsuite put under every
 * group, so it becomes a `Box` carrying that spacing and nothing else.
 * `Form.Text` and `Form.HelpText` become `FormHelperText` wherever they are.
 *
 * `controlId` is dropped: rsuite used it to wire label to control, which
 * `FormControl` does on its own.
 *
 * Run `form-control.mjs` FIRST — the single-`Form.Control` groups it handles
 * turn into a `TextField` that wants no wrapper at all.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { findElementEnd, findTagEnd, parseAttrs, SPREAD } from './jsx-utils.mjs';

let groups = 0;
let labels = 0;
let helpTexts = 0;

const reindent = (body, from, to) => {
  if (from === to) return body;
  const delta = to.length - from.length;
  return body
    .split('\n')
    .map(line =>
      delta > 0 ? (line.trim() ? ' '.repeat(delta) + line : line)
      : line.startsWith(' '.repeat(-delta)) ? line.slice(-delta)
      : line
    )
    .join('\n');
};

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  // Innermost-last: take the last opening tag each pass so nested groups are
  // rewritten from the inside out.
  for (let guard = 0; guard < 80; guard++) {
    let last = -1;
    for (const m of src.matchAll(/<R?Form\.Group(?=[\s/>])/g)) {
      if (m.index > last) last = m.index;
    }
    if (last === -1) break;

    const tag = src.slice(last).match(/^<(R?Form\.Group)/)[1];
    const end = findElementEnd(src, last, tag);
    if (end === -1) break;

    const openEnd = findTagEnd(src, last + tag.length + 1);
    const attrs = parseAttrs(src.slice(last + tag.length + 1, openEnd));
    const indent = src.slice(0, last).match(/\n([ \t]*)[^\n]*$/)?.[1] ?? '';
    let body = src.slice(openEnd + 1, end - `</${tag}>`.length);

    const hasLabel = /<R?Form\.(Control)?Label(?=[\s/>])/.test(body);
    const wrapper = hasLabel ? 'FormControl' : 'Box';

    body = body.replace(
      /<R?Form\.(?:Control)?Label(?=[\s/>])/g,
      () => (labels++, '<FormLabel')
    );
    body = body.replace(/<\/R?Form\.(?:Control)?Label>/g, '</FormLabel>');

    const kept = [];
    for (const [name, value] of attrs) {
      if (name === 'controlId') continue;
      if (name === SPREAD) {
        kept.push(`${indent}  ${value}`);
        continue;
      }
      kept.push(
        value === undefined ? `${indent}  ${name}` : `${indent}  ${name}=${value}`
      );
    }
    if (hasLabel) kept.push(`${indent}  fullWidth`);
    kept.push(`${indent}  sx={{ marginBottom: 3 }}`);

    src =
      src.slice(0, last) +
      `<${wrapper}\n${kept.join('\n')}\n${indent}>${body}${indent}</${wrapper}>` +
      src.slice(end);
    groups++;
  }

  // Labels outside any group — a `Form.Label` sitting next to a control the
  // earlier passes already converted.
  src = src.replace(/<R?Form\.(?:Control)?Label(?=[\s/>])/g, () => {
    labels++;
    return '<FormLabel';
  });
  src = src.replace(/<\/R?Form\.(?:Control)?Label>/g, '</FormLabel>');

  src = src.replace(/<R?Form\.(?:Help)?Text(?=[\s/>])/g, () => {
    helpTexts++;
    return '<FormHelperText';
  });
  src = src.replace(/<\/R?Form\.(?:Help)?Text>/g, '</FormHelperText>');

  if (src !== original) writeFileSync(file, src);
}

console.log(
  `converted ${groups} groups, ${labels} labels, ${helpTexts} help texts`
);
