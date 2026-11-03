---
name: troubleshooting
description: Diagnosing a broken Puck integration — unstyled iframe previews, FOUC, RSC errors, escaped richtext, stale data, hydration mismatches, drag-and-drop offsets.
metadata:
  required_access:
    - CODEBASE
    - DEV_SERVER
---

# Troubleshooting a Puck integration

## Components render unstyled in the editor but fine on the public page

By far the most common report. Puck renders the canvas in an iframe and syncs stylesheets
from the host document, so anything not in a `<link>`/`<style>` in that document — or scoped
to a selector outside the iframe — doesn't reach the preview. Work through, in order:

1. Is the stylesheet loaded on the editor route at all? A framework that splits CSS per route
   won't have loaded the components' CSS, because the editor page never statically imports
   those components.
2. Tailwind: does the content glob cover `puck.config.tsx` and the files it renders? Classes
   only reachable through the config get purged.
3. Runtime style injection (emotion, styled-components): use
   `@puckeditor/plugin-emotion-cache`, or inject into the iframe via the
   [`iframe` override](https://puckeditor.com/docs/api-reference/overrides/iframe.md), which
   receives the iframe `document`.
4. Styles keyed off a class or attribute on `<html>`/`<body>` (dark mode, theme): mirror it
   onto the iframe document with the same override.

`iframe={{ enabled: false }}` will "fix" it by removing the isolation — it also disables
viewports and lets app styles bleed into the editor UI. Use it to confirm the diagnosis, not
as the fix. Full detail in [styling](https://puckeditor.com/docs/integrating-puck/styling.md).

## Flash of unstyled content when the editor loads

Puck loads its styles at runtime by default; bundle them instead. If bundling `puck.css`
leaks editor styles into the iframe, bundle `@puckeditor/core/no-external.css` and disable
style sync — see [styling](https://puckeditor.com/docs/integrating-puck/styling.md).

## Hook or context errors on the editor route

`<Puck>` is being rendered in a server component. Move it behind `"use client"`. Only
`<Render>` and `resolveAllData` are RSC-safe.

## Rich text renders as escaped HTML, or slots render nothing

The server-side config is missing the `richtext`/`slot` field definitions — field definitions
drive the data transforms, so both configs need them even when only one renders
interactively. See [server components](https://puckeditor.com/docs/integrating-puck/server-components.md).

## A component renders in the editor but not via `<Render>`

`render: MyComponent` passed directly where the client boundary needs it called:
`render: (props) => <MyComponent {...props} />`.

## Editor shows stale data after a save

`data` is read once at mount. Remount (change the `key`, or navigate) rather than trying to
drive `data` from state.

## Hydration mismatch on the public page

A config component producing non-deterministic output (`Date.now()`, `Math.random()`,
`window`). Make it deterministic, or compute the value in `resolveData` so it's stored in the
payload.

## Drag-and-drop feels offset or unresponsive

Usually a CSS transform or `overflow` on an ancestor of `<Puck>`. Render the editor at the
top level of its route rather than inside the app's layout chrome.

## Stored payloads no longer match the config

A renamed component or prop. Use
[data migration](https://puckeditor.com/docs/integrating-puck/data-migration.md) so existing
payloads upgrade on read.

## Anyone can open the editor

Expected if auth was never wired — the editor route and save endpoint both need the app's
authorization before deploying.
