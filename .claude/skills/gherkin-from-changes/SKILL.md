---
name: gherkin-from-changes
description: Derive, review and rewrite Gherkin E2E specs (e2e/features/**/*.feature) — decide whether a branch's change deserves E2E at all and write a few complete, behaviour-centric user journeys that reuse existing steps; or review existing feature files and rewrite, merge or delete scenarios that are stale, brittle or low-value. Use when asked to "write e2e specs / gherkin / feature files for this branch / PR / these changes", "what should we e2e-test here", "does this need an e2e test", "review / clean up / rewrite the feature files", or when a change makes an existing journey wrong.
---

# Gherkin from branch changes

E2E journeys are the most expensive tests we have: slow, run against live
sites, and every new step is code to maintain. This skill turns a diff into
**the smallest set of realistic user journeys** that would catch a regression
nothing else catches — often zero. It also owns the quality of the journeys
already there: it may review, rewrite, merge or delete existing scenarios
(see "Review and rewrite"). Implementation of the steps is the
`gherkin-to-playwright` skill's job; test data and fakes are described in
`e2e/README.md`.

Two entry points, same rules:

- **From changes** (default): steps 1–8 below. Existing features the change
  touches are reviewed along the way (step 4).
- **Review only** ("review / clean up the feature files", or named files):
  skip to "Review and rewrite", working over the given files or all of
  `e2e/features/**`.

## 1. Collect the change

```sh
base=$(git merge-base HEAD origin/master)
noise=(':!**/gql/**' ':!**/graphql.ts' ':!**/schema-types.ts' ':!**/possible-types.ts'
       ':!**/*.generated.ts' ':!**/schema-v2.graphql' ':!**/next-env.d.ts' ':!pnpm-lock.yaml')
git log --oneline $base..HEAD
git diff --stat $base...HEAD -- . "${noise[@]}"
git status --short -- . ':!e2e' ':!.claude' "${noise[@]}"   # uncommitted feature work
gh pr view --json title,body 2>/dev/null
```

Uncommitted changes count only if they belong to the feature. Changes under
`e2e/` and `.claude/` are test infrastructure, not the change under test. The
same goes for a staged merge that brings the suite onto a feature branch. If
other uncommitted files look unrelated, ask rather than guess. The exclusions
drop generated code (codegen, schema, lockfile), which only mirrors the real
change.

Read the changed sources (not just the stat) and the PR description: the
intent behind the change is what the journey should protect.

## 2. Classify each change

| Change                                                                        | E2E?                                                                                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Website flow (`libs/*/website`) a reader can see or do                     | candidate → `features/website/`, generic                    |
| One tenant only (`apps/<tenant>`: overridden component, theme, page)       | candidate → `features/website/`, tagged `@app:<tenant>`     |
| Editor flow (`libs/*/editor`, `apps/editor`) staff can see or do           | candidate → `features/editor/`                              |
| API change that alters what a reader or editor experiences                 | candidate, in the app where it shows                        |
| Refactor, types, internal services, jobs, tooling, docs, CI                | no                                                          |

Many website changes reach every tenant through `libs/*/website`; write
those generically (no `@app:` tag, no tenant copy) so they can run against any
`E2E_APP`. Name in the report which tenant(s) and project(s) to run it
against, e.g. `E2E_APP=bajour … --project website`.

## 3. Gate on cost

A candidate earns a journey only if it does **at least one** of:

- crosses system boundaries (website ↔ API ↔ payment / mail / captcha),
- touches money, access or authentication,
- would be expensive to regress (revenue, lock-out, data loss, SEO),
- cannot be covered well by a Vitest unit or Storybook interaction test.

Budget: **0–2 new scenarios per branch.** Extending an existing journey (one
more `Then`, one more `Examples` row) beats adding a scenario. "No E2E needed,
because …" is a valid and common result — say it plainly and point to the unit
or Storybook test that should cover the change instead.

**Check that the suite can reach the boundary.** The only fakes are mailpit
(mail) and the SIMULATED payment provider; Turnstile uses test keys (see
`e2e/README.md` → "Test data and fakes"). A journey through any other external
service (Mailchimp, Stripe, Payrexx, a CRM, …) has no fake: the local stack and
review instances leave it unconfigured, so the feature does not even render.
Never fake it over HTTP. Ask the user to pick one:

- **a credential-backed capability**: a real test account, configured by the
  `Given` from `E2E_*` env vars and gated by a new capability tag (step 7). It
  only runs where those secrets exist.
- **not E2E-able**: report it as such, and name the integration or unit test
  that covers the provider call instead (usually a service spec that mocks the
  provider's SDK).

## 4. Take inventory

```sh
cd e2e && pnpm exec bddgen export   # every step that already exists
```

Read `e2e/features/**`. For each candidate, ask: does an existing journey
already walk past this behaviour? Then add an assertion there instead of a new
scenario. Match new wording to existing step phrasings.

Existing journeys are not frozen. If the change makes one **wrong** (the flow
changed, a step no longer describes what the user does) or reveals that it is
weak (it would not catch the regression), rewrite it as part of this change,
applying "Review and rewrite". Fixing an existing journey beats adding a new
one next to it.

## 5. Write journeys

- **Persona + goal** as the scenario title: "A reader buys a subscription to
  read a paywalled article".
- **Given** sets up state through data fixtures (API), never UI clicks.
- **When** is one coherent run of user actions.
- **Then** checks outcomes the user can observe — what the reader sees or
  receives — never database state.
- **Length follows the goal, not a step count.** Few journeys means each one
  runs until the persona reaches the goal in the title, alternating
  `When`/`Then` along the way (blocked → registers → reads again). Don't cut a
  journey short or split it to stay short. Split only when the goal changes,
  or when a later part needs a capability tag (`@mail`, `@payment`) the
  earlier part does not.
- Declarative language: no selectors, no copy that exists in one tenant only,
  no field-by-field checks.
- `Background` only for shared `Given`s; `Scenario Outline` only when the
  variants _behave_ differently (CHF vs EUR plan is not a different behaviour;
  pay vs decline is).

## 6. Reuse and abstraction

- Rephrase to hit existing steps before inventing new ones.
- New steps are parameterised and generic (`{string}`, `{int}`), so the next
  journey can reuse them.
- **Named entities:** Gherkin refers to things by a quoted alias. The `Given`
  creates synthetic data and stores it under the alias; later steps resolve it.
  This keeps specs readable and environment-independent.

  ```gherkin
  Given a paywalled article "Paid story" for the plan "test-abo-chf"
  When "Noah" opens the article "Paid story"
  ```

## 7. Tags

Every scenario gets a **domain tag** (`@paywall`, `@auth`, `@membership`,
`@comments`, `@seo`, …), `@app:<tenant>` if it only applies to some tenants,
plus **every capability tag** it needs, so runs that lack the capability skip
it with a reason instead of failing:

| Tag         | Needs                                 |
| ----------- | ------------------------------------- |
| `@mutating` | writes data: API, never prod         |
| `@mail`     | reads mails: mailpit (local only)     |
| `@payment`  | simulated payment provider (non-prod) |
| `@mailchimp` | real Mailchimp test audience (`E2E_MAILCHIMP_*`, non-prod) |

Read-only checks that are safe on production get no capability tag. These are
all the capabilities that exist (`requirements` in `e2e/support/env.ts`). A new
one, such as a test account for an external provider, takes a
`requirements` entry, a row in the README's Capabilities table and in this
table, and workflow secrets. Ask the user before adding one, because it
means credentials (see `gherkin-to-playwright`).

## 8. Validate and report

Write the `.feature` file(s), then `cd e2e && pnpm exec bddgen` — missing steps
are the expected red. Report:

1. each scenario → the change it covers → why it needs E2E (which gate),
2. what was deliberately **not** covered and why (and which cheaper test should),
3. the new steps to implement (bddgen's list),
4. existing scenarios you rewrote, merged or deleted (before → after, why).

Then offer to implement them with the `gherkin-to-playwright` skill.

## Review and rewrite

Review each scenario in scope against the rules of steps 5–7 and flag:

| Smell                                                   | Rewrite                                                         |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| Several micro-scenarios checking one flow piece by piece | merge into one journey that only passes if the flow works      |
| Imperative / UI wording (`click`, `fill`, selectors)    | declarative user intent (`subscribes to the plan …`)            |
| `Given` that clicks through the UI to set up state      | data-fixture `Given` (named entity)                             |
| `Then` on database or API state                         | what the user sees or receives                                  |
| Tenant copy in a generic scenario                       | neutral wording, or `@app:<tenant>` if it really is tenant-only |
| Missing domain / capability / `@app:` tags              | add them — a missing `@mutating` is a production risk           |
| `Scenario Outline` whose rows behave the same           | one scenario                                                    |
| Near-duplicate steps (`opens` vs `visits the article`)  | one phrasing, the one already implemented                       |
| Stale: describes behaviour the code no longer has       | rewrite to the current behaviour, or delete                     |
| Low value: fails the cost gate (step 3)                 | delete; name the unit / Storybook test that covers it instead   |

Rules for rewriting:

- **Coverage is preserved unless you say otherwise.** Every behaviour an old
  scenario checked is either in the new version, deliberately dropped (with
  the reason), or covered by a cheaper test you name.
- **Prefer existing step text.** Renaming a step's wording breaks its step
  definition: either rephrase onto another existing step, or update the
  definition in `e2e/steps/` in the same change (one wording, no aliases).
  `cd e2e && pnpm exec bddgen` must end with no missing steps unless new steps
  are intended.
- **A rewrite is a refactor:** where the suite can run (local stack or a
  review instance), run the affected scenarios before and after; a scenario
  green before must be green after, for the same reason.
- Rewrites and merges do not count against the 0–2 new-scenario budget;
  ending with fewer scenarios is a good outcome.
- Don't rewrite for taste alone. If a scenario follows the rules, leave it.

Report as a before → after table per file (kept / rewritten / merged into … /
deleted), with the reason, plus any step definitions you changed.

## Example: one journey, not five checks

Bad — five micro-scenarios, each a UI detail, each paying the full setup cost:

```gherkin
Scenario: Subscribe form shows the email field
Scenario: Subscribe form shows the plan picker
Scenario: Subscribe form requires a payment method
Scenario: Subscribe button shows the price
Scenario: Paywall shows a subscribe button
```

Good — one journey that only passes if all of the above work together, and
asserts what the reader actually wants:

```gherkin
@membership @paywall @mutating @payment
Scenario: A reader buys a subscription to read a paywalled article
  Given a paywalled article "Paid story" for the plan "test-abo-chf"
  And a signed-in reader "Noah"
  When "Noah" opens the article "Paid story"
  Then the paywall hides the rest of the article
  When "Noah" subscribes to the plan "test-abo-chf" from the paywall
  And "Noah" pays on the simulated checkout
  And "Noah" opens the article "Paid story"
  Then "Noah" can read the article "Paid story" in full
```

The form details belong in `subscribe.spec.tsx` / Storybook.
