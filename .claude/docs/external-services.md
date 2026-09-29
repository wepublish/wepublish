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
  (`simulated_declineRenewals`) is ticked, to test failed recurring payments. For dev, review apps and tests; it has no guard, so
  never configure it on a production deployment.

## Email Provider

- Mailgun
- Mailchimp

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
