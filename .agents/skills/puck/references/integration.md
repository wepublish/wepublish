---
name: integration
description: End-to-end walkthrough for adding Puck to an existing application — survey, install, config, routes, persistence, auth, verification.
metadata:
  required_access:
    - CODEBASE
    - PACKAGE_INSTALL
    - DEV_SERVER
---

# Adding Puck to an existing application

Steps 1–2 are specific to an existing codebase; a new app scaffolded with
`npx create-puck-app` arrives with them done and starts at step 3, replacing the recipe's
filesystem persistence and open `/edit` route.

## 1. Survey before proposing anything

Establish these from the repo; only ask what the repo can't answer.

| Fact                             | Where to look                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Framework and router             | `package.json`, plus `app/` vs `pages/` vs `routes/`                            |
| RSC in play                      | Next.js App Router, or an existing `"use client"` convention                    |
| Styling system                   | Tailwind config, CSS modules, emotion/styled-components, design-system package  |
| Where content should live        | the existing DB/ORM/CMS — grep for a data layer before assuming there isn't one |
| Which components become editable | ask; do not guess the scope                                                     |

Then state the plan — component list, routes, storage — and get agreement before editing.

## 2. Install

`npm i @puckeditor/core --save`. React 18+.

## 3. Config

Create `puck.config.tsx` at the project root, typed with `Config<Props>` so `fields` and
`render` params stay in sync. Give every component `defaultProps` — a component dropped in
with `undefined` props looks broken, and reads as Puck being broken.

See references/config-authoring.md for choosing components and designing fields.

## 4. Editor route

`<Puck>` is client-only: in an RSC framework it sits behind `"use client"`, with
`@puckeditor/core/puck.css` imported from the server component above it. Load the stored
`Data` before mounting — it cannot change afterwards. `<Puck>` defaults to `height: 100dvh`,
so give it a route without the app's usual header/footer chrome, or pass `height`.

Per-framework route shapes: references/frameworks.md.

## 5. Persistence

`Data` is plain JSON. Store it the way the app stores everything else — typically a `jsonb`
column keyed by page path. Do not introduce a datastore for this.

`onPublish` for explicit saves; `onChange` only for drafts/autosave, and debounce it because
it fires per keystroke.

## 6. Render route

Fetch the payload by path and pass it to `<Render>`, 404 if absent.
[`root.props`](https://puckeditor.com/docs/integrating-puck/root-configuration.md) is the right
home for SEO fields — read them in the framework's metadata hook.

If any config component is client-only, follow
[server components](https://puckeditor.com/docs/integrating-puck/server-components.md): either
add `"use client"` to the component files and _call_ them in `render` (`render: (props) =>
<Thing {...props} />`, not `render: Thing`), or split into client/server configs sharing one
`Config<Props>` type. A server config that omits `richtext` or `slot` field definitions
renders escaped strings and un-nested children — keep the field definitions in both.

## 7. Auth

Put the app's existing authorization in front of the editor route _and_ the save endpoint.
The `create-puck-app` recipes ship an open `/edit` route with a warning; do not reproduce
that in a real app. If the app has no auth to reuse, say so explicitly rather than leaving
it implied.

## 8. Verify

Start the dev server and confirm: the editor loads, the component list shows the app's
components, a dropped component renders **styled**, publishing writes to the store (check
the store, not the network tab), and the render route matches the preview.

Unstyled previews and hydration errors are defects to fix, not caveats to report —
references/troubleshooting.md.
