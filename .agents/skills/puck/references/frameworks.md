---
name: frameworks
description: Where the editor and render routes go per framework — Next.js App and Pages Router, React Router, TanStack Start, Vite SPA, Astro.
metadata:
  required_access:
    - CODEBASE
---

# Route shapes per framework

`<Puck>` is client-only in every framework; `<Render>` is server-safe. What changes is where
the client boundary and the CSS import go. Fetch the framework's own routing docs for exact
file conventions — this file is only the Puck-specific placement.

## Next.js App Router

Three files: a server page that imports `@puckeditor/core/puck.css` and loads the stored
payload, a `"use client"` child that renders `<Puck>`, and a separate public route rendering
`<Render>`.

- Mark the editor route `dynamic = "force-dynamic"`; leave the public route static.
- CSS must be imported in the _server_ page, not the client child, so it's in the document
  Puck syncs into the iframe.
- The `/edit`-suffix pattern: expose `/edit/[[...path]]` and rewrite `*/edit` to it in
  `middleware.ts`, so any public page is editable in place while staying statically rendered.
  `apps/demo` in the Puck repo is the reference implementation.

## Next.js Pages Router

No RSC constraints — import the CSS in the page and render `<Puck>` directly, loading the
payload in `getServerSideProps`. If the bundler rejects a CSS import outside `_app`, move the
import to `_app.tsx` and gate on route instead.

## React Router (framework mode) / Remix

A splat route (`edit/*`) with `loader` for the payload and `action` for the save. With SSR
on, `<Puck>` still needs to be client-only — mount it behind a mounted check or a
`clientLoader`. The Remix recipe was removed in 0.22; use the React Router one.

## TanStack Start

A splat file route (`routes/edit.$.tsx`), payload via `loader`, `<Puck>` in the component.

## Vite / CRA SPA

The simplest case: one route for the editor, one for the render, payload over `fetch`. Render
a loading state until the payload resolves — `<Puck>` must not mount before its `data` exists.

## Astro and other non-React hosts

`<Puck>` in an island with `client:only="react"`. `<Render>` can be an island too, or
prerendered through a React renderer if the config is RSC-safe.

## Save endpoint

Framework-agnostic and ordinary app code: authorize the caller, then upsert the JSON payload
keyed by page path. Authorization is not optional — see references/integration.md.

## Puck AI handler

`puckHandler` mounts at `/api/puck/*` and has a per-framework snippet for Next.js, React
Router, Hono and TanStack Start in the
[docs](https://puckeditor.com/docs/api-reference/ai/cloud-client/puck-handler.md). See
references/ai.md.
