# puck-content-editor

This lib holds everything Puck-specific behind the editor's Puck route: the
component configs, custom fields, AI schemas, field tabs, locking, edit-mode
behaviour, the conversion between Puck data and the API, and the canvas data
plugin.
The blocks themselves are rendered by `@wepublish/puck-content/website`; this
lib imports it, never the other way round.

## Block configs

Each component group has a `components/<group>/<group>.blocks.ts` that wraps
the group's configs with `withVisibility`, `withDataSource` and `withCSS`.
`config.ts` merges the four groups, adds field tabs and locking to every
component and exposes `getPuckConfig(kind)`; `config.types.ts` holds the Puck
types (`Components`, `PuckConfig`, `PuckData`). The keys of `Components`
must equal the website's `PuckBlockType`; a type test checks it.

A config renders the website component through `editorRender`:

```ts
render: editorRender(SliderRender, {
  minEmptyHeight: 200,
  editingProps: () => ({ dragDisabled: true }),
  useExtra: useSliderEditorExtra,
}),
```

- `inline` passes Puck's drag ref as `ref`.
- `minEmptyHeight` sizes every empty slot of the component.
- `editingProps` overrides props while editing.
- `useExtra` is a hook that supplies the component's `Extra` props (refs,
  `onSubmit`) while editing.
- `decorate` adds editor chrome around the element, such as form warnings.

A config whose editing view differs in structure renders its own editor
component that composes the website parts, such as `TeaserEditorRender`:
while editing, the Teaser never links (the link would swallow clicks meant for
the blocks inside) and keeps its content slot with a hint when it has no
record yet.

`editorRender` turns Puck's slot functions into `slots`, strips the envelope
keys (`puck`, `datasources`, `locked`, `grouped`, …), reads `data` for the
block from `PuckBlockDataContext` and wraps the element in `TeaserSlotBoundary`.

Lock and group are opposites. `locked` freezes a block's own content and
position but lets blocks be inserted into it. `grouped` (only offered for
blocks with slots) freezes the structure below it and leaves content
editable: `withGroupAll` takes drag, delete and duplicate from every block
inside a group (move up/down is disabled too), and `groupPlugin` sends a
canvas click inside a group to the outermost grouped block (a capture
listener on the iframe document). Blocks can still be dropped or inserted
into a group's slots; they become part of the group and are frozen from then
on. Blocks inside a group stay selectable through the Outline, and inline
text inside a group stays editable in the canvas while the group is selected.

Fields follow `<field>/<field>.field.ts` (types, zod v4 schema, `*FieldAi`,
pure helpers), `<field>.component.tsx` (React) and `<field>.ts` (the Puck
plugin). AI schemas use `zod/v4` and `toAiSchema`.

## Saving and loading

- `toPuckDocument(kind, data, config)` turns Puck data into
  `{puckBlocks, puckRegistry, rootProps}` for the create and update
  mutations. Slots follow the config, generated components keep their slot
  names as flat keys, and Lightbox and Listicle get their image datasources
  derived from their props. A block that lists records itself (Event) stores
  how many as the block field `consumes`, taken from its own prop through
  `puckBlockConsumes`; the API never reads props.
- `fromPuckDocument(kind, puckBlocks, puckRegistry, rootProps)` rebuilds the
  Puck data, with the registry in `root.props._dynamicConfig`.
- The registry is stored in Puck AI's `_dynamicConfig` shape, script,
  `streaming` and unknown component keys included. Autosave waits while a
  component is still streaming.

## Canvas data

`puckBlockDataPlugin` sends the unsaved blocks to the website-api
`PuckBlocksPreview` query (debounced, only when a block has a datasource) and
keeps the returned `data` by block id. It never dispatches into Puck, ignores
responses that a newer request has overtaken, and keeps the previous data
while loading or after an error.

## Running unit tests

Run `pnpm nx test puck-content-editor` to execute the unit tests via Vitest.
