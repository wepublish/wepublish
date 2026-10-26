# We.Publish — Authentication, Sessions and Tokens

Scope note: this document describes **what exists today** in `/Users/itrulia/Documents/wepublish`
for authentication, sessions, bearer tokens and the guard chain, as the ground for a new,
separate API-token library. It covers `libs/authentication/api` and `libs/authentication/website`,
`libs/session/api`, the Prisma models `Session`, `Token`, `User`, `UserRole` and
`ImpersonationGrant`, every `token`-shaped concept in the repo (the `Token` row + `createToken`
mutation, peer tokens, the We.Publish One channel JWT, the media-server JWT, the website
service token, external-app tokens, the `systemInfo` shared key, the impersonation grant),
the complete guard/decorator chain (`@Public`, `@Authenticated`, `@Permissions`, `@Feature`,
`@ScopedJwt`, `@OneScopedJwt` and the `OneOfGuard` that arbitrates them), and what it would
take to bolt a new credential type onto that chain. Every claim is anchored to a file path and,
where useful, a line number. The We.Publish database is stopped, so all database facts come from
`libs/api/prisma/schema.prisma` and `libs/api/prisma/migrations/`, never from a live query.
Facts come first; a clearly separated **Porting notes** section at the end draws implications,
and §11 answers the brief's question about how BKa's three mechanisms map onto We.Publish's.

---

## 1. The mechanisms at a glance

| | **A. User session** | **B. `Token` row ("peer token")** | **C. One channel JWT** | **D. Scoped service JWT** | **E. External-app JWT** | **F. Media-server JWT** | **G. `systemInfo` key** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Credential | opaque 64-char random string | opaque 64-byte base64 string | EdDSA JWT signed by We.Publish One | EdDSA JWT signed by this API | EdDSA JWT signed by this API | EdDSA JWT signed by this API | shared secret in a query param |
| Stored where | `sessions.token` (plaintext, `@unique`) | `tokens.token` (plaintext, **not** unique) | nowhere — stateless | nowhere — stateless | nowhere — stateless | nowhere — stateless | injected `SYSTEM_INFO_KEY` provider |
| Transport | `Authorization: Bearer <token>` | `Authorization: Bearer <token>` **plus** `User-Agent: We.Publish/1.0 Peering` | `Authorization: Bearer <jwt>` | `Authorization: Bearer <jwt>` | `Authorization: Bearer <jwt>` | `authorization: Bearer <jwt>` (outbound, API → media server) | `?key=` |
| Issued by | `SessionService.createUserSession` (`libs/session/api/src/lib/session.service.ts:282`) | `createToken` mutation (`libs/peering/api/src/lib/token.resolver.ts:27`) | We.Publish One (external) | `POST /website/token` (`libs/session/api/src/lib/website-token.controller.ts:12`) | `createExternalAppToken` mutation (`libs/external-apps/api/src/lib/external-apps.resolver.ts:84`) | `NovaMediaAdapter.generateAuthToken` (`libs/api/src/lib/media/novaMediaAdapter.ts:72`) | deployment config |
| Verified by | `AuthenticationService.getUserSession` → DB lookup (`libs/authentication/api/src/lib/authentication.service.ts:28`) | `AuthenticationService.getPeerSession` → DB lookup (`…:39`) | `OneTokenVerifier.verifyScopedJWT` (`libs/one/api/src/lib/one-token.verifier.ts:14`) via One's JWKS | `JwtService.verifyScopedJWT` (`libs/session/api/src/lib/jwt.service.ts:155`) | `ExternalAppsUserinfoController` (`libs/external-apps/api/src/lib/external-apps-userinfo.controller.ts:23`) | the media server's `JwtAuthGuard` (`libs/media/api/src/lib/authentication/jwt-auth.guard.ts:18`) via this API's JWKS | `timingSafeEqual` (`libs/system-info/api/src/lib/system-info.controller.ts:65`) |
| Becomes `request.user` | **yes** — a `UserSession` | **yes** — a `TokenSession` | no | no | no (separate REST endpoint) | n/a (outbound) | no |
| Carries roles/permissions | yes, from `User.roleIDs` | yes, from `Token.roleIDs` — but nothing ever sets them (§4.4) | no — scope string only | no — scope string only | roles returned in the response body, not applied to a session | no | no |
| Lifetime | `SESSION_TTL_DAYS` setting, default 7 days | **none — never expires** | set by One | 5 min | 240 min | 5 min | none |
| Revocation | delete the `sessions` row | delete the `tokens` row | rotate One's key | wait 5 min | wait 240 min | wait 5 min | redeploy |
| Guard that admits it | `OptionalAuthenticationGuard` + `AuthenticatedGuard`/`PermissionsGuard` | same | `OneScopedJwtGuard` | `ScopedJwtGuard` (declared, unused — see §2.6) | none (`@Public()` controller, manual check) | the media server's own guard | none (`OneOfGuard` denies it — see §5.6) |

There is **no OAuth2** anywhere in We.Publish (§8), **no refresh token**, **no cookie-based
server session**, and **no CSRF layer** (`csrfPrevention: false`,
`apps/api-example/src/nestapp/app.module.ts:126`).

---

## 2. The data model

Single Prisma schema, `libs/api/prisma/schema.prisma` (2352 lines), configured in two places:
the `prisma` block in the root `package.json` (`"schema": "libs/api/prisma/schema.prisma"`)
and `prisma.config.ts`, which falls back to `prisma/schema.prisma` inside Docker images.
Migrations live in `libs/api/prisma/migrations/`.

### 2.1 `Session` — `schema.prisma:1040`

```prisma
model Session {
  id        String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  expiresAt DateTime @db.Timestamptz(3)
  token     String   @unique

  impersonatedBy      String?
  impersonationReason String?
  impersonatedAt      DateTime? @db.Timestamptz(3)

  userID String
  user   User   @relation(fields: [userID], references: [id], onDelete: Cascade)

  @@index([userID])
  @@index([token])
  @@index([expiresAt])
  @@index([impersonatedBy])
  @@map("sessions")
}
```

- The secret is stored **in plaintext**, is the primary lookup key, and is `@unique`.
- Created in `libs/api/prisma/migrations/20220812113731_init/migration.sql:372` with only
  `id/createdAt/expiresAt/token/userID`; the three `impersonat*` columns and the extra indexes
  came later.
- `onDelete: Cascade` — deleting a `User` deletes their sessions.
- **No `lastUsedAt`, no user-agent, no IP, no `revokedAt`.** The only observability on a live
  session is `createdAt`/`expiresAt`.

### 2.2 `Token` — `schema.prisma:1028`

```prisma
model Token {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt DateTime @updatedAt @db.Timestamptz(3)

  name    String   @unique
  token   String
  roleIDs String[]

  @@map("tokens")
}
```

- `name` is `@unique`; **`token` is not** and has **no index**, so every authentication attempt
  that reaches `getPeerSession` is a sequential scan of `tokens`.
- The secret is stored **in plaintext**.
- **No `expiresAt`, no owner, no `lastUsedAt`, no scopes, no `revoked` flag.** A `Token` is a
  name, a secret and a (never-populated) list of role ids.
- Unchanged since `migrations/20220812113731_init/migration.sql:360`.

### 2.3 `User` — `schema.prisma:1187`

Authentication-relevant columns only:

| Column | Type | Role in authentication |
| --- | --- | --- |
| `id` | `String @id gen_random_uuid()` | JWT `sub`, `Session.userID` |
| `email` | `String @unique` | login identifier; looked up case-insensitively (`libs/user/api/src/lib/user.service.ts:61-68`) |
| `password` | `String` | argon2id hash, or a legacy bcrypt hash starting `$2` |
| `active` | `Boolean` | checked at login **and on every request** (`AuthenticationService.isSessionValid`) |
| `lastLogin` | `DateTime?` | stamped by `createUserSession` |
| `roleIDs` | `String[]` | the only link to `UserRole`; **not a relation**, so no FK integrity |
| `totpSecret` | `String?` | never selected into a session (`unselectPassword` sets it `false`) |
| `totpEnabled` | `Boolean @default(false)` | forces a TOTP code at login |
| `totpExempt` | `Boolean @default(false)` | present in the model; see `libs/session/api/src/lib/totp.service.ts` |
| `emailVerifiedAt`, `pendingEmail`, `pendingEmailAt` | | email self-service change flow |

`unselectPassword` (`libs/authentication/api/src/lib/unselect-password.ts`) is the
column allow-list used wherever a user is loaded into a session: it enumerates every
scalar explicitly and sets `password: false` and `totpSecret: false`. It is typed as
`Record<keyof Omit<Prisma.UserSelect, …relations>, boolean>`, so **adding a scalar column to
`User` breaks the build until it is listed there** — a deliberate tripwire.

### 2.4 `UserRole` — `schema.prisma:1234`

```prisma
model UserRole {
  id            String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt     DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt    DateTime @updatedAt @db.Timestamptz(3)
  description   String?
  name          String   @unique
  permissionIDs String[]
  systemRole    Boolean
  @@map("users.roles")
}
```

Three rows are seeded with **fixed string ids** (`libs/api/prisma/seed.ts:274-313`):
`admin`, `editor`, `peer` — each `systemRole: true` with an **empty** `permissionIDs` array.
Their permissions are injected at read time by `addPredefinedPermissions`
(`libs/permissions/api/src/lib/predefined-permissions.ts:8-43`), which switches on `role.id`
and appends `AllPermissions`, `EditorPermissions` or `PeerPermissions`. Any other role id
keeps exactly the `permissionIDs` stored in the row.

### 2.5 `ImpersonationGrant` — `schema.prisma:1060`

```prisma
model ImpersonationGrant {
  id         String    @id @default(dbgenerated("gen_random_uuid()"))
  createdAt  DateTime  @default(now()) @db.Timestamptz(3)
  jti        String    @unique
  expiresAt  DateTime  @db.Timestamptz(3)
  redeemedAt DateTime? @db.Timestamptz(3)
  @@index([expiresAt])
  @@map("impersonation_grants")
}
```

A single-use ledger for the 60-second impersonation JWTs One mints (§3.1d).

### 2.6 `AuditLog` — `schema.prisma:2328`

The only place the two session kinds are modelled side by side:

```prisma
enum AuditLogActorType { user @map("user")  token @map("token") }

model AuditLog {
  …
  actorType      AuditLogActorType
  userId         String?
  userEmail      String?
  tokenName      String?
  sessionId      String?
  impersonatedBy String?
  …
  @@map("audit_logs")
}
```

### 2.7 What was removed: `users.oauth2-accounts`

`migrations/20220812113731_init/migration.sql:440-459` created a NextAuth-shaped
`users.oauth2-accounts` table (`provider`, `providerAccountId`, `accessToken`, `refreshToken`,
`idToken`, `oauthToken`, `oauthTokenSecret`, `scope`, `sessionState`). It was dropped in
`migrations/20250708133356_remove_oauth_providers/migration.sql`. The only surviving trace in
the tree is the string `oauth2Accounts: []` in a test fixture
(`apps/editor/src/app/routes/users/userEditView.spec.tsx:54`). **There are no OAuth2 login
providers in We.Publish today.**

### 2.8 Table-naming conventions

94 `@@map` values exist. Two conventions coexist:

- **Dot-grouped** — the dominant one for anything that belongs to a family:
  `articles`, `articles.revisions`, `articles.revisions.draft`, `users`, `users.roles`,
  `users.addresses`, `users.payment-providers`, `settings.mailprovider`, `apps.external`,
  `member.plans`, `comments.ratings`, `polls.votes`.
- **snake_case** — used by most of the newer, standalone tables:
  `audit_logs`, `medium_features`, `impersonation_grants`, `one_channel_state`,
  `mail_templates`, `block_templates`, `periodic_jobs`, `paywall_bypasses`.

Flat, ungrouped names also exist (`sessions`, `tokens`, `peers`, `images`, `events`).
A new api-token library following the dominant convention would map to something like
`tokens.api` / `tokens.api.scopes`, or `api_tokens` if it follows the newer snake_case group.

---

## 3. The request pipeline

### 3.1 Registration

Two global guards, both declared in `libs/authentication/api/src/lib/authentication.module.ts:21-34`:

```ts
providers: [
  SessionStrategy,
  AuthenticationService,
  { provide: APP_GUARD, useClass: OptionalAuthenticationGuard },
  { provide: APP_GUARD, useClass: OneOfGuard },
  PublicGuard,
  AuthenticatedGuard,
],
```

`PassportModule.register({ session: false, defaultStrategy: 'session' })` (lines 16-19) —
`session: false` is what keeps Passport from touching cookies.

These are the **only** `APP_GUARD` registrations in the repo. One `APP_INTERCEPTOR` exists:
`AuditLogInterceptor` (`libs/audit-log/api/src/lib/audit-log.module.ts:18`).

`AuthenticationModule` is imported once, in `apps/api-example/src/nestapp/app.module.ts:205`,
immediately before `SessionModule.registerAsync` — the comment on line 207-208 notes the order
matters for dependency resolution.

### 3.2 Order of execution for one GraphQL operation

```
1. OptionalAuthenticationGuard   (global, APP_GUARD #1)
   └─ AuthGuard('session') → SessionStrategy.validate()
        → AuthenticationService.getPeerSession | getUserSession
        → sets request.user = AuthSession | false        (never throws for a user token)
2. OneOfGuard                    (global, APP_GUARD #2)
   └─ reads the `one_of` metadata accumulated by @Public/@Authenticated/@Permissions/@*ScopedJwt
   └─ runs each listed guard, returns true if ANY returns true
   └─ returns FALSE when the metadata is empty  → 403
3. Class-level @UseGuards        (none in this repo today)
4. Method-level @UseGuards       (FeatureGuard, via @Feature — AND semantics)
5. AuditLogInterceptor           (mutations with @Permissions only)
6. the resolver
```

Nest runs global guards first, then controller guards, then route guards, and **all of them
must pass**. That is why `@Feature` is deliberately `UseGuards` rather than `OneOf` — see the
comment at `libs/features/api/src/lib/feature.decorator.ts:7-12`:

> Unlike `@Permissions` or `@Authenticated` this does NOT use `OneOf`: the feature is required
> in addition to whatever else guards the call.

### 3.3 `SessionStrategy` — the only Passport strategy

`libs/authentication/api/src/lib/session.strategy.ts` (37 lines, reproduced almost in full
because every later decision rests on it):

```ts
export const PEER_USER_AGENT = 'We.Publish/1.0 Peering';
export const INVALID_PEER_TOKEN = 'invalid-peer-token';

@Injectable()
export class SessionStrategy extends PassportStrategy(Strategy, 'session') {
  constructor(private authService: AuthenticationService) {
    super({ passReqToCallback: true });
  }

  public async validate(req: Request, token: string) {
    const session =
      req.headers['user-agent'] === PEER_USER_AGENT ?
        await this.authService.getPeerSession(token)
      : await this.authService.getUserSession(token);

    const isSessionValid = this.authService.isSessionValid(session);

    if (!isSessionValid) {
      if (req.headers['user-agent'] === PEER_USER_AGENT) {
        throw new UnauthorizedException('Token is invalid', { cause: INVALID_PEER_TOKEN });
      }
      return false;
    }
    return session;
  }
}
```

The strategy is `passport-http-bearer`, so the credential is always
`Authorization: Bearer <secret>`. **Which table is consulted is decided purely by exact string
equality on the `User-Agent` header.** A `tokens` row presented without that header is looked
up in `sessions`, finds nothing, and the request is anonymous. A `sessions` token presented
*with* that header is looked up in `tokens`, finds nothing, and the request is **rejected
outright** (the `INVALID_PEER_TOKEN` branch).

### 3.4 `OptionalAuthenticationGuard`

`libs/authentication/api/src/lib/optional-authentication.guard.ts`:

```ts
export class OptionalAuthenticationGuard extends AuthGuard('session') {
  public override getRequest(context: ExecutionContext) {
    return GqlExecutionContext.create(context).getContext().req;
  }

  public override async canActivate(context: ExecutionContext): Promise<boolean> {
    try { await super.canActivate(context); }
    catch (e) {
      if (e instanceof UnauthorizedException) {
        if (e.cause === INVALID_PEER_TOKEN) throw e;   // peering must fail loudly
        return true;                                    // everything else: stay anonymous
      }
      throw e;
    }
    return true;
  }
}
```

It **always returns true** (except for a bad peer token). Its job is only to attach
`request.user`; authorisation happens later. A missing, malformed or expired bearer token is
simply an anonymous request.

### 3.5 `OneOfGuard` — the default-deny arbiter

`libs/nest-modules/src/lib/one-of/one-of.guard.ts`:

```ts
const allowedGuards = this.reflector.getAllAndMerge<Type<CanActivate>[]>(ONE_OF_METADATA_KEY, [
  context.getHandler(), context.getClass(),
]);
const guards = allowedGuards.map(ref => this.moduleRef.get<CanActivate>(ref, { strict: false }));
if (!guards.length) { return false; }
const checks = await Promise.all(guards.map(async guard => {
  try { … return await guard.canActivate(context); }
  catch (error) { if (error instanceof UnauthorizedException) return false; throw error; }
}));
return checks.some(Boolean);
```

Three consequences that matter for any new library:

1. **Default deny.** A resolver method with *no* auth decorator at all is unreachable — the
   metadata list is empty, `OneOfGuard` returns `false`, Nest answers 403. Confirmed by
   `libs/nest-modules/src/lib/one-of/one-of.guard.spec.ts:51` ("should return false if no
   guards are set").
2. **`OneOf` guards are OR-ed, and they run in parallel.** `@Public()` on the same method as
   `@Permissions(X)` means "public OR has X" — i.e. public.
3. **Guards are resolved with `moduleRef.get(..., { strict: false })`**, so a new guard only has
   to be a provider *somewhere* in the application graph. It does not have to be exported to,
   or imported by, the module that uses the decorator. This is the single most important
   extension point for a new credential type.

`AddMetadata` (`libs/nest-modules/src/lib/add-metadata.decorator.ts`) is the custom
`SetMetadata` that appends and de-duplicates rather than overwriting, which is what makes
stacking `@Public()` and `@Permissions(...)` on one method work at all.

### 3.6 The authorisation decorators, exhaustively

| Decorator | Defined in | Metadata key | Guard | Semantics | Uses in tree (non-spec) |
| --- | --- | --- | --- | --- | --- |
| `@Public()` | `libs/authentication/api/src/lib/public.decorator.ts` | `public` (`SetMetadata`) | `PublicGuard` | returns the metadata value verbatim; anyone, authenticated or not | **65** |
| `@Authenticated()` | `…/authenticated.decorator.ts` | `authenticated` (`SetMetadata`) | `AuthenticatedGuard` | `!!request.user` — **any** session, user *or* token | **35** |
| `@Permissions(...perms)` | `libs/permissions/api/src/lib/permission.decorator.ts` | `permissions` (`AddMetadata`) | `PermissionsGuard` | `hasPermission(perms, session.roles)` — **ALL** listed permissions must be held | **260** |
| `@Feature(...keys)` | `libs/features/api/src/lib/feature.decorator.ts` | `feature` (`SetMetadata`) | `FeatureGuard` via `UseGuards` | **AND** on top of everything else; throws `ForbiddenException` naming the feature | **0** (the `FEATURES` registry is `[] as const`, `libs/features/src/lib/features.ts:24`) |
| `@ScopedJwt(scope)` | `libs/authentication/api/src/lib/scoped-jwt.decorator.ts` | `scoped_jwt` (`SetMetadata`) | `ScopedJwtGuard` | verifies an EdDSA JWT issued by *this* API carrying `scope` | **0** as a decorator; the verifier is called inline instead (§5.4) |
| `@OneScopedJwt(scope)` | `libs/one/api/src/lib/one-scoped-jwt.decorator.ts` | `one_scoped_jwt` (`SetMetadata`) | `OneScopedJwtGuard` | verifies an EdDSA JWT issued by **We.Publish One** carrying `scope` | **10** |

`PermissionsGuard` (`libs/permissions/api/src/lib/permission.guard.ts:12-32`) uses
`getAllAndMerge`, so `@Permissions(A)` on the class and `@Permissions(B)` on the method means
the caller needs **A and B**. `hasPermission` (`libs/permissions/api/src/lib/has-permission.ts`)
flattens `permissionIDs` across all of the session's roles and requires
`perms.every(...)` — i.e. the arguments of a single `@Permissions(A, B)` are also ANDed.
`@Permissions(CanGetUserRoles, CanGetUserRole)` in `user-role.resolver.ts:38` therefore demands
both.

### 3.7 Parameter decorators

| Decorator | File | Returns |
| --- | --- | --- |
| `@CurrentUser()` | `libs/authentication/api/src/lib/current-user.decorator.ts` | `request.user` — typed as `UserSession` at most call sites, but may actually be a `TokenSession` (§4.7) |
| `@AuthToken()` | `…/auth-token.decorator.ts` | the raw bearer string, or `null` |
| `@RequestFingerprint()` | `…/request-fingerprint.decorator.ts` | `"<sha224(ip)[0..7]>:<sha224(ua)[0..7]>"`; IP from `cf-connecting-ip` → `x-forwarded-for` → `socket.remoteAddress` |
| `@PreviewMode()` | `libs/permissions/api/src/lib/preview-mode.decorator.ts` | `hasPermission(CanPreview, user?.roles ?? []) && !!req.headers.preview` |

### 3.8 Field resolvers are **not** guarded

`GraphQLModule.forRootAsync` in `apps/api-example/src/nestapp/app.module.ts:101-128` does not
set `fieldResolverEnhancers`, and Nest's default is to apply guards only to root-level
`@Query`/`@Mutation`/`@Subscription` handlers. That is why `@ResolveField` methods throughout
the repo carry no decorators (e.g. `PeerProfileResolver.logo`,
`libs/peering/api/src/lib/peer-profile.resolver.ts:60`), and why a field that *does* need a
check performs it inline:

```ts
// libs/settings/api/src/lib/website-settings/website-settings.resolver.ts:104-117
@ResolveField(() => WebsiteAnalytics, { nullable: true })
mailchimp(@Parent() parent, @CurrentUser() session: UserSession | null, @AuthToken() authToken: string | null) {
  const hasPerms =
    hasPermission(CanGetWebsiteSettings, session?.roles ?? []) ||
    this.jwt.verifyScopedJWT(authToken ?? '', 'read:website-settings');
  if (!hasPerms) return null;
  return parent.mailchimp;
}
```

(That expression is `boolean || Promise<boolean>`, so the scoped-JWT branch is always truthy —
an existing defect, noted here only because a new library must not copy the pattern.)

### 3.9 REST controllers go through the same chain

Both `APP_GUARD`s apply to HTTP routes too, and both call
`GqlExecutionContext.create(context).getContext().req` — which looks wrong for HTTP but works
by a quirk of `normalizeResolverArgs`
(`node_modules/@nestjs/graphql/dist/utils/normalize-resolver-args.js`): an argument array of
length 3 (`[req, res, next]` for HTTP) is treated as a "reference resolver" and padded to
`[req, undefined, res, next]`, so `getContext()` returns the **Express response**, and
`res.req` is the request. The chain therefore behaves identically for controllers.

Consequence: every REST controller must carry `@Public()` or another `OneOf` decorator.
The ones that do:

| Controller | Route | Decorator |
| --- | --- | --- |
| `JwksController` | `GET /.well-known/jwks.json`, `GET /.well-known/openid-configuration` | `@Public()` |
| `WebsiteTokenController` | `POST /website/token` | `@Public()` |
| `ExternalAppsUserinfoController` | `GET /external-apps/userinfo` | `@Public()` + manual JWT check |
| `HealthController` | `GET /health`, `/health/readinessProbe`, `/startupProbe`, `/livenessProbe`, `/version` | `@Public()` on each |
| `MailWebhookController` | `POST /<MAIL_WEBHOOK_PATH_PREFIX>/…` | `@Public()` |
| `PaymentWebhookController` | `POST /<PAYMENT_WEBHOOK_PATH_PREFIX>/…` | `@Public()` |
| `SystemInfoController` | `GET /systemInfo?key=` | **none** — see §5.6 |

---

## 4. User sessions

### 4.1 Creation paths

| # | Entry point | Credential checked | TOTP | Resulting session |
| --- | --- | --- | --- | --- |
| a | `createSession(email, password, totpToken?)` — `libs/session/api/src/lib/session.resolver.ts:27`, `@Public()` | argon2id/bcrypt compare | required if `user.totpEnabled`; **no session without it** (`session.service.ts:102-110`) | normal TTL |
| b | `createSessionWithJWT(jwt, totpToken?)` — `session.resolver.ts:41`, `@Public()` | EdDSA JWT, audience = `WEBSITE_URL` | required if `totpEnabled` (`BadRequestException('TOTP_REQUIRED')`) | normal TTL |
| c | same mutation, `audience: 'preview'` | 1-minute JWT minted by `createJWTForWebsiteLogin` | **skipped** — "the editor user already passed 2FA" (`session.service.ts:148`) | normal TTL |
| d | same mutation, `audience: 'impersonation'` | 60-second One-signed grant, single-use via `impersonation_grants.jti` | n/a | TTL = `durationMinutes` from the grant, `impersonatedBy`/`impersonationReason`/`impersonatedAt` stamped |

`createSessionWithJWT` tries the three JWT flavours in this order: impersonation grant →
`preview` audience → ordinary website audience (`session.service.ts:115-158`).

`sendWebsiteLogin` / `sendJWTLogin` (`session.service.ts:331` and `:449`) email a login link;
the JWT inside is minted by `MailsModule`'s `jwtGenerator` closure
(`apps/api-example/src/nestapp/app.module.ts:168-175`) with `issuer = HOST_URL`,
`audience = WEBSITE_URL` and `expiresInMinutes = SEND_LOGIN_JWT_EXPIRES_MIN` (seeded 10080 =
7 days, `libs/api/prisma/seed.ts:68-77`). `sendWebsiteLogin` additionally rate-limits to one
link per minute per user via the `USER_PROPERTY_LAST_LOGIN_LINK_SEND` user property
(`session.service.ts:340-355`). `sendJWTLogin` is gated by `@Permissions(CanSendJWTLogin)`;
`sendWebsiteLogin` is `@Public()`.

### 4.2 `createUserSession`

`libs/session/api/src/lib/session.service.ts:282-329`:

```ts
const token = nanoid(IDAlphabet, 64);           // 62-char alphabet, 64 chars ≈ 381 bits
const expiresAt = new Date(Date.now() + (options?.ttlMs ?? (await this.sessionTtlMs())));
const [{ createdAt }] = await Promise.all([
  this.prisma.session.create({ data: { token, expiresAt, …impersonation, user: { connect: { id: user.id } } } }),
  this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } }),
]);
return { user, token, createdAt, expiresAt, totpEnabled: user.totpEnabled, impersonated: !!options?.impersonatedBy };
```

The alphabet is `0-9a-zA-Z` (`session.service.ts:32-33`). The secret is returned once in the
`SessionWithToken` payload and stored verbatim in the row.

### 4.3 Lifetime

```ts
// session.service.ts:52-62
private async sessionTtlMs(): Promise<number> {
  const days = await this.settingsService.settingByName(SettingName.SESSION_TTL_DAYS).catch(() => null);
  const value = Number(days?.value);
  return Number.isFinite(value) && value > 0 ? value * 24*60*60*1000 : this.sessionTTL;
}
```

- The `sessionTtlDays` setting is seeded to **7**, restricted to 1–365
  (`libs/api/prisma/seed.ts:24-34`).
- The injected fallback `SESSION_TTL_TOKEN` is also 7 days
  (`apps/api-example/src/nestapp/app.module.ts:213-214`: `MS_PER_DAY * 7`).
- **There is no sliding expiry and no refresh.** `expiresAt` is fixed at creation; using the
  session does not extend it. When it passes, the next request is simply anonymous and the
  client must log in again.
- **Expired rows are never swept.** The only `session.deleteMany` calls are
  `UserService.endSessions` (`libs/user/api/src/lib/user.service.ts:138-145`) and
  `SessionService.revokeImpersonationSessions` (`session.service.ts:270-280`). No periodic job
  in `libs/membership/api/src/lib/periodic-job/` touches `sessions`.

### 4.4 Validation on every request

```ts
// libs/authentication/api/src/lib/authentication.service.ts:50-84
private async loadUserSession(token: string) {
  const session = await this.prisma.session.findFirst({
    where: { token },
    include: { user: { select: unselectPassword } },
  });
  if (session && session.user) {
    return {
      type: AuthSessionType.User,
      id: session.id, token: session.token,
      createdAt: session.createdAt, expiresAt: session.expiresAt,
      impersonatedBy: session.impersonatedBy,
      user: session.user,
      roles: (await this.prisma.userRole.findMany({ where: { id: { in: session.user.roleIDs } } }))
               .map(addPredefinedPermissions),
    };
  }
  return null;
}

// …:114-124
public isSessionValid(session: AuthSession | null) {
  if (!session) return false;
  if (session.type === AuthSessionType.User) {
    return session.expiresAt > new Date() && session.user?.active === true;
  }
  return true;                       // token sessions are ALWAYS valid
}
```

So a user session is valid iff: the row exists **and** `expiresAt` is in the future **and**
`user.active === true`. Expiry is **not** filtered in SQL — an expired row is loaded, then
rejected in memory. Roles are re-read from the database on every cache miss, so a role change
takes effect as soon as the cache is invalidated.

### 4.5 The session cache

`libs/authentication/api/src/lib/session-cache.ts`:

```ts
export const SESSION_CACHE_NAMESPACE = 'auth:sessions';
export const SESSION_CACHE_TTL_SECONDS = 300;
export const sessionCacheKey = (kind: 'user' | 'peer', token: string) =>
  `${kind}:${createHash('sha256').update(token).digest('hex')}`;
```

`AuthenticationService.getUserSession`/`getPeerSession` wrap the loaders in
`KvTtlCacheService.getOrLoadNs(...)` for **300 seconds**, stripping the `token` field before
storing (`withoutToken`, `authentication.service.ts:13-19`) and re-attaching it after read.
The cache key is a SHA-256 of the secret, so secrets do not appear in cache keys. The backing
store is Dragonfly/Redis in deployment, in-memory otherwise (`KvTtlCacheModule`).

`SessionCacheInvalidator.invalidate()` resets the entire namespace. It is called from
**fourteen** places:

| File | Trigger |
| --- | --- |
| `libs/session/api/src/lib/session.service.ts:170` | `revokeSession` (logout) |
| `libs/session/api/src/lib/session.service.ts:277` | `revokeImpersonationSessions` |
| `libs/session/api/src/lib/totp.service.ts:209, 250, 297` | TOTP enable / reset / disable |
| `libs/user/api/src/lib/user.service.ts:134` | `updateUserPassword` |
| `libs/user/api/src/lib/user.service.ts:262, 295, 340, 370, 415, 432` | user create/update/delete and related |
| `libs/user/api/src/lib/profile.service.ts:54` | profile image change |
| `libs/user/api/src/lib/user-role.service.ts:81, 102` | `updateUserRole`, `deleteUserRole` |
| `libs/peering/api/src/lib/token.service.ts:32` | `deleteToken` |

Note `createUserRole` does **not** invalidate (nothing can reference a brand-new role yet), and
neither does `createToken`.

**Up to 300 seconds of staleness is therefore possible for anything that does not call the
invalidator** — including deactivating a user through a path that forgets to.

### 4.6 Revocation

| Action | Effect |
| --- | --- |
| `revokeActiveSession` mutation (`session.resolver.ts:52`, `@Public()`) | `prisma.session.delete({ where: { token } })` + cache invalidate |
| `updateUserPassword` | `endSessions(userId, keepSessionId)` deletes **all other** sessions, then invalidates (`user.service.ts:120-136`) |
| `user.active = false` | every session fails `isSessionValid` on the next cache miss |
| delete the user | `onDelete: Cascade` removes the rows |
| `revokeImpersonationSessions(ids?)` | deletes impersonated sessions |

### 4.7 Password handling

`libs/session/api/src/lib/user-authentication.service.ts:19-51`:

```ts
const isLegacyBcrypt = user.password.startsWith('$2');
isValid = isLegacyBcrypt ? await bcryptCompare(password, user.password)
                         : await argon2Verify(user.password, password);
if (!isValid) return null;
if (isLegacyBcrypt) {                                  // transparent upgrade on login
  await this.prisma.user.update({ where: { id: user.id }, data: { password: await argon2Hash(password) } });
}
```

New hashes are argon2id (`@node-rs/argon2`); bcrypt hashes are detected by the `$2` prefix and
rehashed on first successful login. `UserService.validatePassword`
(`libs/user/api/src/lib/user.service.ts:272-281`) runs a zod rule plus a Have-I-Been-Pwned
check (`hibp.service.ts`).

Password reset: `sendPasswordResetEmail` mints a 60-minute JWT with
`audience: 'password-reset'` (`session.service.ts:413-418`); `resetPasswordWithToken` verifies
it, validates the new password and calls `updateUserPassword` — **it does not create a
session** (`session.service.ts:423-447`).

### 4.8 Where the session token lives on the clients

| Client | Storage | Attached by |
| --- | --- | --- |
| Editor | `localStorage['sessionToken']` (`LocalStorageKey.SessionToken`, `libs/editor/api/src/lib/setup.tsx:38-41`) | `authLink` sets `authorization: Bearer <token>` **and a constant `preview: 'preview'` header** (`setup.tsx:43-58`) |
| Website, top-level | cookie `auth.token` holding the JSON `{token, createdAt, expiresAt}`, `sameSite: 'strict'`, `secure` in production, `expires = session.expiresAt` (`libs/utils/website/src/lib/session.provider.tsx:55-59`) | `authLink` (`libs/utils/website/src/lib/auth-link.tsx:6-25`) |
| Website, inside the editor's preview iframe | additionally `sessionStorage['auth.token']`, because a `SameSite=strict` cookie is dropped cross-site (`session.provider.tsx:47-53`) | same `authLink`, cookie first then sessionStorage |
| Website, SSR | `ssrAuthLink(token)` (`auth-link.tsx:27-65`) | explicit token passed in |

The editor gate is client-side: `Login.finalizeLogin` refuses to store the token unless the
returned roles contain `CAN_LOGIN_EDITOR` (`apps/editor/src/app/login.tsx:128-137`). The API
does **not** enforce `CanLoginEditor` on `createSession` — it is only checked on a handful of
editor-only queries (`libs/versionInformation/api/src/lib/versionInformation.resolver.ts:20`,
`libs/one/api/src/lib/one-channel-status.resolver.ts:21`).

---

## 5. What the `Token` model is actually used for

### 5.1 The whole surface

| Operation | Permission | File |
| --- | --- | --- |
| `tokens: [Token!]!` | `CanGetTokens` (`CAN_GET_TOKENS`) | `libs/peering/api/src/lib/token.resolver.ts:15-21` |
| `createToken(name: String!): TokenWithSecret!` | `CanCreateToken` (`CAN_CREATE_TOKEN`) | `…:23-29` |
| `deleteToken(id: String!): Token!` | `CanDeleteToken` (`CAN_DELETE_TOKEN`) | `…:31-37` |

There is **no `updateToken`**. The generated SDL confirms the signature:
`apps/api-example/schema-v2.graphql:2853` — `createToken(name: String!): TokenWithSecret!`.

Service (`libs/peering/api/src/lib/token.service.ts`):

```ts
export function generateToken() { return crypto.randomBytes(48).toString('base64'); }

async createToken(input: CreateTokenInput) {
  return this.prisma.token.create({ data: { ...input, token: generateToken() } });
}
```

`CreateTokenInput` is `PickType(TokenWithSecret, ['name'])` (`token.model.ts:38-43`), so the
only writable field is `name`. 48 random bytes → a 64-character base64 string (which may
contain `+` and `/`).

The secret is returned **once**, in the `TokenWithSecret.token` field; the plain `Token` type
has no `token` field (`token.model.ts:25-36`). The editor shows it in a one-shot panel
(`libs/ui/editor/src/lib/panel/tokenGeneratePanel.tsx:39-40`) and lists tokens at
`/tokens` (`apps/editor/src/app/routes/tokens/tokenList.tsx`, registered at
`apps/editor/src/app/app.tsx:1097` and `:1105`).

### 5.2 How a token authenticates

Only via the peer path:

```
Authorization: Bearer <token>
User-Agent: We.Publish/1.0 Peering
```

`SessionStrategy.validate` routes on the user-agent (§3.3); `getPeerSession` →
`loadPeerSession` (`libs/authentication/api/src/lib/authentication.service.ts:86-112`) does
`prisma.token.findFirst({ where: { token } })` and builds:

```ts
{
  type: AuthSessionType.Token,
  id: tokenMatch.id,
  name: tokenMatch.name,
  token: tokenMatch.token,
  roles: (await prisma.userRole.findMany({ where: { id: { in: tokenMatch.roleIDs } } }))
           .map(addPredefinedPermissions),
}
```

`isSessionValid` returns `true` unconditionally for a token session — **a `Token` never
expires and can never be deactivated short of deleting the row.** Confirmed by the test
"should return that the session is valid if it's a token session"
(`libs/authentication/api/src/lib/authentication.service.spec.ts:98-106`).

### 5.3 The two failure modes are asymmetric

- Wrong **user** token → `validate` returns `false` → `AuthGuard` throws
  `UnauthorizedException` → `OptionalAuthenticationGuard` swallows it → **anonymous request**.
- Wrong **peer** token → `UnauthorizedException` with `cause: INVALID_PEER_TOKEN` →
  rethrown → **401**. The comment calls this "to fake needing a token for peering"
  (`optional-authentication.guard.ts:23-26`): the queries a peer actually calls are
  `@Public()`, so the token is a gate, not a permission.

### 5.4 What permissions a token carries — in practice, none

`Token.roleIDs` is `String[]`, and:

- `createToken` accepts only `name`; `roleIDs` is never written.
- There is no `updateToken` mutation and no admin UI field for roles.
- No seed creates a `Token` row (`grep -rn "token.create\|token.upsert"` matches only
  `token.service.ts:23`).

Therefore every token created through the product has `roleIDs = []`, so `TokenSession.roles`
is `[]`, so `hasPermission(anything, [])` is `false` and **every `@Permissions(...)`-guarded
field is closed to it**. A token passes `@Authenticated()` and `@Public()` and nothing else.
To give a token real power somebody has to `UPDATE tokens SET "roleIDs" = '{admin}'` by hand —
at which point `addPredefinedPermissions` grants it `AllPermissions`.

`PeerPermissions` is `[CanGetPeerProfile, CanGetSharedArticle, CanGetSharedArticles]`
(`libs/permissions/src/lib/permissions.ts:1447-1451`). `CanGetSharedArticle(s)` are referenced
**nowhere** outside the permissions file itself, and `CanGetPeerProfile` is not used as a guard
either (the `peerProfile` query is `@Public()`,
`libs/peering/api/src/lib/peer-profile.resolver.ts:32`). The `peer` role is, today, decorative.

### 5.5 Peering — the one real consumer

The outbound side (`libs/peering/api/src/lib/peer-profile.service.ts:69-83`):

```ts
const link = createSafeHostUrl(hostURL, 'v1');
const client = new GraphQLClient(link, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'User-Agent': PEER_USER_AGENT,
  },
});
```

The token is the remote instance's `tokens.token`, pasted into `Peer.token`
(`schema.prisma:1007-1026`) when the peer is created. `Peer.token` is a plain `@Field()` on the
GraphQL `Peer` type (`libs/peering/api/src/lib/peer.model.ts:35-36`), so **anyone holding
`CanGetPeers` can read every peer's secret**.

`getRemotePeerProfile` caches remote profiles for `REMOTE_PEER_PROFILE_CACHE_TTL_SECONDS`
keyed on `hostURL` + SHA-256 of the token, and bypasses the cache entirely outside production
(`peer-profile.service.ts:54-67`).

### 5.6 Tokens in the audit log

`describeActor` (`libs/audit-log/api/src/lib/audit-log.interceptor.ts:33-64`) maps a
`TokenSession` to `actorType: 'token'`, `tokenName: session.name`, `sessionId: session.id`.
But the interceptor only records a mutation that carries `@Permissions` metadata
(`audit-log.interceptor.ts:94-100`) — and a token can never satisfy a `@Permissions` guard
(§5.4) — so in practice the `token` actor type is only reachable by a hand-edited
`tokens.roleIDs`.

### 5.7 Hazards of the current `Token`, as a list

| # | Fact | Where |
| --- | --- | --- |
| 1 | Secret stored in plaintext | `schema.prisma:1035` |
| 2 | `tokens.token` has no unique constraint and no index → full scan per auth | `schema.prisma:1028-1038` |
| 3 | No expiry; `isSessionValid` returns `true` unconditionally | `authentication.service.ts:123` |
| 4 | No owner, no `lastUsedAt`, no scopes, no `revoked` | `schema.prisma:1028-1038` |
| 5 | `roleIDs` unreachable from the API → tokens are permissionless by construction | `token.model.ts:38-43` |
| 6 | Authentication depends on an **exact** `User-Agent` string | `session.strategy.ts:20` |
| 7 | `Peer.token` (another instance's secret) is readable over GraphQL | `peer.model.ts:35` |
| 8 | `@Authenticated()` admits token sessions, but ~every handler behind it destructures `UserSession` — e.g. `@CurrentUser() { user }: UserSession` in `TotpResolver.generateTotpSetup` (`libs/session/api/src/lib/totp.resolver.ts:29`) would throw on a token session | `authenticated.guard.ts:22-25` |
| 9 | Deleting a token invalidates the whole session cache namespace, not just that key | `token.service.ts:32` |

---

## 6. How a request is authenticated as a non-user client

Exhaustively, today:

### 6.1 Peer token
§5. The only credential that produces a `request.user` without a `User`.

### 6.2 We.Publish One channel JWT — the best prior art

`libs/one/api/src/lib/one-scoped-jwt.guard.ts` + `one-token.verifier.ts`:

```ts
// one-token.verifier.ts:14-37
async verifyScopedJWT(token: string, expectedScope: string): Promise<boolean> {
  if (!this.oneURL) return false;
  try {
    const { kid } = decodeProtectedHeader(token);
    const key = await this.jwks.getKey(kid);
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['EdDSA'],
      issuer: this.oneURL,
      audience: this.hostURL,
      clockTolerance: 30,
    });
    return payload['scope'] === expectedScope;
  } catch { return false; }
}
```

- Keys are fetched from `${oneURL}/channel/jwks.json`, cached 24 h, indexed by `kid`, with a
  stale-key fallback if a refresh fails (`one-jwks-client.service.ts:36-92`).
- The guard is wired as a provider in `OneModule.registerAsync`
  (`libs/one/api/src/lib/one.module.ts:57-80`), with
  `{ provide: ONE_SCOPED_JWT_VERIFIER, useExisting: OneTokenVerifier }`.
- `@OneScopedJwt(scope)` composes `SetMetadata` + `OneOf(OneScopedJwtGuard)`.

Scopes in use (10 call sites):

| Scope | Resolvers |
| --- | --- |
| `read:stats` | `medium-stats.resolver.ts:11, 25, 38`; `medium-audit-log.resolver.ts:13` |
| `write:features` | `medium-features.resolver.ts:14` |
| `write:impersonate` | `impersonation.resolver.ts:29, 35, 46, 65, 93` |

**This is the template a new api-token library should follow**: a self-contained module with
its own verifier, its own guard, its own decorator, plugged into the existing `OneOf`
machinery without touching `libs/authentication/api`.

### 6.3 Website service token

`POST /website/token` is `@Public()` and hands out a 5-minute `read:website-settings` JWT to
*anyone who asks* (`libs/session/api/src/lib/website-token.controller.ts:11-20`). It is
intended for the Next.js server, which is inside the cluster; the endpoint itself is unguarded.
The matching `@ScopedJwt('read:website-settings')` decorator exists but is never applied —
`WebsiteMailResolver.mailchimp` verifies inline instead (§3.8).

### 6.4 External-app JWT

`createExternalAppToken(externalAppId)` is `@Authenticated()` and mints a **240-minute** JWT
with `sub = user.id` and `audience = app.url`
(`libs/external-apps/api/src/lib/external-apps.resolver.ts:84-105`). The external app calls
back to `GET /external-apps/userinfo` with that JWT; the controller decodes `aud` *without*
verifying, matches it against the registered apps by **origin**, then verifies with that
audience and returns the user plus their roles and (predefined-expanded) permission ids
(`external-apps-userinfo.controller.ts:24-89`).

Note the asymmetry: the token is minted with `audience: app.url` (the full URL) but matched
with `new URL(app.url).origin === audience`. These agree only when `app.url` is a bare origin.
UNVERIFIED at runtime (the API is not running); the code paths are unambiguous.

### 6.5 Media-server JWT (outbound)

`NovaMediaAdapter.generateAuthToken(imageId, action)`
(`libs/api/src/lib/media/novaMediaAdapter.ts:72-84`) signs an EdDSA JWT with
`sub = imageId`, `issuer = HOST_URL`, `audience = 'wepublish-media-server'`,
`{action: 'upload'|'delete'}`, 5-minute expiry, and sends it to the media server as a bearer.
The media server verifies it against this API's JWKS and additionally requires `sub` to equal
the requested image id and `action` to match the HTTP method
(`libs/media/api/src/lib/authentication/jwt-auth.guard.ts:38-61`). Keys are fetched from
`${apiUrl}/.well-known/jwks.json`, cached 24 h, with a stale-key fallback
(`libs/media/api/src/lib/authentication/jwks-client.service.ts:24-77`).

### 6.6 `systemInfo` shared key

`GET /systemInfo?key=…` compares against an injected `SYSTEM_INFO_KEY` with `timingSafeEqual`
(`libs/system-info/api/src/lib/system-info.controller.ts:16-29, 65-71`). The route carries
**no `OneOf` decorator**, so the global `OneOfGuard` returns `false` and the request is 403'd
before the key is ever compared. UNVERIFIED at runtime (the API is stopped), but §3.5 and §3.9
make the path unambiguous: either the endpoint is dead, or it is relying on something not
present in this tree.

### 6.7 Webhooks

`MailWebhookController` and `PaymentWebhookController` are `@Public()`; their bodies bypass the
JSON parser (`apps/api-example/src/main.ts:38-61`) so the provider's own signature can be
verified over the raw payload.

### 6.8 Anonymous

65 `@Public()` sites. The website reads articles, pages, events, polls and comments with no
credential at all.

---

## 7. Every JWT in the system

All JWTs are **EdDSA (Ed25519)**, signed with `JWT_PRIVATE_KEY` / verified with
`JWT_PUBLIC_KEY`, both PEM strings read from the environment with `\n` un-escaped
(`apps/api-example/src/nestapp/app.module.ts:215-226`). A development key pair is committed to
`.env`, `docker-compose.yml:31` and the CI workflows; it is not reproduced here.

`JwtService` (`libs/session/api/src/lib/jwt.service.ts`) imports the keys once in the
constructor and throws at boot if either is missing (lines 28-38). The `kid` is an RFC 7638
JWK thumbprint computed by `computeKid` (`libs/session/api/src/lib/jwk-utils.ts:8-17`) and set
on every token it signs. The public key is published at
`GET /.well-known/jwks.json` plus a minimal `GET /.well-known/openid-configuration`
(`libs/session/api/src/lib/jwks.controller.ts`).

| Audience | Issuer | Subject | Extra claims | Expiry | Minted by | Verified by |
| --- | --- | --- | --- | --- | --- | --- |
| `WEBSITE_URL` (default) | `HOST_URL` | user id | — | `expiresInMinutes`, default 60 | `JwtService.generateJWT` (`jwt.service.ts:50`) | `JwtService.verifyJWT` → `JwtAuthenticationService.authenticateUserWithJWT` |
| `WEBSITE_URL` (login link) | `HOST_URL` | user id | — | `SEND_LOGIN_JWT_EXPIRES_MIN` (seeded 10080 min) | `generateJWT` util (`libs/utils/api/src/lib/generate-jwt.ts:12`) via `MailsModule` | same |
| `'preview'` | `HOST_URL` | user id | — | **1 min** | `createJWTForWebsiteLogin` (`session.service.ts:476-493`), `@Permissions(CanPreview)` | `createSessionWithJWT` path c |
| `'password-reset'` | `HOST_URL` | user id | — | 60 min | `sendPasswordResetEmail` (`session.service.ts:413`) | `resetPasswordWithToken` |
| `'impersonation'` | `HOST_URL` | user id | `durationMinutes`, `impersonatedBy`, `reason`, `jti` | **60 s** (`IMPERSONATION_GRANT_TTL_SECONDS`) | `generateImpersonationGrant` (`jwt.service.ts:86`) | `verifyImpersonationGrant` + single-use `impersonation_grants` row |
| `WEBSITE_URL` (scoped) | `HOST_URL` | `'website-service'` | `scope` | 5 min default | `generateScopedJWT` (`jwt.service.ts:133`) | `verifyScopedJWT` (`jwt.service.ts:155`) |
| `app.url` | `HOST_URL` | user id | — | 240 min | `createExternalAppToken` | `ExternalAppsUserinfoController` |
| `'wepublish-media-server'` | `HOST_URL` | image/document id | `action` | 5 min | `NovaMediaAdapter` | media server `JwtAuthGuard` |
| `HOST_URL` | **One's URL** | — | `scope` | set by One | We.Publish One | `OneTokenVerifier` |

`verifyScopedJWT` always validates against `audience: this.websiteURL` regardless of what
`generateScopedJWT` was given (`jwt.service.ts:160-167`) — a scoped JWT minted for any other
audience will not verify.

---

## 8. Permissions, concretely

`libs/permissions/src/lib/permissions.ts` (1451 lines) exports ~200 `Permission` constants of
the shape:

```ts
export type Permission = { id: string; description: string; deprecated: boolean };

export const CanCreateToken: Permission = {
  id: 'CAN_CREATE_TOKEN',
  description: 'Allows to create tokens',
  deprecated: false,
};
```

and three arrays: `AllPermissions` (line 1193), `EditorPermissions` (line 1376),
`PeerPermissions` (line 1447). `hasPermission` logs a console warning for a `deprecated`
permission (`has-permission.ts:15`).

The GraphQL `UserRole.permissions` field re-expands the predefined sets for the three system
roles and otherwise filters `AllPermissions` by the stored ids
(`libs/user/api/src/lib/user-role.resolver.ts:80-94`), which means **a permission id stored in
`permissionIDs` that no longer exists in `AllPermissions` silently disappears from the UI** —
but `hasPermission` still honours it, because it compares raw id strings.

Role CRUD is `@Permissions(CanCreateUserRole)` / `CanDeleteUserRole`
(`user-role.resolver.ts:58-78`); `createUserRole` always forces `systemRole: false`
(`user-role.service.ts:86-94`).

Editor side: `useHasPermission` / `PermissionControl` / `createCheckedPermissionComponent`
(`libs/ui/editor/src/lib/atoms/permissionControl.tsx`) read the roles out of `AuthContext`,
which is populated from the `me` query (`libs/ui/editor/src/lib/authContext.tsx:93-110`).
Note `useHasPermission` returns **`true` when `roles` is undefined** (line 40-42) — the UI
fails open while the session is loading; only the API is authoritative.

The `me` query is `@Authenticated()` (`libs/user/api/src/lib/profile.resolver.ts:21`) and the
`SensitiveDataUser.permissions` field only returns permissions when the parent user *is* the
caller (`libs/user/api/src/lib/sensitive-data-user.resolver.ts:49-59`).

---

## 9. What it would take to add a separate `api-token` library

Nothing below is a recommendation; it is an inventory of the hooks that exist and what each
one costs.

### 9.1 Nx wiring

A new lib follows the existing two-level `libs/<domain>/api` shape. Reference:
`libs/features/api/project.json` —

```json
{
  "name": "features-api",
  "sourceRoot": "libs/features/api/src",
  "projectType": "library",
  "tags": [],
  "targets": {
    "build": { "executor": "@nx/js:tsc", "options": { "outputPath": "dist/libs/features/api", "tsConfig": "libs/features/api/tsconfig.lib.json", "main": "libs/features/api/src/index.ts", "rootDir": "." } },
    "test":  { "options": { "config": "../../../{projectRoot}/vitest.config.ts" } }
  }
}
```

plus a `@wepublish/api-token/api` entry in `tsconfig.base.json` `paths` (the existing block
runs from line 30 for `@wepublish/authentication/api` to line 113 for `@wepublish/session/api`),
an `index.ts` barrel, `eslint.config.mjs`, the three tsconfigs and
`createVitestConfig({ nest: true })`. The module then has to be imported in
`apps/api-example/src/nestapp/app.module.ts`.

### 9.2 A separate Prisma schema file

Prisma is **7.5.0** (`package.json`), and `@prisma/config`'s `schema` option is documented as
"The path to the schema file, **or path to a folder that shall be recursively searched for
`*.prisma` files**" (`node_modules/@prisma/config/dist/index.d.ts:141-145`). So a per-library
schema file is supported, but it is a repo-wide move, not a local one:

1. `libs/api/prisma/schema.prisma` becomes `libs/api/prisma/schema/<something>.prisma`
   (a folder cannot contain both a `schema.prisma` *file* and be the schema *folder*).
2. `prisma.config.ts` (`schema: schemaPath`, lines 12-17 and 28) and the `prisma.schema` key in
   the root `package.json` both have to point at the folder. `prisma.config.ts` also has a
   Docker fallback path (`prisma/schema.prisma`) that must move in step, and the Docker build
   that copies the schema has to copy the folder.
3. `generator`/`datasource` blocks stay in exactly one file in the folder.
4. The new file carries only the api-token models with their own `@@map` prefix.
5. Migrations remain **one shared directory** (`libs/api/prisma/migrations/`) and one
   `_prisma_migrations` table — splitting the schema does not split the migration history.
6. There is still exactly **one** generated `PrismaClient`, provided once by `PrismaService`
   (`libs/nest-modules/src/lib/database/prisma.service.ts`) and injected everywhere as
   `PrismaClient`. A separate schema file buys **file-level** separation, not a separate client,
   connection pool or database.

If genuine independence from the main migration flow is wanted, Prisma 7 also offers
`tables.external` in `prisma.config.ts` — "List of tables that are externally managed. Prisma
will not modify the structure of these tables and not generate migrations for those tables.
These tables will still be represented in schema.prisma file and be available in the client
API" (`node_modules/@prisma/config/dist/index.d.ts:201-208`). That hands migration ownership to
the library at the cost of hand-written SQL.

Table prefix: follow one of the two conventions in §2.8. The dot-grouped family would give
`tokens.api`, `tokens.api.scopes`; the newer snake_case family would give `api_tokens`,
`api_token_scopes`.

### 9.3 Extension points for the credential itself

Three exist. They are not equivalent.

**(a) A second Passport strategy.** `PassportModule.register({ defaultStrategy: 'session' })`
registers one default; `AuthGuard('<name>')` can name another. Cost: the global
`OptionalAuthenticationGuard` is hard-wired to `AuthGuard('session')`
(`optional-authentication.guard.ts:9`), so a second strategy only runs if a *second* global
guard is added, or if `AuthenticationModule` is edited. Both touch shared code.

**(b) A dedicated Nest guard + `OneOf` decorator — the pattern already proven twice.**
`OneScopedJwtGuard` (§6.2) and `ScopedJwtGuard` are exactly this. The recipe:

```ts
// libs/api-token/api/src/lib/api-token.guard.ts
export const API_TOKEN_METADATA_KEY = 'api_token';

@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(private reflector: Reflector, private service: ApiTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndMerge<string[]>(API_TOKEN_METADATA_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!required.length) return false;

    const req = GqlExecutionContext.create(context).getContext().req;   // works for HTTP too (§3.9)
    const header = req?.headers?.authorization;
    if (!header?.startsWith('Bearer ')) return false;

    const token = await this.service.verify(header.slice(7));           // hash lookup + expiry + revoked
    if (!token) return false;

    req.apiToken = token;                                               // own slot, does NOT clobber req.user
    return required.every(scope => token.scopes.includes(scope));
  }
}

export const ApiToken = (...scopes: string[]) =>
  applyDecorators(AddMetadata(API_TOKEN_METADATA_KEY, scopes), OneOf(ApiTokenGuard));
```

Cost: **zero edits to `libs/authentication/api`**, `libs/session/api` or
`libs/permissions/api`. `OneOfGuard` resolves the guard with
`moduleRef.get(ref, { strict: false })` (`one-of.guard.ts:26`), so the guard only needs to be a
provider in the new module. Caveat: because the new decorator is `OneOf`, a method carrying
both `@Permissions(X)` and `@ApiToken('y')` becomes "X **or** y", not "X and y" — the AND form
needs `UseGuards` like `@Feature`.

**(c) Widen `AuthSession`.** `libs/authentication/api/src/lib/auth-session.ts` is a two-member
union:

```ts
export enum AuthSessionType { User = 'user', Token = 'token' }
export type AuthSession = TokenSession | UserSession;
```

Adding `AuthSessionType.ApiToken` and an `ApiTokenSession` member would let an API token flow
through `@CurrentUser()`, `@Authenticated()`, `PermissionsGuard` and `describeActor` unchanged.
Cost: `AuthSession` is consumed in `libs/audit-log`, `libs/permissions/api`, `libs/one/api`,
`libs/consent/api`, `libs/settings/api` and every resolver that types `@CurrentUser()` as
`UserSession`. TypeScript will catch the exhaustive switches; it will **not** catch the ~35
`@Authenticated()` handlers that destructure `{ user }` off a session they assume is a
`UserSession` (§5.7 hazard 8). That is the real cost of (c).

A pragmatic hybrid: ship (b) for the guard, and have the guard additionally set
`req.user = <an AuthSession-shaped object>` only on resolvers explicitly opted in — which is
what makes the organisation scoping below possible.

### 9.4 Making `@Permissions` work for an API token

`PermissionsGuard` reads `request.user.roles` and calls `hasPermission` — nothing more
(`permission.guard.ts:24-31`). Any object with a `roles: {id, permissionIDs}[]` shape satisfies
it. So an API token can reuse the whole permission system by either:

- storing `roleIDs` on the token row and expanding them exactly like
  `loadPeerSession` does (`authentication.service.ts:99-107`) — this is what `Token` already
  intends and never delivers; or
- storing explicit `permissionIDs` on the token and synthesising a single pseudo-role
  `{ id: '<token-id>', permissionIDs }`, which avoids the indirection and lets a token hold a
  strict subset of its creator's permissions.

Either way `addPredefinedPermissions` (`predefined-permissions.ts`) must be applied if role ids
`admin`/`editor`/`peer` are to mean anything.

### 9.5 Scoping a token to an organisation

**There is no `Organization` model in We.Publish today** — `grep -n "model Organization"
libs/api/prisma/schema.prisma` returns nothing, and there is no `libs/organization`. So
organisation scoping is new ground on both sides. The pieces that already exist and can carry it:

| Mechanism | How organisation scoping would attach | Honest assessment |
| --- | --- | --- |
| `Permission.id` strings | invent `CAN_UPDATE_OTHER_ORGANIZATION_EVENTS` etc. (already planned in decision D4) | works for *capability*, carries no *instance* — "which organisation" cannot be encoded in a permission id without an explosion |
| `request.user.roles` | add an `organizationIDs` array to the session object alongside `roles` | the permission guard ignores it, so every resolver/service must read it explicitly — same shape as BKa's voters, which also sit below the firewall |
| A guard-set request slot (`req.apiToken.organizationId`) | the `ApiTokenGuard` above puts it there; services read it | cheapest; makes the scope explicit at the point of use; no shared-code edits |
| Prisma `where` injection | a service-layer helper `scopeToOrganization(where, session)` | the only place that can actually enforce row-level scope; mirrors BKa's Doctrine query extensions (`bka-06` §5) |

The honest conclusion from reading the tree: We.Publish has **capability**-based authorisation
(`@Permissions`) and **no** instance-level authorisation layer at all — no voters, no policy
objects, no row filters. Every existing instance-level rule is an `if` inside a service (e.g.
`libs/consent/api/src/lib/user-consent/user-consent.service.ts:70` checks
`!user.user.roleIDs.includes('admin')` by hand). An organisation-scoped token therefore needs
a new service-layer convention, not a new guard; the guard can only make the scope *available*.

### 9.6 Secret handling a new library should decide explicitly

Each row below is a property the existing `Token` lacks; the column says where the repo already
demonstrates the technique.

| Property | Prior art in this repo |
| --- | --- |
| Hash at rest instead of plaintext | `argon2Hash` in `libs/session/api/src/lib/user-authentication.service.ts:43`; `createHash('sha256')` for cache keys in `session-cache.ts:12` |
| Unique index on the lookup column | `Session.token String @unique` + `@@index([token])` (`schema.prisma:1043, 1055`) |
| A lookup prefix so a hashed secret can still be found in O(1) | none — would be new |
| Expiry | `Session.expiresAt` + `isSessionValid` (`authentication.service.ts:120`) |
| Revocation flag vs. row delete | row delete everywhere today |
| Single-use / replay protection | `ImpersonationGrant.jti` + `redeemedAt`, redeemed with a conditional `updateMany` and a `count !== 1` check (`session.service.ts:222-230`) |
| Owner + audit trail | `AuditLog.actorType = token`, `tokenName` (`schema.prisma:2334-2340`) |
| Show-once UX | `TokenWithSecret` vs `Token` (`token.model.ts:25-36`) and the editor's generate panel |
| Rate limiting | **none anywhere in the repo** |

### 9.7 Caching and invalidation

If the new library caches verification results it should reuse `KvTtlCacheService.getOrLoadNs`
with its **own namespace** — `SessionCacheInvalidator.invalidate()` resets the whole
`auth:sessions` namespace, and piggybacking on it means every user-role change also flushes
every API token. The pattern to copy is `session-cache.ts` (namespace constant + TTL constant +
`sha256` key function + a tiny `@Injectable` invalidator exported from a small `@Module`).

### 9.8 Audit logging

`AuditLogInterceptor` only records mutations that carry `@Permissions` metadata
(`audit-log.interceptor.ts:94-100`). A library whose mutations are guarded by a new
`@ApiToken(...)` decorator instead would record nothing. Either add `@Permissions` alongside,
or extend the interceptor's trigger condition, or record explicitly in the service.

### 9.9 Checklist of files that would have to change outside the new library

| File | Why |
| --- | --- |
| `tsconfig.base.json` | path alias |
| `apps/api-example/src/nestapp/app.module.ts` | import the module |
| `prisma.config.ts` + root `package.json` `prisma.schema` | only if the schema becomes a folder (§9.2) |
| `libs/permissions/src/lib/permissions.ts` | if new `CAN_*_API_TOKEN` permissions are introduced (and `AllPermissions`/`EditorPermissions` updated) |
| `libs/authentication/api/src/lib/auth-session.ts` and its ~6 consumers | **only** if option (c) is taken |
| `apps/editor/src/app/app.tsx` + the editor command-palette route registry | if the library ships a UI |
| `.prettierignore` | if codegen output is added |

---

## 10. Mapping BKa's three mechanisms onto We.Publish

Read against `docs/bka-migration/research/bka-06-security-auth-roles.md` §1, §11, §12, §13.

| BKa mechanism | Nearest We.Publish mechanism | Fit | Gap |
| --- | --- | --- | --- |
| **A. Session login** (`main` firewall, `form_login` + `PHPSESSID`, CSRF, login throttling, `remember_me` configured but inert) | **User session** (§4): `createSession` → opaque 64-char row in `sessions`, returned to the client, replayed as `Authorization: Bearer` | **Good.** Both are server-side opaque session rows keyed off an email+password check, both re-read roles from the database on every request, both refuse disabled users. | We.Publish has **no cookie**, so no CSRF layer is needed and none exists; the credential is bearer-only and lives in `localStorage` (editor) or a `SameSite=strict` cookie the client reads back (website). We.Publish has **no login throttling** — BKa's `login_throttling` (bka-06 §14.1) has no counterpart. We.Publish adds TOTP (BKa has none) and impersonation grants (BKa's `switch_user` is dead, bka-06 §11.4). BKa's "remember me" and session cookie hardening (`nelmio_security`) have no counterpart. |
| **B. OAuth2 client credentials / refresh-token grant** (API v1, `league/oauth2-server`, four confidential clients, `api` scope, access tokens persisted to `oauth2_access_token`, roles = user's roles ∪ `ROLE_OAUTH2_API`) | **Nothing.** The nearest things are (i) the `Token` row, which is a bare non-expiring secret with no client, no scope and no working roles (§5), and (ii) the One channel JWT, which has scopes but is signed by an *external* issuer and never becomes a session (§6.2). | **Poor.** This is the hole the new api-token library is for. | We.Publish has no client registry, no client secret, no grant flow, no token endpoint, no refresh, no scopes, no per-token expiry, no revocation flag, and no concept of "this token acts as user X". BKa's four partner integrations (`bka-frontend`, `guidle`, `heiko_dachstock.ch`, `punktzwei`) each authenticate as a *named user* and inherit that user's roles — three of the five identities are `ROLE_ADMIN`. The closest reproducible behaviour today is a hand-edited `tokens.roleIDs`, which is not a product feature. |
| **C. UserToken JWT** (API v2; admin UI mints an RS256 JWT whose `uuid` claim must match a `user_token` row; owner must be enabled; revocation = delete the row; no scopes, no max expiry — production rows run to 2050) | **Partly `Token`, partly the external-app JWT.** The *stateful-check-behind-a-JWT* shape is unique to BKa; We.Publish either checks a row (`sessions`, `tokens`) or checks a signature (every JWT in §7), never both. | **Partial.** The `Token` row reproduces "a named credential an admin creates in the UI, revoked by deleting the row"; it does not reproduce the owner, the expiry, or the role inheritance. | BKa's model is actually the better template for the new library: a row that owns name + owner + `expiresAt` + a revocation handle, with the presented credential bound to that row. We.Publish's `ImpersonationGrant` (`jti` + `redeemedAt`, §2.5) is the only place in this repo that already does "JWT plus a database row that can veto it". BKa's defects to not copy: no maximum expiry, revocation over a CSRF-less `GET` link, the raw JWT stored in the row in plaintext, and `user_token.expires_at` not re-read at validation time. |

Three cross-cutting observations:

1. **BKa's firewalls are per-URL-prefix; We.Publish's are per-resolver.** BKa can say "`/api/v2`
   is stateless and only accepts JWTs". We.Publish has one GraphQL endpoint (`path: 'v1'`,
   `app.module.ts:117`) and one guard chain; a credential type is admitted or refused per
   field, by decorator. A new api-token library therefore cannot be scoped by URL — it must be
   scoped by which resolvers carry its decorator (or by a session type that the permission guard
   understands).
2. **BKa separates "who you are" from "which door you came through"** (`ROLE_OAUTH2_API` is
   added to the user's roles). We.Publish's `AuthSession` union does the same thing structurally
   (`AuthSessionType.User` vs `.Token`), and `AuditLogActorType` already persists the
   distinction — so the concept is present and unused.
3. **BKa's row-level authorisation (voters + Doctrine query extensions) has no counterpart.**
   `bka-06` §4 and §5 describe six voters and four query extensions enforcing
   "your organisation's events only". We.Publish has `hasPermission` and nothing else. Whatever
   carries organisation scope for the ported events — token or user — will need a new
   service-layer mechanism either way.

---

## 11. Facts that will bite (observations, no design opinions)

1. **Default deny is load-bearing.** A resolver with no auth decorator is 403, not open.
   Any new resolver must carry `@Public()`, `@Authenticated()`, `@Permissions(...)` or a new
   `OneOf` decorator.
2. **`@Permissions(A, B)` means A *and* B.** Stacking two `@Permissions` decorators, or putting
   one on the class and one on the method, also ANDs (`getAllAndMerge`).
3. **Stacking `@Public()` with anything else makes it public.** `OneOf` is OR.
4. **`@Feature` is AND** and is the only decorator using `UseGuards`. The feature registry is
   currently empty, so `@Feature` is unexercised in production code.
5. **Field resolvers are unguarded.** Protecting a field means an inline check, and the one
   existing example of that check has a `boolean || Promise<boolean>` bug.
6. **`@Authenticated()` is not "a logged-in user"** — it is "there is a session", which includes
   peer token sessions with no `user`.
7. **Session validity is cached for 300 s.** Deactivating a user or changing a role is not
   immediate unless the mutating code calls `SessionCacheInvalidator.invalidate()`.
8. **Nothing deletes expired sessions.** The `sessions` table grows monotonically.
9. **`tokens.token` is unindexed and non-unique.** Every peer authentication is a sequential
   scan, and two tokens can share a secret.
10. **Peer authentication keys off an exact `User-Agent` string.** Any proxy that rewrites
    `User-Agent` breaks peering, and a client that *claims* that user agent with a bad token
    gets a hard 401 rather than an anonymous request.
11. **`Peer.token` is exposed in the GraphQL schema** — a remote instance's secret is readable
    by anyone with `CanGetPeers`.
12. **`createToken` cannot set `roleIDs`**, so product-created tokens carry no permissions.
13. **`SystemInfoController` has no `OneOf` decorator**, so the global guard denies it before its
    own shared-secret check runs (UNVERIFIED at runtime).
14. **`POST /website/token` is `@Public()`** and issues a `read:website-settings` JWT to any
    caller.
15. **The external-app token is minted with `aud = app.url` but matched by origin**, so it only
    works for apps registered at a bare origin (UNVERIFIED at runtime).
16. **`unselectPassword` must be updated for every new `User` scalar**, or the build breaks —
    which is the intended behaviour, not a bug.
17. **There is exactly one `PrismaClient`.** Splitting the Prisma schema into several files does
    not split the client, the pool, the migration directory or the `_prisma_migrations` table.
18. **There is no rate limiting anywhere** — not on login, not on password reset, not on token
    verification. The only throttle in the auth area is the one-login-link-per-minute check in
    `sendWebsiteLogin`.
19. **No `kid` on the login-link JWT.** `generateJWT` only sets `kid` when passed one, and
    `MailsModule` does not pass one; `JwtService.verifyJWT` does not look at `kid` either, so a
    key rotation would have to be a flag day.
20. **`revokeActiveSession` is `@Public()`** and deletes whatever session the bearer token
    names — harmless, since you must hold the token, but worth knowing it is not
    `@Authenticated()`.

---

## Porting notes

*Implications, clearly separated from the facts above.*

**The existing `Token` is not a foundation to build on.** It is a plaintext, non-expiring,
unindexed, permissionless secret whose only live consumer is peering, and whose authentication
depends on a magic `User-Agent`. Decision D4's permission set and the organisation scoping the
BKa port needs cannot be expressed on it. A separate `api-token` library is the right shape;
the existing `Token` should be left exactly where it is (peering) rather than extended.

**Copy `libs/one/api`, not `libs/authentication/api`.** `OneScopedJwtGuard` +
`OneTokenVerifier` + `OneScopedJwt` + `OneModule.registerAsync` is a complete, self-contained
credential type that plugs into the global guard chain through `OneOf` and touches no shared
file. The same four files, with a database-backed verifier instead of a JWKS-backed one, is the
whole api-token mechanism.

**The hard question is not the credential, it is the scope.** We.Publish authorises by
capability (`hasPermission(perms, roles)`) and has no instance-level layer — no voters, no row
filters, no policy objects, no `Organization` model. BKa's "your organisation's events only"
lives in six voters and four Doctrine query extensions (`bka-06` §4-§5). Whichever way the port
goes, that layer has to be built; an API token scoped to an organisation is then just another
principal feeding it. Building the guard first and the scoping convention second will produce a
token that can authenticate and cannot be limited.

**Two shapes are worth weighing for the credential itself:**

- *Opaque secret + row* (the `Session` shape). Simple, revocable instantly, needs a unique index
  and ideally a hash-at-rest with a lookup prefix. Costs one database read per request, which
  the existing 300-second cache pattern already solves.
- *JWT + row veto* (the `ImpersonationGrant` shape, and BKa's mechanism C). Stateless happy
  path, but revocation then needs the row read anyway, which erases the advantage. Only worth it
  if tokens have to be verified by a service that cannot reach the database — which, today,
  none does.

Given that every API token will be checked by this API against this database, the opaque-secret
shape is strictly simpler and matches what `sessions` already proves at production volume.

**Reuse the permission system rather than inventing scopes.** `PermissionsGuard` cares only
about `request.user.roles[].permissionIDs`. Giving an api-token row either `roleIDs` (expanded
with `addPredefinedPermissions`, exactly as `loadPeerSession` does) or a direct `permissionIDs`
list makes every one of the 260 existing `@Permissions` sites work for tokens for free, and
makes the new events permissions from decision D4 apply uniformly to users and machines. A
parallel "scope" vocabulary would have to be mapped onto permissions anyway.

**Budget for the `@Authenticated()` hazard.** 35 handlers are guarded by `@Authenticated()` and
most of them destructure a `UserSession`. Any session type that is neither a user nor the
existing peer token will reach them. Either keep API tokens out of `request.user` entirely
(option 9.3b) or audit those 35 sites (option 9.3c). There is no third option that is safe.

**A separate Prisma schema file is cheap; a separate migration lane is not.** The folder switch
is three lines of configuration plus a Docker path, and gives genuine file-level ownership. The
migration directory, the `_prisma_migrations` table and the generated client stay shared. If the
goal is only "the api-token models live in the api-token library's own file", §9.2 steps 1-4
are enough. If the goal is "the api-token library owns its own schema evolution", that needs
`tables.external` and hand-written SQL, and should be a conscious decision rather than a
side-effect.

**Finally, the two things BKa got right that We.Publish lacks and the new library should
carry:** a token has an **owner** (so "who issued this" is answerable without an audit-log
join) and an **expiry** (so a forgotten integration eventually stops working). BKa's own
failure — no maximum on that expiry, hence production rows valid until 2050 — is the one detail
to not reproduce.
