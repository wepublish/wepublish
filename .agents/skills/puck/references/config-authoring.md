---
name: config-authoring
description: Choosing which of an app's existing components to expose in a Puck config, and designing their fields so the editor is usable.
metadata:
  required_access:
    - CODEBASE
---

# Authoring a config from an existing app

Field types, options and syntax are documented per field — start from
[fields](https://puckeditor.com/docs/api-reference/fields/base.md) and
[component configuration](https://puckeditor.com/docs/integrating-puck/component-configuration.md).
This file covers only the judgment those pages don't: which components to expose, and how to
shape their fields.

## Finding candidates

Survey the component tree before writing anything (`src/components`, `app/components`,
`packages/ui`). Good candidates are presentational, driven by props rather than their own
data fetching, and already used on content or marketing pages: sections, heroes, cards,
feature grids, CTAs, testimonials, media blocks, headings, layout primitives.

## Rejecting and adapting

| Component                       | Problem                          | Fix                                                                                                                                                                                                          |
| ------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fetches its own data            | props aren't the source of truth | expose the query args as fields, or use [`resolveData`](https://puckeditor.com/docs/integrating-puck/dynamic-props.md) / an [`external` field](https://puckeditor.com/docs/api-reference/fields/external.md) |
| Takes `children: ReactNode`     | not JSON-serializable            | use a [`slot` field](https://puckeditor.com/docs/api-reference/fields/slot.md)                                                                                                                               |
| Needs router/auth/theme context | breaks inside the editor iframe  | provide the context in `root.render`                                                                                                                                                                         |
| Dozens of props                 | unusable form                    | expose the 3–6 an editor actually changes; hardcode the rest in `render`                                                                                                                                     |

Adapt in `render` rather than editing the app's component — rename props, pin the ones that
shouldn't be editable, and keep the app's own call sites untouched.

## Field design

The failure mode is a faithful prop-for-prop mapping that no one can use. Aim for the
smallest field set that expresses real editorial intent.

- Prefer a constrained field over a free one: `radio`/`select` over `text` for variants, so
  editors can't produce states the design system doesn't support.
- Group related props with `object` rather than flattening ten sibling fields.
- Give every `array` field a `getItemSummary` — without it the editor shows "Item 1, Item 2".
- Expose spacing/layout only where the design system genuinely varies it. Unbounded padding
  fields are how authored pages drift off-brand.
- Set `defaultProps` everywhere.

## Layout and containers

An app usually already has section/container components encoding max-width and padding
conventions. Expose those as slot-bearing components so authored pages inherit the app's
layout rules instead of letting editors nest arbitrary divs. Restrict what can land inside
with the slot's `allow`/`disallow`.

## Structure

Group components with [categories](https://puckeditor.com/docs/integrating-puck/categories.md)
once past roughly eight, or the sidebar stops being navigable.

[`root`](https://puckeditor.com/docs/integrating-puck/root-configuration.md) wraps every page —
the place for page-level fields and app providers. Two traps: `root.render` must render
`children` or nothing appears, and overriding `root.fields` drops the default `title` unless
re-declared.

## Beyond static fields

Reach for these only when a static field set can't express the component:
[`resolveData`](https://puckeditor.com/docs/integrating-puck/dynamic-props.md) for derived
props, [`resolveFields`](https://puckeditor.com/docs/integrating-puck/dynamic-fields.md) for a
field set that depends on current props,
[`external` fields](https://puckeditor.com/docs/integrating-puck/external-data-sources.md) for
picking records from a CMS, and
[permissions](https://puckeditor.com/docs/integrating-puck/feature-toggling.md) to restrict what
editors can do per component.

Once a config is in production its prop shapes are a stored data format. Change them through
[data migration](https://puckeditor.com/docs/integrating-puck/data-migration.md), not by editing
rows.
