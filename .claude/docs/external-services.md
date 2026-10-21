# External services

## Payment Provider

- Stripe
- Mollie
- Payrexx
- Bexio

- Simulated (`simulated` type) — no external service: `createIntent` sends the
  customer to a checkout page served by the API at
  `/payment-webhooks/<providerId>`, where Pay / Decline / Cancel post back
  through the normal webhook path. With `offSessionPayments`, renewals are
  charged straight away — or declined when "Decline renewals"
  (`simulated_declineRenewals`) is ticked, to test failed recurring payments.
  Guarded by `isSimulatedPaymentAllowed()` (`@wepublish/utils/api`): only when
  `APP_ENVIRONMENT` is set and not `production` (unset counts as production —
  `NODE_ENV` is `production` on review too). Otherwise the API refuses to
  create it and skips existing rows when loading providers; the editor hides it.

## Email Provider

- Mailgun
- Mailchimp — the newsletter editor (`libs/newsletter`, behind the
  `newsletter-editor` feature, `WEP_FEATURES=newsletter-editor` locally) pushes
  drafts, never sends, through the Marketing API key and list of the sync-provider integration

Mail, challenge (captcha) and Mailchimp sync run with exactly one provider
each: the runtime uses the first non-deleted row. Their `create*Setting`
mutations only succeed while none exists (the editor then shows «Einrichten»),
and there is no delete mutation, so a medium never ends up without one. Change
type or credentials on the existing row instead.

## PDF Renderer

Renders letters to pdf. One `settings.pdfrenderer` row; editors switch by its
`type` (which clears the other type's credentials).

- Gotenberg (self-hosted, the default; `gotenberg` service in docker-compose)
- Cloudflare Browser Rendering

A template's `letterAppendixId` (an uploaded pdf `Document`, e.g. a static
QR-bill) is appended after rendering by `appendPdf` (pdf-lib, renderer-agnostic)
— CH recipients only, padded to an odd page for duplex (Pingen's QR paper rules).

### Letter layouts (Briefpapier)

`LetterLayout` rows (`letter_layouts`, CRUD in `libs/letter/api/src/lib/letter-layout/`,
editor under `/letterlayouts`) hold header and footer HTML plus their band
heights. A letter prints on the template's `letterLayoutId`, else on the row
with `isDefault`, else bare (`LetterContext.resolveLayout`). The bands are
`position: fixed` so Chromium repeats them on every page, and the body sits in
a table whose repeated `thead`/`tfoot` spacers keep the text out of them; see
`composeLetter` in `libs/letter/api/src/lib/letter-renderer.ts`. Bands are
capped at 40mm so a header cannot reach Pingen's franking zone, and the page 1
address window stays at 60mm whatever the header height. Header and footer
HTML take the same `{{placeholders}}` as the body. Images must be absolute
URLs the renderer can fetch (Gotenberg in docker cannot resolve `localhost`),
with a fixed `height` so the logo stays inside its band. Mails never see a
layout: only the letter path consults it.

## Analytics Provider

- Google Analytics
- Google Tag Manager
- Plausible
- Piwik PRO

## We.Publish One

The One dashboard (`WEP_ONE_URL`) and the API authenticate each other with EdDSA
JWTs verified against the other side's JWKS — no shared secret, no stored
credentials. `libs/one/api` holds the client, the heartbeat and the guards;
`@OneScopedJwt(scope)` is the only way into a One-facing resolver, and the
global guard denies anything without it.

Impersonation (One signs in as a user of this medium) is off unless
`WEP_ONE_IMPERSONATION=true`. A grant is a 60-second single-use JWT that the
editor redeems at `/login/impersonate/:jwt` — a route that accepts nothing but
an impersonation grant, since it skips TOTP and any other JWT pointed at it
would be a way around two-factor.

**Feature toggles** come from One too: per medium, staff-only (One's
`ClientFeatures`).
- Every heartbeat sends the registry (`FEATURES` in `libs/features`). One
  answers `200 {features: {key: bool}}`, the complete state, which
  `FeaturesService.apply` stores in `medium_features`; a key One leaves out is
  switched off.
- One also pushes a change at once via `applyMediumFeatures` (scope
  `write:features`).
- A `204`, an older One or One being down changes nothing: the last known
  state stays. `WEP_FEATURES=a,b` switches flags on locally or in review
  builds without One.
