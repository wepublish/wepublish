# External services

## Payment Provider

- Stripe
- Mollie
- Payrexx
- Bexio

## Email Provider

- Mailgun
- Mailchimp

## Mailchimp audience (sync provider)

`SettingSyncProvider` (type `MAILCHIMP`) holds the API key and list; the daily
sync lives in `libs/membership/api/src/lib/mailchimp-sync`. Its `newsletters`
(`SettingSyncProviderNewsletter` rows, edited in the editor's sync integration
form) are the interests readers toggle on `/profile` through
`userNewsletters` / `updateUserNewsletters`
(`libs/membership/api/src/lib/mailchimp-newsletter`). Only configured interests
can be changed; new members are added as `pending` (double opt-in). An interest
that is also in the sync's interest-group mappings gets flipped by the sync
whenever a matching subscription starts or ends, regardless of the reader's
choice.

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
