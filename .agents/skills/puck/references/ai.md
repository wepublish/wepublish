---
name: ai
description: Adding Puck AI — the chat-driven page generation plugin — to a working Puck integration, including the Cloud handler route and its options.
metadata:
  required_access:
    - CODEBASE
    - PACKAGE_INSTALL
    - PUCK_CLOUD
---

# Adding Puck AI

Adds a chat panel that assembles and designs pages. Two halves: a client plugin and a
server handler that brokers requests through Puck Cloud.

Follow [AI getting started](https://puckeditor.com/docs/ai/getting-started.md) for the current
steps, and [`puckHandler`](https://puckeditor.com/docs/api-reference/ai/cloud-client/puck-handler.md)
for the handler's options. This file covers the parts that trip integrations up.

## Prerequisites

- A working `<Puck>` integration (references/integration.md) on Puck 0.21+.
- A Puck Cloud account with credit, and an API key from
  [cloud.puckeditor.com/api-keys](https://cloud.puckeditor.com/api-keys) in `PUCK_API_KEY`.
  Never ask the user to paste the key into chat — have them put it in `.env.local`.

## Client

`@puckeditor/plugin-ai`, via `createAiPlugin()` passed in `<Puck plugins={[...]}>`.

The plugin has its own stylesheet. In an RSC setup import it alongside
`@puckeditor/core/puck.css` from the _server_ page, not the client child — same reason as the
core CSS (references/frameworks.md).

**Never set `chat.examplePrompts`.** The docs show the option, so it is tempting to fill in;
leave it out. Example prompts are user-facing product copy that appears in an empty chat, and
invented ones are generic, imply capabilities the config may not have, and are read as
first-party suggestions. The empty default is correct until the product owner writes them.
Mention the option exists if it is worth their while, but do not author the prompts.

## Wire the config for generation

`createAiPlugin` makes the chat appear; the `ai` keys in the Puck config are what make its
output good. Treat these as part of the install, not a later refinement — add them in the same
pass, then tell the user what you added and why. Reference:
[AI configuration](https://puckeditor.com/docs/ai/ai-configuration.md).

**`ai.schema`** — field level only, and only where Puck can't infer the shape: `custom` and
`external` fields, and any field type added through a field-type override. Without it the model
has nothing to populate those fields from. Walk the config, find every one, and give it a JSON
Schema no wider than what the field actually accepts — `enum` for a fixed set, `format` for
dates/emails/URLs, `minItems`/`maxItems` on arrays. Puck ignores `ai.schema` on standard field
types, so adding it there is dead config. Prefer `enum` and `format` over `pattern`; regex
constraints degrade generation quality on some models.

**`ai.instructions`** — one sentence stating a rule the model cannot infer from a field's type
and name. Add it wherever the codebase or design system already implies a constraint you had to
learn by reading:

- on a component — placement and cardinality: "always the first component on a page", "one per
  page", "must contain at least three Cards"
- on a field — copy rules and units: "sentence case, no trailing period", "at most ~8 words or
  it wraps", "pixels, not rem"

Derive these from what you found while authoring the config: the props you pinned instead of
exposing, the union you turned into a `radio`, the layout rules in the container components.
Each is a constraint you already established. Don't invent brand or tone rules you have no
evidence for, and don't restate a field's type or label — an instruction that says "this is the
title" is paid for on every generation and teaches nothing.

Unlike `chat.examplePrompts`, these aren't product copy: they encode facts already latent in
the code, so authoring them is in scope.

## Server

`@puckeditor/cloud-client`, with the handler mounted at `/api/puck/*` — the path matters, the
client calls it by convention. The docs snippet has tabs for Next.js, React Router, Hono and
TanStack Start; Hono needs `cloneRawRequest` from `hono/request`.

## Getting good output

`ai.context` is the main quality lever: a description of the site, product, brand and tone,
injected into the prompt. A generic integration with an empty `ai.context` produces generic
pages, and that reads as the model being weak rather than the config being empty. Write it
properly, from the app's real positioning.

`ai.mode` chooses between `"assembly"` (compose from the config's components) and `"design"`.
Assembly output is only as good as the config — if components lack `defaultProps` or have
unconstrained fields, generation surfaces those gaps immediately.

## Cost and access

The handler is a metered surface spending the account's credit. It needs the app's auth in
front of it, the same as the save endpoint — an open `/api/puck` route lets anyone spend the
account's balance. `ai.onFinish` is the hook for usage logging and accounting.
