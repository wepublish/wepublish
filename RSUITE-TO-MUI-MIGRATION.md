# rsuite → MUI migration

Working notes for the `f/replace-rsuite` branch: what has been migrated, the
decisions taken along the way, and what is still open.

## Status

| | |
| --- | --- |
| Files importing rsuite at the start | 253 |
| Files importing rsuite now | 165 |
| Components fully off rsuite | `Message`, `toaster`, `Notification`, `Button`, `IconButton`, `ButtonGroup`, `ButtonToolbar`, `Modal`, `Drawer`, `Stack`, `Divider`, `Loader`, `Tag`, `Avatar`, `Badge`, `Progress`, `Toggle`, `Radio`, `RadioGroup`, `Grid`/`Row`/`Col`, `Whisper`, `Tooltip`, `Pagination` |
| Partly migrated | `Table` (11 of 41 list views on the new `DataTable`, including `articleList` and `pageList`), `Popover` |
| Editor typecheck | clean (`nx typecheck editor`) |

Everything below was verified with `nx typecheck editor` and
`nx affected -t test lint --uncommitted`, and spot-checked in the running
editor at `localhost:3000` (login, dashboard, article list).

## Done

### Notifications — `toaster` + `Message` → `enqueueSnackbar` + MUI `Snackbar`

New module: `libs/ui/editor/src/lib/snackbar/`, exported from
`@wepublish/ui/editor`.

```ts
enqueueSnackbar(message, { variant, title, autoHideDuration, key })
closeSnackbar(key?)   // no key closes all
<SnackbarHost maxSnack={3} anchorOrigin={…} />   // mounted once in app.tsx
```

* Each entry renders as its own MUI `<Snackbar>` inside a fixed flex container,
  so MUI owns the auto-hide timer, pause-on-hover and clickaway handling rather
  than a hand-rolled timer. `position: static` on the Snackbar lets them stack
  instead of overlapping.
* Covered by `snackbar.spec.tsx` (8 tests, written before the implementation).
* **225 call sites** converted by codemod:
  `toaster.push(<Message type="error" duration={8000}>x</Message>)`
  → `enqueueSnackbar(x, {variant: 'error', autoHideDuration: 8000})`.
* `<Message>` used *inline* (not as a toast) became MUI `<Alert>`; `header=`
  became `<AlertTitle>`.

### `Button` → MUI `Button` (105 files)

| rsuite | MUI |
| --- | --- |
| `appearance="primary"` | `variant="contained"` |
| `appearance="ghost"` / `"default"` | `variant="outlined"` |
| `appearance="subtle"` / `"link"` | `variant="text"` |
| no `appearance` | `variant="outlined"` |
| `size="xs"\|"sm"` → `"small"`, `"md"` → `"medium"`, `"lg"` → `"large"` | |
| `color="red"\|"green"\|"blue"\|"yellow"\|"orange"\|"cyan"\|"violet"` | `error\|success\|primary\|warning\|warning\|info\|secondary` |
| `block` | `fullWidth` |
| `active`, `ripple` | dropped (no MUI equivalent) |
| `as={Link}` | `component={Link}` |

### `IconButton` → MUI `IconButton` / `Button` (174 call sites)

rsuite's `IconButton` is one component for two different things, so it splits:

* `<IconButton icon={<X/>} />` (no children) → `<IconButton><X/></IconButton>`
* `<IconButton icon={<X/>}>Label</IconButton>` → `<Button startIcon={<X/>}>Label</Button>`
* `circle` dropped — MUI's `IconButton` is already circular.

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

* `Drawer.Header`/`Title`/`Actions`/`Body`/`Footer` map onto those.
* `size="sm"` etc. become `slotProps={{ paper: { sx: { width: … } } }}`.
* The paper is a flex column so `DrawerBody` (`flex: 1; overflow-y: auto`)
  scrolls while the header stays put.
* `placement` -> `anchor`.
* Covered by `drawer.spec.tsx` (3 tests, written first).

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

| rsuite | MUI | Notes |
| --- | --- | --- |
| `Loader` | `CircularProgress` | `center`/`content` become a flex `Box`; named sizes become pixels |
| `Divider` | `Divider` | direct |
| `Stack` | `Stack` | **`spacing` is pixels in rsuite, theme units in MUI** — `spacing={8}` becomes `spacing={1}`. rsuite also defaults to `direction="row"`, MUI to `column`, so every converted Stack gets an explicit `direction`. MUI v9's Stack takes `alignItems`/`justifyContent`/`flexWrap` through `sx` only. `Stack.Item` becomes `Box`. |
| `ButtonToolbar` | `Stack direction="row"` | no MUI equivalent |
| `ButtonGroup` | `ButtonGroup` | `justified` -> `fullWidth` |
| `Tag` | `Chip` | takes `label`, not children; the `STATE_COLORS`/`actionColors` maps now hold MUI palette names |
| `Avatar` | `Avatar` | already circular; named sizes become `sx` width/height |
| `Progress.Line` | `LinearProgress` | draws only the bar, so the percentage label is rendered alongside it |
| `Badge` | `Badge` | `content` -> `badgeContent`; the `.unsaved`/`.saved` CSS trick becomes `variant="dot" invisible={…}` (the dead CSS is gone from `app.tsx`) |

### `Grid`/`Row`/`Col` -> MUI `Grid`

**rsuite lays out on 24 columns, MUI v9 on 12**, so every span is halved —
`<Col xs={24}>` becomes `<Grid size={{ xs: 12 }}>`. Spans that do not halve
evenly (`xs={5}`) are rounded up and reported by the codemod; there were 14 and
they are worth a visual check. `fluid` disappears (MUI containers are already
full width) and `align`/`justify` move into `sx`.

### `Whisper` -> `Tooltip` / `ClickPopover`

* Hover/focus Whispers whose speaker is a `<Tooltip>` became MUI `Tooltip`s —
  MUI opens on hover *and* keyboard focus, so rsuite's explicit `trigger` list
  has no counterpart. Placements are hyphenated (`bottomEnd` -> `bottom-end`).
* Click-triggered Whispers open a popover, which MUI models as controlled
  `open`/`anchorEl`/`onClose` state. `libs/ui/editor/src/lib/popover/`
  holds a `ClickPopover` that owns that state, so the 14 call sites stay one
  element each. Its children may be a render function receiving a `close`
  callback, which is how the "add a day" confirm popover closes itself.
* `IconButtonTooltip` and `InfoTooltip` — the two shared wrappers used all over
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
`data-table.spec.tsx` (10 tests).

```tsx
<DataTable
  data={rows}
  loading={loading}
  columns={[
    { id: 'title', label: t('title'), width: 300, render: row => … },
  ]}
/>
```

* `width` is a *minimum* unless the column sets `fixed`, so columns share the
  spare width instead of leaving a gap — rsuite expressed that with `flexGrow`.
* Sorting and paging stay with the caller: the lists sort and page on the
  server, so `DataTable` only reports what the user clicked
  (`sortable`, `sortColumn`, `sortOrder`, `onSort`).
* **A sortable column's `sortKey` is the field the server sorts by**, which is
  not always the column id — `publicationDate` sorts by `publishedAt`. rsuite
  carried this as `dataKey`; passing the column id instead silently sends an
  invalid sort field to the API.
* An empty table falls back to a translated `listView.table.empty`.

**11 of 41 list views are converted**, including `articleList` and `pageList`
(the `renderListColumns` group). The rest keep rsuite's `<Table>` for now — see
"Finishing the tables" below.

### Rewritten rather than mapped

Where rsuite's API had no honest MUI equivalent, the component was rebuilt the
way MUI intends rather than shimmed:

* **View/device switchers** — `ButtonGroup` + `active`/`appearance` toggling in
  `imageList`, `previewFrame` and `mail-preview` became
  `ToggleButtonGroup`/`ToggleButton`, which is what that control actually is.
* **`InfoMessage`** (`atoms/infoMessage.tsx`) — was a `styled.div` with a
  hard-coded background per state. Now an `<Alert variant="outlined">`; the
  `InfoColor` enum values are MUI severities, so call sites
  (`messageType={InfoColor.warning}`) read unchanged but the colours come from
  the theme and follow dark mode.
* **`EditorHeaderButton`** (`atoms/editorHeader.tsx`) — now a MUI `Button` with
  `startIcon` and a `label`/`collapse` API. The container queries that hid the
  label target `button[data-collapse]` and `.MuiButton-startIcon` instead of
  `.rs-btn`.
* **`CreateCommentBtn`** — props are MUI's (`size`, `color`, `variant`) instead
  of rsuite's (`circle`, `appearance`, `BasicSize`, `Color`).
* **`mapCommentStateToColor`** returns `'success' | 'warning' | 'error'`
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
10. **Drawer chrome is shared, forms are not.** MUI's `Drawer` has no header or
   body parts, and MUI's own examples define a `DrawerHeader` styled element.
   Rather than repeat that flex CSS in 28 panels, it lives in
   `libs/ui/editor/src/lib/drawer/`. This is layout only — no logic, no props
   beyond what the underlying element takes.
11. **Codemods are checked in.** `tools/rsuite-to-mui/` holds every script plus
   a `run.sh` that re-applies the pipeline, so a merge conflict can be resolved
   by taking the rsuite side and re-running rather than hand-merging JSX. See
   its README.
13. **Specs now mount a `ThemeProvider`.** The migrated components are MUI
   components, and the shared atoms style themselves from the theme through
   emotion — which hands a styled component `{}` when no provider is mounted,
   so `theme.palette.…` throws. The app always has a provider; the specs now
   match (`codemods/spec-theme.mjs`).
15. **Pickers are deferred into the Form pass.** `SelectPicker` & co. key their
   `value` by the option's raw key while MUI's `Autocomplete` value *is* the
   option object, so every site needs a lookup in and a `.value` out. Nearly
   all of them also build `data` inline from a query result, which would be
   evaluated twice per render if the conversion were mechanical, and most sit
   inside a `Form.Control` that the Form pass rewrites anyway. Converting them
   twice is more churn than doing it once alongside the form.
   `codemods/picker.mjs` exists and handles the simple shape, but it
   deliberately refuses anything with an inline `data` expression.
16. **`block` is still on rsuite pickers.** It is a rsuite prop that MUI buttons
   do not understand, so it was removed from buttons only. The ~87 occurrences
   on `SelectPicker`/`CheckPicker`/`TagPicker`/`DatePicker`/`Form.Control` stay
   until those components are migrated.

## Not done yet

Still importing rsuite (167 files), in descending order of effort:

| Component | Refs | Target | Notes |
| --- | ---: | --- | --- |
| `Form` + `Schema` | 86 + 33 | `react-hook-form` + `zod` + MUI `TextField` | The big one — 274 `Form.Control` sites. No shared wrapper (your call): wire `useForm` with `zodResolver` directly in each form. Note the repo is on classic zod (v3) everywhere except the Puck AI schemas. |
| `Table` | 32 | `DataTable` (built, see above) | The 32 remaining list views declare columns dynamically — a `.map()`, a conditional, or `renderListColumns(...)` — so `codemods/table.mjs` parks them. See "Finishing the tables". |
| `SelectPicker` / `CheckPicker` / `TagPicker` / `InputPicker` | 57 | MUI `Autocomplete` | Deliberately deferred into the Form pass — see decision 15. |
| `Input` / `InputGroup` / `NumberInput` / `InputNumber` | 62 | `TextField` / `InputAdornment` | Nearly all sit inside a `Form.Control`, so they move with the Form. |
| `Checkbox` | 13 | `Checkbox` | `onChange(value, checked)` -> `onChange(event, checked)`; mostly form-bound. |
| `Nav` / `Sidenav` / `Navbar` / `Sidebar` | 13 | `Tabs` / `List` / `AppBar` / `Drawer` | `base.tsx`'s sidebar is the main consumer. |
| `DatePicker` / `DateRangePicker` | 13 | `@mui/x-date-pickers` | Already a dependency, but in `devDependencies` — move it to `dependencies` first. |
| `Dropdown` | 7 | `Menu` + `MenuItem` | One was already done inside `commentStateDropdown`. |
| `List` / `Timeline` / `Placeholder` / `TagInput` | 6 | `List` / MUI X `Timeline` / `Skeleton` / `Autocomplete freeSolo` | |
| `CustomProvider` | 1 | — | `app.tsx` still wraps everything in rsuite's provider for locale + theme. It goes last, once nothing else needs rsuite. |

### Finishing the tables

`codemods/table.mjs` converts a `<Table>` whose children are plain `<Column>`
elements. The 32 it skips need a small amount of hand work each:

1. **`renderListColumns(dataColumns, isVisible)`** — `articleList` and
   `pageList` are done; `invoiceListPanel` still uses it. The pattern:

   ```tsx
   <DataTable
     data={articles}
     sortColumn={sortField}
     sortOrder={sortOrder}
     sortable={dataColumns
       .filter(column => column.sortable)
       .map(column => column.dataKey ?? column.id)}
     onSort={(column, order) => { setSort(column, order); setPage(1); }}
     columns={[
       ...dataColumns
         .filter(column => isVisible(column.id))
         .map(column => ({ ...column, sortKey: column.dataKey })),
       actionColumn,
     ]}
   />
   ```

   Watch the row type: rsuite's `RowDataType` silently widened it, so
   `dataColumns` was declared `ListColumn<FullArticleFragment>` when the query
   returns something narrower. Declare
   `type ArticleRow = (typeof articles)[number]` and use that rather than
   casting.
2. **Columns behind a `.map()` or a conditional** — build the array above the
   JSX and pass it in.
3. Once no `<Table>` from rsuite is left, delete `fit-column-widths.ts`
   (it only exists to emulate rsuite's `flexGrow`) and the `Table`/`PaddedCell`/
   `IconButtonCell` exports in `listView/list-view.tsx`.

### Other loose ends### Other loose ends

* **`--rs-*` CSS variables.** rsuite's custom properties (`--rs-text-secondary`,
  `--rs-border-primary`, `--rs-bg-card`, `--rs-radius-md`, …) are still
  referenced from emotion blocks across the editor, and `theme.ts` itself points
  `MuiTableCell`/`MuiCard` at them. They only resolve because rsuite's CSS is
  still loaded. These need swapping for theme tokens
  (`theme.palette.text.secondary`, `theme.shape.borderRadius`, …) before the
  rsuite stylesheet can be dropped, otherwise colours silently fall back to
  nothing. `grep -rn 'var(--rs-' libs apps` to find them.
* **`rsuite/esm/...` deep imports.** A few files import types from
  `rsuite/esm/internals/types` and `rsuite/esm/Table` (`RowDataType`,
  `BasicSize`, `Color`, `Option`). They go away with their components.
* **`rsuite-table`** is imported directly in 23 places for `RowDataType`; it
  disappears with the `Table` migration.

## Re-running the migration

`tools/rsuite-to-mui/` holds every codemod plus `run.sh`, which re-applies the
whole pipeline to a file list. Use it to recover from merge conflicts instead
of hand-merging JSX — the README there has the recipe and the rules that each
codemod had to learn the hard way.

## Gotchas worth knowing before the next pass

* **Never run `nx affected -t lint --fix` on this repo.** It reformats imports
  across every project in the affected graph, including untouched website apps
  and at least one generated file (`libs/website/api/src/lib/gql/index.ts`,
  whose `/* eslint-disable */` header it strips). Lint one project at a time:
  `nx lint <project> --fix`.
* **Scope every codemod by import source, not by tag name.** `<Button>` means
  rsuite in `libs/*/editor` and MUI in `libs/*/website`. An early pass keyed on
  the tag alone and quietly restyled 51 website files.
* **Icons stay on `react-icons`.** No `@mui/icons-material` was introduced and
  none should be.
* **i18n lint catches mis-nested JSX.** `disallow literal string` fired on
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

* **The repo already has the pieces TanStack owns.** `listView/` hand-rolls
  column definitions (`list-columns.tsx`), column visibility
  (`use-column-config.ts`, `column-configurator.tsx`), width fitting
  (`fit-column-widths.ts`) and sort/page state (`use-list-view-state.ts`).
  Those are exactly TanStack's column defs, `columnVisibility`,
  `columnSizing` and `sorting`/`pagination` state. The migration mostly
  *deletes* code rather than adding a new concept.
* **The lists are server-paginated.** `paginated-query-container.tsx` already
  drives Apollo with page/limit/sort. TanStack's `manualPagination` and
  `manualSorting` model that directly; DataGrid's server-side mode fights it.
* **No licence question.** DataGrid's column resizing and several other
  features used here sit behind the Pro tier. TanStack is MIT and headless.
* **Rendering stays MUI.** TanStack produces no markup, so the rows are plain
  MUI `Table`/`TableRow`/`TableCell` and inherit the editor theme, dark mode
  and the existing cell components for free.
* **Virtualisation only where it earns its place.** Most lists are paginated to
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

## Questions for you

1. **Default button look.** See decision 2 — `outlined` everywhere is a safe
   like-for-like, but a lot of editor toolbars might read better as `text`.
   Happy to flip the default in the theme.
2. **24-column grid.** Converting `Grid`/`Row`/`Col` means re-deciding every
   span. Worth doing as its own pass with a visual check rather than folded into
   another change.
3. **Drawer chrome.** `DrawerHeader`/`DrawerTitle`/`DrawerBody` are shared
   styled elements (decision 10). You vetoed a shared *form* abstraction; say
   if you want these inlined per panel too, though that means 28 copies of the
   same flex CSS.
