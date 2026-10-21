/**
 * The rsuite form behind a `styled()` call.
 *
 *   const Form = styled(RForm)`…`          ->  styled('form')
 *   const FormGroup = styled(Form.Group)`…` ->  styled(Box)
 *
 * These aliases hide the form from every other codemod — a `<Form>` that is
 * really a styled rsuite `Form` reads as plain JSX until it renders.
 */
import { readFileSync, writeFileSync } from 'node:fs';

let rebased = 0;

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, 'utf8');
  const original = src;

  src = src.replace(/styled\(R?Form\.Group\)/g, () => (rebased++, 'styled(Box)'));
  src = src.replace(/styled\(R?Form\)/g, () => (rebased++, "styled('form')"));

  if (src !== original) writeFileSync(file, src);
}

console.log(`rebased ${rebased} styled form components`);
