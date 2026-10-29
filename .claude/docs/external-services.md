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

### Changing a subscription's payment method

`changeSubscriptionPaymentMethod` (`PaymentMethodChangeService`,
`libs/membership/api/src/lib/payment-method-change/`) records a
`SubscriptionPaymentMethodChange`. The subscription keeps its `paymentMethodID`
until the change completes, which happens in one of three ways:

- **`invoicePayment`**, when the subscription has an open invoice. The invoice is
  paid with the new method through a normal `Payment`. The change completes
  in the `InvoicePaidNotifier` listener, but only if that payment is the one
  that paid the invoice.
- **`authorization`**, for an off-session provider. A provider that cannot
  authorize is rejected. Each provider authorizes without charging:
  - Stripe uses a SetupIntent. Its webhook must also send
    `setup_intent.succeeded` and `setup_intent.setup_failed`.
  - Mollie places a CHF 0.01 `sequenceType: first` hold with
    `captureMode: manual`, then calls `release-authorization` on it.
  - Payrexx tokenizes 0.01 with `chargeOnAuthorization: false`. The
    `referenceId` is `pmc_<changeID>`. Nothing is released, because the
    authorized transaction is the token.
- **`immediate`**, for any other payment method.

The subscription's current method is accepted too, when its provider charges
renewals automatically: the reader then authorizes it anew (a new card or TWINT
account) and the new token replaces the old one. `PublicSubscription.canRenewPaymentMethod`
tells the website when to offer that.

Authorization outcomes arrive through `WebhookResponse.authorizationStates` and
`PaymentAuthorizationNotifier`. The website also calls
`checkSubscriptionPaymentMethodChange` when the reader returns.

While a change is pending:

- `findUnpaidDueInvoices` skips its subscription's invoices.
- `canExtend` is false.

The periodic job expires pending changes after
`PAYMENT_METHOD_CHANGE_EXPIRY_DAYS`.

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
