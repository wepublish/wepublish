# puck-content-website

Renders Puck documents (pages and articles built in the editor's Puck route)
on a website. It is the read side of `@wepublish/puck-content/editor`: the
editor wraps these components for the Puck canvas, the website renders them
directly.

## Rules

- **No Puck, no editor.** Nothing here imports `@puckeditor/*`,
  `@wepublish/puck-content/editor`, `@wepublish/editor/api` or
  `@wepublish/ui/editor`. The one exception is
  `src/lib/generated/generated-block.component.tsx`, which hands blocks the
  Puck AI generated (`kind: generated`) to Puck's `<Render>`. The lib's
  `eslint.config.mjs` enforces this; run lint with `pnpm nx lint
puck-content-website`.
- **Puck loads lazily.** Only `src/lib/generated/generated-blocks.component.tsx`
  loads `generated-block.component.tsx`, through `React.lazy`, and only when a
  document has a generated block its registry knows. No other file may import
  that module statically, or every consumer bundles Puck and plugin-ai. Lint
  does not catch this; `puck-blocks-renderer.lazy.spec.tsx` does.
- The dependency runs one way: the editor lib imports this lib, never the
  other way round.
- Types come from `@wepublish/website/api` codegen (`FullPuckBlockFragment`,
  `FullPuckRegistryFragment`, `PuckBlockStyling`, …). Enum values cross the
  boundary as plain strings through `GraphQLShape<T>`; never cast.

## Rendering a document

Query `PuckPage` or `PuckArticle` and pass the revision's flat blocks and its
registry to `PuckBlocks`:

```tsx
<PuckBlocks
  blocks={page.latest.puckBlocks}
  registry={page.latest.puckRegistry}
  components={{ Title: { component: TenantTitle } }}
/>
```

`PuckBlocks` rebuilds the tree (`buildPuckBlockTree`), merges tenant
`components` over `puckBlockRegistry`, gives the first three top-level blocks
eager images and renders each block with `PuckBlockRenderer`. SEO and layout
come from the revision fields, never from Puck root props: `PuckPage` and
`PuckArticle` select `...FullPage` / `...FullArticle`, so tenants render SEO
with the existing `PageSEO` / `ArticleSEO` from `@wepublish/website/builder`
and the chrome with `DocumentLayout`. The editor canvas renders no SEO.

A teaser part (`TeaserTitle`, `TeaserLead`, …) reads its record from the
nearest `TeaserSlotContext.Provider`, which a block with a teaser datasource
sets through `TeaserSlotBoundary`. There is no root provider: outside any
teaser, `useTeaserSlot` throws and the block shows its error alert. Specs that
need "no teaser" wrap in `<TeaserSlotContext.Provider value={null}>`.

## Generated blocks

Blocks the Puck AI designed (`kind: generated`) render through Puck with a
config that plugin-ai's `withDynamicConfig` builds from the stored registry,
once per registry content hash (a cache of 32). Their slot children that are
our own blocks render through `PuckBlockRenderer` again.

- Components keep their plain registry names, so `data-puck-design="Hero"` is
  the same as in the editor. plugin-ai keeps registrations in one
  process-wide store by name, so a document re-applies its registry when
  another one that shares a name was applied after it: on the server
  synchronously while rendering, in the browser in a microtask after render.
  Two documents mounted together that share a name both show whichever
  registry was applied last; that collision is accepted.
- Scripts run in the browser only, never on the server, and are removed on
  unmount. The registry's root script runs once every generated block of the
  document has mounted (right away when there are none); a component's script
  runs once per name and script while any instance is mounted. Puck itself
  never sees a script.
- A block whose registry Puck cannot build renders nothing (`HideOnError`
  reports it to Sentry) and counts as mounted, so the rest of the document and
  the root script are unaffected.

## Writing a block

A block is a `PuckBlockComponent<Props, Extra>` registered in its group's
`components/<group>/<group>.registry.ts`. It receives
`{id, props, data, slots, styling, visibility, className}`:

- `props` are the stored component props; slots inside them are empty (`[]`).
- `data` holds the records the API resolved from the block's datasources
  (articles, pages, events, images, member plans, user subscriptions).
  Images, teasers, events and member plans come from here, never from an
  Apollo query in the component.
- `slots` are components: `getSlot(slots, 'content')({ className })` renders
  the children of a slot, or an empty box when there are none.
- `className` carries the styling and breakpoint visibility. It must land on
  the one root element the component renders (or the component returns
  `null`); a Fragment root breaks grid layouts.
- Components never read editor state. Editor-only behaviour reaches them as
  optional `Extra` props (refs, `onSubmit`, `ref`) that the website never
  passes.
- Text props may be React nodes in the editor (inline editing), so render
  them as children only.
- `.tsx` files export components only; factories such as `builderBlock` and
  `plainBlock` live in `.ts` files.

Teaser blocks read their teaser from `useTeaserSlot()`. Every block with an
article, page or event `slot` or `single` datasource provides the record from
its `data`; nothing provides one at the root (see above).

The `Teaser` block is the usual provider: it renders its `content` slot (the
teaser parts) in one `<article>`, or nothing when it has no record. With
`linkToRecord` it links the whole teaser through one empty link placed before
the content and stretched over the article (`position: absolute; inset: 0`),
never by wrapping the content, because editors may put a Button or another
interactive block inside and interactive content inside an `<a>` is invalid
HTML. Interactive descendants of the content (`a`, `button`, form controls,
`label`, `summary`, `[role="button"]`, `[tabindex]`) are lifted above the link
(`position: relative; z-index: 1`, zero specificity so blocks that position
their own buttons keep that position); everything else clicks through to the
record. The link carries the same `teaser.ariaLabel` (title, lead, authors) and
`selectTeaserTarget` as `BaseTeaser`, and draws the focus ring around the card.
The teaser parts never link to the record themselves.

`stylingToCss(theme, block.styling)` turns the codegen styling into an emotion
CSS object, for example `<div css={theme => stylingToCss(theme, styling)} />`.

## Running unit tests

Run `pnpm nx test puck-content-website` to execute the unit tests via Vitest.
