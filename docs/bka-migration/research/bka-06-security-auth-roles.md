# BKa — Security, Authentication, Authorisation and the Permission Model

Scope note: this document describes **what exists today** in `/Users/itrulia/Documents/insitu-admin` (Symfony 6.4 / API Platform 4 / Doctrine, PHP ≥ 8.3) for the **BKA** product (`SYLIUS_THEME=in-situ-admin/bka`, `LIST_OWN_EVENTS_ONLY=true`, `ACTIVATE_MEMBERS=true`, `LOCALES=fr|de`, `DEFAULT_LOCALE=de`). It covers the full security configuration (`config/packages/security.yaml`), every voter in `src/Security/Voters/`, the three authentication mechanisms (form/session login, OAuth2 bearer tokens for API v1, UserToken-backed JWTs for API v2), the API Platform Doctrine query extensions that mirror the voters, the complete user lifecycle (creation, invitation, locale, `member` flag, deactivation, deletion and its cascades), password reset, and the hardening layer (login throttling, CSRF, `nelmio_security`, CORS, session cookie). Every claim is anchored to a file path + line number, a vendor source excerpt, a SQL result run against the restored BKA production database (`docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin`), or an HTTP probe against the live admin at `http://localhost:8080`. Facts come first; a clearly separated **Porting notes** section at the end sketches how this maps onto We.Publish's permission model.

Relevant library versions (from `composer.lock`):

| Package | Version |
| --- | --- |
| `symfony/security-bundle` | v6.4.26 |
| `symfony/security-core` | v6.4.27 |
| `symfony/security-http` | v6.4.26 |
| `symfony/rate-limiter` | v6.4.24 |
| `lexik/jwt-authentication-bundle` | v3.1.1 |
| `league/oauth2-server-bundle` | v0.9.1 |
| `league/oauth2-server` | 9.2.0 |
| `symfonycasts/reset-password-bundle` | v1.23.2 |
| `nelmio/security-bundle` | v3.6.0 |
| `nelmio/cors-bundle` | 2.6.0 |
| `api-platform/symfony` + `api-platform/doctrine-orm` | ^4.0 |
| `friendsofsymfony/rest-bundle` | 3.8.0 |

---

## 1. The three authentication mechanisms at a glance

| | **A. Session login** | **B. OAuth2 bearer (API v1)** | **C. UserToken JWT (API v2)** |
| --- | --- | --- | --- |
| Firewall | `main` (`^/`), stateful | `api` (`^/api(?!/v2)`), **stateless** | `api_platform` (`^/api/v2`), **stateless** |
| Credential | email + password, `_csrf_token` | OAuth2 access token (RS256 JWT issued by `league/oauth2-server`) | app JWT (RS256, lexik) whose `uuid` claim must match a `user_token` row |
| Transport | form POST to `/login`, then `PHPSESSID` cookie | `Authorization: Bearer <token>` | `Authorization: Bearer <token>` |
| Issued by | `form_login` + `SecurityListener` | `bin/console app:oauth-accesstoken-generator` (`src/Command/OauthAccessTokenGeneratorCommand.php`) and refresh at `POST /api/token` | admin UI `GET/POST /user-token/create` (`src/Controller/UserTokenController.php:83`) |
| Stored in | PHP session (`framework.session`, native handler) | `oauth2_access_token` / `oauth2_refresh_token` | `user_token` (**token stored in plaintext**) |
| Revoked by | logout (`/logout`), password/role/email change, user deletion | `revoked` flag / deleting the row / deleting the `oauth2_client` (cascade) | **deleting the `user_token` row** (`DELETE` is a plain `GET` link) or disabling the owner |
| Lifetime | session cookie; `remember_me` configured at 4 weeks but never triggered (see §11.3) | `access_token_ttl: PT1H` for refresh-grant tokens; CLI-minted tokens use whatever `DateInterval` is passed (prod rows run to **2043–2046**) | JWT `exp` = `user_token.expires_at` (prod rows run to **2050**) |
| Enabled-user check | **Yes** (`SecurityListener::onCheckPassport`) | **No** — a disabled user's token still works (§12.5) | **Yes** (`CustomJWTAuthenticator` line 49) |
| Roles used | user's `roles` column, via role hierarchy | user's `roles` **plus** `ROLE_OAUTH2_API` | user's `roles` (reloaded from DB each request) |

---

## 2. Roles

### 2.1 The complete role list

There are exactly **four application roles** referenced anywhere in `src/`, `templates/`, `themes/` or `config/`, plus two framework roles and one scope role.

| Role | Where it comes from | Meaning |
| --- | --- | --- |
| `ROLE_USER` | stored in `user.roles`; also implied by `ROLE_ADMIN` via hierarchy | "Admin" in the UI (`user.userType.labels.Admin`, `src/Controller/UserController.php:54-56`). A normal venue/organisation editor. |
| `ROLE_ADMIN` | stored in `user.roles` | "Super-admin" in the UI (`src/Controller/UserController.php:51-53`). Sees and edits everything. |
| `ROLE_BROADCAST_PARTNER` | stored in `user.roles` | Read-only "broadcast partner" — can read all events/places/organisations through the API but cannot write. **Zero rows in BKA production.** |
| `ROLE_SUPER_ADMIN` | `role_hierarchy` only — **never assigned to any user** | Would grant `ROLE_ADMIN` + `ROLE_ALLOWED_TO_SWITCH`. |
| `ROLE_ALLOWED_TO_SWITCH` | granted only through `ROLE_SUPER_ADMIN` | Symfony's impersonation role. Dead in practice (§11.4). |
| `ROLE_OAUTH2_API` | synthesised per-request by `league/oauth2-server-bundle` from the token's `api` scope (`role_prefix: ROLE_OAUTH2_`, `config/packages/league_oauth2_server.yaml:72`) | Never checked anywhere in `src/`. |
| `IS_IMPERSONATOR` | Symfony built-in | Used only in `templates/includes/header.html.twig:28` and `templates/datatables/user-actions.html.twig:8`. |

### 2.2 Role hierarchy (`config/packages/security.yaml:15-17`)

```yaml
role_hierarchy:
    ROLE_ADMIN:       ROLE_USER
    ROLE_SUPER_ADMIN: [ROLE_ADMIN, ROLE_ALLOWED_TO_SWITCH]
```

Effective closure:

```
ROLE_SUPER_ADMIN → ROLE_ADMIN → ROLE_USER
ROLE_SUPER_ADMIN → ROLE_ALLOWED_TO_SWITCH
ROLE_BROADCAST_PARTNER → (nothing; it is NOT in the hierarchy and does NOT imply ROLE_USER)
```

Because `ROLE_BROADCAST_PARTNER` is outside the hierarchy, every check that wants to include partners has to spell it out — hence the recurring expression `is_granted("ROLE_USER") or is_granted("ROLE_BROADCAST_PARTNER")` on 17 API resources and on `UserTokenController` (`src/Controller/UserTokenController.php:26`).

Note the user form enforces mutual exclusivity between `ROLE_USER` and `ROLE_BROADCAST_PARTNER` (`src/Form/UserType.php:154-164`), but `ROLE_ADMIN` is an orthogonal checkbox that can be combined with either.

### 2.3 Live role distribution (BKA production, 427 users)

```sql
SELECT roles, count(*) FROM "user" GROUP BY roles ORDER BY count(*) DESC;
```

| `roles` | count |
| --- | --- |
| `["ROLE_USER"]` | 397 |
| `["ROLE_USER","ROLE_ADMIN"]` | 28 |
| `["ROLE_ADMIN","ROLE_USER"]` | 2 |

**There are no `ROLE_BROADCAST_PARTNER` and no `ROLE_SUPER_ADMIN` rows in BKA production.** 30 admins, 397 plain users. Note the array order is not normalised (two spellings of the same set) — the port should treat `roles` as a set, not a list.

Other user-column distributions:

```sql
SELECT enabled, count(*) FROM "user" GROUP BY enabled;   -- f:13   t:414
SELECT member,  count(*) FROM "user" GROUP BY member;    -- f:158  t:269
SELECT locale,  count(*) FROM "user" GROUP BY locale;    -- de:427  (no fr users at all)
SELECT config,  count(*) FROM "user" GROUP BY config;
--  {"org_creation":"done"}     21
--  NULL                       302
--  {"org_creation":"ignored"}   1
--  {"org_creation":"needed"}  103
```

### 2.4 "User type" — the UI abstraction over roles

The admin UI does not expose raw roles. `src/Form/UserType.php:66-85` offers a `userType` choice (`User::USER_TYPES`, `src/Entity/User.php:20-28`) plus an independent `adminRole` checkbox. `UserType::onPostSubmit` (`src/Form/UserType.php:137-169`) translates them:

| `userType` choice | roles written | `config.org_creation` written |
| --- | --- | --- |
| `admin` | adds `ROLE_USER`, removes `ROLE_BROADCAST_PARTNER` | `needed` (or kept at `done` if already done) |
| `admin_additional` | adds `ROLE_USER`, removes `ROLE_BROADCAST_PARTNER` | `ignored` |
| `broadcast_partner` | adds `ROLE_BROADCAST_PARTNER`, removes `ROLE_USER` | `ignored` |
| `adminRole` checkbox ✔ | adds `ROLE_ADMIN` | — |
| `adminRole` checkbox ✘ | removes `ROLE_ADMIN` | — |

`userType` is `disabled` on edit (`'disabled' => !(true === $options['creation'])`, line 84) — it can only be chosen at creation. `onPostSetData` (lines 120-135) reverse-maps the stored state back to a choice: partner → `broadcast_partner`; `isOrgCreationIgnored()` → `admin_additional`; otherwise `admin`.

`User::CONFIG_ORG_CREATION_*` (`src/Entity/User.php:32-35`) drives a one-time onboarding form on the events list: when `config.org_creation === 'needed'`, `EventController::index` renders an `OrgCreationType` form that creates the user's first Organization (and optionally a Place) and flips the flag to `done` (`src/Controller/EventController.php:240-230`, specifically lines 160-232). It is a lifecycle flag, not an authorisation flag — but it is what gives a newly created "admin" user an organisation, which is what every authorisation rule below keys off.

---

## 3. `config/packages/security.yaml` in full

### 3.1 Password hashers and user provider

```yaml
password_hashers:
    App\Entity\User: 'auto'
    Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface: 'auto'
providers:
    app_user_provider:
        entity:
            class: App\Entity\User
            property: email
```

- `auto` in Symfony 6.4 = bcrypt or argon2id depending on what PHP has; the stored hash is self-describing. `user.password` is `varchar(255)`.
- The provider looks users up **by email** (`Symfony\Bridge\Doctrine\Security\User\EntityUserProvider::loadUserByIdentifier`, line 57: `$repository->findOneBy(['email' => $identifier])`). It performs **no `enabled` check** — that is done separately per mechanism (§12.5).
- `UserRepository implements PasswordUpgraderInterface` (`src/Repository/UserRepository.php:20,48-57`), so hashes are transparently rehashed on login when the algorithm cost changes.
- `App\Entity\User` implements `\Serializable` with a hand-written `__serialize()` returning `[id, email, password, enabled, roles]` (`src/Entity/User.php:225-250`). On every stateful request `EntityUserProvider::refreshUser()` reloads the row by primary key (vendor line 99), so roles/password/enabled are always fresh from the DB.

### 3.2 Firewalls, in match order

| # | Name | Pattern | Stateless | Authenticators | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | `dev` | `^/(_(profiler\|wdt)\|css\|images\|js)/` | — | `security: false` | |
| 2 | `image_resolver` | `^/media/cache/resolve` | — | `security: false` | LiipImagine webp resolver |
| 3 | `api_platform` | `^/api/v2` | **yes**, `lazy: true` | `json_login` (check_path `jwt_auth`, `username_path: email`, `password_path: password`) + `jwt` with `authenticator: app.custom_jwt_authenticator` | API Platform v2 |
| 4 | `api_token` | `^/api/token$` | — | `security: false` | OAuth2 token endpoint, deliberately public |
| 5 | `api_doc` | `^/api/doc$` | — | `security: false` | Swagger UI, deliberately public |
| 6 | `api` | `^/api(?!/v2)` | **yes** | `oauth2: true` | API v1 (`/api/v1/*`) and `/api/authorize` |
| 7 | `images` | `^/img/` | — | `security: false` | legacy image redirect to R2 |
| 8 | `main` | `^/` | no, `lazy: true` | `form_login` (+ CSRF), `logout`, `remember_me`, `switch_user`, `login_throttling: null` | the whole admin UI |

Verified live (`curl`, admin session vs anonymous):

| Path | anonymous | admin session |
| --- | --- | --- |
| `/events/` | 302 → `/login` | 200 |
| `/admin/users/` | 302 | 200 |
| `/organizations/`, `/places/`, `/user-token/` | 302 | 200 |
| `/api/doc` | **200** | 200 |
| `/api/v2` (Swagger UI) | **200** | 200 |
| `/api/v2/events` | 401 `{"code":401,"message":"JWT Token not found"}` | **401** (session is ignored — stateless firewall) |
| `/api/v1/events` | 401 `WWW-Authenticate: Bearer` | **401** (same reason) |
| `/api/token` (GET) | 405 (POST-only route) | 405 |
| `/api/authorize` | 401 | 401 |
| `/reset-password`, `/reset-password/check-email` | 200 | 200 |
| `/de/proposer-un-evenement/lieu`, `/fr/...` | 200 | 200 |
| `/events/?_switch_user=roy.schlaefli@bka.ch` | — | **403** |

The important consequence: **a browser session grants nothing on `/api/v1` or `/api/v2`.** Both API firewalls are stateless and only accept bearer tokens.

### 3.3 `access_control` (first match wins)

| # | path regex | roles | Effect for BKA |
| --- | --- | --- | --- |
| 1 | `^/login$` | `PUBLIC_ACCESS` | login form |
| 2 | `^/img/` | `PUBLIC_ACCESS` | legacy image redirect |
| 3 | `^/reset-password` | `PUBLIC_ACCESS` | request / check-email / reset |
| 4 | `^/(fr\|de)/proposer-un-evenement` | `PUBLIC_ACCESS` | the 6-step public event proposal wizard |
| 5 | `^/api/v2` | `PUBLIC_ACCESS` | authorisation is delegated entirely to API Platform `security:` expressions |
| 6 | `^/admin/users/edit/\d+$` | `IS_AUTHENTICATED_REMEMBERED` | **self-service account editing** — the only `^/admin` path a non-admin may reach |
| 7 | `^/admin` | `ROLE_ADMIN` | `/admin/users/`, `/admin/users/create`, `/admin/users/delete/{id}`, `/admin/users/password/{id}` |
| 8 | `^/api/authorize` | `IS_AUTHENTICATED_REMEMBERED` | authorisation-code endpoint; the grant is **disabled**, so unreachable in practice |
| 9 | `^/api` | `IS_AUTHENTICATED_FULLY` | API v1 |
| 10 | `^/` | `IS_AUTHENTICATED_REMEMBERED` | everything else in the admin UI |

Note that `/events/*`, `/places/*`, `/organizations/*` and `/user-token/*` are **not** under `/admin` — they only require "be logged in", with the fine-grained rules coming from controller-level `denyAccessUnlessGranted()` and the voters.

Note also rule 7 covers `/admin/users/password/{id}`: a non-admin **cannot change their own password from the admin UI at all**; they must use the public `/reset-password` flow. `UserController::editPassword` (`src/Controller/UserController.php:199`) has no code-level check of its own and relies entirely on this access_control rule.

---

## 4. The voters — every attribute mapped to its rule

Six voters live in `src/Security/Voters/`. Symfony's default `access_decision_manager` strategy (affirmative) applies; no override is configured.

| Voter | Attribute(s) | Subject type | Rule |
| --- | --- | --- | --- |
| `EventVoter` | `view`, `edit`, `publish` | `App\Entity\Event` (incl. `MainEvent`, `SubEvent`) | see §4.1 |
| `OrganizationVoter` | `view`, `edit` (declares `create`, `delete` but `supports()` rejects them) | `App\Entity\Organization` | admin → true; else `user.organizations.contains(org)` |
| `PlaceVoter` | `view`, `edit` (same dead `create`/`delete` constants) | `App\Entity\Place` | admin → true; else any of the user's organisations has this place |
| `UserTokenVoter` | `USER_TOKEN_MANAGE` | `App\Entity\UserToken` | admin → true; else `user === token.owner` |
| `EventApiVoter` | `EVENT_API_EDIT` | `App\ApiResource\EventApi` or `null` | see §4.5 |
| `ImageApiVoter` | `IMAGE_API_EDIT` | `App\ApiResource\ImageApi` or `null` | see §4.6 |

### 4.1 `EventVoter` (`src/Security/Voters/EventVoter.php`)

```php
protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
{
    $user = $token->getUser();
    if (!$user instanceof User) { return false; }
    if ($this->decisionManager->decide($token, ['ROLE_ADMIN'])) { return true; }

    return match ($attribute) {
        self::VIEW    => $this->canViewEvent($subject, $user),
        self::EDIT    => $this->canEditEvent($subject, $user),
        self::PUBLISH => $this->canPublishEvent($subject, $user),
    };
}
```

Three nested predicates (lines 59-105):

| Attribute | Granted when |
| --- | --- |
| `publish` | `event.user_id === currentUser.id` **OR** `currentUser.organizations` contains `event.organization` **OR** `currentUser.organizations` contains `event.place.organization` |
| `edit` | `publish` **OR** `event.proposedBy.email` case-insensitively equals `currentUser.email` |
| `view` | `ROLE_BROADCAST_PARTNER` **OR** `edit` |

Plus `ROLE_ADMIN` short-circuits all three to `true`.

Consumers:

| Call site | Attribute |
| --- | --- |
| `src/Controller/EventController.php:488` (`/events/edit/{slug}`) | `edit` |
| `src/Controller/EventController.php:501` (`can_publish` form option) | `publish` |
| `src/Controller/EventController.php:596` (`/events/copy/{slug}`) | `edit` |
| `src/Controller/EventController.php:612` (`/events/sponsor/{slug}`) | `edit` |
| `src/Controller/EventController.php:641` (`/events/delete/{slug}`) | `edit` |
| `src/Controller/EventController.php:653` (`/events/preview/{slug}`) | `view` |
| `src/Controller/ApiEventController.php:147,186,285` (API v1 reads) | `view` |
| `src/Controller/ApiEventController.php:381,465,555` (API v1 POST/PUT/DELETE) | `edit` |

`can_publish` → `src/Form/EventType.php:569` disables the `publicationStatus` select. So a user who may *edit* an event (e.g. because they proposed it by email) but not *publish* it can change everything except its publication status.

**There is no `delete` attribute** — event deletion is gated by `edit`.

### 4.2 `OrganizationVoter` (`src/Security/Voters/OrganizationVoter.php`)

```php
return match ($attribute) {
    self::EDIT, self::VIEW   => $user->getOrganizations()->contains($subject),
    self::CREATE, self::DELETE => false,
};
```

`supports()` (line 29) only accepts `view` and `edit`, so the `create`/`delete` arms are unreachable. The class docblock warns: *"WARNING: must be aligned with `App\ApiPlatform\OrganizationExtension`."*

Consumers: `src/Controller/OrganizationController.php:159` (`edit`), `src/Controller/ApiOrganizationController.php:66,120` (`view`). Organization creation and deletion are hard-gated on `ROLE_ADMIN` (`OrganizationController.php:122,191`).

### 4.3 `PlaceVoter` (`src/Security/Voters/PlaceVoter.php`)

Same shape, but the membership test walks the user's organisations and asks each whether `organization.places` contains the subject (lines 58-66). Docblock: *"WARNING: must be aligned with `App\ApiPlatform\PlaceExtension`."*

Consumers: `src/Controller/PlaceController.php:128` (`edit`). Place create/delete are `ROLE_ADMIN` only (`PlaceController.php:92,164`); deletion additionally refuses if the place still has upcoming events (`PlaceController.php:167-172`).

### 4.4 `UserTokenVoter` (`src/Security/Voters/UserTokenVoter.php`)

`USER_TOKEN_MANAGE` → `ROLE_ADMIN` or `user === subject.getOwner()`. Used on `/user-token/show/{id}` and `/user-token/delete/{id}` (`src/Controller/UserTokenController.php:117,127`).

### 4.5 `EventApiVoter` (`src/Security/Voters/EventApiVoter.php`) — API Platform v2

```php
if (!$this->security->isGranted('ROLE_USER'))  { return false; }
if ($this->security->isGranted('ROLE_ADMIN'))  { return true;  }
if (null === $subject)                         { return true;  }   // line 52-54
// EVENT_API_EDIT:
if ($event->user === $user)                    { return true;  }   // DTO's ->user property
$eventEntity = $this->eventRepository->find($event->id);
$org = $eventEntity?->getPlace()?->getOrganization();
return null !== $org && $user->getOrganizations()->contains($org);
```

Differences from `EventVoter` worth noting for the port:

- it requires `ROLE_USER` explicitly, so **`ROLE_BROADCAST_PARTNER` can never edit** via API v2;
- it checks only **owner** and **place's organisation** — it does **not** check `event.organization` and does **not** check `proposedBy.email`. The admin UI (`EventVoter`) is strictly more permissive;
- a `null` subject returns `true` (the comment at line 53 says *"to be able to create new image, not sure if it's the best way"* — copy-pasted from `ImageApiVoter`).

Used by `src/ApiResource/EventApi.php:394` (`Patch`) and `:399` (`Delete`): `security: 'is_granted("EVENT_API_EDIT",object)'`.

### 4.6 `ImageApiVoter` (`src/Security/Voters/ImageApiVoter.php`)

```php
if (!is_granted ROLE_USER)  return false;
if (is_granted ROLE_ADMIN)  return true;
if (null === $subject)      return true;              // allows creating a new image
$imageEntity = $imageRepository->find($image->id);
if (null === $imageEntity)  return false;
if ($imageEntity->getEvent())        return $event->getUser() === $user;
if ($imageEntity->getOrganization()) return in_array($user, $organization->getUsers()->toArray());
if ($imageEntity->getPlace())        return $place->getOrganization() && in_array($user, $place->getOrganization()->getUsers()->toArray());
return true;  // "orphean images can be assigned"
```

Used by `src/ApiResource/ImageApi.php:59` (`Delete`) and, interestingly, by a **validator**: `src/Validator/EventImagesValidator.php:34` rejects an event payload that attaches an image the caller may not use. Orphan (unattached) images are assignable by any `ROLE_USER`.

### 4.7 Role-only checks that are not voters

| Location | Check |
| --- | --- |
| `src/Controller/UserController.php:141-144` | non-admin may only open `/admin/users/edit/{id}` for themselves |
| `src/Controller/UserController.php:175` | `/admin/users/delete/{id}` → `ROLE_ADMIN` |
| `src/Controller/EventController.php:246` | `/events/members-only` → `ROLE_ADMIN` |
| `src/Controller/EventController.php:410` | `/events/create` → `#[IsGranted('ROLE_USER')]` (so partners cannot create) |
| `src/Controller/OrganizationController.php:118,122` | `/organizations/create` → `ROLE_USER` **and** `ROLE_ADMIN` |
| `src/Controller/UserTokenController.php:26` | whole controller → `is_granted("ROLE_USER") or is_granted("ROLE_BROADCAST_PARTNER")` |
| `src/Controller/ImageGeneratorController.php:73,107,136,150` | `ROLE_ADMIN` for the unfiltered event list; `ROLE_USER` for the OG-image upload/remove endpoints |
| `src/Controller/DefaultController.php:14` | `/` redirects partners to `/user-token/`, everyone else to `/events/` |
| `src/Organization/OrganizationMagazine.php:26` | admins get `findAll()` organisations, others get their own |
| `src/Form/EventType.php:122,218,715` | admins get all organisations / all places / an enabled organisation field on proposed events |
| `src/Form/EventType.php:136`, `EventController.php:436,494` | print fields shown only when `(user.member OR ROLE_ADMIN) AND HAS_PRINT_OPTIONS` — **BKA has `HAS_PRINT_OPTIONS=true`** |
| `src/Form/PlaceType.php:282` | admin-only place fields |
| `src/Controller/EventController.php:500` | archived fields editable only by admins and only after the event's last `dateTo` |

### 4.8 API Platform resource-level `security:` expressions

Every ApiResource DTO in `src/ApiResource/` carries a class-level `security:` guard. The list is exhaustive:

| Resource file | Class-level `security:` | Operation overrides |
| --- | --- | --- |
| `AffiliationApi.php:18` | `ROLE_USER or ROLE_BROADCAST_PARTNER` | — |
| `AudienceApi.php:20` | same | — |
| `CategoryApi.php:19` | same | — |
| `ContactApi.php:15` | same | — |
| `EventApi.php:406` | same | `Post` → `ROLE_USER` (line 390); `Patch` → `EVENT_API_EDIT` (394); `Delete` → `EVENT_API_EDIT` (399) |
| `EventProposedByApi.php:15` | same | — |
| `ImageApi.php:65` | same | `Post` → `ROLE_USER` (line 56); `Delete` → `IMAGE_API_EDIT` (59) |
| `OccurrenceApi.php:15` | same | — |
| `OrganizationApi.php:76` | same | — |
| `PlaceApi.php:53` | same | — |
| `PlaceProposedApi.php:15` | same | — |
| `RateApi.php:18` | same | — |
| `RegionApi.php:18` | same | — |
| `SubEventApi.php:19` | same | — |
| `TechnicalSheetApi.php:16` | same | — |
| `TicketingApi.php:18` | same | — |
| `UserApi.php:15` | same | — |
| `VideoApi.php:16` | same | — |

So API v2 is: **everything readable by `ROLE_USER` or `ROLE_BROADCAST_PARTNER`, writable only by `ROLE_USER`** (and then only within the row filter of §5 + the `*_API_EDIT` voters).

---

## 5. Row-level filtering: the Doctrine query extensions

`src/ApiPlatform/*Extension.php` apply the same ownership rules as the voters, but as SQL `WHERE` clauses so collections do not leak. These run on **API v2 only**.

### 5.1 `EventExtension` (`src/ApiPlatform/EventExtension.php:84-140`)

Always applied (both collection and item):

```sql
AND e.publicationStatus = 'publish'
AND (e.publicationDate IS NULL OR e.publicationDate <= :now)
LEFT JOIN e.place place
```

Then, unless the caller is `ROLE_ADMIN` **or** `ROLE_BROADCAST_PARTNER` (line 101 → early `return`):

```sql
LEFT JOIN e.organization organization
LEFT JOIN place.organization pOrganization
AND (
     (e.user IS NOT NULL         AND e.user = :user)
  OR (e.organization IS NOT NULL AND organization.id IN (:userOrganizations))
  OR (e.place IS NOT NULL AND place.organization IS NOT NULL
                          AND pOrganization.id IN (:userOrganizations))
)
```

Note the extension **only ever shows published events** — even to admins and even on item GETs. There is no "see my drafts over the API" path.

### 5.2 `OccurrenceExtension` (`src/ApiPlatform/OccurrenceExtension.php:112-144`)

Same `publicationStatus`/`publicationDate` gate, then for non-admin/non-partner:

```sql
AND (
     (event.user IS NOT NULL AND event.user = :user)
  OR (event.place IS NOT NULL AND place.organization IS NOT NULL
      AND organization.id IN (:userOrganizations))
)
```

**It omits the `event.organization` branch** that `EventExtension` has — a user whose org owns the event but not the place sees the event in `/api/v2/events` and not in `/api/v2/occurrences`. Comment on line 112 claims it "reflects `App\Security\Voters\EventVoter`".

### 5.3 `OrganizationExtension` (`src/ApiPlatform/OrganizationExtension.php:120-143`)

```sql
AND o.enabled = true
-- non admin/partner:
AND o.id IN (:ids)   -- ids = the user's organizations
```

### 5.4 `PlaceExtension` (`src/ApiPlatform/PlaceExtension.php:93-116`)

Non-admin/non-partner: `AND p.id IN (:ids)` where `ids` = every place belonging to any of the user's organisations. Note there is **no `enabled`/`private` filter** here, unlike the admin form's `PlaceRepository::findActiveAndNotPrivate()`.

### 5.5 API v1 filtering

API v1 does not use extensions. Two paths:

- `USE_OPTIMIZED_EVENT_LOAD=true` (**BKA**): `EventSearchEngine::optimizedSearchEvents()` (`src/Event/EventSearchEngine.php:86-117`) sets `$filterByUser = false` for admins and partners, throws `UnauthorizedHttpException('Bearer Token')` if there is no `User`, and otherwise passes the user to `EventOccurrenceRepository::occurrenceEngineSearch()` (`src/Repository/EventOccurrenceRepository.php:78-99`), which adds
  ```sql
  AND (
       (event.user IS NOT NULL AND event.user = :user)
    OR (place IS NOT NULL AND place.organization IS NOT NULL
        AND placeOrganization.id IN (<inlined ids>))
  )
  ```
  — again no `event.organization` branch.
- `USE_OPTIMIZED_EVENT_LOAD=false` (In Situ default): the legacy path loads everything and filters in PHP with `$this->isGranted('view', $event)` (`src/Controller/ApiEventController.php:146-150`, `183-188`).

`ApiOrganizationController::getOrganizations` always post-filters in PHP with `isGranted('view', $organization)` (`src/Controller/ApiOrganizationController.php:65-69`).

---

## 6. "Who can see / edit / delete what" — consolidated matrix

Legend: **own** = owner (`event.user_id`), **org** = `event.organization` ∈ `user.organizations`, **place-org** = `event.place.organization` ∈ `user.organizations`, **proposer** = `event.proposedBy.email` == `user.email` (case-insensitive).

### 6.1 Events

| Surface | `ROLE_ADMIN` | `ROLE_USER` | `ROLE_BROADCAST_PARTNER` | Anonymous |
| --- | --- | --- | --- | --- |
| Admin list `/events/` (upcoming) | **all** upcoming | **BKA (`LIST_OWN_EVENTS_ONLY=true`):** only `org` **or** `proposer` (`EventController.php:106-146`) | 403 at `^/` only if logged out; partner is logged in and *would* see the list, but `DefaultController` redirects `/` to `/user-token/` | redirect to `/login` |
| Admin archive `/events/archived/` | all past | only `org` or `proposer` | — | — |
| Admin `/events/members-only` | all upcoming with `event.user.member = true` | **403** (`EventController.php:246`) | 403 | — |
| Admin edit `/events/edit/{slug}` | any | `own` ∪ `org` ∪ `place-org` ∪ `proposer` (`EventVoter::canEditEvent`) | denied (voter requires one of the ownership branches; partners own nothing) | — |
| Admin publish (`publicationStatus` field enabled) | any | `own` ∪ `org` ∪ `place-org` | denied | — |
| Admin delete `/events/delete/{slug}` | any | same as edit | denied | — |
| Admin copy / sponsor / preview | any | copy+sponsor = edit; preview = view | preview: `view` returns `true` for any event (`EventVoter::canViewEvent` line 61) | — |
| API v1 `GET /api/v1/events` | all published | `own` ∪ `place-org`, published only | **all** published | 401 |
| API v1 `POST/PUT/DELETE /api/v1/events` | any | `edit` per `EventVoter` | 403 (`#[IsGranted('ROLE_USER')]`) | 401 |
| API v2 `GET /api/v2/events` | all **published** | `own` ∪ `org` ∪ `place-org`, published only | **all** published | 401 |
| API v2 `POST /api/v2/events` | yes | yes (`ROLE_USER`) | 403 | 401 |
| API v2 `PATCH/DELETE /api/v2/events/{id}` | yes | `own` ∪ `place-org` only (`EventApiVoter`) | 403 | 401 |

**Known inconsistency (verified by reading all five implementations):** the admin list filter (`org ∪ proposer`), the admin edit voter (`own ∪ org ∪ place-org ∪ proposer`), the v2 collection filter (`own ∪ org ∪ place-org`), the v2 edit voter (`own ∪ place-org`) and the v1/occurrence filter (`own ∪ place-org`) all use **five different** definitions of "my event".

### 6.2 Organizations

| Surface | `ROLE_ADMIN` | `ROLE_USER` | `ROLE_BROADCAST_PARTNER` |
| --- | --- | --- | --- |
| Admin list `/organizations/` | all | **all** — the list is *not* filtered by `LIST_OWN_EVENTS_ONLY`; it only narrows when `?mine=1` is passed (`src/Controller/OrganizationController.php:44-47,73-77`) | same as `ROLE_USER` |
| Admin create | yes (`ROLE_ADMIN`, line 122) | **403** | 403 |
| Admin edit `/organizations/edit/{id}` | any | only own (`OrganizationVoter`) | denied |
| Admin delete | yes (line 191) | 403 | 403 |
| API v1 `/api/v1/organizations` | all | own only | **all** |
| API v2 `/api/v2/organizations` | all `enabled=true` | own ∩ `enabled=true` | all `enabled=true` |

### 6.3 Places

| Surface | `ROLE_ADMIN` | `ROLE_USER` | `ROLE_BROADCAST_PARTNER` |
| --- | --- | --- | --- |
| Admin list `/places/` | all | **all** (only narrowed by `?mine=1`, `src/Controller/PlaceController.php:40-43,69-75`) | same |
| Admin create / delete | yes (`PlaceController.php:92,164`) | 403 | 403 |
| Admin edit | any | only places owned by one of the user's organisations (`PlaceVoter`) | denied |
| Place *choices* in the event form | `PlaceRepository::getQueryBuilderFindAll()` | `findActiveAndNotPrivate($user)`: `enabled = true AND (private = false OR id IN <own org's places>)` (`src/Repository/PlaceRepository.php:87-112`) | n/a |
| API v2 `/api/v2/places` | all | places of own organisations | all |

### 6.4 Users

| Surface | `ROLE_ADMIN` | anyone else |
| --- | --- | --- |
| `/admin/users/` list | all 427 rows, unfiltered (`src/Controller/UserController.php:83-91`) | 403 (access_control `^/admin`) |
| `/admin/users/create` | yes | 403 |
| `/admin/users/edit/{id}` | anyone, full form | **own id only** (`UserController.php:141-144`), and the form is reduced to `email` + `locale` (`UserType::buildForm` returns early when `self_service === true`, `src/Form/UserType.php:53-55`) |
| `/admin/users/password/{id}` | yes | 403 (access_control), even for one's own account |
| `/admin/users/delete/{id}` | yes, except self (`UserController.php:178-183`) | 403 |

The `member` column is only shown/editable when `ACTIVATE_MEMBERS=true` — **true for BKA** (`UserController.php:71-78`, `UserType.php:108-114`).

### 6.5 User tokens

| Surface | `ROLE_ADMIN` | `ROLE_USER` / `ROLE_BROADCAST_PARTNER` |
| --- | --- | --- |
| `/user-token/` list | all tokens of all users (`UserTokenController.php:61-64`) | only `owner = me` |
| `/user-token/create` | may pick an arbitrary `owner` (`with_owner => isGranted('ROLE_ADMIN')`, line 87) | token is forced to `owner = me` (line 94-96) |
| `/user-token/show/{id}` | any (`USER_TOKEN_MANAGE`) | own only |
| `/user-token/delete/{id}` | any | own only |

`/user-token/show/{id}` renders the **full raw JWT** in the page body (`templates/user_token/show.html.twig`), and the create flow also flashes it (`UserTokenController.php:100`). The token is stored unhashed in `user_token.token` (`text`).

### 6.6 Images

`ImageApiVoter` (§4.6) is the only image rule: owner-of-the-attached-event, member-of-the-attached-organisation, member-of-the-attached-place's-organisation, or the image is orphaned (→ allowed for any `ROLE_USER`).

---

## 7. `LIST_OWN_EVENTS_ONLY` — the BKA toggle

Wiring: `config/services.yaml:26` binds `$listOwnEventsOnly: '%env(bool:LIST_OWN_EVENTS_ONLY)%'`. BKA sets it to `true` (`docker-compose.yaml:43`); the repo default in `.env:75` is `false`.

It is injected into exactly one class, `App\Controller\EventController` (`src/Controller/EventController.php:49`), and read in four places:

| Line | Method | Behaviour |
| --- | --- | --- |
| 68-71 | `index()` (`/events/`) | `listOwn = true` when the flag is on **and** the user is not `ROLE_ADMIN`; otherwise it can be opted into with `?mine=1` |
| 283 | `members_only()` sub-events query | — (that route is admin-only anyway) |
| 302 | `members_only()` main query | — (idem) |
| 332-337 | `archived()` (`/events/archived/`) | same rule as `index()` |

When `listOwn` is true the DQL gains (lines 112-119 for the sub-event id pre-query, 137-145 for the main query, 326-348 for the archive):

```php
->leftJoin('e.proposedBy', 'pb')
->andWhere($builder->expr()->orX(
    $builder->expr()->in('o.id', ':userOrganizations'),   // o = e.organization
    'LOWER(pb.email) = :userEmail'
))
->setParameter('userOrganizations', $userOrganizationIds)
->setParameter('userEmail', mb_strtolower((string) $user->getEmail()));
```

Three consequences for BKA:

1. A non-admin's event list is **organisation-scoped, not owner-scoped**. An event they personally created (`event.user_id = me`) but which has no `organization` **does not appear in their list**, even though `EventVoter` lets them edit it.
2. The place's organisation is *not* considered in the list, although it *is* considered by `EventVoter::canPublishEvent`.
3. The flag does **not** affect `/places/` or `/organizations/` — those lists stay global for every logged-in user, filtered only by `?mine=1`.

Supporting production numbers:

```sql
SELECT count(*) total, count(user_id) with_user, count(organization_id) with_org,
       count(place_id) with_place, count(proposed_by_id) with_proposedby FROM event;
-- total 34279 | with_user 21378 | with_org 27949 | with_place 31717 | with_proposedby 4288

SELECT count(*) FROM event WHERE user_id IS NULL AND organization_id IS NULL AND place_id IS NULL;
-- 2558   (events that NO non-admin can ever see or edit)

SELECT count(DISTINCT e.id) FROM event e
  JOIN event_proposed_by pb ON pb.id = e.proposed_by_id
  JOIN "user" u ON lower(u.email) = lower(pb.email);
-- 329    (events reachable purely through the proposedBy-email rule)
```

### 7.1 The user ↔ organization many-to-many

`App\Entity\User::$organizations` is `#[ORM\ManyToMany(targetEntity: Organization::class, inversedBy: 'users')]` (`src/Entity/User.php:60-61`); the inverse side is `Organization::$users` (`src/Entity/Organization.php:145-147`). Join table `user_organization`:

```
                Table "public.user_organization"
     Column      |  Type  | Nullable
-----------------+--------+---------
 user_id         | bigint | not null
 organization_id | bigint | not null
PK (user_id, organization_id); indexes on each column
FK user_id        -> "user"(id)      ON UPDATE RESTRICT ON DELETE CASCADE
FK organization_id-> organization(id) ON UPDATE RESTRICT ON DELETE CASCADE
```

Live shape (BKA):

```sql
-- organisations per user
SELECT n, count(*) FROM (SELECT user_id, count(*) n FROM user_organization GROUP BY user_id) t GROUP BY n;
--  1 org: 325 users   |   2 orgs: 79 users   |   3 orgs: 8 users
SELECT count(*) FROM "user" u WHERE NOT EXISTS (SELECT 1 FROM user_organization uo WHERE uo.user_id = u.id);
--  15 users belong to NO organisation

-- users per organisation
SELECT n, count(*) FROM (SELECT organization_id, count(*) n FROM user_organization GROUP BY organization_id) t GROUP BY n;
--  1 user: 396 orgs | 2: 39 | 3: 7 | 4: 3
```

So the relation **is genuinely many-to-many in production** (87 users in 2+ orgs; 49 orgs with 2+ users) — a port must not collapse it to a single "organisation" foreign key.

The admin edits it from the user form (`src/Form/UserType.php:86-96`, a multi-select `EntityType` over all organisations — admin-only).

---

## 8. User lifecycle

### 8.1 Creation paths

There are four ways a `user` row comes into existence:

| Path | File | Roles set | `enabled` | `member` | `locale` | Password | Notification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Admin UI `/admin/users/create` | `src/Controller/UserController.php:102-135` | from `UserType` (`ROLE_USER`[+`ROLE_ADMIN`] or `ROLE_BROADCAST_PARTNER`) | entity default `true` (`src/Entity/User.php:55`); checkbox available | entity default `true` (line 70); checkbox shown because `ACTIVATE_MEMBERS=true` | chosen from `LOCALES` | admin types it (`UserPasswordType`, repeated field, only `NotBlank`) | **none** — the admin must communicate the password out of band |
| Public event proposal wizard, step 5 | `src/Controller/ProposeEventController.php:261-276` | `['ROLE_USER']` | default `true` | **`false`** (explicit) | `$request->getLocale()` | random `PasswordGenerator::generateNewPassword()` → `NNNN-XXXX` (4 digits, dash, 4 uppercase letters) | **yes**: a reset-password token + `Mailer::accountCreatedChangePassword()` ("account created, set your password") |
| CLI bulk import | `src/Command/ImportUsersXlsxCommand.php:74-86` | `['ROLE_USER']` | `true` | **`true`** | `'de'` | random generated, **printed to stdout** | none; also auto-creates a disabled Organization + private disabled Place per user (lines 91-118) |
| Fixtures / Foundry | `src/Factory/UserFactory.php:66-78`, `src/Story/UsersStory.php` | `['ROLE_USER']`, plus one `ROLE_USER+ROLE_ADMIN` and one `ROLE_BROADCAST_PARTNER` | `true` | `false` | — | faker | — |

**There is no invitation flow as such.** The closest thing is the proposal-wizard path, which mails a reset-password link via `templates/propose_event/user-created.html.twig`. Admin-created users get nothing.

### 8.2 Locale

- Column: `user.locale varchar(2) NOT NULL DEFAULT 'de'` (made non-null by `migrations/Version20260926150000.php:19-21`). Entity default `User::DEFAULT_LOCALE = 'de'` (`src/Entity/User.php:30,66-67`).
- Editable by the user themselves and by admins (`src/Form/UserType.php:40-49`); choices come from the `LOCALES` env var (`fr|de` for BKA) and are labelled with `\Locale::getDisplayLanguage` (`UserType::localeChoices()`, lines 176-184).
- On login, `UserLocaleSubscriber::onLoginSuccess` (`src/EventListener/UserLocaleSubscriber.php:21-44`) copies the stored locale into the session (`_locale`) **unless** the user already picked a language from the UI switcher in that session (`LocaleSubscriber::SESSION_LOCALE_FROM_SWITCHER`). It explicitly bails out for stateless requests.
- Per-request resolution is `LocaleSubscriber` (`src/EventListener/LocaleSubscriber.php:22-58`, priority 20 on `kernel.request`): route `_locale` → `?_locale=xx` query param (sets the switcher flag) → session `_locale` → `Accept-Language` best match among `LOCALES`.
- Email language: `Mailer::localeFor()` (`src/Mailer/Mailer.php:234-245`) looks the recipient up by email and uses their `locale` if it is in `LOCALES`, else the current request locale. One email is built per distinct recipient locale.
- **In BKA production all 427 users have `locale = 'de'`.**

### 8.3 `member` flag

- `user.member boolean NOT NULL`, entity default `true` (`src/Entity/User.php:69-70`); added by `migrations/Version20231122094424.php`.
- Only surfaced when `ACTIVATE_MEMBERS=true` (BKA): the users list column (`src/Controller/UserController.php:71-78`) and the user form checkbox (`src/Form/UserType.php:108-114`).
- Authorisation-adjacent effects:
  - **Print fields**: `($user->isMember() || ROLE_ADMIN) && HAS_PRINT_OPTIONS` gates the print section of the event form (`src/Controller/EventController.php:436,494`; `src/Form/EventType.php:136`). BKA has both flags on, so non-member users do not see print options.
  - **`/events/members-only`** (admin-only route) lists upcoming events whose `event.user.member = true` (`src/Controller/EventController.php:300-307`).
  - **`?member=true` API filter**: `EventSearchEngine::searchEvents` (`src/Event/EventSearchEngine.php:70-79`) and `EventOccurrenceRepository::occurrenceEngineSearch` (lines 101-111) both filter to events whose owner is a member, gated on `membersActivated`.
- Production split: 269 members / 158 non-members.

### 8.4 Enabled / disabled

- `user.enabled boolean NOT NULL`, default `true` in the entity.
- Enforced on **password login only**: `src/EventListener/SecurityListener.php:28-39` throws `BadCredentialsException('User inactivated.')` from `CheckPassportEvent` when the passport carries `PasswordCredentials` and `!$user->isEnabled()`.
- Enforced on the **UserToken JWT** path: `src/Security/CustomJWTAuthenticator.php:49-51`.
- **Not** enforced on OAuth2 (API v1) — the OAuth2 authenticator builds a `SelfValidatingPassport` with no password credentials, and the Doctrine user provider has no enabled check.
- **Not** enforced on an existing session: `ContextListener::hasUserChanged()` (`vendor/symfony/security-http/Firewall/ContextListener.php:288-327`) only compares password, salt, roles and user identifier — flipping `enabled` to `false` does **not** kick a logged-in user out. Changing their **password, roles or email does**.
- 13 disabled users in production, none of whom holds a `user_token`. One of them (`elias@wepublish.ch`) **does** hold a live OAuth2 access token valid until 2046 — see §12.5.

### 8.5 Deletion, and what happens to the user's events

`UserController::deleteUser` (`src/Controller/UserController.php:172-197`):

```php
$this->denyAccessUnlessGranted('ROLE_ADMIN');
if ($currentUser->getId() === $user->getId()) { flash danger 'user.flashError.deleteSelf'; return; }
try { $userRepository->remove($user, true); }
catch (ForeignKeyConstraintViolationException) { flash danger 'user.flashError.deleteFailed'; return; }
```

There is no soft-delete. The database cascades (verified with `\d+ "user"`):

| Referencing table | FK | On delete |
| --- | --- | --- |
| `event.user_id` | `fk_3bae0aa7a76ed395` | **`SET NULL`** — the user's events survive and become ownerless |
| `user_organization.user_id` | `fk_41221f7ea76ed395` | `CASCADE` |
| `reset_password_request.user_id` | `fk_7ce748aa76ed395` | `CASCADE` (changed from `RESTRICT` by `migrations/Version20261008090000.php:25`) |
| `user_token.owner_id` | `fk_bdf55a637e3c61f9` | `CASCADE` (also `orphanRemoval: true` on the ORM side, `src/Entity/User.php:75`) |

The ORM mapping for the event side is explicit: `#[ORM\JoinColumn(name: 'user_id', ..., nullable: true, onDelete: 'SET NULL')]` (`src/Entity/Event.php:232-234`), introduced by `migrations/Version20240430070034.php:24`.

Nothing cascades from `user` to `oauth2_access_token` — those rows key on `user_identifier` (an **email string**, not an FK), so deleting a user leaves orphan tokens behind. Production already contains one such orphan (`technique1@venue-example.org`, §12.4).

Consequence after deletion: the user's events keep their `organization_id` / `place_id`, so other members of the same organisation still see and edit them; events with no organisation and no place become invisible to every non-admin.

`User::$userTokens` has `orphanRemoval: true`, so the tokens are removed by Doctrine before the DB cascade would fire; `reset_password_request` and `user_organization` are cleaned up by the DB. Hence in practice the `ForeignKeyConstraintViolationException` catch is a safety net for relations added later.

---

## 9. Password reset

Config (`config/packages/reset_password.yaml`):

```yaml
symfonycasts_reset_password:
    request_password_repository: App\Repository\ResetPasswordRequestRepository
```

Everything else is bundle default (`vendor/symfonycasts/reset-password-bundle/src/DependencyInjection/Configuration.php:34-45`):

| Option | Default in effect |
| --- | --- |
| `lifetime` | **3600 s (1 hour)** |
| `throttle_limit` | **3600 s** — a user may request one reset per hour |
| `enable_garbage_collection` | `true` |

Flow (`src/Controller/ResetPasswordController.php`, route prefix `/reset-password`, `PUBLIC_ACCESS`):

| Route | Name | Behaviour |
| --- | --- | --- |
| `GET/POST /reset-password` | `app_forgot_password_request` | `ResetPasswordRequestFormType` (email). On submit, `processSendingPasswordResetEmail()` (lines 142-182): looks the user up, **silently redirects if not found** (no user enumeration), generates a token, mails `Mailer::resetPasswordRequest()` → `templates/reset_password/email.html.twig`, stores the token object in the session, redirects to check-email |
| `GET /reset-password/check-email` | `app_check_email` | if no token in session, generates a **fake** one so the page looks identical (lines 70-72) |
| `GET /reset-password/reset/{token}` | `app_reset_password` | stores the token in the session and redirects to the token-less URL so the token never leaks via `Referer` (lines 85-91) |
| `GET/POST /reset-password/reset` | `app_reset_password` | `validateTokenAndFetchUser()`; on success shows `ChangePasswordFormType`; on submit removes the reset request, hashes the new password, flushes, cleans the session, redirects to `app_login` |

Password policy on reset: `NotBlank` + `Length(min: 6, max: 4096)` (`src/Form/ChangePasswordFormType.php:27-35`). The admin-set password form (`src/Form/UserPasswordType.php`) only enforces `NotBlank` — **no minimum length**.

DB table:

```
             Table "public.reset_password_request"
    Column    |           Type           | Nullable
--------------+--------------------------+---------
 id           | bigint                   | not null
 user_id      | bigint                   | not null
 selector     | character varying(20)    | not null
 hashed_token | character varying(100)   | not null
 requested_at | timestamp with time zone | not null   (DC2Type:datetime_immutable)
 expires_at   | timestamp with time zone | not null   (DC2Type:datetime_immutable)
FK user_id -> "user"(id) ON DELETE CASCADE
```

`SELECT count(*) FROM reset_password_request;` → **0** rows in the production snapshot. Entity: `src/Entity/ResetPasswordRequest.php` (hand-written rather than using the bundle's trait, so the date columns can be `datetimetz`).

---

## 10. Entities

### 10.1 `App\Entity\User` (`src/Entity/User.php`)

```php
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
class User implements UserInterface, PasswordAuthenticatedUserInterface, \Serializable
```

| Property | Column | Notes |
| --- | --- | --- |
| `$id` | `id` | `GeneratedValue`, `INTEGER` in the mapping but **`bigint` in the restored Postgres DB** |
| `$email` | `email varchar(180) UNIQUE` | also the `UserInterface` identifier (`getUserIdentifier()` line 109) |
| `$roles` | `roles` `Types::JSON` (physically `text` with `(DC2Type:json)`) | `getRoles()` returns the raw array — **no implicit `ROLE_USER`** is appended, unlike the Symfony maker default |
| `$password` | `password varchar(255)` | |
| `$enabled` | `enabled boolean` default `true` | |
| `$lastLogin` | `last_login timestamptz` | written by `SecurityListener` |
| `$organizations` | → `user_organization` | ManyToMany |
| `$locale` | `locale varchar(2) NOT NULL DEFAULT 'de'` | |
| `$member` | `member boolean NOT NULL` default `true` | |
| `$userTokens` | OneToMany, `orphanRemoval: true` | |
| `$config` | `config` nullable JSON | holds `org_creation` |
| (trait) | `created_at`, `updated_at` | `App\Entity\Trait\TimestampableEntity` |

Serialization groups `reader` / `archive` are attached to `id`/`email` and `reader` to `enabled` — so **user email addresses are exposed through the API v1 `reader` serializer group** wherever a user is embedded.

Live DDL:

```
                        Table "public.user"
   Column   |           Type           | Nullable |     Default
------------+--------------------------+----------+------------------
 id         | bigint                   | not null | nextval(...)
 email      | character varying(180)   | not null |
 roles      | text                     | not null |             (DC2Type:json)
 password   | character varying(255)   | not null |
 enabled    | boolean                  | not null |
 last_login | timestamp with time zone |          |
 created_at | timestamp with time zone | not null |
 updated_at | timestamp with time zone | not null |
 locale     | character varying(2)     | not null | 'de'
 member     | boolean                  | not null |
 config     | text                     |          |             (DC2Type:json)
Indexes: idx_253042_primary PK (id); idx_253042_uniq_8d93d649e7927c74 UNIQUE (email)
```

### 10.2 `App\Entity\UserToken` (`src/Entity/UserToken.php`)

```php
#[ORM\Entity(repositoryClass: UserTokenRepository::class)]
class UserToken {
    #[ORM\Id] #[ORM\GeneratedValue] #[ORM\Column] private ?int $id = null;
    #[ORM\ManyToOne(inversedBy: 'userTokens')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')] private ?User $owner = null;
    #[ORM\Column(length: 255)]                        private ?string $name = null;
    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]   private ?\DateTimeImmutable $expiresAt = null;
    #[ORM\Column(type: Types::TEXT, nullable: true)]   private ?string $token = null;   // the raw JWT
    #[ORM\Column(type: 'uuid', unique: true)]          private ?Uuid $uuid = null;      // Uuid::v4() in the ctor
    use TimestampableEntity;
}
```

Live DDL:

```
                    Table "public.user_token"
   Column   |           Type           | Nullable
------------+--------------------------+---------
 id         | bigint                   | not null
 owner_id   | bigint                   | not null
 name       | character varying(255)   | not null
 expires_at | timestamp with time zone | not null   (DC2Type:datetime_immutable)
 token      | text                     |
 created_at | timestamp with time zone | not null
 updated_at | timestamp with time zone | not null
 uuid       | uuid                     | not null   (DC2Type:uuid)
Indexes: PK(id); idx on owner_id; UNIQUE on uuid
FK owner_id -> "user"(id) ON UPDATE RESTRICT ON DELETE CASCADE
```

Live rows (5; token values redacted, lengths shown):

| id | name | owner | expires_at | created_at | uuid | token length |
| --- | --- | --- | --- | --- | --- | --- |
| 2 | Print Import | roy.schlaefli@bka.ch (ROLE_ADMIN) | 2030-04-30 10:28 +00 | 2026-03-10 | `8f6ce3fb-…04dff` | 921 |
| 4 | Printimport V2 | roy.schlaefli@bka.ch | **2050-03-21 18:07 +00** | 2026-03-12 | `464114d3-…32c2b6` | 921 |
| 5 | Name | roy.schlaefli@bka.ch | 2026-04-30 07:17 +00 (expired) | 2026-04-07 | `297cbbd6-…64e485b` | 921 |
| 6 | Mahogany | konzerte1@venue-example.org (ROLE_USER, 1 org) | 2036-03-26 10:53 +00 | 2026-04-28 | `24f78926-…65f0bc` | 904 |
| 7 | Karl Merkli Test | admin@wepublish.ch (ROLE_ADMIN) | 2027-05-08 21:59 +00 | 2026-05-08 | `9a7e5d1a-…854f107` | 919 |

Migration history: created by `migrations/Version20241107165934.php` (MySQL `AUTO_INCREMENT`/InnoDB), `uuid BINARY(16)` added in `Version20241112080228.php`, `token` made nullable in `Version20241112080821.php`, unique index on `uuid` in `Version20241112084137.php`, and `expires_at` retyped `datetimetz_immutable` in `Version20260923160000.php`.

---

## 11. Mechanism A — session login (`main` firewall)

### 11.1 Login

`src/Controller/SecurityController.php`:

```php
#[Route('/login', name: 'app_login')]            // renders security/login.html.twig
#[Route('/logout', name: 'app_logout', methods: ['GET'])]   // never executed
```

The form posts `_username`, `_password`, `_csrf_token` (intention `authenticate`) to `/login` (`templates/security/login.html.twig`, and the BKA override `themes/bka/templates/security/login.html.twig`, which additionally renders a "Mitglieder-Login" panel, an optional `JOIN_US_LINK` "Join us" button and the fr/de language switcher). `enable_csrf: true` on `form_login`.

Verified live: `POST /login` with a fresh `_csrf_token` → `302 http://localhost:8080/`.

### 11.2 Login side-effects

`src/EventListener/SecurityListener.php`:

| Event | Handler | Effect |
| --- | --- | --- |
| `CheckPassportEvent` | `onCheckPassport` | if the passport has `PasswordCredentials` and `!$user->isEnabled()` → `BadCredentialsException('User inactivated.')` |
| `LoginSuccessEvent` | `onLoginSuccess` | `$user->setLastLogin(new \DateTime()); persist; flush;` |

**`LoginSuccessEvent` fires on every firewall, including the two stateless API firewalls.** `RegisterGlobalSecurityEventListenersPass` (`vendor/symfony/security-bundle/DependencyInjection/Compiler/RegisterGlobalSecurityEventListenersPass.php:40-53`) copies global listeners for `LoginSuccessEvent`, `CheckPassportEvent`, etc. onto every firewall dispatcher. The companion `UserLocaleSubscriber` even documents this (`src/EventListener/UserLocaleSubscriber.php:26-30`: *"A stateless request (the API, authenticating with a JWT) still carries a session object, but touching it throws"*). **Therefore every authenticated API request performs an `UPDATE "user" SET last_login = now(), updated_at = now()`.**

Verified empirically: `user` id 1 `last_login`/`updated_at` both moved to `2026-10-17 16:10:36+00` immediately after the probe login.

### 11.3 Remember-me

Configured (`security.yaml:69-72`) with `secret: '%kernel.secret%'`, `lifetime: 2419200` (4 weeks), `path: /`. `always_remember_me` is **not** set, so the handler needs a `_remember_me` request parameter. `grep -rn "_remember_me\|remember_me" templates/ themes/ assets/` returns **nothing** — neither login template renders the checkbox. **No remember-me cookie is ever issued.** The `IS_AUTHENTICATED_REMEMBERED` access-control rules are therefore satisfied only by full session logins.

### 11.4 Impersonation (`switch_user`)

`switch_user: true` (`security.yaml:77`) with Symfony's default role `ROLE_ALLOWED_TO_SWITCH`, reachable only through `ROLE_SUPER_ADMIN`, which **nobody has**. The UI link is already guarded (`templates/datatables/user-actions.html.twig:8`), and `templates/includes/header.html.twig:28` renders an "Exit impersonation" item for `IS_IMPERSONATOR`.

Verified live as a `ROLE_ADMIN` user: `GET /events/?_switch_user=roy.schlaefli@bka.ch` → **403**.

### 11.5 Logout

`logout: { path: app_logout }` with route `/logout` registered by `config/routes/security.yaml` (`security.route_loader.logout`). `SecurityController::logout()` throws if ever reached. No `csrf_token_generator` is configured, so logout is a plain GET.

### 11.6 Session cookie

`config/packages/framework.yaml:17-21`:

```yaml
session:
    handler_id: null                       # PHP's native handler (files)
    cookie_secure: auto                    # Secure flag mirrors the request scheme
    cookie_samesite: null                  # TODO should be lax; left null so the
                                           # "propose event" wizard works inside an iframe
    storage_factory_id: session.storage.factory.native
```

`cookie_samesite: null` means **no `SameSite` attribute is emitted** — a deliberate trade-off documented in the comment to support embedding `/{_locale}/proposer-un-evenement` in a third-party iframe.

`trusted_proxies: '%env(TRUSTED_PROXIES)%'` with `trusted_headers: [x-forwarded-for, x-forwarded-proto, x-forwarded-port, x-forwarded-host]` (lines 11-12). BKA compose sets `TRUSTED_PROXIES: "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1"`.

---

## 12. Mechanism B — OAuth2 bearer tokens (API v1, `api` firewall)

### 12.1 Server configuration (`config/packages/league_oauth2_server.yaml`)

| Setting | Value | Consequence |
| --- | --- | --- |
| `authorization_server.private_key` | `%kernel.project_dir%/var/oauth/test_private.key` | the only keys present in the repo are `var/oauth/test_private.key` + `var/oauth/test_public.key` |
| `encryption_key` | `%env(OAUTH2_ENCRYPTION_KEY)%`, `encryption_key_type: plain` | used to encrypt the refresh-token payload |
| `access_token_ttl` | `PT1H` | applies to tokens minted by the **token endpoint** |
| `refresh_token_ttl` | `P6M` | |
| `auth_code_ttl` | `PT10M` | moot — the grant is off |
| `enable_client_credentials_grant` | **`false`** | |
| `enable_password_grant` | **`false`** | |
| `enable_refresh_token_grant` | **`true`** | **the only enabled grant** |
| `enable_auth_code_grant` | **`false`** | `/api/authorize` is therefore dead |
| `require_code_challenge_for_public_clients` | `true` | moot |
| `persist_access_token` | `true` | every access token is written to `oauth2_access_token` |
| `resource_server.public_key` | `var/oauth/test_public.key` | |
| `scopes.available` / `default` | `[api]` / `[api]` | |
| `persistence` | `doctrine`, entity manager `default` | |
| `role_prefix` | `ROLE_OAUTH2_` | token scope `api` → role `ROLE_OAUTH2_API` |
| `client.classname` | `League\Bundle\OAuth2ServerBundle\Model\Client` | no custom client entity |

No override of these values exists anywhere else in `config/` (checked with grep).

Routes, mounted with prefix `/api/` (`config/routes.yaml:8-11` → `vendor/league/oauth2-server-bundle/src/Resources/config/routes.php`):

| Route | Path | Methods |
| --- | --- | --- |
| `oauth2_authorize` | `/api/authorize` | any |
| `oauth2_token` | `/api/token` | **POST only** (verified: GET returns 405) |

### 12.2 How a client authenticates

1. **Bootstrap** (out of band, by an operator): `php bin/console app:oauth-accesstoken-generator <email> <scope> <client_id> [<duration>]` (`src/Command/OauthAccessTokenGeneratorCommand.php`). It calls `OauthTokenGenerator::generateTokens()` (`src/Security/OauthTokenGenerator.php:28-55`), which:
   - resolves the user by email (`UserNotFoundException` if absent),
   - creates an access token for `(client, [scope], userIdentifier)`, sets its expiry to `now + DateInterval($accessTokenDuration)` (default `PT1H`),
   - signs it with a `CryptKey` loaded from the **hard-coded** path `$projectDir.'/var/oauth/private.key'` (line 45 — note this is *not* `test_private.key`, i.e. it diverges from the bundle config),
   - persists the access token and a refresh token (expiry `now + P6M`),
   - prints the access token JWT and the **encrypted** refresh-token blob (`getRefreshToken()`, lines 62-76, encrypting a JSON payload with `OAUTH2_ENCRYPTION_KEY` via `League\OAuth2\Server\CryptTrait`).
2. **Calling the API**: `Authorization: Bearer <access_token>` against `/api/v1/*`. `OAuth2Authenticator::supports()` only fires when the header starts with `Bearer ` (`vendor/league/oauth2-server-bundle/src/Security/Authenticator/OAuth2Authenticator.php:58-61`); otherwise the entry point returns `401` + `WWW-Authenticate: Bearer`. The resource server validates the signature against `var/oauth/test_public.key` and checks the DB `revoked`/expiry via `AccessTokenRepository`.
3. **Role assembly**: `OAuth2Token::__construct` (`.../Security/Authentication/Token/OAuth2Token.php:17-40`) builds roles as `['ROLE_OAUTH2_API'] ∪ $user->getRoles()`. So an OAuth2 caller gets the user's `ROLE_USER` / `ROLE_ADMIN` exactly as if they were logged in.
4. **Refresh**: `POST /api/token` with `grant_type=refresh_token`, `refresh_token=<encrypted blob>`, plus client credentials (`client_id`+`client_secret` in the body or HTTP Basic). The new access token gets `access_token_ttl = PT1H`.

The checked-in Postman collection (`postman_collection_20250116.json`) confirms the shape: every API v1 request carries `Authorization: Bearer {{token}}` (collection-level `auth.type = bearer`).

Scope enforcement: `CheckScopeListener` (`.../Security/EventListener/CheckScopeListener.php`) only rejects when a route sets an `oauth2_scopes` request attribute. No route in this app does, so scope is effectively advisory.

### 12.3 DB shape of the `oauth2_*` tables

```
             Table "public.oauth2_client"
        Column         |          Type          | Nullable | Default
-----------------------+------------------------+----------+---------
 identifier            | character varying(32)  | not null |            -- PK
 name                  | character varying(128) | not null |
 secret                | character varying(128) |          | NULL
 redirect_uris         | text                   |          |            (DC2Type:oauth2_redirect_uri)
 grants                | text                   |          |            (DC2Type:oauth2_grant)
 scopes                | text                   |          |            (DC2Type:oauth2_scope)
 active                | boolean                | not null |
 allow_plain_text_pkce | boolean                | not null | false

          Table "public.oauth2_access_token"
     Column      |           Type           | Nullable
-----------------+--------------------------+---------
 identifier      | character(80)            | not null   -- PK
 client          | character varying(32)    | not null   -- FK -> oauth2_client ON DELETE CASCADE
 expiry          | timestamp with time zone | not null   (DC2Type:datetime_immutable)
 user_identifier | character varying(128)   |            -- the user's EMAIL, not an FK
 scopes          | text                     |            (DC2Type:oauth2_scope)
 revoked         | boolean                  | not null

         Table "public.oauth2_refresh_token"
    Column    |           Type           | Nullable
--------------+--------------------------+---------
 identifier   | character(80)            | not null   -- PK
 access_token | character(80)            |            -- FK -> oauth2_access_token ON DELETE SET NULL
 expiry       | timestamp with time zone | not null
 revoked      | boolean                  | not null

       Table "public.oauth2_authorization_code"   (same columns as access_token)
```

All four were created in the very first migration, `migrations/Version20221124093828.php:31-34`, as MySQL InnoDB tables.

### 12.4 Live OAuth2 data (secrets redacted)

```sql
SELECT identifier, name, (secret IS NOT NULL) has_secret, length(secret) secret_len,
       redirect_uris, grants, scopes, active, allow_plain_text_pkce
FROM oauth2_client ORDER BY name;
```

| identifier | name | has_secret | secret_len | redirect_uris | grants | scopes | active | plain PKCE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `2e7e30c5…73ba0` | **bka-frontend** | yes | 128 | *(empty)* | `refresh_token` | `api` | t | f |
| `1d5709aa…be19e` | **guidle** | yes | 128 | *(empty)* | `refresh_token` | `api` | t | f |
| `052adb6f…97a7c` | **heiko_dachstock.ch** | yes | 128 | *(empty)* | `refresh_token` | `api` | t | f |
| `aa2d951a…3f825` | **punktzwei** | yes | 128 | *(empty)* | `refresh_token` | `api` | t | f |

Four confidential clients, all limited to the `refresh_token` grant and the `api` scope. (Client identifiers are not secrets — they travel in the token request — but the 128-char secrets are redacted here.)

Access tokens (7 rows, identifiers truncated):

| id prefix | client | expiry | `user_identifier` | scopes | revoked |
| --- | --- | --- | --- | --- | --- |
| `a6dece47…` | bka-frontend | 2043-12-05 | `technique1@venue-example.org` | api | f |
| `80ccf308…` | guidle | 2043-12-07 | `support@guidle.com` | api | f |
| `53bbd23e…` | punktzwei | 2043-12-07 | `produktion@bka.ch` | api | f |
| `065de1a6…` | heiko_dachstock.ch | 2044-05-14 | `person05@example.org` | api | f |
| `168e47e8…` | bka-frontend | 2046-03-10 | `elias@wepublish.ch` | api | f |
| `212260bf…` | bka-frontend | 2046-03-10 | `admin@wepublish.ch` | api | f |
| `09d7aefb…` | guidle | 2046-03-10 | `support@guidle.com` | api | f |

`oauth2_refresh_token`: 7 rows. `oauth2_authorization_code`: **0 rows** (as expected — the grant is disabled).

Cross-check of those identities against the `user` table:

| `user_identifier` | user exists | enabled | roles |
| --- | --- | --- | --- |
| `produktion@bka.ch` | yes | t | `["ROLE_USER","ROLE_ADMIN"]` |
| `person05@example.org` | yes | t | `["ROLE_USER"]` |
| `elias@wepublish.ch` | yes | **f (disabled)** | `["ROLE_USER"]` |
| `support@guidle.com` | yes | t | `["ROLE_USER","ROLE_ADMIN"]` |
| `admin@wepublish.ch` | yes | t | `["ROLE_ADMIN","ROLE_USER"]` |
| `technique1@venue-example.org` | **no such user** | — | — |

### 12.5 Two concrete consequences

1. **Disabled users keep API v1 access.** `elias@wepublish.ch` is `enabled = false`, yet holds a non-revoked access token valid to 2046. The OAuth2 path has no enabled check (§8.4), so the token still authenticates and still carries `ROLE_USER`. (Not probed live — the token value is not reproducible from the DB without the signing key — so **UNVERIFIED at runtime**, but the code path is unambiguous: `OAuth2Authenticator::doAuthenticate` builds a `SelfValidatingPassport`, `SecurityListener::onCheckPassport` only reacts to `PasswordCredentials`, and `EntityUserProvider::loadUserByIdentifier` does not inspect `enabled`.)
2. **Deleted users leave orphan tokens.** `technique1@venue-example.org` has no `user` row; `loadUserByIdentifier` will throw `UserNotFoundException` → 401. Harmless, but the row survives indefinitely because `oauth2_access_token.user_identifier` is a plain string, not an FK.
3. Three of the five identities are `ROLE_ADMIN`, i.e. three of the four partner integrations call the API with **full admin scope** and therefore bypass every row filter in §5.

### 12.6 Revocation and management

`league/oauth2-server-bundle` ships the console commands `league:oauth2-server:create-client`, `update-client`, `delete-client`, `list-clients`, `clear-expired-tokens`, `generate-keypair`. There is **no UI** for OAuth2 clients or tokens. Revocation means flipping `revoked`, deleting the row, or deleting/deactivating the client (`active=false`, or delete → `ON DELETE CASCADE` on `oauth2_access_token.client`).

---

## 13. Mechanism C — UserToken JWTs (API v2, `api_platform` firewall)

### 13.1 Issuance

`UserTokenController::create` (`src/Controller/UserTokenController.php:83-112`):

```php
$form = $this->createForm(UserTokenType::class, options: ['with_owner' => $this->isGranted('ROLE_ADMIN')]);
…
if (null === $userToken->getOwner()) { $userToken->setOwner($this->getUser()); }
$this->JWTGenerator->generateAndSaveJwt($userToken);
$this->addFlash('warning', trans('user_token._texts.Save-your-new-token') . $userToken->getToken());
```

`UserTokenType` (`src/Form/UserTokenType.php`) asks for `name` (required) and `expiresAt` (`DateTimeType`, required, `GreaterThanOrEqual(now)`); admins additionally pick an `owner` from all users. **There is no maximum expiry** — hence the 2050 row in production.

`JWTGenerator` (`src/Security/JWTGenerator.php`):

```php
$token = $this->JWTTokenManager->createFromPayload($userToken->getOwner(), [
    'exp'  => $userToken->getExpiresAt()->getTimestamp(),
    'uuid' => $userToken->getUuid()->toRfc4122(),
]);
$userToken->setToken($token);
$this->userTokenRepository->save($userToken, true);
```

Resulting JWT:

| Part | Content |
| --- | --- |
| Header | `{"typ":"JWT","alg":"RS256"}` (lexik default `signature.algorithm: RS256`) |
| Claims | `iat` (added by `LcobucciJWSProvider`, line 74-77), `exp` (= `user_token.expires_at`), `roles` (snapshot of `$user->getRoles()`, `JWTManager::createFromPayload` line 63), `username` (= the user's **email**; `user_id_claim` defaults to `username`, `vendor/lexik/.../DependencyInjection/Configuration.php:65-66`), `uuid` (the `user_token` UUID) |
| Signature | RS256 with `JWT_SECRET_KEY` (`config/packages/lexik_jwt_authentication.yaml:2`); `pass_phrase: ''`; verified with `JWT_PUBLIC_KEY` |

`api_platform: false` in the lexik config — API Platform integration is handled by the custom authenticator instead.

### 13.2 Validation — `CustomJWTAuthenticator`

`src/Security/CustomJWTAuthenticator.php` extends lexik's `JWTAuthenticator` and is registered as `app.custom_jwt_authenticator` (`config/services.yaml:77-81`, `parent: lexik_jwt_authentication.security.jwt_authenticator`).

```php
public function authenticate(Request $request): Passport
{
    $passport = parent::authenticate($request);           // signature + exp + user load
    $token   = $this->getTokenExtractor()->extract($request);
    $payload = $this->jwtManager->parse($token);

    if (!isset($payload['uuid']))      { throw new InvalidPayloadException('uuid'); }
    $userToken = $this->userTokenRepository->findOneBy(['uuid' => $payload['uuid']]);
    if (null === $userToken)           { throw new InvalidTokenException('Invalid JWT Token'); }
    if (true !== $userToken->getOwner()?->isEnabled()) { throw new InvalidTokenException('Invalid JWT Token'); }

    return $passport;
}
```

So validation = valid RS256 signature + unexpired `exp` + user exists (looked up by the `username` claim through `app_user_provider`) + a `user_token` row with that `uuid` exists + that row's owner is enabled.

Notes:

- **Roles are *not* taken from the JWT claim.** Lexik loads the user via the entity provider and `JWTAuthenticator::createToken` uses `$passport->getUser()->getRoles()` (`vendor/lexik/.../Security/Authenticator/JWTAuthenticator.php:213`). Role changes take effect immediately.
- `user_token.expires_at` is **not re-read** at validation time — the authoritative expiry is the `exp` baked into the JWT. Editing the row (there is no UI for it anyway) would not shorten a live token.
- **Revocation = deleting the `user_token` row**, which is a plain `GET` link (`templates/datatables/user-token-actions.html.twig`, route `user_token_delete`) with no CSRF token.
- The token owner's `uuid` row is the only link between a token and its revocation state; there is no `revoked` flag, no `lastUsedAt`, no scopes.

### 13.3 `/api/v2/auth` (json_login) is a dead end

The `api_platform` firewall declares:

```yaml
json_login:
    check_path: jwt_auth          # route /api/v2/auth, POST (config/routes.yaml:4-6)
    username_path: email
    password_path: password
    success_handler: lexik_jwt_authentication.handler.authentication_success
```

`AuthenticationSuccessHandler` mints a JWT via `JWTManager::create($user)`, whose payload is `{roles, username, iat, exp}` — **no `uuid` claim**. There is no `JWTCreatedEvent` listener anywhere in `src/` or `config/` (grep for `JWTCreated` returns nothing) that would add one. Consequently a JWT obtained from `POST /api/v2/auth` is rejected by `CustomJWTAuthenticator` with `InvalidPayloadException('uuid')` on the very next request.

**UNVERIFIED at runtime** (confirming it requires a `POST`, which the research brief forbids), but the code path is unambiguous. Treat `/api/v2/auth` as non-functional and `user_token` as the only way to obtain a usable API v2 credential.

### 13.4 OpenAPI advertising

`src/ApiPlatform/OpenApiFactoryDecorator.php:24-28` registers a `JWT` security scheme of type `http` / scheme `bearer`, overriding the `api_keys.JWT` header entry declared in `config/packages/api_platform.yaml:26-31`. The docs at `/api/v2` and `/api/doc` are public (verified: both return 200 anonymously).

---

## 14. Hardening layer

### 14.1 Login throttling

`main: { login_throttling: null }` (`security.yaml:59`) → bundle defaults (`vendor/symfony/security-bundle/DependencyInjection/Security/Factory/LoginThrottlingFactory.php:48-55,66-82`):

| Limiter | Policy | Limit | Interval | Key |
| --- | --- | --- | --- | --- |
| local | `fixed_window` | **5** | **1 minute** | HMAC-SHA256(`<lowercased username>-<client IP>`, `kernel.secret`), first 8 base64 chars |
| global | `fixed_window` | **25** (`5 * max_attempts`) | **1 minute** | HMAC-SHA256(`<client IP>`, `kernel.secret`) |

`lock_factory` defaults to `null` in the factory config (line 53), so the limiters run without locking. Storage is `CacheStorage` over the `cache.rate_limiter` pool, which falls back to the default `app` cache — **filesystem**, since `config/packages/cache.yaml` only defines a memcached pool for ProInfirmis. In a horizontally scaled deployment the counters are therefore per-pod.

Throttling applies **only to the `main` firewall**. There is **no rate limiting on `/api/token`, `/api/v1/*` or `/api/v2/*`**, and none on `/reset-password` beyond the bundle's 1-hour per-user `throttle_limit`.

### 14.2 CSRF

- `framework.csrf_protection` is commented out (`config/packages/framework.yaml:5`); with standalone (non-`symfony/symfony`) packages this leaves CSRF **enabled by default**. Verified live: `/admin/users/create` renders `name="user[_token]"` and `/user-token/create` renders `name="user_token[_token]"`.
- Login form: `enable_csrf: true`, intention `authenticate`, hidden `_csrf_token` in both templates.
- Logout: no `csrf_token_generator`; `/logout` is a GET.
- **Destructive actions reached by GET without CSRF protection**: `/admin/users/delete/{id}` (`templates/datatables/user-actions.html.twig:32`), `/user-token/delete/{id}`, `/events/delete/{slug}`, `/events/copy/{slug}`, `/places/delete/{id}`, `/organizations/delete/{id}`.

### 14.3 `nelmio_security` (`config/packages/nelmio_security.yaml`)

| Feature | Config | Header observed live |
| --- | --- | --- |
| Clickjacking | `'^/(fr\|de)/proposer-un-evenement/*': ALLOW`, `'^/.*': DENY` | `X-Frame-Options: DENY` everywhere except the proposal wizard (verified: the wizard response carries no `X-Frame-Options`) |
| Content type | `nosniff: true` | `X-Content-Type-Options: nosniff` |
| XSS protection | `enabled: true`, `mode_block: true` | `X-XSS-Protection: 1; mode=block` |
| Referrer policy | `no-referrer`, `strict-origin-when-cross-origin` | `Referrer-Policy: no-referrer, strict-origin-when-cross-origin` |
| CSP | `enabled: true`, `report_logger_service: logger`, `level1_fallback: true`, `browser_adaptive: false`, `report-uri: %router.request_context.base_url%/nelmio/csp/report` | `Content-Security-Policy: frame-ancestors http://*.localhost *.wepublish.cloud *.wepublish.dev *.wepublish.works *.wepublish.media *.in-situ.org insitu.live *.bka.ch bka.ch in-situ.org; report-uri /nelmio/csp/report` (plus the legacy `X-Content-Security-Policy` duplicate) |

The CSP contains **only** `frame-ancestors` — there is no `default-src`, `script-src` or `style-src`. CSP reports POST to `/nelmio/csp/report` (`config/routes/nelmio_security.yaml`).

### 14.4 CORS (`config/packages/nelmio_cors.yaml`)

```yaml
defaults:
    origin_regex: true
    allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']
    allow_methods: ['GET','OPTIONS','POST','PUT','PATCH','DELETE']
    allow_headers: ['Content-Type','Authorization']
    expose_headers: ['Link']
    max_age: 3600
paths: { '^/': null }
```

`CORS_ALLOW_ORIGIN` is a regex supplied per environment (repo default `^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$`, `.env:54`; the real value for BKA lives in the deployment's environment and is **UNVERIFIED** from this checkout). `allow_credentials` is not set, so it defaults to `false` — cross-origin cookie auth is not possible; only bearer tokens.

### 14.5 Other

- `framework.http_method_override: false` — no `_method` spoofing.
- `handle_all_throwables: true`.
- `X-Robots-Tag: noindex` is present on responses (observed live); it is not set by any of these bundles, so it comes from the Apache layer or the reverse proxy — **UNVERIFIED** which.
- Serializer uses `camel_case_to_snake_case` globally (`framework.yaml:29-30`), which is why API payloads are snake_case.
- `/img/{path}` is a public 302 redirect to the R2 bucket, with a `..` guard (`src/Controller/ImageRedirectController.php:14-16`).

---

## 15. Facts that will bite a port (no design opinions, just observations)

1. **Five different "my event" definitions** coexist (admin list, `EventVoter`, `EventApiVoter`, `EventExtension`, `OccurrenceExtension`/`occurrenceEngineSearch`) — see §6.1. Two of the extensions carry docblocks asserting they are aligned with the voters; they are not.
2. **Every authenticated API request writes to the `user` table** (`SecurityListener::onLoginSuccess` on all firewalls, §11.2).
3. **`enabled = false` only blocks fresh password logins.** Existing sessions and OAuth2 tokens keep working (§8.4, §12.5).
4. **`POST /api/v2/auth` yields an unusable JWT** (missing `uuid`), §13.3.
5. **UserToken JWTs are stored in plaintext and re-displayed on demand** at `/user-token/show/{id}` (§6.5).
6. **Token expiry is unbounded** at creation — production holds a token valid to **2050** and OAuth2 access tokens valid to **2046**.
7. **Three of the four API partner identities are `ROLE_ADMIN`**, so the per-organisation row filters never apply to them (§12.4).
8. **`/places/` and `/organizations/` lists are global for every logged-in user**, regardless of `LIST_OWN_EVENTS_ONLY` (§6.2, §6.3). Only `?mine=1` narrows them.
9. **Non-admins cannot change their own password from the admin UI** (access_control rule 7 covers `/admin/users/password/{id}`); they must use `/reset-password`.
10. **`switch_user` and `remember_me` are configured but unreachable** (§11.3, §11.4).
11. **`OauthTokenGenerator` hard-codes `var/oauth/private.key`** (line 45) while the bundle config points at `var/oauth/test_private.key`; only the `test_*` pair exists in the repo, so the CLI command and the resource server can disagree about the key in any environment that does not provide both files.
12. **`oauth2_access_token.user_identifier` is an email string, not an FK** — renaming or deleting a user silently breaks or orphans their tokens (`technique1@venue-example.org` is already orphaned).
13. **No `delete` voter attribute for events** — deletion reuses `edit`, so anyone who may edit may delete, including the "proposed this event by email" branch.
14. **Admin-set passwords have no minimum length** (`UserPasswordType` only `NotBlank`); reset-flow passwords require 6 characters.
15. **`cookie_samesite: null`** is deliberate, to let the proposal wizard run in an iframe (`framework.yaml:20`).
16. **Migrations are MySQL-first.** Every auth table (`user`, `user_organization`, `oauth2_*`, `reset_password_request`, `user_token`) was created with `AUTO_INCREMENT`/`ENGINE = InnoDB` in `migrations/Version20221124093828.php`, `Version20231012152447.php`, `Version20241107165934.php`; later Postgres-only patches (`Version20260923160000.php`, `Version20260926150000.php`, `Version20261008090000.php`) adjust column comments, the `locale` default and the `reset_password_request` FK. The live Postgres DB has `bigint` ids where the mapping says `INTEGER`, and `roles`/`config` are `text` carrying `(DC2Type:json)`.
17. `ROLE_BROADCAST_PARTNER` has **zero production users** but 17 ApiResources, 4 query extensions, `EventVoter::canViewEvent`, `DefaultController` and `UserTokenController` all special-case it.

---

## Porting notes

*(Design commentary, clearly separated from the facts above. These are starting points, not decisions.)*

**Role model.** We.Publish already has a permission-string model: `libs/permissions/src/lib/permissions.ts` (189 permissions) with `CanGetEvent` / `CanCreateEvent` / `CanUpdateEvent` / `CanDeleteEvent` / `CanGetImportedEvents` (lines 685-713), roles stored in `UserRole { permissionIDs String[] }` (`libs/api/prisma/schema.prisma:1234`) and the predefined `admin` / `editor` / `peer` roles (`libs/permissions/api/src/lib/predefined-permissions.ts`). BKA's three roles map cleanly onto three `UserRole` rows:

| BKA role | We.Publish `UserRole` | Permissions |
| --- | --- | --- |
| `ROLE_ADMIN` | existing `admin` (or a new `bka-admin`) | all event/organization/place/image/user permissions, no row scoping |
| `ROLE_USER` | new role, e.g. `bka-organizer` | `CAN_GET_EVENT`, `CAN_CREATE_EVENT`, `CAN_UPDATE_EVENT`, `CAN_DELETE_EVENT` + new organization/place permissions, **with row scoping** |
| `ROLE_BROADCAST_PARTNER` | new read-only role, e.g. `bka-partner` | `CAN_GET_EVENT` only; no scoping (sees everything published) |

**Row-level scoping has no equivalent today.** We.Publish permissions are global booleans (`libs/permissions/api/src/lib/permission.guard.ts`). The BKA model needs an ownership dimension: `user ↔ organization` (many-to-many, genuinely used — 87 users in ≥2 orgs), and an event is "mine" if `event.userId = me` **or** `event.organizationId ∈ myOrgs` **or** `event.place.organizationId ∈ myOrgs` **or** `event.proposedBy.email = my email`. Pick **one** definition and apply it in exactly one place (a `scopeEventsForUser(user)` Prisma `where` fragment reused by resolvers and guards), rather than reproducing the five divergent ones.

**`LIST_OWN_EVENTS_ONLY` is a BKA constant.** It is `true` for BKA and only ever read by `EventController`. It can be hard-coded as "non-admins see only their own events" rather than carried over as a flag — but note that it currently means *organisation-or-proposer*, not *owner*, and that it does **not** apply to the place/organisation lists.

**Draft/pending/published.** BKA has a single `event.publicationStatus` (`draft` / `to_validate` / `publish`) plus `publicationDate`, and both API surfaces hard-filter to `publish` — there is no API path to a draft. Mapping onto We.Publish revisions: `publish` → published revision; `to_validate` → pending (awaiting a user with the `publish` right); `draft` → draft. The `can_publish` distinction (`EventVoter::PUBLISH` excludes the `proposedBy`-email branch) becomes a separate permission (e.g. `CAN_PUBLISH_EVENT`) rather than a different row filter.

**Authentication.** We.Publish already has `Session` (`libs/api/prisma/schema.prisma:1040`, opaque token + `expiresAt`, with impersonation columns) and `Token { name, token, roleIDs }` (line 1028) for machine access, plus `libs/authentication/api/src/lib/scoped-jwt.guard.ts`. BKA's three mechanisms collapse to two:

- *Session login* → We.Publish session (note BKA's `enabled` flag needs an equivalent of `User.active`, which already exists at `schema.prisma:1200`).
- *UserToken JWT* and *OAuth2 bearer* → We.Publish `Token` rows. Both BKA mechanisms are in reality "a long-lived bearer credential bound to one user's roles"; the OAuth2 refresh-grant machinery buys nothing here (no authorization-code flow, no client-credentials flow, no scopes enforced). The four `oauth2_client` rows map to four `Token` rows. **Decide whether partner tokens should continue to carry admin rights** — three of the five today do.

**Migration of credentials.** Passwords are Symfony `auto` hashes (bcrypt or argon2id, self-describing in the `$2y$`/`$argon2id$` prefix); We.Publish hashes with bcrypt. Verify the hash formats line up or plan a rehash-on-next-login shim. Email is the identity in both systems. `user.locale` ('de' for all 427 BKA users) has no column in We.Publish's `User` — it would need adding if per-user email language matters. `user.member` likewise.

**Things worth not porting:** the dead `/api/v2/auth` route, `switch_user`/`remember_me` (We.Publish has its own impersonation in `Session`), plaintext token storage + the "show full token forever" page, GET-based delete links, and unbounded token expiry.

**Things worth porting carefully:** the `enabled`/`active` check must be applied on *every* mechanism, not just password login; the `last_login` write must not happen on every API request; and `oauth2_access_token.user_identifier`-style string references should become real foreign keys.
