# Secure channel between the We.Publish CMS and the One dashboard

**Status:** design approved, not yet implemented
**Date:** 2026-09-16
**Spans two repositories:** `wepublish` (CMS/API/editor) and `one` (Directus backend + Nuxt frontend)

## Problem

One needs to exchange data with every medium's CMS instance in both directions:

- **CMS to One** — telemetry, health, version, and billing/usage figures.
- **One to CMS** — configuration and commands, plus the peering/article and
  matching reads that `peering-articles/api.ts` and `matching/runMeasure.ts`
  perform today **completely unauthenticated** against `Clients.apiUrl`.

There is no authentication on this path at present, and no way to see from
either side whether a given medium is connected.

## Solution in one paragraph

Both sides become JWT issuers. Each signs a short-lived, audience-bound EdDSA
token per request and verifies the other's tokens against a published JWKS
document. No shared secret is minted, exchanged, refreshed, or stored. A
periodic signed heartbeat from each CMS gives One a connection status, which is
surfaced as a coloured dot in both UIs.

### Rejected alternative: shared session key

The original sketch had the CMS mint a random key at boot, announce it to One in
a scoped JWT, and rotate it every 29 minutes with a 60-minute lifetime. It was
dropped because:

- **It had a bootstrap hole.** If One restarts and asks the CMS for the key, the
  CMS cannot tell One from any other caller that can reach the URL.
- **It required secrets at rest** in both databases.
- **It was not replica-safe.** A key minted in API memory breaks the moment
  `api.replicaCount` exceeds 1, because each pod would mint a different one.
- **It needed rotation machinery** — timers, overlap windows, retry on push
  failure — that per-request signing makes unnecessary.

Pure JWT removes all four problems and reuses primitives the CMS already has.

## Goals

- Mutual authentication in both directions, with no shared secret anywhere.
- Per-medium identity: medium A must never be able to act as medium B.
- Connection status visible in the editor and in One.
- Inert unless explicitly configured, so existing deployments are untouched.
- Correct from the first deploy: no soft mode, no flag to flip later.

## Non-goals

- Alerting on a disconnected medium. v1 is observe-only. See "Rollout".
- Replay-nonce (`jti`) tracking. Short TTL over TLS is the v1 position.
- Encrypting payloads beyond TLS.
- Heartbeat history. Only current state is stored.

## 1. Trust model and topology

```
   +---------------- One (central, single deployment) ----------------+
   |  Ed25519 keypair (ONE_JWT_PRIVATE_KEY / ONE_JWT_PUBLIC_KEY)      |
   |  publishes  {WEP_ONE_URL}/channel/jwks.json                          |
   |  knows every medium via  Clients.apiUrl                          |
   +-----------+--------------------------------------+---------------+
               | signs aud=<that medium's apiUrl>     | verifies iss -> Clients.apiUrl
               v                                      ^
   +---------------------------+      +---------------------------+
   |  CMS medium A             |      |  CMS medium B             |
   |  existing Ed25519 keypair | ...  |  existing Ed25519 keypair |
   |  /.well-known/jwks.json   |      |  /.well-known/jwks.json   |
   |  env: WEP_ONE_URL             |      |  env: WEP_ONE_URL             |
   +---------------------------+      +---------------------------+
```

### Identity resolution

**CMS to One.** One reads `iss`, finds the `Clients` row whose `apiUrl` origin
matches it **exactly**, fetches the JWKS from *that same origin*, and verifies.
An `iss` matching no client is rejected and logged; a client is never
auto-created. This is what prevents medium A speaking for medium B: A can only
sign tokens whose `iss` is its own host URL.

**One to CMS.** The CMS verifies `iss === WEP_ONE_URL` **and** `aud === its own
hostURL`. The `aud` check prevents medium A replaying a token One sent it
against medium B. This is the single most security-critical assertion in the
design.

### Trust anchors

Trust rests on DNS, TLS, and `Clients.apiUrl` being admin-managed — the same
anchor `peering-articles` already relies on, but now actually verified. The one
new dependency is that each CMS trusts `WEP_ONE_URL` from its environment; it ships
in Helm values rather than sealed secrets, so it is as trustworthy as the rest
of the deployment configuration.

## 2. Token format and scopes

One scope per token; a caller mints a token for the specific call it is making.
This preserves exact-match scope comparison, which the existing code already
does.

| Claim | CMS to One | One to CMS |
| --- | --- | --- |
| `alg` / `kid` | `EdDSA` / RFC 7638 thumbprint (existing `computeKid`) | same |
| `iss` | the CMS's `hostURL` | `WEP_ONE_URL` |
| `aud` | `WEP_ONE_URL` | **that medium's `apiUrl`** |
| `sub` | `wepublish-api` | `wepublish-one` |
| `scope` | see below | see below |
| `exp` | 120s | 120s |

`sub` is for logs and debugging only. `iss`, `aud` and `scope` carry the
security weight.

### Scopes

Following the existing `verb:resource` convention from `read:website-settings`:

- **CMS to One:** `write:medium-heartbeat`, `write:medium-stats`
- **One to CMS:** `read:content`, `read:stats`, `write:settings`

### Transport

Each platform's idiom: **One to CMS is GraphQL** (as `peering-articles` already
does), so it reuses the `@ScopedJwt`-style guard and carries the token in the
standard `Authorization: Bearer` header. **CMS to One is REST** into Directus
custom endpoints, which verify tokens themselves.

⚠️ **CMS to One must NOT use the `Authorization` header.** Directus' own auth
middleware intercepts `Authorization: Bearer …`, tries to resolve it as a
Directus session token, and answers `401 INVALID_CREDENTIALS` *before* a custom
endpoint's handler runs — verified against a live instance. That direction
therefore carries the token in **`x-wepublish-channel-token`** instead. This is
not a preference; the standard header is unusable there.

`clockTolerance: 30` on both sides, so a 120s TTL does not become flaky on
drifting nodes.

## 3. Changes to existing CMS code

Three changes are **required** by the design, in `libs/session/api` and
`libs/authentication/api`:

1. **`generateScopedJWT` cannot set an audience.** It hardcodes
   `.setAudience(this.websiteURL)` (`jwt.service.ts:88`). It needs an
   `audience` parameter, exactly as `generateJWT` already has. Without this the
   `aud` binding above is impossible.

2. **`verifyScopedJWT` can only verify tokens the CMS signed itself.** It
   verifies with `this.publicKey` and pins `issuer: this.hostURL`. Tokens from
   One are signed by a different key under a different issuer, so this method
   structurally cannot check them. One-issued tokens get a **separate**
   verifier backed by a JWKS client pointed at `WEP_ONE_URL`, registered under a new
   `ONE_SCOPED_JWT_VERIFIER` symbol with its own `OneScopedJwtGuard` and
   `@OneScopedJwt(scope)` decorator. The existing `SCOPED_JWT_VERIFIER` binding
   and the behaviour of `read:website-settings` are untouched — the two
   verifiers have genuinely different trust inputs and must not share a binding.

3. **`kid`-aware key selection.** The existing
   `libs/media/api/.../jwks-client.service.ts` does `importJWK(jwks.keys[0])`,
   ignoring `kid`. The new client selects by `kid` with a fallback to
   `keys[0]`, which makes future key rotation a non-event instead of a hard
   cutover.

Known limitation, deliberately not addressed: `ScopedJwtGuard` calls
`GqlExecutionContext.create(context).getContext().req` unconditionally and is
therefore GraphQL-only. That is fine for the One-to-CMS GraphQL path. If REST
endpoints are ever needed on the CMS, the guard must learn to handle HTTP
contexts.

## 4. CMS side (`wepublish`)

Prerequisites already in place: `ScheduleModule.forRoot()` at
`apps/api-example/src/nestapp/app.module.ts:535`, `HOST_URL` as a required env,
and `apps/api-example` as the single API app (other `apps/*` are Next.js
websites) — so this is one wiring point, not twenty-five.

### New lib `libs/one/api` (`@wepublish/one/api`)

Registered like `SessionModule`, via `OneModule.registerAsync({ oneURL,
hostURL, heartbeatIntervalMs })`.

| File | Responsibility |
| --- | --- |
| `one.module.ts` | dynamic module + config tokens |
| `one-jwks-client.service.ts` | fetch and cache One's JWKS, selected by `kid`; near-copy of the media JWKS client including its stale-key-on-outage fallback |
| `one-token.verifier.ts` | `ScopedJwtVerifier` for One-issued tokens: pins `iss === WEP_ONE_URL`, `aud === hostURL` |
| `one-client.service.ts` | outbound: mints a scoped JWT, POSTs to One |
| `one-heartbeat.service.ts` | `OnApplicationBootstrap` + `@Interval` |
| `one-channel-status.resolver.ts` | `oneChannelStatus` query for the editor |

### Heartbeat

Fires once on `OnApplicationBootstrap`, then every **5 minutes**. With One's
15-minute green threshold that means three missed heartbeats before a medium
turns amber, so a genuine outage shows up within 15 minutes while a single
transient failure does not flap the badge. Payload is non-secret operational
data:
version, git sha, `NODE_ENV`, coarse health flag.

A failure logs at **error** level and reports to Sentry, then waits for the next
tick. It must never block boot or take the API down.

### Persisted channel state

New single-row Prisma model `OneChannelState`:

| Field | Persisted | Why |
| --- | --- | --- |
| `lastSuccessAt` | **yes** | must survive a restart — if One is unreachable now, the useful fact is when it last worked |
| `lastAttemptAt` | in memory | a restart legitimately resets "what happened on the last try" |
| `lastError` | in memory | same |

The generic `Setting` model (`schema.prisma:1199`) was rejected for this: it
backs editor-configurable settings with `settingRestriction`, and channel state
parked there risks surfacing in the settings UI.

### Inert by default

If `WEP_ONE_URL` is unset, the module registers but does nothing: no heartbeat, and
the One guards deny. Every existing deployment and every local dev environment
is unaffected until explicitly configured.

### Replica safety

Per-request signing is replica-safe for free: every pod signs with the same
configured private key, and heartbeats are idempotent upserts. Scaling
`api.replicaCount` beyond 1 needs no further work.

## 5. One side (`one`, Directus)

Directus mounts extension endpoints under their bundle entry name, so a new
`channel` entry yields `{WEP_ONE_URL}/channel/...`.

| Route | Direction | Auth |
| --- | --- | --- |
| `GET /channel/jwks.json` | — | public; serves One's Ed25519 public key |
| `POST /channel/heartbeat` | CMS to One | `write:medium-heartbeat` |
| `POST /channel/stats` | CMS to One | `write:medium-stats` |

These routes verify tokens themselves and cannot use `req.accountability` — the
caller is a CMS, not a Directus user. Writes go through `ItemsService` with
`accountability: null`, matching every other endpoint in the bundle.

One's key is **not** served at `/.well-known/jwks.json`: Directus mounts
endpoints under the entry name, so the RFC path is not cleanly reachable. Since
the CMS reads the location from its own config, the explicit
`{WEP_ONE_URL}/channel/jwks.json` is simpler than fighting the router and costs
nothing.

### Shared helpers

- `shared/channel/verify.ts` — inbound: resolve `iss` to a client, fetch and
  cache that origin's JWKS, verify signature, `aud`, `scope`, `exp`.
- `shared/channel/sign.ts` — outbound: mint `aud`-bound tokens for One-to-CMS
  calls. First consumers are `peering-articles/api.ts` and
  `matching/runMeasure.ts`.

### Data model

Three new columns on `Clients` (one-to-one with a client, so columns rather than
a child collection; no history table in v1):

- `channel_last_seen_at` — timestamp, nullable
- `channel_cms_version` — string, nullable
- `channel_cms_git_sha` — string, nullable

Update `DirectusTypes.ts` in **both** copies:
`apps/directus/extensions/wepublish/src/DirectusTypes.ts` and
`apps/front/types/DirectusTypes.ts`.

### Derived status

Status is computed at read time and never stored, so nothing has to run a cron
to flip a medium to stale:

| State | Condition | Meaning |
| --- | --- | --- |
| green | `channel_last_seen_at` < 15 min | connected |
| amber | older than 15 min | was connected, now silent |
| red | `channel_last_seen_at` is `null` | never connected — expected during rollout |

## 6. User interfaces

### Editor: status dot beside the version string

`libs/ui/editor/src/lib/atoms/version.tsx` — rendered in the sidebar footer at
`apps/editor/src/app/base.tsx:1201` — gains a dot and a tooltip, driven by
extending its existing query with `oneChannelStatus`.

```
+- editor sidebar footer ---------------+
|  o  Deployed Version: 890550c         |
+---------------------------------------+
   ^ hover / focus
   +------------------------------------------+
   | We.Publish ONE: verbunden                |
   | Letzter erfolgreicher Kontakt: vor 2 Min |
   | one.wepublish.ch                         |
   +------------------------------------------+
```

The dot reports the **CMS's own view** of the channel, which is what is useful
to someone standing in that editor. Note this is deliberately *not* the same
rule as One's 15-minute threshold: the CMS knows the outcome of its own last
attempt, so it can say "broken right now" immediately rather than waiting for a
staleness window to elapse. The two views can therefore disagree for up to 15
minutes after a failure starts, which is correct — the editor is the faster
signal.


| Dot | Condition | Tooltip |
| --- | --- | --- |
| green | `WEP_ONE_URL` set and the **most recent attempt succeeded** | connected, last contact, which One |
| amber | `WEP_ONE_URL` set and the **most recent attempt failed** | last success + the actual failure reason |
| red | `WEP_ONE_URL` not set | "not configured — this instance sends nothing to One" |

Tooltips show **both relative and absolute** time; relative alone is too vague
to debug with:

```
green  We.Publish ONE: verbunden
       Letzter erfolgreicher Kontakt: vor 2 Minuten (16.09.2026, 14:31)
       one.wepublish.ch

amber  We.Publish ONE: Verbindung gestoert
       Letzter erfolgreicher Kontakt: vor 3 Tagen (13.09.2026, 08:12)
       Letzter Versuch: vor 1 Minute - fehlgeschlagen: 403 Forbidden
       one.wepublish.ch

red    We.Publish ONE: nicht konfiguriert
       Diese Instanz sendet keine Daten an We.Publish ONE.
       Letzter erfolgreicher Kontakt: nie
```

The amber case is the valuable one: it shows that the channel worked until
Sunday, that it is still trying, and why it is failing — without opening a pod
log.

`oneChannelStatus` returns `configured`, `oneUrl`, `lastSuccessAt` (persisted),
`lastAttemptAt`, `lastError`.

Two improvements folded in, since the component is being edited anyway:

- **Remove the `useEffect`.** The component currently mirrors query data into
  state via an effect, which `code-style.md` explicitly warns against. Both
  values derive straight from the query.
- **Do not encode status in colour alone.** The tooltip already carries the
  text; an `aria-label` makes the dot readable to screen readers.

Strings go through `react-i18next`, German as source.

### One: monitoring pages

The `monitoring/` pages already render per-medium health, so the green/amber/red
badge and `channel_cms_version` belong alongside that, and on the client
overview. Labels go through the existing i18n catalogs, German as source.

Red must be worded as "not rolled out here yet", not "broken" — during rollout
that is exactly what it means, and it must not send anyone chasing an incident.

## 7. Failure modes

| Situation | Behaviour |
| --- | --- |
| `WEP_ONE_URL` unset | module inert: no heartbeat, One guards deny; editor shows "not configured" |
| One unreachable | CMS boots and serves normally; heartbeat logs error + Sentry, retries next tick |
| One's JWKS unreachable, key cached | verify with cached key |
| One's JWKS unreachable, no cached key | **reject** every One-to-CMS call |
| Token missing/malformed/expired/wrong `aud`/wrong scope | 401/403, logged with `iss` and reason, no fallback |
| `iss` matches no `Clients` row | 403 + log; never auto-creates a client |
| CMS never heartbeated | red in One, silent |

### Strict from the first deploy

There is no soft mode and no config flag to relax verification later. One's
endpoints reject bad tokens outright, and the `@OneScopedJwt` resolvers require
a token from day one. No migration window is needed: One always sends a token,
and an older CMS that lacks the guard simply ignores it.

### Two deliberate exceptions, stated rather than buried

1. **A CMS whose `WEP_ONE_URL` is set but unreachable still boots and serves.**
   Making One a boot dependency would let One's downtime take every medium
   offline. Heartbeat failures are loud (error + Sentry) but never fatal.
2. **The stale-JWKS-on-outage fallback is kept.** A cached key is still One's
   real key; this is an availability win with no authorization bypass. It is
   not a soft failure.

## 8. Configuration

| Variable | Where | Secret? |
| --- | --- | --- |
| `WEP_ONE_URL` | each CMS | no — Helm values |
| `ONE_JWT_PRIVATE_KEY` | One | **yes** |
| `ONE_JWT_PUBLIC_KEY` | One | no |

One's keypair is generated once with the same Ed25519 + PEM shape the CMS
already uses, so `computeKid` and the JWKS serialisation carry over unchanged.

## 9. Rollout

The feature is observe-only in v1. Red and amber raise no alert, no Sentry
event, and no Slack notification anywhere in One, because during rollout red
means "this medium has not been deployed yet". Once every medium is on a version
with the channel, red genuinely means "broken", and adding alerting is a small
separate change.

## 10. Testing

Jest on the CMS, Vitest on One. The security-critical assertions are the
negative ones, and they should exist before the code does:

- a token signed by **medium A with `aud` = medium B** is rejected by B (the
  cross-medium replay from section 1)
- an `iss` matching no `Clients.apiUrl` is rejected, and no client row is created
- expired, wrong-scope, unsigned, and `alg: none` tokens are rejected
- `kid` selection picks the right key when the JWKS holds two
- status derivation: null to red, fresh to green, stale to amber
- a heartbeat failure does not throw out of `OnApplicationBootstrap`
- `lastSuccessAt` survives a simulated restart; `lastAttemptAt` does not

## 11. Implementation notes

- Prisma migrations run against **port 5433**, not 5432 — 5432 is the pooler and
  leaks advisory locks.
- `DirectusTypes.ts` exists in two copies and both must be updated.
- The One repo keeps its own specs under `one/docs/superpowers/specs/`; this
  document covers both repositories and lives in `wepublish`.
- This is too large for one pull request. Per `commit-rules.md`, split it into
  stacked PRs — a natural cut is: (1) CMS auth primitives (`audience`
  parameter, One verifier, `kid` selection, `libs/one/api` skeleton);
  (2) heartbeat + `OneChannelState` + `oneChannelStatus` + the editor dot;
  (3) One's `channel` endpoints, `Clients` columns and monitoring badge;
  (4) migrating `peering-articles` and `matching` onto authenticated calls.
  Agree the split with the user before opening anything.
