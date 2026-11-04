# Form library

Schema-driven editor forms on react-hook-form (RHF) and the zod 4 API. A form
is a module-level zod schema whose metadata holds translation keys, plus a
layout. The field components are styled once, in one components map, and
every form picks them up from there.

| Package | Project | Holds | May import |
| --- | --- | --- | --- |
| `@wepublish/form/core` (`libs/form/core`) | `form-core` | The engine: kinds, metadata, empty values, the validation resolver, `createForm`, `<Form>`, `fieldsFor`, the field hooks | `react`, `react-hook-form`, `@hookform/resolvers`, `zod/v4` and nothing else. Lint enforces it, so a website mapping can reuse the engine later. |
| `@wepublish/form/editor` (`libs/form/editor`) | `form-editor` | The editor's look: `editorForm`, one MUI component per kind, the picker wrappers, `formFields` schema helpers, `FormErrorSummary`, the test helper `@wepublish/form/editor/testing` | `@wepublish/ui/editor`, `@wepublish/editor/api`, MUI, react-i18next. Classic `zod` is banned; import `zod/v4`. |

Editor code imports only `@wepublish/form/editor`; it re-exports the core
hooks and types a form needs. `libs/ui/editor` must never import either
package (`form/editor` depends on it, so that would be a project cycle).

Contents: [Quick start](#quick-start) · [Form views](#form-views) · [Layout](#layout) · [Kinds](#kinds-and-components) ·
[Metadata and translations](#metadata-and-translations) · [Overrides](#overrides) ·
[Values](#values) · [Validation and errors](#validation-and-errors) ·
[Submitting](#submitting) · [Loading](#loading) ·
[Field components](#writing-a-field-component) · [React Compiler rules](#react-compiler-rules) ·
[Testing](#testing) · [Migration recipe](#migration-recipe) · [Verify](#verify) ·
[Out of scope and known limits](#out-of-scope-and-known-limits)

## Quick start

The consent form (`libs/consent/editor`) is the smallest complete example.

**1. The schema** lives in `<name>.schema.ts`, at module level, built with
`zod/v4`. Every `.meta()` value is an i18n key.

```ts
import { z } from 'zod/v4';

export const consentSchema = z.object({
  name: z.string().min(1).meta({ label: 'consents.name' }),
  slug: z
    .string()
    .min(1)
    .meta({ label: 'consents.slug', description: 'consents.slugInfo' }),
  defaultValue: z.boolean().default(true).meta({
    label: 'consents.checkedByDefault',
    description: 'consents.defaultValueInfo',
  }),
});
```

**2. The view** lives in `<name>.view.ts`, at module level: which fields go
in which section, the list and edit paths, and which server errors land on
which field.

```ts
import { formView, uniqueConstraint } from '@wepublish/form/editor';

import { consentSchema } from './consent.schema';

export const consentView = formView(consentSchema, {
  paths: { list: '/consents', edit: id => `/consents/edit/${id}` },
  sections: [
    { title: 'consents.consent', fields: ['name', 'slug'] },
    { title: 'consents.defaultValue', fields: ['defaultValue'] },
  ],
  serverErrors: [
    {
      match: uniqueConstraint('slug'),
      path: 'slug',
      error: 'consents.uniqueConstraint',
    },
  ],
});
```

**3. The create view** owns the mutation; `save` returns the new id.

```tsx
export const ConsentCreateView = () => {
  const [createConsent] = useMutation(CreateConsentDocument);
  const consent = useCreateForm(consentView, {
    title: 'consents.titleCreate',
    save: async values => {
      const { data } = await createConsent({ variables: values });

      return data?.createConsent.id;
    },
  });

  return <FormPage controller={consent} />;
};
```

**4. The edit view** loads through `useQueryLoader`, and the component that
owns the form is keyed by the record id, so moving to another record loads it
afresh.

```tsx
export const ConsentEditForm = ({ consentId }: { consentId: string }) => {
  const load = useQueryLoader(
    ConsentDocument,
    { id: consentId },
    data => data.consent
  );
  const [updateConsent] = useMutation(UpdateConsentDocument);
  const consent = useEditForm(consentView, {
    title: 'consents.titleEdit',
    load,
    save: values => updateConsent({ variables: { id: consentId, ...values } }),
  });

  return <FormPage controller={consent} />;
};

export const ConsentEditView = () => {
  const { id } = useParams();

  return (
    <ConsentEditForm
      key={id}
      consentId={id!}
    />
  );
};
```

What the library adds without further code: a sticky header with the title,
a back link to the list and Save / Save & close; titled sections; a `*` on
`name` and `slug` (required) but not on the checkbox (booleans are never
required); the checkbox starting checked on create; errors under each field
when it is left empty (`form.errors.required`); a taken slug under the slug
field; a spinner while the edit view loads and an alert with a retry button if
loading fails; a toast plus an inline alert for an unknown server error; a
success toast; navigation by intent; a prompt before the back link discards
changes; the browser's unsaved-changes warning while the form is dirty; and a
clean form after a successful save.

## Form views

A form view is the uniform editor form: every page and drawer form built with
it has the same header, sections, buttons, errors, toasts and navigation. It
sits on top of [`editorForm`](#layout); use the lower layer only for what a
view cannot express (see [Escape hatches](#escape-hatches)).

```text
<name>.schema.ts   schema, fromX / toXVariables mappings
<name>.view.ts     formView(schema, { layout?, paths, sections, fields, serverErrors })
route component    useCreateForm | useEditForm | useSingletonForm(view, { title, load, save, … })
                   <FormPage controller={…} />
                   or <FormDrawer …><FormDrawerPanel controller={…} /></FormDrawer>
```

### The view

`formView(schema, config)` is called once, at module level. Every path in it
is a typed `RenderablePath` of the schema: typos and item paths
(`'links.*.label'`) do not compile, and enum-keyed schemas work
(`SettingName.X`).

| Config | Meaning |
| --- | --- |
| `layout` | `'sections'` (default) or `'cards'`; see [Layouts](#layouts). The layout decides which of `placement` and `span` a section may take; the other one does not compile. |
| `sections` | The sections in order. Each takes `title?` and `description?` (keys; the description is visible text under the title), `placement?: 'main' \| 'aside'` (default layout only), `span?: 'full'` (cards layout only: the card takes the whole grid row), `modes?: ('create' \| 'edit' \| 'singleton')[]`, `hidden?` (Dynamic over the values; its fields are still validated), `collapsible?: 'open' \| 'closed'` (needs a title), `fields?` (entries) and `component?` + `covers?`. |
| entries | A path renders `view.Field`; a tuple of two or more paths is a row; `{ group: [...], title? }` is a toggle group for a run of checkboxes and switches. |
| `component`, `covers` | A module-level component rendered after the section's fields, with `{ mode, readOnly }`; `covers` lists the paths it renders. |
| `fields` | The static [overrides](#overrides) per path (`props`, `hideLabel`, Dynamic `hidden`, `normalize`, `'<array>.*'` `layout`, …). |
| `serverErrors` | `{ match, path, error, params?, modes? }`: the first rule whose `match(error)` is true sets `error` (a key) at `path`, with `params(values)` or, by default, `{ [last path segment]: value }` (`{ slug }`). No toast, no reset; the form stays dirty. Unmatched errors are rethrown. |
| `paths` | `{ list, edit(id) }`, the default navigation targets. A hook may pass its own. |

`view.Field` is `editorForm.fieldsFor(schema).Field` (cached per schema) for
section components and item layouts. A titled section whose only entry is one
array, object or union hides that field's own label (it keeps it as
`aria-label`), so "Links" is not printed twice; `fields[path].hideLabel:
false` turns that off.

Outside production `formView` **throws** when a top-level key is placed in no
section or more than once (nested paths count for their first segment; a
`covers` path counts), when a collapsible section has no title, when rich
text sits in an aside section or anywhere in the cards layout (the aside and a
card are both bordered boxes, and the rich-text editor draws its own), when a
cards view has an aside section, and when a default view uses `span`. A
half-migrated view therefore breaks its lib's specs at import.

### The controller hooks

The route component calls one hook and passes the result to a container.

| Hook | `load` | `save` resolves to | After Save | After Save & close |
| --- | --- | --- | --- | --- |
| `useCreateForm(view, options)` | (`defaultValues?` instead) | the new id | `paths.edit(id)`, or `paths.list` without an id | `paths.list` |
| `useEditForm(view, options)` | `() => Promise<defaults>` | anything | stays; the form is clean | `paths.list` |
| `useSingletonForm(view, options)` | `() => Promise<defaults>` | anything | stays | not offered |

Options shared by all three:

| Option | Meaning |
| --- | --- |
| `title` | A key; `titleParams?(values)` makes it live ("Edit {{tag}}"; it must handle empty values, which render while loading). |
| `subtitle?` | A key or a node under the title. |
| `fields?` | Runtime overrides, merged into the view's per path (hook keys win; plain `props` objects are merged). Required when a path needs `props` (`formFields.entity()`). |
| `readOnly?`, `writePermissions?` | Read-only disables every field, removes the save buttons and shows a `form.view.readOnly` chip. `writePermissions` uses `useHasPermission`; pass a module-level array. A missing session counts as allowed. |
| `successToast?` | Defaults to `toast.createdSuccess` (create) or `toast.updatedSuccess`; another key, or `false`. |
| `confirm?` | `{ title, description?, format?, body? }` puts Save behind a confirmation dialog (below). |
| `headerActions?` | Nodes before the save buttons. |
| `paths?` | Overrides the view's paths. A create or edit form with paths in neither the view nor the hook throws outside production. |
| `save(values, context)` | `values` is the schema output. `context` is `{ intent, mode, form, changed, changedKeys }`: `changed`/`changedKeys` come from `getChangedValues`, `form` is RHF's form for `setFieldError` on errors one rule cannot describe. Errors set inside `save` suppress the toast and the navigation. |

### Containers and primitives

| Piece | Renders |
| --- | --- |
| `<FormPage controller />` | The page form: a sticky header (back link, title, read-only chip, `headerActions`, save buttons) and the body. The header puts the title exactly where a list page's `ListViewContainer` puts its `PageTitle` (the shell's `--wep-page-padding-y`/`-x`, no rule below); from `md` the back link hangs in the left gutter so the title does not move between list and edit. A long title stays on one line with an ellipsis and the full text in `title`; from `md` the actions never wrap under it. When stuck, the header keeps a 16px top padding. It publishes the header height as `--wep-sticky-top`. |
| `<FormDrawer open onClose width?>` + `<FormDrawerPanel controller />` | A right drawer (`width` from `DRAWER_WIDTHS`, default `md`) whose header holds the title (one line, ellipsis, full text in `title`), the save buttons and a close button; section titles are `h3`. The drawer mounts its form only while open. |
| `useRouteDrawer({ list, create, edit: '…/:id' })` | `{ open, mode, id, close }` from the route. `mode` and `id` keep the last match, so the content stays during the close animation. |
| `<FormRoot controller as? headingLevel?>` | The form element and the view context, for a hand-made shell. Inside it: `<FormPageHeader />`, `<FormBody />` (summary, server error, load state, sections, confirmation dialog), `<FormSaveActions />`. |
| `<FormSection title? description? collapsible? errorPaths? variant? span?>`, `<FormRow>`, `<FormToggleGroup title?>` | The exact primitives sections, rows and toggle groups render with. Use them in section components, item layouts and hand-made bodies so custom parts look the same. `variant="card"` (default `'section'`) and `span="full"` are what the cards layout passes. |
| `useFormView()` | `{ mode, readOnly }` inside any view; throws outside one. |

### Layouts

In both layouts a titled section is a `<section>` named by its title (a
`region`) with an `h2` heading (`h3` in a drawer); collapsible sections keep
their header button, `aria-expanded` and error-count chip; the header, error
summary, load state, confirmation and discard prompts are the same.

- **`'sections'`** (default, every form except settings): titled groups
  separated by 1px rules, not cards (`subtitle1` titles). Only the aside is a
  bordered panel; it sits beside the main column when the body is wide enough
  and wraps under it otherwise (flexbox, no media queries). The body is 760px
  wide, 1200px with an aside, and unlimited in a drawer.
- **`'cards'`** (`formView(schema, { layout: 'cards', … })`): every section is
  an outlined `Card` with an `h4`-styled title, its description, then the
  fields 16px apart. The cards sit in a grid in declaration order, one column
  and two from the `sm` breakpoint (always one in a drawer), 32px apart and
  top-aligned; `span: 'full'` gives a card the whole row. The body is 1200px
  wide. There is no aside, and rich text is not allowed in a card. Use it only
  for a page of many small, independent groups that read better side by side
  (the settings page); pair cards of similar height and give wide content
  (long labels, rows of fields, long selects) a full row.

`apps/editor/src/app/formLayout.spec.ts` fails when a file that uses form
views imports `Card`, `CardContent`, `CardHeader`, `Grid` or `Paper` from MUI,
or `SingleViewTitle` / `ListViewHeader`.

### Behaviour

- **Submitting.** The core pipeline is unchanged (portal guard, refusal while
  loading or read-only, intent, validation). Then `save` runs; a matching
  `serverErrors` rule sets its field error; anything else is rethrown and shows
  the 8 s toast plus an inline `form.errors.server` alert until the next
  submit. Otherwise the success toast shows and the hook navigates. Navigation
  after a save never asks to discard.
- **Loading.** While loading: the header with disabled buttons and the
  `form.loading` spinner, no sections. After a failed load: the retry alert,
  no sections. While saving: the buttons show progress; the title stays.
- **Discarding.** The back link of a dirty page and every close path of a
  dirty drawer (close button, Escape, backdrop) ask
  `form.view.discardChanges.*` first. Sidebar links and the command palette
  still leave silently (no data router). Discard turns the unsaved-changes
  warning off for that one navigation, so a `useBlocker`-based
  `useUnsavedChangesDialog` does not ask a second time.
- **Confirmation** (`confirm`). Save is a plain button, disabled while the
  form is clean. It validates first (errors show as on submit); a valid form
  opens a dialog listing each changed top-level field as `label: before →
  after` (`format[key]` turns a value into text; booleans read
  `form.value.on`/`off`, enums use their `optionLabelPrefix`, numbers get a
  string `unit` from `fields[key].props`, translated with `count`, so a unit
  key needs a `_one` form next to its plural). The dialog's Confirm button submits
  the form; Cancel keeps the form dirty. A hidden disabled submit button stops
  Enter from skipping the dialog. A custom `body` receives `{ changes }`.
- **Singleton.** No back link unless `useSingletonForm` gets a `closePath`
  (a sub-page such as website analytics leads back to its overview; the link
  asks while dirty, like any page); Discard changes (resets to the loaded
  values) and Save, both disabled while the form is clean.

### Data helpers

- **`useQueryLoader(query, variables, select)`** returns a loader for `load`.
  It always asks the network (`fetchPolicy: 'network-only'`), also on retry,
  and rejects when the query returns no data. A fragment with extra keys
  (`__typename`, `id`) is a valid result. `variables` are checked against the
  query's own variables, so a misspelt or undeclared one does not compile.
- **`uniqueConstraint(...columns)`** matches Prisma's unique violations in
  both forms: `fields: (\`slug\`)` and `constraint: \`consents_slug_key\``
  (what the API sends today, Prisma 7 with the pg adapter). An index matches
  when its name ends in `_<columns in any order>_key`; without columns it
  matches any unique violation. `uniqueViolationOf(error)` returns the parsed
  `{ columns, index }`. Suffix matching cannot tell a trailing column from a
  composite index that ends in it (`'tag'` also matches `tags_type_tag_key`),
  so a rule names every column of its index.

### Escape hatches

A section `component` (+ `covers`) for a part no entry describes; item
layouts on `'<array>.*'`; `headerActions`; `setFieldError(context.form, …)`
inside `save`; and `FormRoot` with `FormPageHeader`, `FormBody`,
`FormSaveActions` and the section primitives for a shell the containers do not
fit. Add a view or hook option only when two forms need it.

### Testing a view

`renderFormRoutes(routes, { route, mocks?, wrapper? })` from
`@wepublish/form/editor/testing` mounts each `path → element`, a catch-all
route and a path probe, and returns `currentPath()` with the usual render
result. `formSectionOf(title)` queries inside the section named `title`.

```tsx
const { user, currentPath } = renderFormRoutes(
  { '/consents/create': <ConsentCreateView /> },
  { route: '/consents/create', mocks: [createMock] }
);

await user.type(getFieldByLabel('consents.name*'), 'Newsletter');
await user.click(screen.getByTestId('saveButton'));

await waitFor(() => expect(currentPath()).toBe('/consents/edit/consent-1'));
expect(
  formSectionOf('consents.consent').getByRole('textbox', { name: /^consents\.slug/ })
).toBeInTheDocument();
```

Test ids: `saveButton`, `saveAndCloseButton`, `discardButton` (singleton),
`confirmSaveButton` (in the confirmation dialog). Accessible names: the back
link `back`, the drawer close button `close`, the discard prompt
`form.view.discardChanges.title`. Lib views carry an `is memoised by the
React Compiler` spec on the component that calls the hook.

## Layout

`editorForm` is `createForm(...)` with the editor's components and settings
(see [Configuration](#configuration)). It has three members:

- **`editorForm.useSchemaForm(schema, options?)`** returns the handle
  `{ form, schema, loadError, reloading, retry }`. `form` is RHF's own
  `useForm` object, untouched; pass it where an API wants RHF's form
  (`setFieldError(handle.form, …)`, `getChangedValues(handle.form)`). Never
  spread `form` (see [React Compiler rules](#react-compiler-rules)).
- **`<editorForm.Form form={handle} onSubmit={…}>`** renders the `<form>`
  element and provides the form to everything inside it. Props: `form`,
  `onSubmit(values, context)`, `onInvalid?(errors)`, `fields?` (overrides),
  `disabled?`, `warnOnUnsavedChanges?`, `as?` (the element instead of `form`,
  for example a styled form as the view kit's `PageForm`; it receives `id`,
  `noValidate`, `onSubmit` and the children), `id?` (also the prefix of the
  field ids) and `children`. Always pass children: a
  form without children renders only `<AutoFields/>`, which has no summary.
- **`editorForm.fieldsFor(schema, scope?)`** returns `{ Field, AutoFields }`,
  typed against the schema. Call it at module level.

The layout pieces:

| Piece | Renders |
| --- | --- |
| `<Field name="startsAt" />` | One field, chosen by its kind. `name` is a typed path (`'seo.title'` for nested objects). Every [override](#overrides) can be passed as a prop and wins over `fields`. Paths with `*` are rendered by their array, never by `Field`. |
| `<AutoFields omit={['title']} />` | `<LoadState/>`, then every top-level field in schema order, minus `omit`. Use it when the form is one column in schema order. |
| `<LoadState />` | The spinner while loading, the error alert with retry after a failed load, otherwise nothing. Put it where the fields go. `AutoFields` already includes it. |
| `<FormErrorSummary />` | An error alert listing errors that no rendered field shows (hidden fields, other tabs, schema-level errors). **Every layout renders one** (see [Errors outside the view](#errors-outside-the-view)). |
| `useFormStatus()` | `{ isSubmitting, isDirty, isValid, isLoading, loadError, canSubmit, serverError }` for headers and buttons. Each property subscribes only when read; avoid `isValid` unless you show it, because reading it makes RHF validate the whole schema on every change. |

Fields render nothing while the form loads or after a failed load, so a
layout can sit in its existing cards without prop threading. Headers, titles
and Close links render straight away. When whole cards should disappear
during loading, gate them on `useFormStatus()` as banner and event do:

```tsx
const { Field } = editorForm.fieldsFor(eventSchema);

export const EventForm = ({ title, create = false }: EventFormProps) => {
  const { t } = useTranslation();
  const { isSubmitting, isLoading, loadError, canSubmit } = useFormStatus();

  return (
    <>
      <SingleViewTitle
        loading={isSubmitting}
        disabled={!canSubmit}
        title={title}
        loadingTitle={title}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={eventListPath}
      />

      <FormErrorSummary />
      <LoadState />

      {isLoading || loadError !== undefined ? null : (
        <Columns>
          <Card variant="outlined">
            <CardContent>
              <FormFields>
                <Field name="name" />
                <Field
                  name="externalSourceName"
                  readOnly
                  hidden={withoutExternalSource}
                />
                <Field name="startsAt" />
                <Field name="endsAt" />
                <Field name="description" />
              </FormFields>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <FormFields>
                <Field
                  name="status"
                  hidden={create}
                />
                <Field name="tagIds" />
                <Field name="image" />
              </FormFields>
            </CardContent>
          </Card>
        </Columns>
      )}
    </>
  );
};
```

`FormFields`, `FormSectionTitle` and `Card` from `@wepublish/ui/editor` stay
the layout primitives; the code-style rules for editor layout apply
unchanged.

**Header buttons.** `SingleViewTitle`'s two buttons are submit buttons with
`name="intent"` and `value="save"` / `value="close"`. Leave out `setCloseFn`;
read `intent` in `onSubmit` instead. Save comes first, so Enter in a text
input saves. A page with a single save button (website settings) renders a
plain `<Button type="submit">`; its `intent` is `undefined`.

## Kinds and components

A field's **kind** picks its component. Structural kinds come from the zod
type, read from `schema._zod.def` after unwrapping `optional`, `nullable`,
`default`, `prefault`, `readonly`, `catch`, `nonoptional`, `lazy` and `pipe`.
Custom kinds are marked with `withKind(schema, kind, params?)`; editor code
gets them through the `formFields.*` helpers. The mark survives `.min()`,
`.meta()`, `.nullish()` and every other chained call.

A path whose kind has no component is a **compile error**: the form then
requires `fields[path].component` (or a `layout` for an array-item path). At
runtime `Field` throws `No component for kind "<kind>" at "<path>"`.

**Structural kinds**

| Kind | Schema | Component | Props | Value |
| --- | --- | --- | --- | --- |
| `string` | `z.string()`, `z.email()`, `z.url()`, other string formats | `TextField` | `type?: 'text' \| 'email' \| 'url' \| 'password'` (email/url otherwise follow the format; password gets a show/hide button), `autoComplete?`, `endAdornment?: ReactNode` (shown as is at the end of the input, e.g. a vote count, and linked by `aria-describedby`) | string |
| `number` | `z.number()`, `z.int()` | `NumberField` | `unit?: ReactNode` (a string is a key, e.g. `form.units.days`; an end adornment linked by `aria-describedby`) | number; empty is the cleared value, never `NaN`; `min`/`max`/`step` come from the schema |
| `boolean` | `z.boolean()` | `CheckboxField` | none | boolean |
| `date` | `z.date()` | `DateField` | none | `Date`; `.min()`/`.max()` limit the calendar |
| `enum` | `z.enum([...])`, `z.enum(NativeEnum)`, `z.literal()`, a union of literals | `SelectField` | `searchable?` (an Autocomplete for long lists) | the option value; an empty choice (`form.select.empty`) appears only when the field is not required |
| `enumArray` | `z.array(z.enum(...))` | `MultiSelectField` | none | values in the order picked; `[]` when cleared |
| `primitiveArray` | `z.array(z.string())` | `ChipsField` | none | `string[]`, trimmed, empty entries dropped, duplicates removed |
| `array` | an array of objects, discriminated unions or custom kinds | `ArrayField` | `variant?: 'list' \| 'table'`, `sortable?` (default `true`; `false` turns it off; a drag handle at the start of each row, a labelled first column in tables: drag with the pointer, or focus it and press Space, the arrow keys and Space again; announced through `form.array.drag*`), `addLabel?` (a key or a ReactNode; a text button). Adding focuses the new row; removing focuses the next row's remove button, else the previous one's, else Add | items in on-screen order; RHF's row ids never reach the value |
| `object` | `z.object(...)` inside the schema | `ObjectField` | none | the nested object |
| `discriminatedUnion` | `z.discriminatedUnion('type', [...])` | `DiscriminatedUnionField` | `control?: 'select' \| 'radio'` (default: radio up to 3 options) | the active branch; switching keeps the keys the new branch accepts |
| kind of `X` | `X.or(z.literal(''))` | as for `X` | | |

Anything else has no kind: `z.record`, `z.custom` without a helper, `z.any`,
mixed unions, and arrays of numbers, dates or booleans. Give those a
`component` override.

**Custom kinds** (`formFields` from `@wepublish/form/editor`)

| Helper | Schema it builds | Component | Props | Value |
| --- | --- | --- | --- | --- |
| `formFields.textarea()` | `z.string()` | `TextareaField` | `minRows?` (3), `maxRows?` | string |
| `formFields.switch()` | `z.boolean()` | `SwitchField` | none | boolean |
| `formFields.radio(z.enum(...))` | the enum | `RadioField` | `row?` | the option value |
| `formFields.dateTime()` | `z.date()` | `DateTimeField` | none | `Date` (Today / Tomorrow / Now shortcuts) |
| `formFields.secret()` | `z.string().nullish().transform(v => v \|\| undefined)` | `SecretField` | `autoComplete?` (`'one-time-code'`) | string; an empty secret is `undefined` in the output, so the API receives no key |
| `formFields.color()` | `z.string().regex(HEX)` | `ColorField` | `presetColors?` | `#rrggbb`, or `#rrggbbaa` when not opaque |
| `formFields.entity<T>()` | `z.custom<T>()`, required | `EntitySelectField` | **required:** `options`, `getOptionLabel`; optional `isOptionEqualToValue` (default compares `id`), `loading` | the whole object |
| `formFields.richText<T>()` | `z.custom<RichtextJSONDocument>()`, required | `RichTextField` | none | the editor document `{ type: 'doc', content }` |
| `formFields.image<T>()` | `z.custom<FullImageFragment>()`, required | `ImageField` (`ChooseEditImage` with the select and edit drawers) | none | the image object |
| `formFields.tags(TagType.Event)` | `z.array(z.string())` | `TagsField` | none (the tag type is a kind param) | tag ids |
| `formFields.page()` / `.pages()` | `z.string().min(1)` / `z.array(z.string())` | `PageField` / `PagesField` | none | id / ids |
| `formFields.paywall()` | `z.string().min(1)` | `PaywallField` | none | id |
| `formFields.memberPlan()` / `.memberPlans()` | `z.string().min(1)` / `z.array(z.string())` | `MemberPlanField` / `MemberPlansField` | none | id / ids |
| `formFields.user()` | `z.custom<FullUserFragment>()`, required | `UserField` | none | the user object |

- The object helpers (`entity`, `richText`, `image`, `user`) and the single
  pickers (`page`, `paywall`, `memberPlan`) are required until you add
  `.nullish()`; then they clear to `null`. List helpers are optional unless you
  add `.min(1)`.
- `CurrencyField` (amounts in cents, rounded) is not in the map; bind it per
  field: `const CHF = bindComponent(CurrencyField, { currency: 'CHF' })` at
  module level, then `<Field name="amount" component={CHF} />`.
- A schema helper takes arguments only for real parameters (`tags(tagType)`,
  `radio(enum)`); everything else chains on the result:
  `formFields.textarea().min(1).meta({ label: 'banner.form.text' })`.

## Metadata and translations

`.meta()` accepts these keys; each value is an **i18n key**, translated when
the field renders, so switching the language updates what is on screen.

| Key | Shown as |
| --- | --- |
| `label` | The label. A `*` follows it when the field is required. |
| `description` | An `InfoTooltip` after the label. |
| `helperText` | Text under the field. An error replaces it. |
| `placeholder` | The input placeholder. |
| `optionLabelPrefix` | Option labels: `t(prefix + value)`. The prefix carries its own separator: `'banner.form.loginStatus.'`, `'event.form.statuses.'` (or `'…_'` for underscore-style keys). For an enum array it may sit on the array or on the element. |

Rules:

1. **Keys are string literals**, written where `locales.spec.ts` sees them:
   `label: 'x.y'` in a `*.schema.ts` file that imports `zod/v4`, or in any file
   that imports `@wepublish/form/*` (including JSX props such as
   `label="x.y"`, `addLabel: 'x.y'`, and the third argument of
   `setFieldError`). Keys inside helper functions or computed strings are not
   found. Inside `libs/form/*/src` every quoted `'form.…'` literal counts.
2. **`error:`, never `message:`**, for an own error key:
   `.min(0, { error: 'banner.form.mustNotBeNegative' })`.
3. **Placeholders are keys** too.
4. **A string is a key; any other ReactNode renders unchanged.** This applies
   to meta, overrides, the results of Dynamic functions and of `optionLabel`.
   A `<Trans>` with links is passed as a ReactNode override
   (website analytics passes its `<Trans>` hints as hook `fields`
   `helperText`). Labels inside an
   `options` override are data and are never translated.
5. **`.meta()` goes after checks.** `.min()`, `.regex()`, `.refine()`,
   `.trim()`, `.extend()`, `.pick()` and `.partial()` return a schema without
   the meta. Wrappers are fine either side: meta is merged across
   `optional`/`nullable`/`default` layers, the outer one winning.
6. **Unknown meta keys throw** outside production (`{ lable: 'x' }` type-checks,
   because zod's `GlobalMeta` has an index signature). Never use
   `meta({ id })`: registering one id twice throws.
7. **Schemas are module-level constants.** `.meta()` registers into zod's
   global registry, which keeps every schema alive; building schemas in render
   or `useMemo` leaks.

Translations go into `apps/editor/src/app/locales/{en,de,fr}.json` (see
[code-style.md](../../.claude/docs/code-style.md#translations) for the
language rules). The library's own texts live under `form.*`
(`form.errors.*`, `form.array.*`, `form.loadError.*`, …). Keys returned from a
Dynamic `label` or from `optionLabel` are not scanned; prefer
`optionLabelPrefix` and static meta, and check such keys by hand.

## Overrides

Overrides are passed per form in `fields`, keyed by schema path, or per call
as props on `Field`. Per-call props win over `fields`; `props` objects are
merged.

| Override | Dynamic | Meaning |
| --- | --- | --- |
| `label`, `description`, `helperText` | yes | Text, following the text rule above. |
| `placeholder` | yes | A key. |
| `hidden` | yes | Unmounts the field. Its value is kept and **still validated**, so the schema must make it conditionally valid. When a field with an error becomes hidden, it is re-validated. |
| `disabled`, `readOnly` | yes | UI only; the value is still submitted. `<Form disabled>` disables every field and blocks submit. |
| `required` | yes | Overrides the derived asterisk and `required` attribute (not the schema). |
| `hideLabel` | no | Hides the visual label; a string label becomes the `aria-label`. |
| `options` | yes | Runtime options for enum-like fields, as values or `{ value, label }` (labels are data). |
| `optionLabel(value)` | no | A key or a ReactNode per option value. |
| `props` | yes | Extra props of the kind's component, type-checked. Required in `fields` when the component has required props. |
| `component` | no | `bindComponent(Comp, props)`: a different component for this field. Excludes `props`. |
| `normalize(next)` | no | Rewrites a value before it is stored (lower-case a slug). |
| `guard(next, actions)` | no | Return `false` to refuse a change. |
| `onValueChange(value, actions)` | no | Cascades into other fields after a change. |
| `layout` | no | Only in `fields`, only on `'<array>.*'` paths: the component that renders one array item. |

`actions` is `{ getValues, setValue, trigger, resetField }`. Its `setValue`
defaults to `{ shouldDirty: true }` and validates when the target is touched or
invalid, so derived values count as changes. Nothing exposes `formState`.

```tsx
const { Field } = editorForm.fieldsFor(consentSchema);

<Field
  name="name"
  onValueChange={(name, { setValue }) => setValue('slug', name.toLowerCase())}
/>
<Field
  name="slug"
  normalize={slug => slug.toLowerCase()}
/>
```

**Dynamic values** are `T | ((values: FormValues<S>) => T)`. A field whose
overrides contain a function subscribes to the form values and re-evaluates on
every render, so closures over `t`, query data or component state stay
current. Static fields never subscribe. Define the function at module level
when it needs no closure:

```tsx
const withoutExternalSource = ({ externalSourceName }: FormValues<typeof eventSchema>) =>
  !externalSourceName;

<Field
  name="externalSourceName"
  readOnly
  hidden={withoutExternalSource}
/>
```

**Item paths.** Array items use `*`: `fields={{ 'actions.*.role': { … } }}`
configures the role of every row. An override on a concrete index does not
exist. `ArrayField` renders each item with the element's own kind component
(an `ObjectField` for object items), inside an item scope that resolves `*` to
the row index.

**Item layouts.** For a custom row, give `'<array>.*'` a `layout` and render
scoped fields made with `fieldsFor(schema, '<array>.*')`. A layout is rendered
as a component with `{ index, count, remove, move }`, so it may use hooks.
Define it at module level; an inline function is a new component type on
every render of an uncompiled host, and the row would remount. In the editor
`ArrayField` still draws the row around the layout: plain rows divided by
rules (no box per item), with the drag handle first (unless `sortable={false}`) and the red remove
button at the end.

```tsx
const ActionRow = editorForm.fieldsFor(bannerSchema, 'actions.*');

function ActionLayout() {
  return (
    <Stack direction="row" spacing={2}>
      <ActionRow.Field name="label" />
      <ActionRow.Field name="url" />
    </Stack>
  );
}

<editorForm.Form
  form={handle}
  onSubmit={save}
  fields={{ 'actions.*': { layout: ActionLayout } }}
>
```

**Table variant.** `props={{ variant: 'table' }}` on an array of objects (or
discriminated unions) renders one column per item key, with the item labels
and description tooltips as column headers and label-less cells (each input
keeps its label as `aria-label`). Union items get a type select in the
discriminator's column, and cells for keys the active branch lacks stay
empty. Other item kinds throw. Banner actions:

```tsx
<Field
  name="actions"
  hideLabel
  props={{ variant: 'table', addLabel: 'banner.actions.add' }}
/>
```

**Components with required props.** `EntitySelectField` needs its options, so
a form with an `entity` field does not compile without them. Build the props
with `entityProps`, which ties the callbacks to the options' type:

```tsx
fields={{
  plan: { props: entityProps({ options: plans, getOptionLabel: plan => plan.name }) },
}}
```

**`bindComponent(Comp, props?)`** wraps a component and its fixed props into a
value for `component`. Props are type-checked and required when `Comp`
requires them (`bindComponent(CurrencyField)` does not compile). Bind at
module level. A component can declare the value type it handles with
`fieldComponent<V>()(Comp)`; a bound, declared component is then rejected on a
field whose value it does not cover. The editor's value fields are exported
declared (`libs/form/editor/src/lib/field-components.ts`), so
`bindComponent(CurrencyField, { currency })` on a string field, or a page
picker on a tag list, does not compile. `ArrayField`, `ObjectField`,
`DiscriminatedUnionField` and `RichTextField` stay undeclared and fit any
field. Declare your own components the same way, keeping the function
declaration separate so the React Compiler still compiles it.

## Values

**Three value types.** Import them from `@wepublish/form/editor`:

| Type | Is | Used for |
| --- | --- | --- |
| `FormValues<typeof s>` | What the form holds while editing. Honest about empties: numbers, dates, enums and custom kinds may be `null` even when required. | Dynamic functions, `normalize`, `guard`, `onValueChange` |
| `FormOutput<typeof s>` | `z.output` of the schema, after validation and transforms. | `onSubmit` and the save mapping |
| `FormDefaultValues<typeof s>` | What `defaultValues` may return: objects and arrays partial, custom-kind values (an image, a user) whole. | The `fromX` load mapping |

**Empty values.** A create form needs no `EMPTY_*` constant; the schema
provides them.

- Every field starts at its cleared value (below): `''` for a plain string,
  `null` for a number, date, enum or image, `false` for a boolean, `[]` for an
  array.
- `.default()`/`.prefault()` fill the start value instead; a lazy
  `.default(() => new Date())` is called for each new form.
- A required discriminated union starts with its first branch.
- An optional or nullable object group starts as its blank inner shape, so its
  fields can render, and is submitted as `undefined`/`null` again while every
  leaf is blank or equal to its default. A `null` from the server for such a
  group behaves the same. Optional unions stay `undefined`/`null`.

**Merging loaded data.** The loader's result is merged over the empty values
by the schema, never with lodash:

- Only keys in the schema are kept, so `__typename` and other extras drop out.
- Arrays of objects are merged item by item; arrays of primitives, Dates and
  custom-kind values are taken whole.
- A union value merges into the branch its discriminator selects.
- `undefined` keeps the empty value; `null` replaces it.

**Cleared value.** When an input empties, `useField().onChange` stores the
field's cleared value instead of what the component emitted:

- string values (also string-based kinds such as `textarea`, `page`, `color`):
  the first of `''`, `null`, `undefined` the schema accepts, else `''`; a
  defaulted string that rejects `null` clears to `null`;
- other values (numbers, dates, enums, `image`, `entity`, …): `null`, else
  `undefined` (or `''` when the schema has a `z.literal('')` option), else
  `null`;
- arrays `[]`, booleans `false`;
- a field that is not required and was loaded with `null` or `''` returns to
  that loaded value, so typing and clearing leaves the form clean.

**Required.** A field is required when its schema, ignoring defaults, rejects
its cleared value. Required fields get the `*`, the `required` attribute and
`form.errors.required` on submit. Booleans are never required, and fields in
an optional group are not marked. **Clearing a field that has a default makes
it required** (a decision, not an accident): banner `delay` cleared shows
"required" instead of silently saving `0`.

**Optional strings.** An untouched `z.string().nullish()` submits `''`. Map it
in the save function when the API wants `null` (`location: location || null`
in `event.schema.ts`).

**Dates.** Date fields hold `Date`. Convert ISO strings in the load and save
mappings (`startsAt: new Date(event.startsAt)` in, `startsAt.toISOString()`
out).

**Ids or objects.** Pickers that resolve labels themselves store ids: `tags`,
`page(s)`, `paywall`, `memberPlan(s)`. `image`, `entity` and `user` store the
object, because their components need it to show anything; the save mapping
takes the id (`imageId: image?.id ?? null`).

**Only edited data in the schema.** Ids, `__typename` and data the form only
carries through stay in the route params, the loader and the save mapping.

**Partial saves.** `getChangedValues(handle.form)` returns the top-level keys
whose values differ from the loaded ones (deep compare, Dates by time, blank
optional groups equal to absent ones). RHF's `dirtyFields` misses array
removals, so do not use it for this. The result holds raw form values, not the
output, so pick from the validated values:

```tsx
onSubmit={async values => {
  const changed = getChangedValues(handle.form);
  const input = Object.fromEntries(Object.entries(values).filter(([key]) => key in changed));

  await updateSettings({ variables: { input } });
}}
```

**Write-only secrets** use `formFields.secret()`: the field starts empty, and an
empty secret leaves the key out of the mutation, so the stored value stays.

## Validation and errors

**When.** Fields validate when left (`onTouched`), then on every change.
Submit validates everything. Per form, `useSchemaForm(schema, { mode })`
changes this.

**Default error keys.** The library's resolver gives every issue without an
own `error` a key from the finite set `formErrorKeys` (exported from core,
checked against all three catalogs by `locales.spec.ts`):

- An empty input (`undefined`, `null`, `''`, `[]`) is always
  `form.errors.required`, whatever the check.
- `form.errors.invalid_type.{string,number,int,boolean,date,array,object}`,
  `form.errors.invalid_format.{email,url,regex,uuid,default}`,
  `form.errors.too_small.{string.min,string.exact,array.min,array.exact,number.inclusive,number.exclusive,date.inclusive,date.exclusive}`,
  the same under `too_big` with `string.max`/`array.max`,
  `form.errors.{invalid,invalid_value,not_multiple_of,unexpected,server}`.
- Issue parameters reach the translator: `{{minimum}}`, `{{maximum}}`,
  `{{divisor}}`; dates as `{{minimum, P}}`.

**Own keys** go in `error`: `.regex(re, { error: 'k' })`,
`.refine(fn, { error: 'k' })`. In `X.or(z.literal(''))` put the real branch
first; the resolver reports the first branch's issue, so its key survives.

**Async refines** work; the resolver always parses asynchronously. There is no
debouncing.

**Rules across fields** use `crossField(schema, keys, check, { path, error })`.
A plain object `.refine()` stays silent until every other field in the object
is valid; `crossField` runs as soon as its own keys parse and skips while one
of them has an issue. `path[0]` must be a key of the object.

```ts
const eventFields = z.object({
  startsAt: formFields.dateTime().meta({ label: 'event.form.startsAt' }),
  endsAt: formFields.dateTime().nullish().meta({ label: 'event.form.endsAt' }),
});

export const eventSchema = crossField(
  eventFields,
  ['startsAt', 'endsAt'],
  ({ startsAt, endsAt }) => !endsAt || endsAt >= startsAt,
  { path: ['endsAt'], error: 'event.form.endsBeforeStart' }
);
```

`crossField` returns a new schema: apply it last (after any `.extend()`,
`.pick()` or `.partial()`, which drop refines), put a group's `.meta()` after
it, and call `fieldsFor` on the result. A rule on a nested group wraps that
group in place (website analytics checks each provider's `key` only while it
is enabled).

**Hidden fields are validated.** Make them conditionally valid with
`crossField` or a discriminated union, as analytics does. If the schema still
fails on a field that is not on screen, the summary shows it.

**Server errors.** In a form view, declare them as `serverErrors` rules
(see [The view](#the-view)). With `editorForm` directly, map known errors in
`onSubmit` with `setFieldError(handle.form, path, key, params?)` and return;
rethrow anything else.

```tsx
try {
  await updateConsent({ variables: { id: consentId, ...consent } });
} catch (error) {
  if (!uniqueConstraint('slug')(error)) {
    throw error;
  }

  setFieldError(handle.form, 'slug', 'consents.uniqueConstraint', { slug: consent.slug });

  return;
}
```

A rejected `onSubmit` becomes `root.server` (`form.errors.server`) plus a toast
through `humanizeError`; `useFormStatus().serverError` holds its text. Issues
without a path, and a refine that throws (`form.errors.unexpected`), land on
`root.schema`, which the summary lists without a label. A form with errors
after `onSubmit` is not reset, so it stays dirty.

### Errors outside the view

Every rendered field registers its path. `<FormErrorSummary/>` lists each
error whose path no rendered field covers: a hidden field, a field in a closed
tab or accordion, `root.schema`. Entries read "label: message"; an entry is a
button that focuses its field only when RHF has that field mounted (a leftover
`Controller` during a migration), otherwise plain text.

**Every layout renders `<FormErrorSummary/>`; there is no toast fallback.**
`apps/editor/src/app/formErrorSummary.spec.ts` fails when a module rendering
`<editorForm.Form` does not reach `<FormErrorSummary` itself or through its
relative imports. Outside production the form also logs a `console.error`
when a submit is blocked by unreachable errors and no summary is mounted.

`useFieldErrors(paths)` returns the error entries under one or more paths, for
an error marker on a tab or accordion header.

## Submitting

The submit handler of `<Form>`, in order:

1. **Ignores submits from other forms** that bubble through a React portal.
   The legacy `ImageEditPanel` drawer is a form rendered inside event and
   banner; its save used to save the event as well.
2. **Stops propagation**, so its own submit never reaches an outer legacy form.
3. **Refuses** while loading, after a failed load, with `disabled`, and while a
   submit is still running (a double click submits once).
4. **Reads the intent** from the pressed button's `value`. `editorForm`
   declares `['save', 'close']`; `SubmitContext` from `@wepublish/form/editor`
   types `intent` as `'save' | 'close' | undefined`, so `intent === 'clsoe'`
   does not compile. An undeclared value logs a `console.error` outside
   production and arrives as `undefined`.
5. **Validates**, then calls `onSubmit(values, { intent })` with the
   schema output.
6. **Resets after success.** The form's defaults become the values that were
   submitted, so it is clean, while anything typed during the save stays dirty.
   The reset uses the submitted input, not the server's response; forms whose
   API rewrites values must reload them. Errors set during `onSubmit` (for
   example with `setFieldError`) skip the reset, and so does a thrown error.

```tsx
const onSubmit = async (values: EventFormOutput, { intent }: SubmitContext) => {
  await updateEvent({ variables: toUpdateEventVariables(id, values) });

  if (intent === 'close') {
    navigate(eventListPath);
  }
};
```

**Unsaved changes.** While the form is dirty and not submitting, closing or
reloading the tab asks for confirmation (`useUnsavedChangesDialog`). It is on
for every form; opt out with `<editorForm.Form warnOnUnsavedChanges={false}>`.
In-app navigation is not blocked (see [Out of scope](#out-of-scope-and-known-limits)).

## Loading

- `defaultValues: async () => fromX(data)` runs once per mount. Fields render
  nothing until it resolves.
- A rejection is caught: `handle.loadError` holds it, `<LoadState/>` shows the
  error alert, a toast reports it, and submit is refused, so empty values can
  never overwrite the record. The alert's retry button calls `handle.retry()`,
  which reloads in place (`handle.reloading` is true meanwhile).
- To load another record, remount: put `key={id}` on the component that owns
  the form, as every edit view does.

### Configuration

`editorForm` is created in `libs/form/editor/src/lib/editor-form.ts`:

| Setting | Editor value |
| --- | --- |
| `components` | `libs/form/editor/src/lib/components.ts` (the kind map) |
| `intents` | `['save', 'close']` |
| `useTranslate` | react-i18next's `t` |
| `as` | `'form'` |
| `Loading` / `LoadError` | `FormLoading` (labelled spinner) / `FormLoadError` (alert, humanized error, retry) |
| `onLoadError` / `onSubmitError` | `enqueueSnackbar(humanizeError(error), { variant: 'error', autoHideDuration: 8000 })` |
| `useUnsavedChanges` | `useUnsavedChangesDialog(dirty)` |
| `mode` / `reValidateMode` | core defaults: `onTouched` / `onChange` |

A different host (a website mapping, later) calls `createForm` from
`@wepublish/form/core` with its own map and translator:

```tsx
import { createForm } from '@wepublish/form/core';

export const websiteForm = createForm({
  components: { string: WebsiteTextField, boolean: WebsiteSwitch },
  useTranslate: useWebsiteTranslate,
});
```

## Writing a field component

Styling a kind means changing its component in `libs/form/editor/src/lib/fields/`;
every form follows. The shared look lives in
`libs/form/editor/src/lib/field-anatomy.tsx` (internal to form-editor):

| Helper | Does |
| --- | --- |
| `FieldLabel({ field })` | The label, then `*` when required, then an `InfoTooltip` for the description (a ReactNode description gets the tooltip label `form.field.moreInfo`). |
| `fieldAnatomy(field)` | `{ label, ariaLabel, helperText, helperTextId }`: no label with `hideLabel` (its text moves to `ariaLabel`), the error in place of the helper text, `${field.id}-helper-text` as the id. |
| `textFieldProps(field, { input?, htmlInput? })` | Everything a MUI `TextField` needs: id, name, label, helper text, `error`, `required`, `disabled`, placeholder, `fullWidth`, `slotProps.input.readOnly`, `slotProps.inputLabel.required: false` (the `*` is ours, not MUI's), `slotProps.htmlInput['aria-label']`. |

Groups (`ArrayField`, `ObjectField`, `DiscriminatedUnionField`) use
`fields/field-group.tsx`: a `role="group"` titled with `FormSectionTitle`.

**The `useField<T>()` contract.** A field component calls one hook and gets:

- identity: `name` (the resolved path), `id`;
- value plumbing: `value`, `onChange(next)`, `onBlur`, `ref`. `onChange` runs
  `normalize`, then `guard`, turns `''`/`null`/`undefined` into the cleared
  value, stores it and calls `onValueChange`;
- text: `label`, `description`, `helperText`, `placeholder` (translated),
  `hideLabel`;
- state: `error` (translated, with params), `invalid`, `required`, `disabled`
  (also true while loading), `readOnly`;
- `options` (labelled, for enum-like kinds), `info` (`format`, `patterns`,
  `minLength`, `maxLength`, `minimum`, `maximum`, `exclusiveMinimum`,
  `exclusiveMaximum`, `multipleOf`, `integer`), `kind`, `kindParams`.

```tsx
import { TextField as MuiTextField } from '@mui/material';
import { useField } from '@wepublish/form/core';

import { textFieldProps } from '../field-anatomy';

export function SlugField() {
  const { ref, ...field } = useField<string | null | undefined>();

  return (
    <MuiTextField
      {...textFieldProps(field)}
      inputRef={ref}
      value={field.value ?? ''}
      onChange={event => field.onChange(event.target.value)}
      onBlur={field.onBlur}
    />
  );
}
```

Rules:

- **Destructure `ref`** (`const { ref, ...field } = useField()`). Passing
  `field.ref` in JSX makes the compiler treat the whole object as a ref.
- **`ref` goes to the focusable element**, so the summary and RHF can focus
  it: `inputRef` on MUI text inputs (their `ref` lands on a wrapper div),
  `slotProps.input.ref` on `Switch`/`Checkbox`/`Radio`.
- **Controlled values** render `value ?? ''` (`value ?? false` for a toggle
  that may start `undefined` inside an optional group).
- **Emit the empty value** (`''` or `null`) to clear; never `NaN`.
- **MUI 9**: `slotProps`, never `InputProps`/`inputProps`/`InputLabelProps`.
- **Never read `useFormContext().formState`**; use `useFormState` or
  `useFormStatus`.
- Read kind params through a type guard and throw on a missing one, as
  `TagsField` does (`kind "tags" needs a tagType`).

Container hooks for custom groups: `useArrayField()` (`items`, `itemKeys`,
`count`, `append`, `remove`, `move`, `renderItem(index, override?)`),
`useObjectField()` (`keys`, `renderField(key, override?)`) and
`useUnionField()` (`discriminator`, `options`, `active`, `setType`,
`renderBranch()`). Each also returns the field's presentation (label, error,
flags).

**A one-off component in a feature lib** imports `useField` from
`@wepublish/form/editor` and follows the same rules by hand (the anatomy
helpers are not exported), then is used through `bindComponent`.

**Registering a new kind** (only in form-editor):

1. Add a helper to `form-fields.ts`: `slug: () => withKind(z.string().min(1), 'slug')`
   (a third argument passes kind params).
2. Write the component in `fields/<kind>-field.tsx` with a spec.
3. Map it in `components.ts` (`slug: SlugField`) and export it from
   `src/index.ts`.
4. Add any new `form.*` texts to en/de/fr.

## React Compiler rules

The editor compiles everything with the React Compiler, and these traps pass
lint and uncompiled tests. form-core, form-editor, apps/editor and the migrated
libs therefore run their specs compiled (`reactCompiler: true`), and both form
libs lint `.watch()` calls and `.formState` reads as errors.

1. **Never spread RHF's form object.** `{ ...form, extra }` is memoised on
   `form`, which never changes identity, while RHF reassigns `form.formState`
   on every render; the copy keeps its first state and `isLoading` stays
   `true`. That is why `useSchemaForm` returns a handle with `form` inside.
2. **Never read `useFormContext().formState`**; it stays at its first value.
   Use `useFormStatus()` or `useFormState()`.
3. **`useWatch`, never `watch()`.** The compiler memoises `watch('x')` once.
4. **Choose components by property access during render**
   (`components[kind]`), never through a hook result or `useMemo`.
5. **Field components destructure `ref`.**
6. **Item layouts and bound components are module-level.**
7. **No schemas with `.meta()` in render.**
8. **Keep optional chains out of `try` blocks.** The compiler skipped
   `ConsentCreateView` entirely over a `?.` inside a `try`; assign the result
   inside the `try` and read it after the block. A skipped component looks
   fine and passes uncompiled tests, so the migrated views carry a spec that
   checks for the compiler's memo cache (`apps/editor/src/app/reactCompiler.spec.ts`
   for app views, `is memoised by the React Compiler` in
   `consent-create-view.spec.tsx`); add new views to it.

## Testing

Write the failing spec first (repo rule). Spec helpers come from
`@wepublish/form/editor/testing` (inside form-editor itself, import
`'../../testing'`; the alias is rejected within the project):

| Helper | Does |
| --- | --- |
| `renderEditorForm(ui, { mocks?, route?, path? })` | Renders in ThemeProvider (transitions off), a data router (`createMemoryRouter`, so `useBlocker` works) at `route`, Apollo `MockedProvider` with `mocks`, plus a `SnackbarHost`. Errors thrown while rendering are rethrown, not caught by the router. With `path`, wraps `ui` in a matching `<Route>`. Returns the render result plus `user` (userEvent). |
| `renderFormRoutes(routes, { route, mocks?, wrapper? })` | `renderEditorForm` around a `path → element` map, a catch-all route and a path probe; returns `currentPath()` as well. `wrapper` adds providers (`I18nextProvider`, `AuthContext`). |
| `formSectionOf(title)` | `within` the section region named `title`. |
| `formHeader()` | `within` the page header of a form view (title, back link, save buttons). |
| `getFieldByLabel(label)` / `queryFieldByLabel(label)` | Finds the `input`/`textarea` for a label. Use it whenever the field has a description: the tooltip button sits inside the `<label>`, so plain `getByLabelText` finds two elements. |
| `drawerClosed(options?)` | Waits until no MUI drawer is open. |
| `autocompleteOf(input)`, `clearButtonOf(user, input)` | Reach an Autocomplete's root and its Clear button (hidden until focus). |
| `stubSortableRowRects()` | Gives `li`/`tr` rows stacked boxes so dnd-kit's keyboard sensor can reorder a `sortable` `ArrayField` in jsdom: focus a row's `form.array.dragHandle` button, press `[Space]`, `[ArrowDown]`/`[ArrowUp]`, `[Space]`. Returns the spy; call `mockRestore()` at the end. |
| `imageFixture`, `imageListMock`, `imageMock`, `updateImageMock`, `tagFixture`, `tagListMock`, `tagMock`, `pageFixture`, `pageListMock`, `paywallFixture`, `paywallListMock`, `memberPlanFixture`, `memberPlanListMock`, `userFixture`, `userListMock` | Typed picker data and reusable Apollo mocks that match any variables and honour search and paging. |

There is no i18n mock: texts render as their keys, and a required label reads
`'event.form.name*'`. To test interpolated text, wrap the view in
`I18nextProvider` with an `i18next.createInstance()` holding the few strings
you need (consent specs do this for `{{slug}}`).

```tsx
import { screen, waitFor } from '@testing-library/react';
import { editorForm, FormErrorSummary } from '@wepublish/form/editor';
import { getFieldByLabel, renderEditorForm } from '@wepublish/form/editor/testing';
import { z } from 'zod/v4';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'event.form.name' }),
});

const { Field } = editorForm.fieldsFor(schema);

function View({ onSubmit }: { onSubmit: (values: z.output<typeof schema>) => unknown }) {
  const handle = editorForm.useSchemaForm(schema);

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <FormErrorSummary />
      <Field name="name" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

it('submits the typed name', async () => {
  const onSubmit = vi.fn();
  const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

  await user.type(getFieldByLabel('event.form.name*'), 'Konzert');
  await user.click(screen.getByRole('button', { name: 'save' }));

  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Konzert' }, expect.anything())
  );
});
```

Spec gotchas seen during the build:

- An open MUI drawer hides the rest of the page from role queries until it
  closes; await `drawerClosed()`.
- Without an i18n instance react-i18next's `t` changes identity on every
  render, so effects depending on `t` re-run in specs.
- happy-dom turns a non-numeric value in a number input into `''`.
- Assert mutation variables exactly (`toStrictEqual` on the mock's
  `variables`); untouched optional strings arrive as `''`.

**Project setup for a lib with library forms** (consent-editor and
banner-editor are the templates): `reactCompiler: true` in `vitest.config.ts`,
a `typecheck` target in `project.json` that runs
`tsc --noEmit -p <lib>/tsconfig.spec.json --incremental --tsBuildInfoFile tmp/tsc-cache/<project>-spec.tsbuildinfo`
with `NODE_OPTIONS=--max-old-space-size=8192`, and
`"@testing-library/jest-dom"` in the spec tsconfig's `types`. Test-only helpers
go in `src/testing/`, excluded by `tsconfig.lib.json`.

## Migration recipe

For each remaining editor form:

1. **Pin today's behaviour first.** Write a characterization spec against the
   unchanged view: labels, defaults, option order, required errors,
   navigation after save / save and close / create, and the exact mutation
   variables. Run it green on the old code. Then change the assertions to the
   intended new behaviour and watch them fail for the right reasons before
   migrating. The reference migrations each found real bugs this way
   (unhandled rejections on server errors, the image drawer saving the outer
   form, a removed image coming back, stale values on route change).
2. **Schema.** Create `<name>.schema.ts` at module level with `zod/v4` (the
   file name is load-bearing for the locales scan). Only fields the form edits
   or shows. Keys in `.meta()` and `error`, `.meta()` after checks.
3. **Rewrite the schema parts:**
   - `z.custom` and hand-built pickers → a `formFields.*` helper;
   - `z.coerce.number()` → `z.number()` (the component emits numbers);
   - ISO date strings → `formFields.dateTime()` or `z.date()`, converted in
     the mappings;
   - a `tags` + `tagIds` mirror → one `formFields.tags(type)` field of ids;
   - `t()` factories and `lazyMessage` → literal keys;
   - keep `.regex(re, { error }).or(z.literal('')).nullish()`, real branch
     first;
   - create-only requirements → separate create/edit schemas built from a
     shared base, or a `required` override plus a refine;
   - rules across fields → `crossField`, applied last; hidden fields
     conditionally valid.
4. **Mappings.** `fromX(record): FormDefaultValues<typeof xSchema>` and
   `toXVariables(values: FormOutput<typeof xSchema>)`: ids out of objects,
   ISO strings, `''` to `null` where the API wants it.
5. **View.** Put a module-level `formView(xSchema, { paths, sections,
   serverErrors })` in `<name>.view.ts` (see [Form views](#form-views)): every
   top-level key in exactly one section, `layout: 'cards'` only for card
   pages like settings. The route components call `useCreateForm` /
   `useEditForm` / `useSingletonForm(xView, { title, load, save })` and
   render `<FormPage controller/>`, or `<FormDrawer>` + `<FormDrawerPanel>`
   with `useRouteDrawer` for drawers. Load with `useQueryLoader` in a
   component keyed by the record id; create `save` returns the new id.
6. **Server errors.** Map known ones with `serverErrors` rules
   (`uniqueConstraint(...)` understands both Prisma message forms); call
   `setFieldError(context.form, …)` inside `save` for anything a rule cannot
   describe; let the rest throw. Remove the old `onError` toasts.
7. **Panels in `libs/ui/editor`** cannot use the library. Move a panel next to
   its only route in the same change that migrates it
   (`PaymentMethodEditPanel`, `NavigationEditPanel`). `ImageEditPanel` stays;
   the portal guard covers it.
8. **Partial saves** use `getChangedValues`; write-only secrets use
   `formFields.secret()`.
9. **Project and texts.** Apply the project setup above; add the view to
   `reactCompiler.spec.ts` when it is in apps/editor; delete translation keys
   nothing uses any more (search the repo first).
10. **Verify** (below) and update this README when the form needs something
    the library did not have.

**Worked examples**

| Form | Files | Shows |
| --- | --- | --- |
| Consent | `libs/consent/editor/src/lib/consent.schema.ts`, `consent.view.ts`, `consent-create-view.tsx`, `consent-edit-view.tsx` and their specs | the smallest form view: two sections, `useCreateForm` / `useEditForm` + `FormPage`, `useQueryLoader`, a `uniqueConstraint('slug')` rule with default params, `key={id}` |
| User consent | `libs/consent/editor/src/lib/user-consent.schema.ts`, `user-consent.view.ts`, `use-consent-options.ts`, `user-consent-create-view.tsx`, `user-consent-edit-view.tsx`, specs | `user<T>()` and `entity` pickers with hook `fields` props, a composite unique rule (`userId`, `consentId`) |
| Event | `apps/editor/src/app/routes/events/event.schema.ts` (schema and mappings), `event.view.ts`, `eventCreateView.tsx`, `eventEditView.tsx`, specs | `crossField` on two date-times, rich text, `tags()` ids, an aside section, Dynamic `hidden` on a read-only field, hook `fields` hiding `status` on create |
| Banner | `libs/banner/editor/src/lib/banner.schema.ts` (with `fromBanner`, `toBannerInput`), `banner.view.ts`, `create-banner-form.tsx`, `edit-banner-form.tsx`, specs and `src/testing/` | main sections plus an aside (`placement: 'aside'`), radio enum with `optionLabelPrefix`, defaulted numbers with `.min(0, { error })`, `pages()` ids, `image`, an actions table (`variant: 'table'`) |
| Tags | `apps/editor/src/app/routes/tags/tag.schema.ts` (with `tagPaths`, `tagTitleParams`, `fromTag`), `tag.view.ts`, `tagCreateView.tsx`, `tagEditView.tsx`, specs | one view for five tag types with per-type `paths`, a live title via `titleParams`, `color({ alpha: false })`, a `(tag, type)` unique rule |
| Paywall | `apps/editor/src/app/routes/paywall/paywall.schema.ts`, `paywall.view.ts`, `bypassTokenRow.tsx`, `paywallCreateView.tsx`, `paywallEditView.tsx`, specs | an aside, collapsible sections, an item layout (`'bypassTokens.*': { layout }`) with a QR dialog, member-plan pickers |
| Navigations | `apps/editor/src/app/routes/navigations/navigation.schema.ts`, `navigation.view.ts`, `navigationDrawer.tsx`, `navigationList.tsx`, specs | a route drawer (`useRouteDrawer`, `FormDrawer`, `FormDrawerPanel`) with the discard prompt, a links array of a discriminated union (external, page, article) |
| Website analytics | `apps/editor/src/app/routes/website-settings/website-analytics.schema.ts`, `website-analytics.view.ts`, `website-analytics.tsx`, spec | a singleton sub-page: `useSingletonForm` + `FormPage` with a `closePath` back link, nested paths (`'plausible.key'`) as section entries, a `crossField` per provider group, keys hidden until enabled (view `fields`), `<Trans>` helper texts as hook `fields` |
| Settings | `libs/settings/editor/src/lib/settings.schema.ts`, `settings.view.ts`, `settings-page.tsx`, spec | the only cards layout (`layout: 'cards'`, `span: 'full'` on wide cards), a singleton with `confirm` and a `format` for the paywall id, enum-keyed paths, one mutation per changed key with `setFieldError` for the rejected ones |

## Verify

```sh
pnpm nx run-many -t test -p form-core form-editor --skip-nx-cache --parallel=1
pnpm nx run-many -t lint typecheck build -p form-core form-editor --parallel=1

# a migrated lib form
pnpm nx run-many -t test lint typecheck build -p <domain>-editor --parallel=1

# a migrated apps/editor form
pnpm nx test editor --parallel=1 -- src/app/locales src/app/formErrorSummary.spec.ts src/app/reactCompiler.spec.ts src/app/routes/<route>
pnpm nx run-many -t lint typecheck -p editor --parallel=1

# before calling it done (repo rule)
pnpm nx affected -t lint test --uncommitted --parallel=1
```

form-core's test run includes its type tests (`*.test-d.ts`); vitest ignores
type errors outside `it` blocks, so run `nx typecheck form-core` as well. The
`typecheck` targets cover spec files; `nx build` covers library code only.

## Out of scope and known limits

Not built:

- **Blocking in-app navigation** on unsaved changes; `BrowserRouter` has no
  `useBlocker`, so it needs a data-router migration.
- Autosave and immediate-mutation sub-editors (flow filters, system mails, the
  SEO checklist, block styles, poll answers), the mail-send wizard, list
  filter bars.
- The article and page editors, and the remaining editor forms (the recipe
  above).
- A website mapping of the core.
- Async field validation such as slug availability.

Known limits of what is built:

- Fields of a union branch ignore a union-level `disabled`/`readOnly`
  (`renderBranch()` takes no override); a form-level `disabled` works.
- Array table headers show label and description, no `*`.
- Sorting is by buttons only, no drag and drop.
- `MultiSelectField` chips show the raw value when an option label is a
  ReactNode.
- Page and member-plan pickers show a stored id as is when they have not
  loaded that record (pages load 200, member plans 50 per page).
- Date inputs have no `required` attribute (the `*` shows it), and a date
  field with `hideLabel` has no accessible name; the date picker's clear
  button is labelled in English.
- Resetting the form to `null` does not empty `RichTextField`.
- `CurrencyField` has no negative amounts; `EntitySelectField` selects one
  object, not several.
- The reset after save uses the submitted values, not the server response.
