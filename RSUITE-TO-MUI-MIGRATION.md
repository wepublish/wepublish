# rsuite → MUI migration

Working notes for the `f/replace-rsuite` branch: what has been migrated, the
decisions taken along the way, and what is still open.

## Status

**The migration is finished.** Nothing in the editor imports `rsuite`, no
`var(--rs-*)` is left, and the dependency is out of `package.json`.

|                                       |             |
| ------------------------------------- | ----------- |
| Files importing rsuite at the start   | 253         |
| Files importing rsuite now            | **0**       |
| `var(--rs-*)` references at the start | 472         |
| `var(--rs-*)` references now          | **0**       |
| `rsuite` in `package.json`            | **removed** |
| Editor typecheck                      | clean       |
| Editor + lib tests                    | green       |

Everything below was verified with `tsc -p apps/editor/tsconfig.app.json
--noEmit` (**check the exit code — the output is ANSI-coloured, so grepping for
the literal string `error TS` silently finds nothing**) plus
`nx run-many -t test lint` over the editor projects, and spot-checked in the
running editor at `localhost:3000`.

## Done

### Notifications — `toaster` + `Message` → `enqueueSnackbar` + MUI `Snackbar`

New module: `libs/ui/editor/src/lib/snackbar/`, exported from
`@wepublish/ui/editor`.

```ts
enqueueSnackbar(message, { variant, title, autoHideDuration, key })
closeSnackbar(key?)   // no key closes all
<SnackbarHost maxSnack={3} anchorOrigin={…} />   // mounted once in app.tsx
```

- Each entry renders as its own MUI `<Snackbar>` inside a fixed flex container,
  so MUI owns the auto-hide timer, pause-on-hover and clickaway handling rather
  than a hand-rolled timer. `position: static` on the Snackbar lets them stack
  instead of overlapping.
- Covered by `snackbar.spec.tsx` (8 tests, written before the implementation).
- **225 call sites** converted by codemod:
  `toaster.push(<Message type="error" duration={8000}>x</Message>)`
  → `enqueueSnackbar(x, {variant: 'error', autoHideDuration: 8000})`.
- `<Message>` used _inline_ (not as a toast) became MUI `<Alert>`; `header=`
  became `<AlertTitle>`.

### `Button` → MUI `Button` (105 files)

| rsuite                                                                 | MUI                                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `appearance="primary"`                                                 | `variant="contained"`                                        |
| `appearance="ghost"` / `"default"`                                     | `variant="outlined"`                                         |
| `appearance="subtle"` / `"link"`                                       | `variant="text"`                                             |
| no `appearance`                                                        | `variant="outlined"`                                         |
| `size="xs"\|"sm"` → `"small"`, `"md"` → `"medium"`, `"lg"` → `"large"` |                                                              |
| `color="red"\|"green"\|"blue"\|"yellow"\|"orange"\|"cyan"\|"violet"`   | `error\|success\|primary\|warning\|warning\|info\|secondary` |
| `block`                                                                | `fullWidth`                                                  |
| `active`, `ripple`                                                     | dropped (no MUI equivalent)                                  |
| `as={Link}`                                                            | `component={Link}`                                           |

### `IconButton` → MUI `IconButton` / `Button` (174 call sites)

rsuite's `IconButton` is one component for two different things, so it splits:

- `<IconButton icon={<X/>} />` (no children) → `<IconButton><X/></IconButton>`
- `<IconButton icon={<X/>}>Label</IconButton>` → `<Button startIcon={<X/>}>Label</Button>`
- `circle` dropped — MUI's `IconButton` is already circular.

The shared `IconButton` exported from `listView/list-view.tsx` (used by ~54 list
views) is now `styled(MuiIconButton)` with the same 36×36 sizing and spacing.

### `Modal` → MUI `Dialog` (49 files)

`Modal` → `Dialog`, `Modal.Title`/`Modal.Header` → `DialogTitle`,
`Modal.Body` → `DialogContent`, `Modal.Footer` → `DialogActions`.
`size="xs|sm|md|lg"` → `maxWidth` + `fullWidth`; `backdrop`, `overflow`,
`keyboard`, `enforceFocus` dropped.

`onEntered`/`onExited` moved to `slotProps={{ transition: { … } }}` — MUI v9
removed the `TransitionProps` prop.

### `Drawer` -> MUI `Drawer` (64 files)

MUI's `Drawer` is only a sliding surface — it has no header/body/footer parts —
so `libs/ui/editor/src/lib/drawer/` holds the small styled layout elements
MUI's own drawer examples use: `DrawerHeader`, `DrawerTitle`, `DrawerActions`,
`DrawerBody`, `DrawerFooter`, plus a `DRAWER_WIDTHS` map replacing rsuite's
named `size`.

- `Drawer.Header`/`Title`/`Actions`/`Body`/`Footer` map onto those.
- `size="sm"` etc. become `slotProps={{ paper: { sx: { width: … } } }}`.
- The paper is a flex column so `DrawerBody` (`flex: 1; overflow-y: auto`)
  scrolls while the header stays put.
- `placement` -> `anchor`.
- Covered by `drawer.spec.tsx` (3 tests, written first).

### `Toggle` -> `Switch`, `Radio`/`RadioGroup` -> MUI (45 call sites)

The dangerous part is the handler signature — **rsuite calls
`onChange(value, event)`, MUI calls `onChange(event, value)`**. The arguments
are swapped, so a plain rename hands every handler an event object where it
expects a boolean. `codemods/toggle.mjs` and `codemods/radio.mjs` rewrite the
arrow parameters rather than just the tag.

Also: `label` becomes a wrapping `FormControlLabel`; `<Radio value>Label</Radio>`
becomes `<FormControlLabel value control={<Radio />} label />`; `inline` becomes
`row`; `disabled` on a `RadioGroup` moves to a wrapping `FormControl`; and
`defaultChecked` is dropped wherever `checked` is also set (React warns about
inputs that are both controlled and uncontrolled — that warning was already
firing in the console before this change).

### The small ones

| rsuite          | MUI                     | Notes                                                                                                                                                                                                                                                                                                                        |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Loader`        | `CircularProgress`      | `center`/`content` become a flex `Box`; named sizes become pixels                                                                                                                                                                                                                                                            |
| `Divider`       | `Divider`               | direct                                                                                                                                                                                                                                                                                                                       |
| `Stack`         | `Stack`                 | **`spacing` is pixels in rsuite, theme units in MUI** — `spacing={8}` becomes `spacing={1}`. rsuite also defaults to `direction="row"`, MUI to `column`, so every converted Stack gets an explicit `direction`. MUI v9's Stack takes `alignItems`/`justifyContent`/`flexWrap` through `sx` only. `Stack.Item` becomes `Box`. |
| `ButtonToolbar` | `Stack direction="row"` | no MUI equivalent                                                                                                                                                                                                                                                                                                            |
| `ButtonGroup`   | `ButtonGroup`           | `justified` -> `fullWidth`                                                                                                                                                                                                                                                                                                   |
| `Tag`           | `Chip`                  | takes `label`, not children; the `STATE_COLORS`/`actionColors` maps now hold MUI palette names                                                                                                                                                                                                                               |
| `Avatar`        | `Avatar`                | already circular; named sizes become `sx` width/height                                                                                                                                                                                                                                                                       |
| `Progress.Line` | `LinearProgress`        | draws only the bar, so the percentage label is rendered alongside it                                                                                                                                                                                                                                                         |
| `Badge`         | `Badge`                 | `content` -> `badgeContent`; the `.unsaved`/`.saved` CSS trick becomes `variant="dot" invisible={…}` (the dead CSS is gone from `app.tsx`)                                                                                                                                                                                   |

### `Grid`/`Row`/`Col` -> MUI `Grid`

**rsuite lays out on 24 columns, MUI v9 on 12**, so every span is halved —
`<Col xs={24}>` becomes `<Grid size={{ xs: 12 }}>`. Spans that do not halve
evenly (`xs={5}`) are rounded up and reported by the codemod; there were 14 and
they are worth a visual check. `fluid` disappears (MUI containers are already
full width) and `align`/`justify` move into `sx`.

### `Whisper` -> `Tooltip` / `ClickPopover`

- Hover/focus Whispers whose speaker is a `<Tooltip>` became MUI `Tooltip`s —
  MUI opens on hover _and_ keyboard focus, so rsuite's explicit `trigger` list
  has no counterpart. Placements are hyphenated (`bottomEnd` -> `bottom-end`).
- Click-triggered Whispers open a popover, which MUI models as controlled
  `open`/`anchorEl`/`onClose` state. `libs/ui/editor/src/lib/popover/`
  holds a `ClickPopover` that owns that state, so the 14 call sites stay one
  element each. Its children may be a render function receiving a `close`
  callback, which is how the "add a day" confirm popover closes itself.
- `IconButtonTooltip` and `InfoTooltip` — the two shared wrappers used all over
  the editor — are now MUI `Tooltip`s, which converted most call sites at once.

### `Pagination` -> MUI

`libs/ui/editor/src/lib/listView/pagination.tsx` composes MUI's numbered
`Pagination` with a page-size `Select` and a total count. MUI's
`TablePagination` only offers prev/next arrows, which is poor on lists that run
to 80+ pages. Covered by `pagination.spec.tsx` (4 tests).

Call sites collapsed from a dozen rsuite props to
`state={{page, limit, setPage, setLimit}}` + `totalCount`.

### `Table` -> TanStack + MUI (partly done)

`libs/ui/editor/src/lib/listView/data-table.tsx` is the new table: TanStack
Table owns the column model and visibility, MUI owns the markup. Covered by
`data-table.spec.tsx` (28 tests).

```tsx
<DataTable
  data={rows}
  loading={loading}
  storageKey="articles"
  columns={[
    { id: 'title', label: t('title'), width: 300, alwaysVisible: true, render: row => … },
  ]}
/>
```

- **`storageKey` turns on the column menu**, and names the drawer the choice
  is kept in (`wepublish:editor:columns:<key>`, holding `{hidden, order, shown}`). One stable key per table —
  two tables sharing a key would share each other's hidden columns. Every
  list view passes one; the small pickers inside drawers deliberately do not,
  since a three-column picker has nothing worth hiding.
- The control is the **table's**, not the page's. It used to be an unlabelled
  icon beside the `PageTitle`, where it read as part of the heading; it now
  sits in a strip on the table's top-left, as a labelled button carrying the
  number of columns currently switched off — without that count a short table
  is invisible state, since nothing says why a column is missing.
- The menu lists every column the user may **move**, which is a wider set than
  the ones they may hide: `alwaysVisible` columns are in it with their
  checkbox locked, pinned `fixed` ones (the row's actions) stay out, and so
  does any column whose header is not a plain string — give one a
  `columnLabel` to bring it in. The last remaining column cannot be switched
  off either: an empty table carries no handle to undo itself.
- **`defaultHidden` columns start hidden.** A table can offer details most
  users never need (the invoice table's payment method, deactivation date…)
  without widening it for everyone: the column stays out until the user
  switches it on, which is kept in `shown`; a reset hides it again, and so does
  a choice stored before the column existed.
- **The filter bar is the table's too** (`filters`, `filterCount`,
  `onResetFilters`). A row of fields above every list is a lot of chrome for
  something most visits never touch, so the fields fold away behind a button
  in the same toolbar, with the number of active filters on it and a × beside
  it that clears them. The panel opens on the button alone; a list that
  _arrives_ filtered says so with the count on it, which is why the count is
  not optional.
- `countActiveFilters` and `clearFilters` (`filter-state.ts`) are what the
  toolbar counts and the × calls. They work per _field_, so both ends of a
  date range read as the one question the user was asked, and they leave
  alone anything the list did not offer — the poll vote list pins a `pollId`
  that is not the user's to clear.
- The filter panel is `flex-shrink: 0`. A list lays its parts out in a flex
  column that shrinks whatever it can; without the floor the fields were
  squashed to a fraction of their height and the table painted over them.
- **Every list's filters moved**, not just the seven on the shared
  `ListViewFilters`: the bare search fields (tags, images, authors, documents,
  navigations, member plans, user roles), the comment list's state picker and
  the subscription list's twelve-field grid. Two of them kept state the filter
  object does not — `SubscriptionListFilter` holds a picked user and nine
  pickers' own values — so it takes a `resetToken` the list bumps when the ×
  is pressed, which remounts those fields empty. Its old `resetFilterKey`
  timestamp did the same job for its own reset button, which is gone.

- The table lays out with `table-layout: fixed`, so `width` is the width the
  column _keeps_. Letting the browser measure from content meant a long
  article title shoved every other column sideways, and the layout shifted
  from page to page. Cells clip with an ellipsis rather than spill into their
  neighbour.
- `width` is a starting point, not a floor: a column may be dragged down to
  `minWidth`, defaulting to 48px. Using `width` as `minSize` (the first cut)
  meant a column could only ever grow.
- A pinned (`fixed`) column keeps a left border plus a shadow, so it reads as
  sitting above the content scrolling under it. Two details that are easy to
  get wrong:
  - The shadow is a **pseudo-element, not a `box-shadow`**. A box shadow with
    a negative spread fades out at the top and bottom of every cell, so a
    column of them reads as a stack of separate smudges rather than one band.
  - It is **only drawn while the table can still scroll**. The container
    tracks `scrollLeft` and flips `data-pin-shadow`; flush right there is
    nothing underneath to lift the column above, and the shadow is just a
    smudge against the edge.
  - The pinned cell sets `overflow: visible`. The clipping every other column
    needs would otherwise cut the shadow off, since it is drawn just outside
    the cell's left edge. Pinned columns hold action icons, not prose, so they
    have nothing to clip.

**Resizing has to stay off the styling path.** A drag updates the sizing state
on every mousemove. Two things make that cheap:

- **Widths are CSS custom properties** (`--col-<id>-size`) set inline on the
  `<table>`, not `sx={{width: …}}` per cell. An `sx` width makes emotion
  serialise and inject a fresh class for _every cell in the table_ on every
  frame; measured on a 100-row article list, a full drag now adds **0** new
  CSS rules.
- **The body is memoised.** Since the widths ride on variables, the rows would
  re-render to byte-identical markup. Watch the dependency list: `t` from
  `useTranslation` is a **new function on every render**, so depending on it
  defeats the memo completely — the empty-state string is resolved outside.
- Sorting and paging stay with the caller: the lists sort and page on the
  server, so `DataTable` only reports what the user clicked
  (`sortable`, `sortColumn`, `sortOrder`, `onSort`).
- **A sortable column's `sortKey` is the field the server sorts by**, which is
  not always the column id — `publicationDate` sorts by `publishedAt`. rsuite
  carried this on the _cell_ as `dataKey` (and on the column as a bare
  `sortable` flag); passing the column id instead silently sends an invalid
  sort field to the API. `codemods/table.mjs` lifts both into the table's
  `sortable={[…]}` list and the column's `sortKey`.
- An empty table falls back to a translated `listView.table.empty`.

**All 41 list views are converted**, and `rsuite`'s `Table` is gone from the
editor along with `fit-column-widths.ts` and the `Table`/`PaddedCell`/
`IconButtonCell` exports it existed to serve. The last 7 were done by hand
because they build their columns dynamically (a `.map()`, a conditional, a
`PermissionControl` wrapper), which `codemods/table.mjs` deliberately refuses
to guess at — see "Finishing the
tables" below.

### Rewritten rather than mapped

Where rsuite's API had no honest MUI equivalent, the component was rebuilt the
way MUI intends rather than shimmed:

- **View/device switchers** — `ButtonGroup` + `active`/`appearance` toggling in
  `imageList`, `previewFrame` and `mail-preview` became
  `ToggleButtonGroup`/`ToggleButton`, which is what that control actually is.
- **`InfoMessage`** (`atoms/infoMessage.tsx`) — was a `styled.div` with a
  hard-coded background per state. Now an `<Alert variant="outlined">`; the
  `InfoColor` enum values are MUI severities, so call sites
  (`messageType={InfoColor.warning}`) read unchanged but the colours come from
  the theme and follow dark mode.
- **`EditorHeaderButton`** (`atoms/editorHeader.tsx`) — now a MUI `Button` with
  `startIcon` and a `label`/`collapse` API. The container queries that hid the
  label target `button[data-collapse]` and `.MuiButton-startIcon` instead of
  `.rs-btn`.
- **`CreateCommentBtn`** — props are MUI's (`size`, `color`, `variant`) instead
  of rsuite's (`circle`, `appearance`, `BasicSize`, `Color`).
- **`mapCommentStateToColor`** returns `'success' | 'warning' | 'error'`
  instead of `'green' | 'yellow' | 'red'`.

### Test setup

`@testing-library/jest-dom/vitest` now loads globally for every project running
in a DOM environment (`vitest.setup-dom.ts`, wired up in `vitest.shared.ts`), so
specs no longer import it one by one.

## Decisions

1. **No compatibility shim.** An earlier attempt reimplemented rsuite's API on
   top of MUI (a `toaster.push(<Message/>)` lookalike, a `Table`/`Column`/
   `Cell` wrapper). That was thrown away in favour of using MUI the way MUI is
   meant to be used, even where it means touching more call sites.
2. **Default `Button` variant is `outlined`.** rsuite's default button has a
   visible grey fill; MUI's default (`text`) would have made a lot of toolbars
   read as plain links. `outlined` keeps the affordance. Easy to change
   globally in `apps/editor/src/app/theme.ts` via `MuiButton.defaultProps` if
   you prefer a flatter look.
3. **Default snackbar duration is 5s.** rsuite had no default and every call
   site passed one; the converted call sites keep their explicit durations.
   `duration={0}` (never auto-dismiss) became `autoHideDuration: null`.
4. **Snackbars anchor bottom-right.** rsuite's `toaster` defaulted to top-centre
   and a handful of call sites passed `placement: 'topCenter'`. Bottom-right is
   MUI's default and stays out of the way of the editor header. `placement` on
   the old call sites was dropped; `SnackbarHost` takes an `anchorOrigin` if you
   want it moved.
5. **Inline `closable` alerts lost their close button.** rsuite's `Message`
   tracked its own dismissed state; a MUI `Alert` needs an `onClose` handler.
   Rather than invent state, inline alerts render without a close button. Toasts
   are still dismissible — `SnackbarHost` wires `onClose` itself.
6. **Website apps and libs were left alone.** `libs/*/website` and `apps/<tenant>`
   already use MUI and have no rsuite dependency. An early codemod run touched
   51 of them by accident; all were restored.
7. **Forms use react-hook-form + zod, with no shared wrapper.** Each form wires
   `useForm` with `zodResolver` directly rather than going through a house
   `<FormField>` component. Note the repo is on classic zod (v3) everywhere
   except the Puck AI schemas, which use `zod/v4`.
8. **Icons stay on `react-icons`.** `@mui/icons-material` is not used and was
   not introduced.
9. **Drawer chrome is shared, forms are not.** MUI's `Drawer` has no header or
   body parts, and MUI's own examples define a `DrawerHeader` styled element.
   Rather than repeat that flex CSS in 28 panels, it lives in
   `libs/ui/editor/src/lib/drawer/`. This is layout only — no logic, no props
   beyond what the underlying element takes.
10. **Codemods are checked in.** `tools/rsuite-to-mui/` holds every script plus
    a `run.sh` that re-applies the pipeline, so a merge conflict can be resolved
    by taking the rsuite side and re-running rather than hand-merging JSX. See
    its README.
11. **Specs now mount a `ThemeProvider`.** The migrated components are MUI
    components, and the shared atoms style themselves from the theme through
    emotion — which hands a styled component `{}` when no provider is mounted,
    so `theme.palette.…` throws. The app always has a provider; the specs now
    match (`codemods/spec-theme.mjs`).
12. **Pickers are deferred into the Form pass.** `SelectPicker` & co. key their
    `value` by the option's raw key while MUI's `Autocomplete` value _is_ the
    option object, so every site needs a lookup in and a `.value` out. Nearly
    all of them also build `data` inline from a query result, which would be
    evaluated twice per render if the conversion were mechanical, and most sit
    inside a `Form.Control` that the Form pass rewrites anyway. Converting them
    twice is more churn than doing it once alongside the form.
    `codemods/picker.mjs` exists and handles the simple shape, but it
    deliberately refuses anything with an inline `data` expression.
13. **`block` is still on rsuite pickers.** It is a rsuite prop that MUI buttons
    do not understand, so it was removed from buttons only. The ~87 occurrences
    on `SelectPicker`/`CheckPicker`/`TagPicker`/`DatePicker`/`Form.Control` stay
    until those components are migrated.

## The final pass

What the last pass took off rsuite, and what each became.

| Component                              | Target                                                | Notes                                                                                                                                                                        |
| -------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Form` + `Schema`                      | `react-hook-form` + `zod`, or a plain `<form>`        | A `<Form model=…>` became `useForm({resolver: zodResolver(schema)})`; a `<Form>` with no model was never a form at all, just rsuite's column layout, so it became a `Stack`. |
| `Form.Group` / `Form.Label`            | `FormControl` + `FormLabel`, or `Box`                 | A group with a label is a `FormControl`; one without was only there for the 24px rsuite put under every group.                                                               |
| `Form.Control`                         | `TextField`, or the accepter rendered directly        | `Form.Control` was a wiring shim that read the value out of `formValue` by `name`; nothing leaned on it any more.                                                            |
| `SelectPicker`                         | `TextField select` + `MenuItem`, or `Autocomplete`    | A short fixed list is a select; a list worth searching is an `Autocomplete`.                                                                                                 |
| `CheckPicker` / `TagPicker`            | `Autocomplete multiple` over raw keys                 | Keys rather than option objects, because rsuite's `value` was already the keys. `creatable` → `freeSolo`.                                                                    |
| `Input` / `InputGroup` / `NumberInput` | `TextField`, `InputAdornment`                         | An addon becomes a start/end adornment; `postfix` an end adornment; `onPressEnter` an `onKeyDown` guard.                                                                     |
| `Checkbox`                             | `Checkbox` inside a `FormControlLabel`                | rsuite put the label in the children.                                                                                                                                        |
| `DatePicker`                           | `@mui/x-date-pickers` `DatePicker` / `DateTimePicker` | A `format` containing hours picks the date-time variant.                                                                                                                     |
| `DateRangePicker`                      | `DateRangeFilter` (two fields + preset chips)         | MUI's range picker is Pro-only; see decision 16.                                                                                                                             |
| `List` / `Nav` / `Popover`             | `List` / `Tabs` / a plain styled container            |                                                                                                                                                                              |
| `CustomProvider`                       | —                                                     | Its two jobs now belong to `ThemeProvider` (colour mode, already wired in `main.tsx`) and `LocalizationProvider`'s `adapterLocale` (date formats per editor language).       |
| `rsuite/dist/rsuite.css`               | the editor theme                                      | See below.                                                                                                                                                                   |

### The last mile: `var(--rs-*)` → theme tokens

472 references across 87 files were the real thing holding the stylesheet in
the bundle — the variables were defined by `rsuite.css` and by nothing else.

- **Inside a styled/css template** (277 of them) → an interpolation:
  `color: var(--rs-text-secondary)` became
  `color: ${({ theme }) => theme.palette.text.secondary}`. Codemod:
  `codemods/rs-vars.mjs`.
- **Inside an `sx` object** → a system token: `color: 'var(--rs-text-secondary)'`
  became `color: 'text.secondary'`, `borderRadius: 'var(--rs-radius-md)'`
  became `borderRadius: 0.75` (sx multiplies `shape.borderRadius`). Codemod:
  `codemods/rs-vars-sx.mjs`.
- **In a map of state to colour** → the palette _path_, resolved where it is
  used: `paletteColor(theme, 'success.main')`. The maps are plain data, so they
  hold the path rather than the colour.
- `editorGlobalStyles.tsx` was mostly a rsuite skin — every rule targeted an
  `.rs-*` class. What survives is the `--wep-*` design tokens, now chosen from
  `theme.palette.mode` instead of the `body.rs-theme-dark` class rsuite set.

Two traps worth remembering, both caught by `tsc`:

- `theme.shape.borderRadius` is a **number**, and is typed `number | string`.
  In raw CSS it needs a unit (`${theme.shape.borderRadius}px`) and it cannot be
  multiplied — the smaller radii go through `calc()`.
- In `styleOverrides` a palette path like `'divider'` is **not** resolved —
  those are plain CSS. The theme's own overrides take the callback form
  (`root: ({ theme }) => ({...})`) for that reason.

### Specs need a `ThemeProvider`

Emotion's `styled` has no default theme (MUI's does, but the lint rule here
forbids importing `styled` from `@mui/material`). While the colours came from
CSS variables that did not matter; now a spec that renders a styled component
without a provider throws `Cannot read properties of undefined`. Seven specs
gained a `renderWithTheme` helper.

### Forms — `Form` + `Schema` → react-hook-form + zod

The one pattern, with **no shared wrapper** (your call). `resetUserPasswordForm`
is the worked example:

```tsx
// Built inside the component so the messages follow the active language.
const schema = z.object({
  password: z
    .string()
    .min(1, t('errorMessages.noPasswordErrorMessage'))
    .min(12, t('errorMessages.passwordTooShortErrorMessage')),
});

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { password: '' },
});

const onSubmit = handleSubmit(async ({ password }) => { … });

<form onSubmit={onSubmit}>
  <TextField
    {...register('password')}
    error={Boolean(errors.password)}
    helperText={errors.password?.message}
  />
</form>
```

Mapping notes:

| rsuite                         | react-hook-form + MUI           |
| ------------------------------ | ------------------------------- |
| `Schema.Model({…})`            | `z.object({…})` + `zodResolver` |
| `StringType().isRequired(msg)` | `z.string().min(1, msg)`        |
| `.minLength(n, msg)`           | `.min(n, msg)`                  |
| `Form.Group` + `Form.Label`    | `TextField`'s own `label`       |
| `Form.Control name="x"`        | `{...register('x')}`            |
| `errorMessage={…}`             | `error` + `helperText`          |
| `onSubmit={(passed, e) => …}`  | `handleSubmit(values => …)`     |

- **Keep the schema inside the component.** It closes over `t`, so hoisting it
  to module scope freezes the error messages in whatever language loaded first.
- **`register` does not work for the pickers.** `SelectPicker`, `CheckPicker`,
  `TagPicker` and the date pickers are not native inputs, so they need
  `<Controller>` — which is why the picker migration is folded into this pass
  rather than done separately.
- Server-side errors stay separate from validation errors: the field shows
  `errors.x?.message ?? humanizeError(mutationError)`.

### The create/edit view wrappers (16 files)

These used rsuite's `<Form>` purely as a validation wrapper — no `Form.Control`
inside, just a model and a submit handler. They are now a plain `<form>` driven
by `useForm` + `zodResolver`:

```tsx
const schema = z.object({ name: z.string().min(1) });

const { handleSubmit } = useForm({
  resolver: zodResolver(schema),
  // The record lives in component state; this keeps the resolver looking at
  // what is actually on screen.
  values: (goodie ?? {}) as z.input<typeof schema>,
});

<form onSubmit={handleSubmit(() => onSubmit(), invalid => …)}>
```

Three things the translation turns on:

- **The schemas were written by hand, not derived.** An absent key passes an
  rsuite model unless `isRequired`; zod requires every declared key. Getting
  that backwards silently changes what can be submitted, and nothing — not
  tsc, not a test — would have told us.
- **`z.input`, not `z.infer`,** for `values`: `infer` is the _parsed_ shape, so
  a `z.coerce.date()` field makes it demand a `Date` where the record holds a
  string. Where the record really does store ISO strings (events), the schema
  says `z.string()` and compares with `new Date(…)` rather than coercing.
- **An invalid submit now says so.** rsuite blocked silently — you clicked
  Save and watched nothing happen. `handleSubmit`'s second callback raises an
  error snackbar naming the fields.

The generator lives at `tools/rsuite-to-mui/codemods/` as a one-off script in
the job scratch dir; the schema map in it is the record of what each rsuite
model meant.

### The edit panels

`userRoleEditPanel`, `peerEditPanel`, `imageEditPanel`, `teaserListConfigPanel`
and `paymentMethodEditPanel` are done. Same hook wiring as the view wrappers,
plus the fields themselves:

- `RForm.Stack` / `Form.Group` / `Form.Label` were layout — `Stack`, a `div`,
  `FormLabel`.
- **A fixed list that cannot be cleared is `TextField select` + `MenuItem`,
  not `Autocomplete`.** It keeps `value` as the raw key, exactly as rsuite's
  `SelectPicker` did, so the call site needs no `find`. Reach for
  `Autocomplete` when the list is long enough to need searching.
- `TagPicker creatable` → `Autocomplete multiple freeSolo`.
- `Control plaintext` → `TextField` with `slotProps.input.readOnly` and the
  standard variant.
- `NumberInput postfix` → an `endAdornment`.

**Watch which value the model was validating.** `imageEditPanel`'s rsuite
`<Form>` had no `formValue`, so its `link` rule read the _attribution_ link
from the `Control name="link"` inside — not the image block's `linkUrl`, which
is what I wired it to first. Nothing would have caught that: both are strings,
both are URLs, and tsc is happy either way. When a model has no `formValue`,
find the `Control` with the matching `name`.

### Pickers — `SelectPicker` → `Autocomplete`, `DatePicker` → `@mui/x-date-pickers`

`networkContentArticleFilters` is the worked example.

**The trap**: rsuite's `value` is the raw key, MUI's `Autocomplete` value is the
_option object_. Rather than threading `options.find(…)` through every call
site, make the options the keys themselves — then `value` keeps exactly the
shape the surrounding state already holds:

```tsx
<Autocomplete
  options={clients.map(client => client.name)}
  value={filters.clientName || null}
  onChange={(_event, clientName) => updateFilter({ clientName: clientName ?? '' })}
  renderInput={params => <TextField {...params} label={…} />}
/>
```

When the label differs from the key, add `getOptionLabel={id => lookup(id)}`
rather than switching to objects.

| rsuite                     | MUI                                 |
| -------------------------- | ----------------------------------- |
| `data={[{label, value}]}`  | `options` (keys) + `getOptionLabel` |
| `onChange={value => …}`    | `onChange={(event, value) => …}`    |
| `searchable` / `cleanable` | `Autocomplete` defaults             |
| `block`                    | `fullWidth`                         |
| `<InputGroup.Addon>`       | `slotProps.input.startAdornment`    |

Date fields come from `@mui/x-date-pickers` (already a dependency, already used
on the website side). **`main.tsx` now wraps the app in a `LocalizationProvider`
with `AdapterDateFns`** — without an adapter in scope every date field throws.

Testing note: MUI renders a date field as a `role="group"` of day/month/year
spinbuttons, _not_ a textbox, so assert with
`getByRole('group', {name}).toHaveTextContent('04.03.2026')`. Driving the mask
from a test is testing MUI rather than the component.

The date fields are **react-datepicker**, not `@mui/x-date-pickers`.

MUI's range picker is Pro-only, which is why every rsuite `DateRangePicker`
had become a pair of from/to fields. react-datepicker has one, so the pairs
are single fields again — the subscription filters, the list filters and the
mail-send filters each went back to one input. `libs/ui/editor/.../datePicker`
holds the two components (`DatePicker`, `DateRangePicker`) and the Material
styling for the calendar:

- The library ships the layout; `material-calendar.tsx` restyles the surface,
  shape, type scale and every state layer. Its rules are scoped one level
  deeper (`.react-datepicker .react-datepicker__day`) because the stock sheet
  styles the same elements at the same specificity and is injected first —
  unscoped rules lost, and in dark mode that meant light-grey hovers under
  light text.
- The panel is a block box sized by `width: max-content`, with the months as
  inline blocks. A flex row cannot do it: a full-width row needs a percentage,
  and a percentage inside a shrink-to-fit popper resolves against the viewport,
  which blew the panel up to 720px.
- The popper renders through `portalId`, so opening a calendar no longer
  pushes the form down.
- The time half is `customTimeInput` with two MUI selects
  (`time-input.tsx`): the native `input[type=time]` opens a browser drop-down
  that cannot be styled, and react-datepicker's own list is a second column
  that doubles the panel's width.
- The calendar's footer closes the panel through a context
  (`useCloseCalendar`), not a callback handed to a render prop — the latter
  reads the picker's ref during render, which the React compiler rules forbid.

Three things the pickers needed before they stopped looking foreign:

- **A date field is a `PickersTextField`, not a `TextField`,** so it never saw
  `MuiTextField`'s `size: 'small'` default and rendered a size larger than every
  control beside it. The theme now carries `MuiPickersTextField` as well (which
  is why `theme.ts` imports `@mui/x-date-pickers/themeAugmentation`).
- **Shortcuts belong in the picker, not above the field.** rsuite hung them off
  the calendar in `renderExtraFooter`; MUI's slot for exactly that is
  `shortcuts`, reached through `slotProps`. `DateTimePicker` used to render them
  as two rows of joined buttons above the field — taller than the field itself
  — and now passes the same presets as `shortcuts.items`, each `getValue`
  closing over the current selection so a day preset keeps the chosen time and a
  time preset keeps the chosen day.
- **Picker fields are `fullWidth` in filter rows.** A date field's intrinsic
  width is half again a select's, so a wrapping flex row came out ragged with
  the last control past the edge. `DateRangeFilter` fills its container, and
  `subscriptionListFilter` lays its eleven filters out as
  `repeat(auto-fill, minmax(200px, 1fr))` with the from/to pairs spanning two
  columns.

### Merged in from the worktrees

- **`state-multiselect`** — `MultiSelectFilter`, a tag-style `Autocomplete`
  replacing the rows of state toggles on the article/page and comment lists.
  Its worktree held a _stale copy_ of this whole migration, so only its five
  feature files were taken; a 3-way merge against `HEAD` was useless because
  `HEAD` is not the real common ancestor (49 of 54 files "conflicted", all of
  them just my newer work against their older copy). The giveaway: the lines
  only their side had were `<Form.Control>`, `<Column>`, `<HeaderCell>` —
  rsuite markup already removed here.
- **`editor-animated-logo`** — the wordmark's highlight box now slides across
  on hover. Its worktree also sat on three `origin/master` commits (#3126,
  #3128, #3131) which were **not** merged; see "Still to do" below.

Two things the merge needed on top:

- The logo is recoloured for the shell by `svg path[fill='black']` selectors in
  `base.tsx`. The animated version paints through `<use>`, so those selectors
  stopped matching and the wordmark rendered white on white. Widened to
  `svg :is(path, use)[fill=…]`.
- **The highlight geometry comes from tsri.ch's footer**, which runs the same
  animation: the block always spans from the midpoint of the wordmark to one
  outer edge — right at rest, left on hover. tsri insets its artwork from the
  viewBox so the hover block has room; this artwork starts hard against `x=0`,
  so the **viewBox** gains that room on the left (`-7.0728 0 252.0048 43`)
  instead. Without it the block's leaning left edge clips the w.
- **No backticks inside a styled-component template literal** — a CSS comment
  containing `` `use` `` closed the template and broke the parse.

**Chip colours** reuse what the tables already use: publication states take the
`--wep-state-*` tints from `StatusBadge`, comment states take
`mapCommentStateToColor`. `MultiSelectFilterOption.chipSx` carries it.

**No empty state.** The API ORs `draft`/`pending`/`published`, so leaving all
three unset returns everything — an empty control made "none" look like a real
choice when it is only how "all" is spelled. The filter now shows all states
picked by default, and deselecting the last one falls straight back to that.

### `Input` / `InputGroup` -> `TextField`

`codemods/input.mjs` handles both shapes — a bare `<Input/>`, and the
`<InputGroup><Input/><InputGroup.Addon>` sandwich the list filters use, which
becomes a `slotProps.input` adornment on whichever side the addon was written.
52 call sites; the shared JSX surgery now lives in `codemods/jsx-utils.mjs`.

Two bugs it had, both worth knowing before writing the next one:

- **Spread attributes.** `parseAttrs` read `{...props}` as an attribute named
  `props`, so `<Input {...props}/>` came out as `<TextField props/>`. There is
  a `SPREAD` marker now; tsc caught it, but only because `props` happens not to
  be a valid prop.
- **Double-rewriting a handler.** `onChange={event => setColor(event.target.value)}`
  — already event-shaped, from an earlier pass — became
  `event.target.value.target.value`. `rewriteHandler` now leaves a handler alone
  if its parameter is already dereferenced with `.target`.

### `DeferredTextField` removed

Replaced by plain MUI `TextField`s at all 16 call sites (your call). The
character counter rides in `helperText`, and passing the limit now sets `error`
rather than printing a separate warning line.

**Measured cost, so the next person does not have to guess.** The component
existed to keep typing out of the parent's render. Without it, a keystroke in
the article metadata drawer costs **~36ms** (p90 52ms, worst 80ms) against a
0ms floor for the same events on an unlistened input.

Where it goes: 1814 of 1820 DOM mutations over 40 keystrokes land **inside the
drawer** — the metadata panel re-rendering itself, not the block list. Memoising
`<BlockList>` was tried and reverted: the blocks account for 4-6 mutations
either way, so it bought nothing. Roughly a third of the drawer (82 of 285
elements) is still rsuite — form groups, nav items, pickers — so this should
come down on its own as those migrate.

### `Dropdown` -> `ClickMenu` (gone)

`libs/ui/editor/src/lib/popover/click-menu.tsx`, a sibling of `ClickPopover`:
`Menu` rather than `Popover`, so the items keep their roles and arrow-key
navigation. All it adds is the `anchorEl` state MUI expects every call site to
hold — which is what rsuite's `renderToggle` was hiding. 7 call sites; rsuite's
`Dropdown` is gone from the editor.

### `CheckPicker` -> `Autocomplete multiple`

`userCheckPicker` and `authorCheckPicker` are server-searched, which maps onto
`Autocomplete` better than it did onto rsuite:

- `filterOptions={options => options}` — the server already filtered. Leaving
  MUI's default filter in place hides results whose label does not literally
  contain the search term.
- `value` is now the **objects**, not their ids, so the id round-trip through
  `data`/`onChange` disappears entirely.
- rsuite's `renderExtraFooter` (the "create this author" button) becomes
  `noOptionsText` — MUI already has that slot.

**Two testing notes, both of which cost time:**

- **MUI resets an Autocomplete's input whenever the field is not focused.**
  `fireEvent.change` without a preceding `.focus()` reaches `onInputChange`
  and is then thrown away on the next render, so the search term appears and
  vanishes. Focus first.
- An explicit `onClose={() => setFilter('')}` is **redundant and harmful**:
  MUI clears its own input on close, which already drives `onInputChange('')`.

### `Checkbox`, `Placeholder`

`Checkbox` with children becomes `FormControlLabel` + `Checkbox`; bare ones
stay bare. `Placeholder.Graph` becomes `Skeleton`.

### The sidebar — `Sidenav` / `Nav` → `List` + `Collapse`

`libs/ui/editor/src/lib/navigation/sidebar-nav.tsx`: `SidebarNavItem` (a
`ListItemButton` that is a router `Link`) and `SidebarNavMenu` (a header plus a
`Collapse`). 65 call sites in `base.tsx`, rewritten in a pass rather than by
hand. 8 tests.

- **Which section is open stays with the caller.** Only one is open at a time,
  which is what rsuite's `openKeys` + `onOpenChange` did; `onlyLatestOpen` is
  unchanged and still does the deciding.
- A _collapsed_ section containing the current page would otherwise read as
  irrelevant, so `SidebarNavMenu` walks its children for a matching `href` and
  marks itself `data-contains-current`. That mark is a **bold label only** — it
  used to share the active pill with `.Mui-selected`, which lit the section up
  as though the heading itself were the page you were on.
- The footer's three `Nav.Menu renderToggle` entries were popups, not sections
  — those became `ClickMenu`.

**rsuite's `Container` and `Sidebar` were carrying the layout.** `Sidebar`
took its width from a `width={248}` _prop_, and `Container` supplied the flex
row. Dropping them left the sidebar full-width above the content — the markup
was right and every test passed. Both facts now live in CSS. Worth remembering
for the remaining shells: an rsuite layout component may be doing more than it
looks like in the JSX.

### Date ranges — no free MUI equivalent

rsuite's `DateRangePicker` has no counterpart in `@mui/x-date-pickers`; MUI's
lives in the **Pro** (paid) package. `atoms/dateRangeFilter.tsx` is a from/to
pair of ordinary `DatePicker`s that report together, so the filters downstream
still get one patch. If you ever buy Pro, this is the one place to swap.

Specs that render a date field need a `LocalizationProvider` of their own —
the app has one in `main.tsx`, tests do not inherit it.

### `TextField select` — two things that bite

Converting a `SelectPicker` whose placeholder doubles as a "none" option:

- **A `placeholder` is not a `label`.** rsuite showed the placeholder _inside_
  the collapsed field. In MUI the empty `MenuItem` already shows it there, so
  adding it as a `label` prints the same sentence twice — which is what a
  subscription-flow test caught, counting two matches where it wanted one.
- **An empty value renders nothing** unless you pass
  `slotProps={{select: {displayEmpty: true}}}`. Without it the "no mail sent"
  option is invisible until the menu is opened, and the field looks blank.

### Tab bars — `Nav appearance="tabs"` -> `Tabs` + `Tab`

`codemods/nav-tabs.mjs`. rsuite hands `onSelect` the key; MUI hands `onChange`
the event first, so the handler is rewritten the way the input codemods do it.
A `Nav` whose items carry `onClick` rather than `eventKey` is a row of buttons,
not a tab bar, and is left alone — the audience drawer's stat picker became a
`List` instead.

**Destructured aliases hide components from every codemod.** `const { Item } =
Nav` means the markup says `<Item>`, and a codemod looking for `<Nav.Item>`
converts the _bar_ but leaves rsuite items inside it — which renders a blank
page, not a type error. The same trap hid `const { Group, Label, Control } =
Form` in the login screens. `codemods/normalize-aliases.py` rewrites the
aliases back to their dotted names; **run it before any component codemod**,
and grep for `} = Form`/`} = Nav` before assuming a file is done.

**Two `Tab` details:** a `Tab` must be a _direct_ child for `Tabs` to measure
it, so a permission check decides whether to render one rather than wrapping it
in `PermissionControl`; and `icon` needs `iconPosition="start"` to sit beside
the label the way rsuite's did.

### Other loose ends

- **`--rs-*` CSS variables.** rsuite's custom properties (`--rs-text-secondary`,
  `--rs-border-primary`, `--rs-bg-card`, `--rs-radius-md`, …) are still
  referenced from emotion blocks across the editor, and `theme.ts` itself points
  `MuiTableCell`/`MuiCard` at them. They only resolve because rsuite's CSS is
  still loaded. These need swapping for theme tokens
  (`theme.palette.text.secondary`, `theme.shape.borderRadius`, …) before the
  rsuite stylesheet can be dropped, otherwise colours silently fall back to
  nothing. `grep -rn 'var(--rs-' libs apps` to find them.
- **`rsuite/esm/...` deep imports.** A few files import types from
  `rsuite/esm/internals/types` and `rsuite/esm/Table` (`RowDataType`,
  `BasicSize`, `Color`, `Option`). They go away with their components.
- **`rsuite-table`** is gone: all 41 list views now use `DataTable`.

## Gotchas from this pass

- **`tsc`'s output is ANSI-coloured.** `tsc … | grep -c 'error TS'` reports
  **zero even when the build is broken**, because the word `error` is wrapped
  in escape codes. Check the **exit code**, or pipe through
  `sed -e 's/\x1b\[[0-9;]*m//g'` first. This nearly let a batch of
  "Cannot find name 'TextField'" errors through.
- **`codemods/form-control.mjs` does not add the `TextField` import.** Run
  `codemods/add-mui-import.mjs TextField -- <files>` straight afterwards.
- **Shorthand object properties.** `onChange={code => f({code})}` must become
  `f({code: event.target.value})`, not `f({event.target.value})`. The codemod
  expands shorthand before substituting and skips object _keys_; if you write
  another handler rewriter, do the same.
- **A `Form.Group` whose body is a conditional is not one field.** The
  crowdfunding form picked between a `Form.Control` and a `CurrencyInput`
  depending on the goal type; folding that into one `TextField` quietly
  dropped the cents-to-francs conversion. **`tsc` saw nothing** — the test did.
  `form-control.mjs` now refuses groups containing a `?` or `&&` in the body.
- **`lint --fix` one project at a time.** A workspace-wide `--fix` reformats
  unrelated files, including stripping `/* eslint-disable */` from generated
  code.
- **`git stash push <path>` on an untracked file fails**, and a `;`-chained
  `git stash pop` will then pop somebody _else's_ stash. Use `&&`, or recover
  with `git fsck --unreachable` + `git stash store`.

## Re-running the migration

`tools/rsuite-to-mui/` holds every codemod plus `run.sh`, which re-applies the
whole pipeline to a file list. Use it to recover from merge conflicts instead
of hand-merging JSX — the README there has the recipe and the rules that each
codemod had to learn the hard way.

## Gotchas worth knowing before the next pass

- **Never run `nx affected -t lint --fix` on this repo.** It reformats imports
  across every project in the affected graph, including untouched website apps
  and at least one generated file (`libs/website/api/src/lib/gql/index.ts`,
  whose `/* eslint-disable */` header it strips). Lint one project at a time:
  `nx lint <project> --fix`.
- **Scope every codemod by import source, not by tag name.** `<Button>` means
  rsuite in `libs/*/editor` and MUI in `libs/*/website`. An early pass keyed on
  the tag alone and quietly restyled 51 website files.
- **Icons stay on `react-icons`.** No `@mui/icons-material` was introduced and
  none should be.
- **i18n lint catches mis-nested JSX.** `disallow literal string` fired on
  expressions that had lost their braces and would have rendered as visible
  source text. Worth running `nx lint` after any JSX codemod — `tsc` does not
  catch it.

## The table decision: TanStack Table

`@tanstack/react-table` (**v8**) and `@tanstack/react-virtual` are installed,
and `DataTable` is built on them rather than on MUI X DataGrid.

> npm installed v9 first. v9 replaces `useReactTable`/`getCoreRowModel` with a
> feature-composition API (`useTable` + `tableFeatures({...})`) and already
> carries deprecation notes on parts of its own surface, so this is pinned to
> the stable v8 line — which is also what every TanStack/MUI integration
> example out there uses.

**Why TanStack rather than DataGrid**

- **The repo already has the pieces TanStack owns.** `listView/` hand-rolls
  column definitions (`list-columns.tsx`), column visibility
  (`use-column-config.ts`, `column-configurator.tsx`), width fitting
  (`fit-column-widths.ts`) and sort/page state (`use-list-view-state.ts`).
  Those are exactly TanStack's column defs, `columnVisibility`,
  `columnSizing` and `sorting`/`pagination` state. The migration mostly
  _deletes_ code rather than adding a new concept.
- **The lists are server-paginated.** `paginated-query-container.tsx` already
  drives Apollo with page/limit/sort. TanStack's `manualPagination` and
  `manualSorting` model that directly; DataGrid's server-side mode fights it.
- **No licence question.** DataGrid's column resizing and several other
  features used here sit behind the Pro tier. TanStack is MIT and headless.
- **Rendering stays MUI.** TanStack produces no markup, so the rows are plain
  MUI `Table`/`TableRow`/`TableCell` and inherit the editor theme, dark mode
  and the existing cell components for free.
- **Virtualisation only where it earns its place.** Most lists are paginated to
  10–100 rows, so plain rows are fine. `@tanstack/react-virtual` is there for
  the article list, which uses `fillHeight` over 1590 rows.

**Suggested order**

1. Rewrite `listView/list-view.tsx` and `list-columns.tsx` over
   `useReactTable` + MUI `Table`, keeping the exported names
   (`Table`, `PaddedCell`, `IconButtonCell`, `renderListColumns`) so the ~54
   list views do not change at all in the first step.
2. Fold `fit-column-widths.ts` into TanStack's `columnSizing` and delete it.
3. Move `use-column-config.ts` onto `columnVisibility`.
4. Only then simplify the individual list views.

## After the migration — 2026-10-10/11

The branch kept moving once rsuite was gone. These are the decisions taken
since, in the same spirit: use the library the way it is meant to be used.

### React Compiler is on, for `apps/editor` only

`babel-plugin-react-compiler` runs in `apps/editor/vite.config.ts`. It was
turned on to fix a measured problem: showing or hiding a column on the article
list blocked for **~500 ms** at 100 rows, because the list hands `DataTable` a
freshly built `columns` array every render, which rebuilt TanStack's column
model and with it every cell. The compiler memoises that array, and the toggle
now costs **~65 ms**. `DataTable` also hides columns with a CSS rule rather
than removing them from the column model, so the rows are not rebuilt at all.

Two consequences worth knowing:

- **A `!` non-null assertion inside a handler can crash the page.** The
  compiler reads values out of handlers to decide what to memoise, so
  `articleToImport!.articleId` in an `onClick` dereferenced `undefined` during
  render and blanked `/articles/peer`. Guard instead of asserting. There is a
  `gotchas.md` entry.
- **`RouteErrorBoundary`** now wraps the routes (`apps/editor/src/app/app.tsx`).
  Without it React unmounts the whole tree and Sentry swallows the message —
  a blank page and an empty console, which is what made that bug expensive.

### The theme carries both colour schemes

`createEditorTheme()` takes no arguments any more. It builds one theme with
`cssVariables` and `colorSchemes`, and the light/dark switch sets
`data-mui-color-scheme` on the root instead of handing React a new theme — the
old version re-rendered every component in the editor on every toggle.
`useColorMode` is now a thin wrapper over MUI's `useColorScheme`.

**In Emotion read `theme.vars.palette.*`, never `theme.palette.*`** — the
latter holds the light scheme's literals and will never change. There is no
`theme.palette.mode` to branch on: write the light rule and override it under
`[data-mui-color-scheme='dark'] &`, or use `theme.applyStyles('dark', {…})`.
`theme.palette` is still correct where code runs `lighten()`/alpha maths on a
real colour. Full rules in `.claude/docs/code-style.md`.

### Compiler lint rules are scoped to the editor

Upgrading `eslint-plugin-react-hooks` to v7 brings the compiler's own
diagnostics, and nx's React preset applies them to all 52 React projects — but
the compiler only runs on the editor. `reactCompilerRules(level)` in the root
`eslint.config.mjs` is the one switch: off at the root, `'error'` in the nine
editor projects' configs, explicitly off again in the six website projects
whose own configs re-enable it through `flat/react`. `incompatible-library`
stays advisory everywhere — it reports a skipped optimisation, not a defect.

Clearing those rules removed ~130 real findings. The recurring one was state
copied out of a query by an effect; most became a plain derived value, and the
rest `useSeededState` (`libs/ui/editor/src/lib/hooks/use-seeded-state.ts`),
which does the same comparison during render.

### Edit panels: the form _is_ the record

`useForm` fetches what it edits through `defaultValues` as an async callback,
rather than a `useQuery` whose result is copied into a parallel set of
`useState`s. `paymentMethodEditPanel.tsx` is the worked example and is pinned
by its spec; converting it also fixed a Save button that called the mutation
from `onClick` _and_ submitted the form, so validation never got a say.

The create/edit view pairs follow one shape:

- **The schema lives with the form component and describes the whole record**,
  not only the validated fields, so `z.infer<typeof schema>` _is_ the form's
  type and the two cannot drift. `eventForm.tsx` exports `eventSchema` and
  `EventFormValues`; both the create and the edit view import them.
- **The view owns the `useForm` and passes it down with `FormProvider`.** The
  `*Form` component reads it with `useFormContext` — no `record`/`onChange`
  props, no component state holding a copy.
- **Every field is a `Controller` that renders its own error** as
  `helperText`. The old views announced `Object.keys(invalid).join(', ')` in a
  toast, which named fields without pointing at them.
- **`handleSubmit` hands the validated values to the mutation.** Nothing reads
  state to build the variables; what the resolver accepted is what is sent.
- **A view renders nothing until `formState.isLoading` clears**, because an
  async `defaultValues` has not resolved before then — every field would be
  fed `undefined`, and the ones holding a list (`ListInput`, `SelectTags`, a
  multi `Autocomplete`) throw on it rather than render empty. Drawer panels do
  the same for their `DrawerBody` and keep the header and buttons.
- **Reads of a field use `useWatch`, never a bare `watch('x')`.** See the
  compiler entry in [gotchas.md](.claude/docs/gotchas.md): a `watch()` call is
  memoised against the stable `watch` identity, so it is read once and never
  again. Where a hook cannot be called — inside a `map`, or for a dynamic
  name — subscribe to the parent object once (`useWatch({control})`) and index
  into it.
- **Validation messages are translated**, so the schema is a factory taking
  `t`: `createBannerSchema(t)`, `createMemberPlanSchema(t)`. The plain `z
.string().min(1)` default reads "String must contain at least 1
  character(s)" on screen.
- **A dialog's confirming action is the last child of `DialogActions`.** MUI
  lays them out left to right, so the last one sits bottom-right, which is
  where Material puts the confirm — 40 dialogs had it the other way round
  (rsuite's `Modal.Footer` examples put the primary first). The dismissive
  action keeps `variant="text"`, the confirm is `variant="contained"` (ten of
  them were `outlined`), and a destructive confirm carries `color="error"`.
- **One destination reads as current, and its section opens itself.** Items
  matched the path by prefix on their own, so `/comments` and
  `/comments/rating` both lit up on the ratings page. `SidebarNav` wraps the
  sidebar, collects every `href` below it and picks the longest match, so a
  detail route like `/comments/edit/abc` still belongs to its list while a
  sibling sub-page wins over the list it sits under. A section holding the
  current page opens itself until the reader opens one of their own —
  `onToggle` receives what the section _was_ showing, because a section that
  opened itself is not in the caller's `openMenus` and the first click would
  otherwise re-open it.
- **A state dropdown is one button.** `CommentStateDropdown` was a
  `ButtonGroup` holding a button that showed the state and did nothing beside
  an icon button carrying the same caret — two carets, one of them dead. It is
  now a single `ClickMenu` trigger. `ClickMenu` rather than `ClickPopover`:
  the popover pads its paper for free-form content, which left the menu items
  inset inside a second box.
- **A form group spaces its own fields.** The theme leaves form controls with
  no margin, and the `<Stack sx={{ width: '100%' }}>` the codemod produced for
  rsuite's `<Form fluid>` has no gap either, so fields sat flush and floating
  labels landed on the border above — 41 groups across the editor. They now
  carry `spacing={3}`, the two form codemods emit it, and the 63 child
  `marginBottom: 3` hacks that doubled the gap are gone.
- **Nothing wraps the rich-text editor.** `RichtextEditor` already renders an
  outlined `Paper`, so a `Card` or a bordered box around it is a box inside a
  box — visible in the poll editor, where the framed "Info text" card sat next
  to an unframed answers card. Where the editor is a card's only content, the
  card goes and a `FormLabel` takes the `CardHeader`'s place.
- **A single column of fields gets no cards.** `FormFields` (one grid, one
  gap) and `FormSectionTitle` live with the drawer chrome in
  `libs/ui/editor/src/lib/drawer`; a `CardHeader` becomes a heading and the
  fields sit directly on the panel. Every drawer panel is one column, so all
  of them lost their card stack — `author` alone shed six. Cards stay where a
  layout is genuinely multi-column: `banner`, `crowdfunding`, `memberplan`,
  `poll`, `subscription`, `user`, `settings`.
- **The multi-column screens were laid out again, not just de-rsuited.**
  `user`, `subscription` and `memberplan` had kept rsuite's scaffolding —
  nested `CardContent`, a `RowPaddingTop` spacer per row, a `Divider` with
  text standing in for a heading. Each card is now `CardContent > FormFields`
  with the pairs that belong together side by side (user/plan,
  periodicity/amount, start/paid-until; the address fields split into their
  own card), `FormSectionTitle` where a divider used to label a group, and
  the subscription's "Renew now" in `CardActions` rather than in the field
  flow. On the member plan the trial button stays at the top of the card,
  since it is a preset for the two fields underneath it.
- **One component for every page title.** List views each wrote their own
  `<h2>` inside `ListViewHeader` and `SingleViewTitle` styled an `h1` at
  rsuite's display size (36px), so an edit view shouted next to the list it
  came from. `PageTitle` (`libs/ui/editor/src/lib/atoms/pageTitle.tsx`) is a
  `Typography variant="h2" component="h2"`, used by all 44 list headers and by
  `SingleViewTitle`; pinned by `pageTitle.spec.tsx` and
  `singleViewTitle.spec.tsx`.
- `DateTimePicker` grew a `helperText` prop so date fields can show theirs.
- **One component for every picked image.** `ChooseEditImage`
  (`libs/ui/editor/src/lib/atoms/chooseEditImage.tsx`) was a `Card` wrapping a
  `CardContent` wrapping a `PlaceholderInput` whose affordance was a 24px `+`,
  and the picked image carried a menu button in its corner. It is now one box
  of a fixed height in both states: empty, the whole box is a dashed button;
  picked, the image is _contained_ in the box over a blurred copy of itself,
  so a portrait and a landscape both fill it, with choose / edit / remove as
  icon buttons on a scrim. `imageBlock` and `imageGalleryBlock` use it too, so
  a picture in an article looks like a picture in a panel; pinned by
  `chooseEditImage.spec.tsx` and `imageBlock.spec.tsx`.
- **The focal point box lost three nested `CardContent`s.** They inset the
  image inside the box the marker is positioned against, so the point the
  editor picked was not the point the image showed.
- **Form panels use `DrawerForm`.** A plain `<form>` between the drawer's
  paper and `DrawerBody` breaks the flex chain: the body grew to its content,
  the paper itself scrolled and the save button went with it.

Converted: `paymentMethod`, `event`, `goodie`, `discountCode`, `paywall`,
`consent`, `user-consent`, `banner`, `crowdfunding`, `memberplan`, `poll`,
`subscription`, `user`, `settings`, and the drawer panels `author`,
`peerProfile`, `peer`, `image`, `userRole`, `teaserListConfig` — every
`useForm` in the editor that used to take `values:`.

Three of them are worth a note of their own:

- **`memberplan`** was one record threaded through three files by
  `setMemberPlan`. The schema, the pruning of prices whose periodicity is no
  longer offered, and the derivation of a missing price moved into
  `memberplan-schema.ts` as pure functions, so the pricing panel no longer
  writes derived prices back from an effect — it derives them for display and
  the same function runs again on save.
- **`settings`** has no fields of its own: `dirtyFields` is what the user
  changed and `formState.defaultValues` is what the server sent, which is
  exactly what the confirmation dialog lists. Cancel is `reset()`.
- **`subscription`** keeps the fetched user, plan and payment method as
  objects in the form rather than ids, because the fields render from them.

### Other fixes worth noting

- **`margin: 'dense'` does not suit this editor.** MUI's dense preset puts an
  asymmetric 8px/4px margin on every form control; the editor's forms and
  filter rows space themselves with `gap`, so rows grew 40px → 52px and
  controls sat 8px below their row-mates. `MuiFormControl` is `margin: 'none'`
  and the other three entries are left out entirely (they only accept
  `'dense'`). Density comes from `size: 'small'`.
- **Drawer papers are a flex column in the theme** (`MuiDrawer.styleOverrides
.paper`). Each drawer used to declare it itself, and the ones that forgot
  scrolled their header away with the content — 42 call sites de-duplicated.
- **A link wrapping a button becomes `component={RouterLink}`**, not an anchor
  around a button. `tools/rsuite-to-mui/codemods/router-link.mjs` does it and
  is re-runnable; 46 call sites converted.
- **Three rsuite icon imports survived** in `paywallForm.tsx` and
  `teaser-slots-autofill-controls.tsx` and only broke once a real
  `npm install` dropped `@rsuite/icons` from disk — see question 5 below,
  which is now resolved.

### The sidebar, matched to prod — 2026-10-13/14

The MUI sidebar had drifted from the rsuite one still running on
`editor-demo.wepublish.works`. Measured against it and brought back:

- **Density.** Parent rows 36px, child rows 30px (prod: 37 / 30.4), 2px
  between rows. `ListItemText` carries a 4px margin sized for two-line list
  items — `my: 0` is what makes a row as tall as its label.
- **Muted ink.** Nav rows take `--wep-nav-text` rather than MUI's full-strength
  `text.primary`, icons inherit it (`.MuiListItemIcon-root { color: inherit }`),
  and hover lifts to the new `--wep-nav-hover-text` (`#121212` light, `#fff`
  dark) on the existing hover wash. Prod does exactly this.
- **The submenu rule.** `margin-left: 16px`, `padding: 6px 0 6px 10px`, and a
  1px left border — prod's `.rs-dropdown-menu` geometry, down to the colour.
- **One arrow that turns.** `MdChevronRight` rotated 90° on open, rather than
  swapping `MdExpandMore`/`MdExpandLess`. The `Collapse` height animation was
  always there; the arrow had no motion of its own.

**Do not make the nav list a flex column to get the row gaps.** The `Collapse`
between the sections ends up a flex item with no height and its children
overlap the rows below. Margins on the rows, not `gap` on the list.

### Light finally got its own surfaces

`background.default` and `.paper` were both MUI's white in the light scheme,
so a card was visible only by its border while dark had two distinct shades.
Light is now `#f3f4f7` / `#ffffff`.

`--wep-shell-bg` and `--wep-content-bg` are **gone**: they duplicated those two
palette values in a second place that could drift. Everything that painted the
shell or the content pane reads `theme.vars.palette.background.default` /
`.paper` directly. `--wep-shell-border` and the row/state tints stay — they
have no palette equivalent.

### Permission ids come from `@wepublish/permissions`

`createCheckedPermissionComponent`, `useAuthorisation` and `useHasPermission`
all take ids, and every call site imports the `Permission` and passes its
`.id` — never a `'CAN_…'` literal, which no rename would ever catch. Two
stragglers fixed: `atoms/user/userSubscriptionsList.tsx` and
`membership/editor/.../periodic-job-logs.tsx`. The only `CAN_*` strings left in
`.ts`/`.tsx` outside `libs/permissions` are session fixtures inside specs.

### The design pass — 2026-10-13/14

Everything below came after the migration proper: the editor worked, and these
are the rounds that made it look like one product.

**Controls say what they do.** A switch means the change already happened; a
checkbox means it happens on save. The settings page, the user's _Active_
flag and the comment list's state picker are checkboxes for that reason, and
`editor-conventions.mjs` reports the seven switches still sitting on forms
that save (the author, payment-method and user edit panels, and the Mailchimp
integration form). Consecutive checkboxes live in a `FormGroup` so a row of related options
reads as one list rather than as fields 24px apart.

**Every list table carries its own controls.** `storageKey` turns on the column
menu; `filters` + `filterCount` + `onResetFilters` fold the filter bar away
behind a button with the count on it and a × beside it. Both live in a strip on
the table's top-left, which is also why the page titles are clean again. The
filter panel opens on the button alone — a list that arrives filtered says so
with the count.

The exceptions are worth knowing: the pickers inside drawers (event, poll,
comment, crowdfunding) get neither, because a three-column picker has nothing
worth hiding; and the image library's search sits on the _page_, not the
table, because its grid layout has no toolbar.

**Images.** `ChooseEditImage` is one box at a fixed height in both states:
empty it is a dashed button, filled it contains the image — never cropped —
over a blurred copy of itself, with choose/edit/remove on a scrim. Dropping a
file on the empty box opens the upload step on it, exactly as dropping one into
the Choose Image drawer does. `compressImageForUpload` in `utility.ts` is the
one place that decides whether a file is resized before upload.

**Date ranges are a real range again.** react-datepicker replaced the MUI
pickers; the ranges worth one click (last week … next year) sit in the
calendar's footer rather than as chips above the field. The picker holds the
half-picked state itself: a caller that only stores whole ranges would throw
the first of the two clicks away, which made picking over an existing range
impossible.

**Flex columns shrink what they contain.** Three separate bugs, one cause: the
filter panel squashed to 78px of its 116px, the audience table's 800px scroll
area reduced to 173px, and a list item's fields sized to their content inside a
full-width row. `flex-shrink: 0` on the first two, `flex: 1 1 auto` on the
third.

**One colour picker, and it suggests the theme.** The editor had two: a native
`type="color"` swatch in `atoms/colorPicker.tsx` and the `@uiw/react-color`
`Sketch` popup written for the website theme page. The `Sketch` one won and
moved into the atom, so tags, peer profiles and the website palette all open
the same control; the props are the shape react-hook-form hands a field
(`{...field}` plus `label`, `helperText`, `error`, `disabled`).

Two things it needed on the way:

- **The popup is anchored to the swatch at click time.** Reading a ref during
  the first render hands `Popper` a null anchor and the palette lands wherever
  it was last measured.
- **Dark mode is two sets of CSS variables.** `Sketch`'s own
  (`--sketch-background` and friends) go through its `style` prop, but the hex
  and RGBA fields declare `--editable-input-*` inline on themselves, so those
  take a rule with `!important` to shift — see the `Palette` wrapper.

`presetColors` fills the swatch row, and the tag form fills it from the
tenant's website palette via `useWebsiteThemeColors` — brand first, then the
shades, signals and surfaces, deduped. `undefined` rather than `[]` when a
tenant has no theme, because an empty list removes the row entirely.

**Two panels that were really one.** The user's mail log and the form that
sends the next mail are one card; the audience dashboard's controls and its
series toggles are one panel, which also removed the dead column beside the
shorter half.

### The metadata panels, the autosave switch and the lists — 2026-10-14/15

**Autosave is the editor's, not the article's.** The article and page editors
carry a switch in the header (`useAutosaveEnabled`, stored under
`wepublish:editor:autosave`), so the preference follows the person to the next
document rather than being set per article. It sits in `EditorHeader`'s
`statusAction` slot, which puts it at the end of the status row: beside the
save state on a wide screen, top-right above the buttons once the action row
wraps. A switch is right here precisely because it takes effect immediately —
everything else on those forms is a checkbox.

**The metadata panels are grouped by what a newsroom does with them.** Both
`articleMetadataPanel` and `pageMetadataPanel` were one flat stack of controls
that opened, in the article's case, on the character count and the like
counter. They now read Headline (pre-title, title, lead, image) → Search engine
(SEO title, SEO description, slug, canonical URL) → Byline → Publication →
Stats, built from the drawer's own `FormFields` and `FormSectionTitle`. The
social tab leads with the image and says what each field falls back to; the
fallback chain is not invented, it is what `article-seo.tsx` resolves
(`socialMediaTitle || seoTitle || title`, and so on down the description and
image). The page panel also stopped wrapping its tabs in a `Card` — a card
inside a drawer body is a box drawn inside a box, and it made the two panels
look like different features.

**Query errors are reported once, centrally.** `queryErrorLink` sits at the
head of the Apollo chain and hands any **query** failure to whatever
`setQueryErrorHandler` was given; `useReportQueryErrors()` in `ui/editor`
registers the humanised snackbar and `App` calls it. Mutations keep their own
`onError`. That removed 21 hand-written `useEffect(() => { if (error) …})`
blocks, 14 `useShowErrors()` calls and the helper itself.

**Lists remember how you arranged them.** `storageKey` already drove column
visibility; the same record now holds the order, so the Columns menu is a
drag-to-sort list and the stored shape became `{hidden, order}` (a bare array
still reads as the old hidden-only value). Every column the user may move is in
that menu, including the always-visible ones — position and visibility are
separate questions — and "Reset columns" puts both back.

**`UserSearch` never searched.** `setUserSearch` had no caller, so the field
pulled the first 100 users once and filtered them in the browser. It queries
the server now, and two things had to go with it: `disabled={loading || …}`,
which killed the field on every keystroke, and a `value` derived from the
options array, whose identity changed with each result and made MUI reset the
input. The query is skipped while the popup is closed, so filling the field no
longer triggers a second load.

**Braces are back and enforced.** Every `if` in the editor packages has a
block, and `curly: ['error', 'all']` is in each editor project's ESLint config
so it stays that way.

### Codemods for what came after

`run.sh` ends with two steps that belong to this pass rather than to rsuite:

- **`drawer-form.mjs`** rewrites a panel's own `styled.form` with
  `height: 100%` to the shared `DrawerForm`. The height does not repair what
  the extra element breaks: the drawer's paper is the flex column that makes
  `DrawerBody` scroll, so the body grew to its content, the paper scrolled
  instead, and the save button scrolled away with the fields. Six panels
  shipped that way.
- **`editor-conventions.mjs`** reports, and never rewrites, four things a
  script cannot decide: a `DataTable` without a `storageKey` (only a person can
  name one), a `Switch` on a form that saves, `theme.palette.…` where
  `theme.vars.palette.…` is meant, and a panel `<form>` that is not
  `DrawerForm`.

Run them over the whole editor with:

```bash
node tools/rsuite-to-mui/codemods/editor-conventions.mjs \
  $(git ls-files 'libs/ui/editor/src/**/*.tsx' 'apps/editor/src/**/*.tsx' \
    'libs/*/editor/src/**/*.tsx')
```

## Questions for you

1. **Default button look.** See decision 2 — `outlined` everywhere is a safe
   like-for-like, but a lot of editor toolbars might read better as `text`.
   Happy to flip the default in the theme.
2. **24-column grid.** Converting `Grid`/`Row`/`Col` means re-deciding every
   span. Worth doing as its own pass with a visual check rather than folded into
   another change.
