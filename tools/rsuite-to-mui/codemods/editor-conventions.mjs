/**
 * Reports where editor code has drifted from the conventions the migration
 * settled on. Reports only — every fix here needs a name or a judgement a
 * script cannot make.
 *
 *   node tools/rsuite-to-mui/codemods/editor-conventions.mjs <files…>
 *
 * Each rule exists because the thing it looks for shipped at least once:
 *
 * - **A list table without a `storageKey`** has no column menu, and no drawer
 *   to keep the choice in. The key names the local-storage drawer, so only a
 *   person can pick it — and two tables sharing one would share each other's
 *   hidden columns.
 * - **A `Switch` on a form that saves** says the setting already took effect.
 *   Switches are for what happens immediately; everything a save button holds
 *   back is a checkbox.
 * - **`theme.palette.…` in a styled template** is the light scheme, frozen at
 *   `createTheme`. `theme.vars.palette.…` is the CSS variable that follows the
 *   scheme the user is actually in. (Colour functions — `lighten`,
 *   `getContrastText` — need a real colour and are left alone.)
 * - **A panel `<form>` of its own** breaks the flex chain that makes the
 *   drawer body scroll; `DrawerForm` is the one that does not. `drawer-form.mjs`
 *   fixes the common shape.
 *
 * A line is exempt when the lines above it carry `conventions-ignore: <rule>`
 * — with the reason, which is the point of writing it down.
 */
import { readFileSync } from 'node:fs';

import { findTagEnd } from './jsx-utils.mjs';

const RULES = [
  {
    name: 'data-table-without-storage-key',
    hint: 'give the table a storageKey so its columns can be hidden',
    find(source) {
      // To the tag's own `>`: a prop holding an arrow function or JSX has
      // plenty of its own, and the first one is never the end.
      return [...source.matchAll(/<DataTable\b/g)]
        .filter(
          match =>
            !/\bstorageKey=/.test(
              source.slice(match.index, findTagEnd(source, match.index))
            )
        )
        .map(match => match.index);
    },
  },
  {
    name: 'switch-on-a-saved-form',
    hint: 'nothing here takes effect until save: use a Checkbox',
    find(source) {
      if (!/type="submit"|handleSubmit\(/.test(source)) return [];

      return [...source.matchAll(/<Switch\b/g)].map(match => match.index);
    },
  },
  {
    name: 'frozen-palette',
    hint: 'theme.vars.palette.… follows the colour scheme, theme.palette.… does not',
    find(source) {
      return [...source.matchAll(/\btheme\.palette\.[\w.[\]]+/g)]
        .filter(match => {
          const before = source.slice(Math.max(0, match.index - 24), match.index);

          // `t('websiteSettings.theme.palette.…')` is a locale key, not the
          // theme: in real code the name is never preceded by a dot.
          if (before.endsWith('.')) return false;

          // These need a colour to work on, not a `var()`.
          const isArgument =
            /(lighten|darken|alpha|emphasize|getContrastText)\(\s*$/.test(before);

          return (
            !isArgument && !/^theme\.palette\.(mode|getContrastText)/.test(match[0])
          );
        })
        .map(match => match.index);
    },
  },
  {
    name: 'panel-form-outside-drawer-form',
    hint: 'use DrawerForm, or the drawer header scrolls away with the fields',
    find(source) {
      // The module that defines `DrawerForm` is where the one good one lives.
      if (!/DrawerBody/.test(source) || /export const DrawerForm/.test(source))
        return [];

      // Only the shape that breaks it: a form styled as a flex column of its
      // own is doing something else.
      return [...source.matchAll(/const \w+ = styled(?:\.form|\('form'\))`[^`]*`/g)]
        .filter(match => /height:\s*100%/.test(match[0]))
        .map(match => match.index);
    },
  },
];

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/** `conventions-ignore: <rule>` in the three lines above, with its reason. */
const exempted = (source, index, rule) => {
  const lines = source.slice(0, index).split('\n').slice(-4);

  return lines.some(line => line.includes(`conventions-ignore: ${rule}`));
};

let found = 0;

for (const file of process.argv.slice(2)) {
  if (file.includes('.spec.')) continue;

  const source = readFileSync(file, 'utf8');

  for (const rule of RULES) {
    for (const index of rule.find(source)) {
      if (exempted(source, index, rule.name)) continue;

      console.log(`${file}:${lineOf(source, index)}  ${rule.name} — ${rule.hint}`);
      found++;
    }
  }
}

console.log(
  found ? `editor-conventions: ${found} to look at` : 'editor-conventions: clean'
);
