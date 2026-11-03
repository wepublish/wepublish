---
name: puck
description: Build with Puck, the visual editor for React. Use when needing to (1) add Puck, a page builder, or a visual/drag-and-drop editor to an application, new or existing, (2) author or extend a Puck config so the app's own components become editable, (3) debug a Puck integration — unstyled previews, RSC errors, iframe or persistence problems, or (4) look up how any Puck API, field, or plugin works.
allowed-tools:
  - WebFetch(domain:puckeditor.com)
  - Bash(curl *puckeditor.com/*)
  - Bash(npm view @puckeditor/* *)
  - Bash(npm ls @puckeditor/*)
---

# Puck

Puck is a visual editor for React. A `config` declares which of the app's components are
editable; the editor produces a JSON `Data` payload; the app stores that payload and renders
it back with `<Render>`. The app owns the data — there is no hosted content store.

## Core principles

1. **Docs first.** NEVER write Puck code from memory — fetch the relevant page (see
   [Documentation](#documentation) below). The API moves, and a wrong field or prop name
   costs more than the fetch. The package scope changed in 0.21 (`@measured/puck` →
   `@puckeditor/core`); run `npm ls @puckeditor/core` before advising anything
   version-sensitive.
2. **Expose the app's real components.** The value of an integration is the config. Do not
   invent generic Hero/Text/Button blocks when the app already has components.
3. **Don't reshape the app to fit Puck.** Adapt inside the component's `render`, not by
   editing the app's components.
4. **Confirm scope before editing.** Which components become editable, which routes get
   added, and where `Data` is stored are the user's decisions, and the expensive ones to get
   wrong.
5. **Verify in a browser, not a typecheck.** An integration that compiles and renders every
   component unstyled is the normal first-run outcome, not success.

## Documentation

Every docs page is available as markdown by appending `.md` to its URL — fetch these rather
than the HTML:

```
https://puckeditor.com/docs/getting-started.md
https://puckeditor.com/docs/api-reference/fields/slot.md
```

`https://puckeditor.com/llms.txt` is the full page index — fetch it first when unsure which
page covers something, then fetch that page's `.md`.

Caveat: the `.md` conversion currently strips `import` lines from code blocks, so fetched
examples show usage without the imports they need. Everything is imported from
`@puckeditor/core` unless the page says otherwise.

## Minimal integration

The whole API surface, in three files. Types, fields and props are documented in
[component configuration](https://puckeditor.com/docs/integrating-puck/component-configuration.md)
and the [`<Puck>` reference](https://puckeditor.com/docs/api-reference/components/puck.md).

```tsx
// puck.config.tsx — maps the app's components to editable Puck components
import type { Config } from "@puckeditor/core";
import { Hero } from "@/components/Hero";

type Props = { Hero: { title: string } };

export const config: Config<Props> = {
  components: {
    Hero: {
      fields: { title: { type: "text" } },
      defaultProps: { title: "Hello, world" },
      render: ({ title }) => <Hero title={title} />,
    },
  },
};
```

```tsx
// The editor — client-only. Import "@puckeditor/core/puck.css" from the server parent.
"use client";
import { Puck } from "@puckeditor/core";
import { config } from "@/puck.config";

export function Editor({ data }: { data: any }) {
  // onPublish receives the Data payload — persist it wherever the app stores content
  return <Puck config={config} data={data} onPublish={save} />;
}
```

```tsx
// The page — server-safe
import { Render } from "@puckeditor/core";
import { config } from "@/puck.config";

export default function Page({ data }: { data: any }) {
  return <Render config={config} data={data} />;
}
```

## Starting a new application

`npx create-puck-app my-app` scaffolds from a recipe: `next`, `next-ai`, `react-router`, or
`react-router-ai`. Pick by the user's framework, and the `-ai` variant only if they want
Puck AI (references/ai.md).

Read the generated README before changing anything — recipes ship deliberate shortcuts a real
app must replace: an unauthenticated `/edit` route, and persistence to the local filesystem
rather than a database. Both need fixing before deploy. From there the config, persistence and
auth guidance in references/integration.md applies unchanged.

## Use case specific references

- adding Puck to an existing application, end to end: references/integration.md
- choosing which existing components to expose and designing their fields: references/config-authoring.md
- wiring the editor and render routes for a specific framework or router: references/frameworks.md
- diagnosing a broken integration — unstyled previews, FOUC, RSC errors, hydration, drag-and-drop: references/troubleshooting.md
- adding Puck AI, the chat-driven page generation plugin: references/ai.md
- submitting feedback about this skill: references/skill-feedback.md

## Facts worth knowing before reading anything

- `<Puck>` is client-only. `<Render>` and
  [`resolveAllData`](https://puckeditor.com/docs/api-reference/functions/resolve-all-data.md)
  are the only RSC-safe APIs.
- `data` cannot change after `<Puck>` mounts. Load it before rendering.
- Puck renders the canvas in an iframe and syncs host stylesheets into it. Most "Puck is
  broken" reports are the app's styles not reaching that iframe —
  references/troubleshooting.md.
- Use the [`slot` field](https://puckeditor.com/docs/api-reference/fields/slot.md) for nested
  drag-and-drop areas. The legacy `DropZone` component has RSC problems.
- The editor route and the save endpoint are content-write surfaces. They need the app's auth
  before anything ships.
