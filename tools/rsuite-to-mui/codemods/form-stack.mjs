/**
 * rsuite `Form.Stack` -> MUI `Stack`.
 *
 * `Form.Stack` is a column flexbox with `align-items: flex-start`; its `fluid`
 * widens the group children instead, which is what a plain `Stack` already
 * does. So `fluid` becomes a full-width `Stack`, and its absence becomes an
 * explicit `alignItems: 'flex-start'`.
 *
 * Both carry `spacing={3}`: rsuite spaced a form group's controls for you and
 * MUI's `Stack` does not, so without it the fields sit flush and the floating
 * label of one lands on the border of the one above.
 */
import { readFileSync, writeFileSync } from 'node:fs';

let converted = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  src = src.replace(/<R?Form\.Stack(\s+fluid)?\s*>/g, (_match, fluid) => {
    converted++;
    return fluid ?
        `<Stack spacing={3} sx={{ width: '100%' }}>`
      : `<Stack spacing={3} sx={{ alignItems: 'flex-start' }}>`;
  });
  src = src.replace(/<\/R?Form\.Stack>/g, '</Stack>');

  if (src !== original) writeFileSync(file, src);
}

console.log(`converted ${converted} form stacks`);
