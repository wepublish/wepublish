# rsuite → MUI codemods

The scripts that performed the migration, kept so the work can be **re-applied
after a merge conflict** instead of redone by hand.

## Re-running

From the workspace root:

```bash
# every file that still imports rsuite
tools/rsuite-to-mui/run.sh

# or just the files a merge mangled
tools/rsuite-to-mui/run.sh libs/ui/editor/src/lib/panel/authorEditPanel.tsx
```

Then verify — always both, `tsc` alone misses mis-nested JSX:

```bash
npx nx typecheck editor
npx nx run-many -t test lint -p ui-editor editor membership-editor \
  settings-editor banner-editor consent-editor crowdfunding-editor \
  event-import-editor
```

Every step keys off what the file still imports from `'rsuite'`, so running it
over an already-migrated file is a no-op. `run.sh` does **not** cover the
one-off rewrites (toggle/radio handler swaps, the `ToggleButtonGroup`
switchers, `EditorHeaderButton`); those steps are listed below and can be run
individually.

## Conflict-resolution recipe

When a merge brings back rsuite code in a file you had already migrated:

1. Resolve the conflict by taking **their** (rsuite) side for the conflicting
   hunk — don't hand-merge JSX.
2. Run `tools/rsuite-to-mui/run.sh <that file>`.
3. Run the extra codemods the file needs (`toggle.mjs`, `radio.mjs`,
   `loader.mjs`, `chip-label.mjs` — all take a file list).
4. Typecheck and lint. Expect a short tail of manual fixes; the patterns are in
   `RSUITE-TO-MUI-MIGRATION.md`.

## The scripts

| Script | What it does |
| --- | --- |
| `rsuite-files.mjs` | Lists files importing given names from `'rsuite'`. Every other script takes a file list, so this is how you build one. |
| `jsx-attrs.mjs` | Generic attribute rewriter driven by a rules JSON: rename/drop/translate props, add props conditionally, rename the tag. **Edits only the attribute span in place** — it never re-serializes a tag, so arbitrarily nested arrow functions survive untouched. |
| `swap-import.mjs` | Drops names from the `'rsuite'` import and adds the MUI components the file now uses (detected from its JSX), merging into any existing `@mui/material` import. |
| `move-imports.mjs` | Moves named imports from `'rsuite'` to another module. |
| `dedupe-imports.mjs` | Removes a name from the `@mui/material` import when the file already gets it from elsewhere or declares it locally. |
| `toaster-to-snackbar.mjs` | `toaster.push(<Message …>x</Message>)` → `enqueueSnackbar(x, {…})`. |
| `message-to-alert.mjs` | Inline `<Message>`/`<Notification>` → MUI `<Alert>`. |
| `fix-snackbar-imports.mjs` | Import cleanup after the two above. |
| `icon-button.mjs` | rsuite `IconButton` → MUI `IconButton` (icon only) or `Button` + `startIcon` (icon + label). Second argument lists local `styled()` wrapper names that must keep their identity. |
| `flatten-dialog-title.mjs` | Collapses `Modal.Header > Modal.Title` into one `DialogTitle`. |
| `stack.mjs` | rsuite `Stack` → MUI `Stack`, converting pixel `spacing` to theme units and making the row direction explicit. |
| `toggle.mjs` | `Toggle` → `Switch`, **swapping the handler arguments**. |
| `radio.mjs` | `Radio`/`RadioGroup` → MUI, same argument swap, children → `label`. |
| `loader.mjs` | `Loader` → `CircularProgress`, with a flex `Box` for `center`/`content`. |
| `chip-label.mjs` | Moves `Chip` children into the `label` prop. |
| `restore-block.mjs` | Puts rsuite's `block` prop back on non-button tags after a too-broad drop. |
| `panel.mjs` | `Panel` -> `Card`/`Accordion`. Detects local `styled(Panel)` wrappers and keeps their names, mapping only the rsuite props. |
| `drawer-rules.json` | `Drawer` sizes/placement -> `slotProps` + `anchor`. |
| `grid.mjs` | `Grid`/`Row`/`Col` -> MUI `Grid`, halving 24-column spans to 12. |
| `whisper.mjs` | Hover `Whisper` -> `Tooltip`. |
| `whisper-popover.mjs` | Click `Whisper` -> `ClickPopover`. |
| `pagination.mjs` | rsuite `Pagination` -> the editor's `Pagination`. |
| `table.mjs` | `Table` + `<Column>` children -> `DataTable` + a column array. Skips tables whose columns are built dynamically. |
| `picker.mjs` | `SelectPicker`/`CheckPicker`/`TagPicker` -> `Autocomplete` over option objects. Refuses sites with an inline `data` expression or a `//` comment among the props. |
| `picker-select.mjs` | `SelectPicker` over a short, fixed list -> `TextField select` + `MenuItem`. Handles both `SRC.map(x => ({label, value}))` and a literal `[{label, value}, …]`. A `placeholder` becomes an empty entry at the top plus `displayEmpty`. |
| `picker-multi.mjs` | `CheckPicker`/`TagPicker` -> `Autocomplete multiple` over **raw keys**, so nothing downstream has to change. `creatable` -> `freeSolo`. |
| `normalize-aliases.py` | `const {Group, Label, Control} = Form` -> the dotted names, so every form codemod can see them. Run it first. |
| `form-styled.mjs` | `styled(Form)` -> `styled('form')`, `styled(Form.Group)` -> `styled(Box)`. Another alias that hides the form. |
| `form-control.mjs` | A `Form.Group` holding exactly one plain `Form.Control` -> one `TextField`. |
| `form-accepter.mjs` | `<Form.Control accepter={X}>` -> `<X>`; `accepter={Checkbox}` -> `FormControlLabel` + `Checkbox`. |
| `form-group-layout.mjs` | The remaining `Form.Group`s -> `FormControl` + `FormLabel` (with a label) or `Box` (without). `Form.Text`/`Form.HelpText` -> `FormHelperText`. |
| `form-stack.mjs` | `Form.Stack` -> `Stack`. |
| `form-bare.mjs` | Leftover bare `Form.Control`s -> `TextField`, and a `<Form>` with no `model` -> `<form>` (if it submits) or `Stack` (if it was only layout). |
| `form-wrappers.py` | A `<Form model={Schema.Model(…)}>` -> `useForm` + `zodResolver`. The zod schemas are hand-written per file, in the table at the top — rsuite's rules and zod's differ at the edges and deriving them would silently change what can be submitted. |
| `date-picker.mjs` | rsuite `DatePicker` -> `@mui/x-date-pickers` `DatePicker`/`DateTimePicker`, picking the date-time variant when the `format` mentions hours. |
| `checkbox.mjs` | rsuite `Checkbox` -> MUI `Checkbox` in a `FormControlLabel`, children -> `label`. |
| `rs-vars.mjs` | `var(--rs-*)` inside a styled/css template -> a `${({theme}) => …}` interpolation. Reports the ones it cannot reach. |
| `rs-vars-sx.mjs` | `'var(--rs-*)'` inside an `sx` object -> a system token (`'text.secondary'`, `borderRadius: 0.75`). |
| `add-mui-import.mjs` | Adds `@mui/material` imports for components the codemods introduced, and drops the rsuite import of the same name — it would otherwise shadow the new one with no error. |
| `styled-rebase.mjs` | Repoints `styled(RFoo)` wrappers at their MUI equivalent, importing it under a `Mui…` alias. |
| `editor-imports.mjs` | Adds imports for the editor's own exports (`DrawerHeader`, `enqueueSnackbar`, `DataTable`, …) that the codemods introduce. |
| `spec-theme.mjs` | Wraps a spec's `render(...)` trees in a `ThemeProvider`. |
| `*-rules.json` | Rule sets for `jsx-attrs.mjs`. |

## Hard-won rules

These caused real breakage during the migration. Read them before writing
another codemod against this repo.

1. **Scope by import source, never by tag name.** `<Button>` is rsuite in
   `libs/*/editor` and MUI in `libs/*/website`. Keying on the tag restyled 51
   untouched website files once, and a later `Chip` pass leaked into
   `apps/eenews`. Before finishing, always check:

   ```bash
   git diff --name-only | grep -vE '^(libs/(ui|banner|consent|crowdfunding|settings|membership)/editor|libs/event/import/editor|apps/editor|vitest\.|tools/|package)'
   ```

   Anything that prints is out of scope and should be restored.
2. **Never re-serialize a JSX tag.** An early version rebuilt attribute lists
   from a parse, and silently destroyed every tag whose props contained a
   nested arrow function. `jsx-attrs.mjs` edits substrings inside the
   attribute span and copies everything else byte for byte.
3. **Attribute patterns need both boundaries.** `block` matched inside
   `blockStyleToDelete`, and `active` inside `!user.active`. Every pattern
   needs a leading `(^|\s)` and a trailing `(?![\w$-])`.
4. **"Already imported" means the local binding.** `Stack as MuiStack` binds
   `MuiStack`, not `Stack`; a raw text search for `Stack` wrongly concluded the
   import was there and left the file without one.
5. **Run `nx lint` after any JSX codemod.** The i18n `disallow literal string`
   rule catches expressions that lost their braces and would have rendered as
   visible source text — `tsc` does not.
6. **Don't run `nx affected -t lint --fix`.** It reformats every project in the
   affected graph, including generated files. Lint one project at a time.
7. **A codemod that renames a tag to itself must park its output.** Rewriting
   `<Panel>` to `<Panel>` (keeping a local wrapper's name) re-matched what it
   had just written and nested the element 200 deep before the guard tripped.
   Emit a placeholder tag and swap it back once the file is done.
8. **Only persist a file the codemod actually converted.** `table.mjs`
   normalises `<RTable.Column>` to `<Column>` before parsing; when it then
   decided to skip the table, that half-rewrite was being written to disk.
9. **Don't drop an import from a file the codemod skipped.** Work out which
   files really converted (no rsuite markup left) before touching imports.
10. **Watch for prefix collisions in styled() rebasing.** `styled(RTag` matched
   `styled(RTagPicker`, and `styled(Radio` matched `styled(RadioOptionHint`.
   Require the name to end at the paren or comma.
11. **A quoted string inside a template is still a string.** An `${}` written
   there is literal text, not an interpolation. The first variable sweep put
   `'${({theme}) => …}'` into eight files, which renders the source.
12. **A `,` only opens an object shorthand inside `{}`.** Rewriting
   `value => f(id, value, type)` treated the call's arguments as an object
   literal and produced `f(id, value: event.target.value, type)`. Track bracket
   depth and expand only when the innermost open bracket is `{`.
13. **Collapsing whitespace eats `//` comments.** Re-emitting leftover props on
   one line turned a comment among them into a comment over the rest of the
   file. Skip any element whose attribute span contains a line comment.
14. **Never `git checkout` a file to undo a bad codemod.** It discards every
   *earlier* uncommitted pass too. Fix forward, or re-run `run.sh` on that file.
15. **`shape.borderRadius` is a number typed `number | string`.** In raw CSS it
   needs a unit; it cannot be multiplied without a cast, so fractional radii go
   through `calc()`.
16. **Check what you insert into the locale files by path.** Anchoring a JSON
   insertion on the first matching key put eight keys in the wrong block;
   `locales.spec.ts` is what caught it.
17. **A rule with `defaults` fires on already-migrated elements.** `drawer-rules`
   probed only `size`/`placement`; a `<Drawer>` that had neither — because an
   earlier run had already converted it — matched no `add.when`, fell through to
   `defaults`, and got a second `anchor` and `slotProps`. `skipDefault` only
   works on names the rule also **probes**, so both lists need the prop.
18. **The conventions report is a to-do list, not a gate.** `editor-conventions.mjs`
   exits zero whatever it finds; every one of its rules needs a name or a
   judgement a script cannot make.

