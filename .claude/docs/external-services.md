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
- Mailchimp

Mail, challenge (captcha) and Mailchimp sync run with exactly one provider
each: the runtime uses the first non-deleted row. Their `create*Setting`
mutations only succeed while none exists (the editor then shows «Einrichten»),
and there is no delete mutation, so a medium never ends up without one. Change
type or credentials on the existing row instead.

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

Impersonation (One signs in as a user of this medium) is on unless a medium
sets `WEP_ONE_IMPERSONATION=false` (`isImpersonationEnabled`). A grant is a
60-second single-use JWT that the editor redeems at `/login/impersonate/:jwt` —
a route that accepts nothing but an impersonation grant, since it skips TOTP and
any other JWT pointed at it would be a way around two-factor. It needs a reason,
except for the support account `admin@wepublish.ch` (`SUPPORT_LOGIN_EMAIL`,
decided from the real user record, never from what One sends).

The editor's **We.Publish Support Login** (below the normal login, hidden when
`supportLoginEnabled` is false) is the same grant as an authorization-code flow:
the editor keeps `state` and a PKCE verifier in `sessionStorage`, sends the
browser to `WEP_ONE_URL/impersonation/support-login`, One signs the operator in,
matches `redirect_uri` exactly against the editor it knows for that medium, asks
that medium's API for a grant for `admin@wepublish.ch` with the S256
`codeChallenge` once the operator confirms, and returns the grant in the
fragment (`/login/support#code=…&state=…`) — never sent to a server, log or
referrer. `captureSupportLoginResult()` in `main.tsx` takes it out of the
address **before Sentry starts**; the page then checks `state` and redeems it
with `createSessionWithJWT(jwt, codeVerifier)`. Sentry scrubs the tokens in
`/login/impersonate/:jwt` and `/login/jwt/:jwt` (`sentryScrub.ts`). Every
redeemed or refused impersonation grant writes an audit log entry
(`createSessionWithJWT`, `impersonatedBy` = the One operator) — the audit
interceptor itself only sees mutations with `@Permissions`, so
`SessionService` records these directly. A grant with a challenge redeems only
with its verifier (`impersonation_grants.codeChallenge`), so a code that leaks
or is opened in another browser is useless; a grant from another medium fails
the signature and issuer check.
