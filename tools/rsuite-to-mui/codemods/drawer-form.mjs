/**
 * A panel's own `<form>` -> the shared `DrawerForm`.
 *
 *   const Form = styled.form`
 *     height: 100%;
 *   `;
 *   …
 *   <Form onSubmit={…}>   ->   <DrawerForm onSubmit={…}>
 *
 * The drawer's paper is the flex column that makes `DrawerBody` scroll.
 * Anything between the two breaks the chain, and `height: 100%` does not
 * repair it: the body grows to its content, the *paper* scrolls instead, and
 * the header — with the save button in it — scrolls away with the fields.
 * Six panels shipped that way.
 *
 * Keyed off the shape of the declaration, so a form styled for anything else
 * (`margin-top`, a flex column of its own) is left alone, and a panel already
 * using `DrawerForm` is a no-op.
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** `const Form = styled.form`…`;` / `styled('form')`…`;` with only a height. */
const DECLARATION =
  /\nconst (\w+) = styled(?:\.form|\('form'\))`\s*height:\s*100%;\s*`;\n/;

let converted = 0;

for (const file of process.argv.slice(2)) {
  const source = readFileSync(file, 'utf8');
  const declaration = source.match(DECLARATION);

  if (!declaration) continue;

  const [whole, name] = declaration;
  let next = source.replace(whole, '\n');

  // The element, opening and closing. A name like `Form` also appears in
  // `FormControl` and `</FormFields>`, so both boundaries are required.
  next = next
    .replace(new RegExp(`<${name}(?=[\\s>])`, 'g'), '<DrawerForm')
    .replace(new RegExp(`</${name}>`, 'g'), '</DrawerForm>');

  if (next === source) continue;

  // Into the editor import it already has, in alphabetical order; the panels
  // all import their drawer parts from one place.
  if (!/\bDrawerForm\b/.test(next.split('\n').slice(0, 60).join('\n'))) {
    next = next.replace(/(\n\s*)DrawerBody,\n/, `$1DrawerBody,$1DrawerForm,\n`);
  }

  // `styled` may have been imported for that one declaration.
  if (!/styled[.(]|styled`/.test(next.replace(/^import .*$/gm, ''))) {
    next = next.replace(/^import styled from '@emotion\/styled';\n/m, '');
  }

  writeFileSync(file, next);
  converted++;
  console.log(`  ${file}: ${name} -> DrawerForm`);
}

console.log(`drawer-form: ${converted} file(s)`);
