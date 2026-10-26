# BKA legacy API v1 — the hand-written FOSRest controllers

**Scope.** This document is the complete, field-by-field contract of the *legacy* REST API of
`insitu-admin` — everything routed under `/api/v1/*` and implemented by the hand-written
`App\Controller\Api*Controller` classes (`Affiliation`, `Audience`, `Category`, `Event`,
`Organization`, `Place`, `Region`, plus the shared `AbstractApiController`). It covers the routing,
the OAuth 2 firewall that guards it, every query/body parameter, the write-side form types
(`src/Form/ApiForm/*`), the serializer groups and custom normalizers that shape every response byte,
the error shapes, the two PHPUnit tests that exist for it, and every request in
`postman_collection_20250116.json`. It is written as the contract a compatibility stub in We.Publish
would have to emulate. **API v2** (API Platform, `/api/v2/*`, JWT via `UserToken`) is explicitly out
of scope and is only mentioned where it contrasts. Everything below is grounded in a file path, a
`debug:router` / `debug:serializer` dump from the running BKA container, a SQL query against the
restored BKA production database, or a real `curl` against `http://localhost:8080`. Where I could
not execute something, it is marked **UNVERIFIED** with the reason.

---

## 1. Live-call limitation (read this before trusting any example payload)

Every `/api/v1/*` route requires a valid OAuth 2 **bearer access token** (see §4). The only grant
enabled on this deployment is `refresh_token`
(`config/packages/league_oauth2_server.yaml:34-43`), and exercising it would **write** a new row to
`oauth2_access_token` — which the research rules forbid. Minting a token locally from the committed
key pair was blocked by the tool sandbox.

Consequence:

* **Captured live (real HTTP responses):** all `401`, `404`, `405` and CORS-preflight responses, the
  `/api/doc` page, `/openapi.yaml`, and the `Allow:` headers. These are quoted verbatim.
* **Reconstructed (not captured):** the `200` payloads. They are assembled from
  (a) the serializer metadata dumped by `php bin/console debug:serializer` inside the running
  container, (b) the custom normalizers in `src/Serializer/Normalizer/`, and (c) **real production
  rows** pulled out of the restored database. Every value in the example payloads below comes from an
  actual production row (event `37005`, place `313`, organization `313`, region `13`, category `1`,
  audience `1`, image `28346`, rate `13238`). They are marked **[reconstructed]**.

---

## 2. Where v1 lives, and what it is built on

| Thing | Value | Source |
| --- | --- | --- |
| PHP | `>=8.3` (container runs 8.3.35) | `composer.json`; `X-Powered-By` header |
| Symfony | `6.4.*` | `composer.json` |
| REST layer | `friendsofsymfony/rest-bundle ^3.3` | `composer.json` |
| OAuth 2 server | `league/oauth2-server-bundle ^0.9` | `composer.json` |
| API docs | `nelmio/api-doc-bundle ^4.9` | `composer.json` |
| ORM | `doctrine/orm ^3.3.2` | `composer.json` |
| Deprecation marker | `@deprecated prefer usage of API v2` on `ApiEventController` only | `src/Controller/ApiEventController.php:29-31` |

Routing is loaded twice (both loaders point at `src/Controller/`):

```yaml
# config/routes/annotations.yaml
controllers:
  resource: ../../src/Controller/
  type: annotation
```
```yaml
# config/routes.yaml
controllers:
    resource:
        path: ../src/Controller/
        namespace: App\Controller
    type: attribute
```

FOSRest's own routing loader is **off** (`fos_rest.routing_loader: false`,
`config/packages/fos_rest.yaml:27`), so `#[Rest\Get]`/`#[Rest\Post]` attributes act purely as
Symfony `#[Route]` subclasses — the paths come from the attributes themselves.

The OAuth 2 endpoints are mounted under `/api/` by `config/routes.yaml`:

```yaml
oauth2:
  resource: '@LeagueOAuth2ServerBundle/Resources/config/routes.php'
  type: php
  prefix: /api/
```

which yields `oauth2_authorize → /api/authorize` and `oauth2_token → POST /api/token`
(`vendor/league/oauth2-server-bundle/src/Resources/config/routes.php`).

### 2.1 FOSRest zone

```yaml
# config/packages/fos_rest.yaml:30-31
zone:
  - { path: '^/api(?!/v2)' }
```

All FOSRest listeners (body decoding, format negotiation, view handling, allowed-methods,
exception→`{code,message}`) are active **only** on `/api/*` **except** `/api/v2/*`. This is the hard
boundary between v1 and v2.

---

## 3. Complete route table

Captured from the running container:
`docker exec insitu-admin-app-1 php bin/console debug:router`.

| Route name | Method | Path | Controller method | File:line |
| --- | --- | --- | --- | --- |
| `api_affiliations_get_all` | GET | `/api/v1/affiliations/` | `ApiAffiliationController::getAffiliations` | `ApiAffiliationController.php:17,44` |
| `api_audiences_get_all` | GET | `/api/v1/audiences/` | `ApiAudienceController::getAudiences` | `ApiAudienceController.php:17,44` |
| `api_categories_get_all` | GET | `/api/v1/categories/` | `ApiCategoryController::getCategories` | `ApiCategoryController.php:17,46` |
| `api_regions_get_all` | GET | `/api/v1/regions/` | `ApiRegionController::getRegions` | `ApiRegionController.php:17,44` |
| `api_events_get_all` | GET | `/api/v1/events/` | `ApiEventController::getEvents` | `ApiEventController.php:46,132` |
| `api_events_count_only` | GET | `/api/v1/events/count` | `ApiEventController::getEventsCounterOnly` | `ApiEventController.php:173,177` |
| `api_events_get_sponsored` | GET | `/api/v1/events/sponsored` | `ApiEventController::getSponsoredEvents` | `ApiEventController.php:201,229` |
| `api_events_get_by_slug` | GET | `/api/v1/events/{slug}` | `ApiEventController::getEventBySlug` | `ApiEventController.php:246,283` |
| `api_events_create_event` | POST | `/api/v1/events/` | `ApiEventController::postEvent` | `ApiEventController.php:302,355` |
| `api_events_modify_event` | PUT | `/api/v1/events/{id}` (`id` ⇒ `\d+`) | `ApiEventController::putEvent` | `ApiEventController.php:410,463` |
| `api_events_delete_event` | DELETE | `/api/v1/events/{id}` (`id` ⇒ `\d+`) | `ApiEventController::deleteEvent` | `ApiEventController.php:518,553` |
| `api_events_get_similar` | GET | `/api/v1/events/similar/{slug}` | `ApiEventController::getSimilarEvents` | `ApiEventController.php:569,610` |
| `api_events_get_events_for_organization` | GET | `/api/v1/events/organization/{slug}` | `ApiEventController::getOrganizationEvents` | `ApiEventController.php:630,671` |
| `api_events_get_events_for_place` | GET | `/api/v1/events/place/{slug}` | `ApiEventController::getPlaceEvents` | `ApiEventController.php:691,732` |
| `api_organizations_get_all` | GET | `/api/v1/organizations/` | `ApiOrganizationController::getOrganizations` | `ApiOrganizationController.php:20,59` |
| `api_organizations_get_by_slug` | GET | `/api/v1/organizations/{slug}` | `ApiOrganizationController::getOrganizationBySlug` | `ApiOrganizationController.php:81,118` |
| `api_places_get_all` | GET | `/api/v1/places/` | `ApiPlaceController::getPlaces` | `ApiPlaceController.php:20,65` |
| `api_places_get_by_slug` | GET | `/api/v1/places/{slug}` | `ApiPlaceController::getPlaceBySlug` | `ApiPlaceController.php:81,118` |
| `oauth2_authorize` | ANY | `/api/authorize` | league bundle | `config/routes.yaml` |
| `oauth2_token` | POST | `/api/token` | league bundle | `config/routes.yaml` |
| `api_doc` | ANY | `/api/doc` | `DefaultController::apiDoc` | `DefaultController.php:21-25` |

**18 v1 endpoints in total** (7 collections + list, 4 single-resource GETs, 3 writes, 3 scoped event
lists, 1 counter).

### 3.1 Routing subtleties that matter for a stub

1. **Every collection route ends in a slash** (`/api/v1/events/`, `/api/v1/places/`, …). The
   slash-less form (`/api/v1/events`) is handled by Symfony's redirecting matcher, but the firewall
   runs first, so an unauthenticated slash-less call returns `401`, not `301`
   (verified: `curl -i http://localhost:8080/api/v1/categories` → `401`). With a valid token, a
   `301` to the slash form is expected — **UNVERIFIED** (needs a token).
2. `/count` and `/sponsored` are declared **before** `/{slug}`, so they win. `{slug}` does not match
   `/`, so `/similar/{slug}`, `/organization/{slug}` and `/place/{slug}` are unambiguous even though
   they are declared *after* `/{slug}`.
3. `GET /api/v1/events/123` resolves to `api_events_get_by_slug` (slug = `"123"`), not to an id
   lookup. Verified via the `Allow` header:
   ```
   $ curl -s -D- -o /dev/null -X OPTIONS http://localhost:8080/api/v1/events/123
   HTTP/1.1 405 Method Not Allowed
   Allow: GET, PUT, DELETE
   ```
4. `PUT`/`DELETE` take a **numeric id**, `GET` takes a **slug**. Asymmetric by design.
5. `/api/v1/events/count` is deliberately excluded from the OpenAPI document
   (`config/routes/nelmio_api_doc.yaml` → `path_patterns: ^/api(?!/doc|/v1/events/count|/token|/authorize$)`).

---

## 4. Authentication and authorization

### 4.1 Firewalls (`config/packages/security.yaml:19-77`)

```yaml
firewalls:
    # api v2
    api_platform:
        pattern: '^/api/v2'
        stateless: true
        json_login: { check_path: jwt_auth, username_path: email, password_path: password, ... }
        jwt: { authenticator: app.custom_jwt_authenticator }

    # old api v1
    api_token:
        pattern: ^/api/token$
        security: false
    api_doc:
        pattern: ^/api/doc$
        security: false
    api:
        pattern: ^/api(?!/v2)
        security: true
        stateless: true
        oauth2: true
```

So **v1 runs on the `api` firewall with `oauth2: true`** — the resource-server authenticator from
`league/oauth2-server-bundle`. It is `stateless`, so the admin session cookie from
`http://localhost:8080/login` grants **nothing** on `/api/v1/*`.

### 4.2 Access control (`config/packages/security.yaml:81-92`)

```yaml
access_control:
    - { path: ^/api/v2,         roles: PUBLIC_ACCESS }
    - { path: ^/api/authorize,  roles: IS_AUTHENTICATED_REMEMBERED }
    - { path: ^/api,            roles: IS_AUTHENTICATED_FULLY }
```

Every `/api/v1/*` route — including the pure reference-data ones (`/regions/`, `/audiences/`,
`/affiliations/`, `/categories/`) — requires a fully authenticated principal. There is no public
read surface in v1.

### 4.3 OAuth 2 server configuration (`config/packages/league_oauth2_server.yaml`)

| Setting | Value |
| --- | --- |
| `access_token_ttl` | `PT1H` (1 hour) |
| `refresh_token_ttl` | `P6M` (6 months) |
| `auth_code_ttl` | `PT10M` |
| `enable_client_credentials_grant` | `false` |
| `enable_password_grant` | `false` |
| `enable_refresh_token_grant` | **`true`** |
| `enable_auth_code_grant` | `false` |
| `persist_access_token` | `true` |
| `scopes.available` / `.default` | `[api]` |
| `role_prefix` | `ROLE_OAUTH2_` → granted role is `ROLE_OAUTH2_API` |
| `private_key` / `public_key` | `var/oauth/test_private.key` / `var/oauth/test_public.key` (committed; prod overrides expected) |

The access token is an **RS256 JWT** with claims `aud` (client id), `jti` (access-token identifier),
`iat`, `nbf`, `exp`, `sub` (the user's e-mail), `scopes: ["api"]`
(`vendor/league/oauth2-server/src/AuthorizationValidators/BearerTokenValidator.php:119-128`). The
`jti` is checked against `oauth2_access_token` for revocation, so forging is not possible without a
matching DB row.

`OAuth2Authenticator::doAuthenticate()`
(`vendor/league/oauth2-server-bundle/src/Security/Authenticator/OAuth2Authenticator.php:68-112`)
loads the Symfony user by the `sub` claim via the single configured provider
(`app_user_provider`, entity `App\Entity\User`, property `email`) and attaches a `ScopeBadge`. The
resulting token's roles are the user's own roles **plus** `ROLE_OAUTH2_API`.

Documented refresh flow (from the OpenAPI description, `config/packages/nelmio_api_doc.yaml`):

```
POST https://admin.insitu.live/api/token
{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "grant_type": "refresh_token",
  "refresh_token": "YOUR_REFRESH_TOKEN"
}
```

### 4.4 Real OAuth 2 clients in the BKA production dump

```sql
SELECT identifier, name, active, grants, scopes FROM oauth2_client;
```
| identifier | name | active | grants | scopes |
| --- | --- | --- | --- | --- |
| `052adb6fc2432319ac669f05f4f97a7c` | `heiko_dachstock.ch` | t | `refresh_token` | `api` |
| `1d5709aa6bfbc4c6e05a25e4c40be19e` | `guidle` | t | `refresh_token` | `api` |
| `2e7e30c5e37a23dcf6adbeacaa073ba0` | `bka-frontend` | t | `refresh_token` | `api` |
| `aa2d951a902d8e2bffd295460693f825` | `punktzwei` | t | `refresh_token` | `api` |

```sql
SELECT identifier, expiry, user_identifier, client, scopes, revoked FROM oauth2_access_token ORDER BY expiry DESC;
```
7 rows, **none revoked**, token subjects: `support@guidle.com`, `admin@wepublish.ch`,
`elias@wepublish.ch`, `person05@example.org`, `produktion@bka.ch`, `technique1@venue-example.org`.
Refresh tokens per client: `bka-frontend` 3, `guidle` 2, `heiko_dachstock.ch` 1, `punktzwei` 1.

> **Note.** The expiry timestamps in the dump run to 2043–2046 even though `access_token_ttl` is
> `PT1H`; the dump's clock appears shifted (the environment's "today" is 2026-10-17 and events run
> into Dec 2026). Which of these four integrations still calls v1 rather than v2 is **UNVERIFIED** —
> there are no access logs in the restored environment. The names strongly suggest the BKA public
> website (`bka-frontend`), the Guidle event-exchange, a venue (`dachstock.ch`) and an agency
> (`punktzwei`).

### 4.5 Per-endpoint authorization

| Endpoint | Firewall gate | Extra attribute | Per-object voter |
| --- | --- | --- | --- |
| `GET /affiliations/`, `/audiences/`, `/categories/`, `/regions/` | `IS_AUTHENTICATED_FULLY` | — | none |
| `GET /events/` | `IS_AUTHENTICATED_FULLY` | — | `EventSearchEngine` does its own org filter (see §7.1); the legacy branch runs `isGranted('view', $event)` per row |
| `GET /events/count` | `IS_AUTHENTICATED_FULLY` | — | same as above |
| `GET /events/sponsored` | `IS_AUTHENTICATED_FULLY` | — | **none** (no `view` check) |
| `GET /events/{slug}` | `IS_AUTHENTICATED_FULLY` | — | `isGranted('view', $event)` → `403` |
| `POST /events/` | `IS_AUTHENTICATED_FULLY` | `#[IsGranted('ROLE_USER')]` | `isGranted('edit', $event)` after the form binds → `403` |
| `PUT /events/{id}` | `IS_AUTHENTICATED_FULLY` | `#[IsGranted('ROLE_USER')]` | `isGranted('edit', $event)` **before** the form binds → `403` |
| `DELETE /events/{id}` | `IS_AUTHENTICATED_FULLY` | `#[IsGranted('ROLE_USER')]` | `isGranted('edit', $event)` → `403` |
| `GET /events/similar/{slug}`, `/organization/{slug}`, `/place/{slug}` | `IS_AUTHENTICATED_FULLY` | — | **none** |
| `GET /organizations/` | `IS_AUTHENTICATED_FULLY` | — | `isGranted('view', $organization)` per row, non-matching rows silently dropped |
| `GET /organizations/{slug}` | `IS_AUTHENTICATED_FULLY` | — | `isGranted('view', $organization)` → `403` |
| `GET /places/` | `IS_AUTHENTICATED_FULLY` | — | **none** (not even `enabled`/`private` filtering — see §7.9) |
| `GET /places/{slug}` | `IS_AUTHENTICATED_FULLY` | — | **none**; the `403` documented in the OpenAPI file is dead code |

`role_hierarchy` (`security.yaml:15-17`): `ROLE_ADMIN → ROLE_USER`,
`ROLE_SUPER_ADMIN → [ROLE_ADMIN, ROLE_ALLOWED_TO_SWITCH]`. `ROLE_BROADCAST_PARTNER` is **not** in the
hierarchy, so a broadcast-partner token cannot `POST`/`PUT`/`DELETE` events (fails
`#[IsGranted('ROLE_USER')]`), but *can* read.

Role distribution in production (`SELECT roles, count(*) FROM "user" GROUP BY roles`):
`["ROLE_USER"]` 397, `["ROLE_USER","ROLE_ADMIN"]` 28, `["ROLE_ADMIN","ROLE_USER"]` 2. No user carries
`ROLE_BROADCAST_PARTNER` in the BKA dump.

### 4.6 `EventVoter` (`src/Security/Voters/EventVoter.php`)

```php
VIEW   → ROLE_ADMIN  OR  ROLE_BROADCAST_PARTNER  OR  canEdit
EDIT   → ROLE_ADMIN  OR  canPublish  OR  (event.proposedBy.email  ==ci==  user.email)
PUBLISH→ ROLE_ADMIN  OR  event.user == user
                     OR  user.organizations contains event.organization
                     OR  user.organizations contains event.place.organization
```

### 4.7 `OrganizationVoter` (`src/Security/Voters/OrganizationVoter.php`)

```php
VIEW / EDIT → ROLE_ADMIN OR user.organizations.contains(subject)
CREATE / DELETE → always false
```

Only `VIEW` and `EDIT` are in `supports()`, so a `create`/`delete` check on an `Organization` is
abstained on, not denied.

### 4.8 `AbstractApiController` (the entire class)

```php
abstract class AbstractApiController extends AbstractFOSRestController
{
    protected function handleForbiddenResponse(string $msg = 'You are not authorized to manage events for this place'): View
    {
        $response = ['code' => Response::HTTP_FORBIDDEN, 'message' => $msg];
        return View::create($response, Response::HTTP_FORBIDDEN);
    }
}
```

Default message: `"You are not authorized to manage events for this place"`. Overridden with
`"Not authorized to view this event"` in `getEventBySlug` and
`"Not authorized to view this organization"` in `getOrganizationBySlug`.

---

## 5. Request / response pipeline

### 5.1 `config/packages/fos_rest.yaml` (verbatim)

```yaml
fos_rest:
  serializer:
    serialize_null: true
  body_listener:
    enabled: true
    throw_exception_on_unsupported_content_type:  true
    decoders:
      json: fos_rest.decoder.json
  body_converter:
    enabled: false
  param_fetcher_listener:  true
  allowed_methods_listener:  true
  view:
    view_response_listener:  true
  exception:
    codes:
      Doctrine\ORM\EntityNotFoundException: 404
  format_listener:
    rules:
      - { path: ^/api/doc, prefer_extension: true, fallback_format: html, priorities: [ 'text/html', '*/*' ] }
      - { path: ^/api, prefer_extension: false, fallback_format: json, priorities: [ 'json' ] }
      - { path: ^/, prefer_extension: true, fallback_format: html, priorities: [ 'text/html', '*/*' ] }
  routing_loader: false
  zone:
    - { path: '^/api(?!/v2)' }
```

Consequences:

* **Format**: `/api/v1/*` always negotiates to `json`. `Accept` is effectively ignored.
* **Body decoding** (`BodyListener`,
  `vendor/friendsofsymfony/rest-bundle/EventListener/BodyListener.php:58-116`): for
  `POST|PUT|PATCH|DELETE` whose `Content-Type` is **not** `multipart/form-data` or
  `application/x-www-form-urlencoded`, the raw body is decoded with the format derived from
  `Content-Type` and placed into `$request->request` as an `InputBag`. With
  `throw_exception_on_unsupported_content_type: true`, a body with an unknown/absent content type
  raises `UnsupportedMediaTypeHttpException` → **415** (the only exemption is an empty `DELETE` with
  no content type). A JSON body that decodes to a non-array raises `BadRequestHttpException` → **400**
  with message `Invalid json message received`.
  ⇒ `POST`/`PUT` **must** send `Content-Type: application/json`. Classic form encoding also works
  (Symfony populates `request` itself).
* **`serialize_null: true`** ⇒ the Symfony serializer runs with `skip_null_values => false`
  (`SymfonySerializerAdapter::convertContext()`), so **nulls are emitted**, never omitted.
* **`allowed_methods_listener: true`** ⇒ every response carries an `Allow` header.
  Verified: `GET /api/v1/events/?…` → `Allow: GET, POST`; `/api/v1/events/123` → `Allow: GET, PUT, DELETE`.
* **`exception.codes`** maps `Doctrine\ORM\EntityNotFoundException` → 404.
* **`body_converter: false`** ⇒ no automatic request→DTO conversion; controllers read
  `$request->request->all()` themselves.

### 5.2 `#[Rest\View]` handling

`ViewResponseListener::onKernelView()`
(`vendor/friendsofsymfony/rest-bundle/EventListener/ViewResponseListener.php:142-160`) merges the
attribute into the `View` the controller returned:

* `serializerGroups` are merged into the view context (set if the context has none).
* `serializerEnableMaxDepthChecks: false` ⇒ `$context->disableMaxDepth()` ⇒ `enable_max_depth => false`.
  `#[MaxDepth]` is nowhere in the entities anyway, but this makes the deep `reader` graphs expand fully.
* `statusCode` on the attribute is only applied when the view has no status or has `200`.

`ViewHandler::getSerializationContext()` additionally sets a `status_code` context attribute equal
to the view's status code (`ViewHandler.php:246-248`) — this is what makes nested form errors carry
a `code` (§9.3).

### 5.3 Serializer configuration

```yaml
# config/packages/framework.yaml:28-30
serializer:
    name_converter: 'serializer.name_converter.camel_case_to_snake_case'
```

* **All object attribute names are snake_cased** (`eventStatus` → `event_status`,
  `proInfirmisDetailUrl` → `pro_infirmis_detail_url`).
* **Keys *inside* JSON columns are NOT converted.** `labels` keeps `description`,
  `printDescription`, `ticketingUrl`, `legend`, `designation`, `about`, `capacity`, `subTitle`,
  `name`, `alt`, `title` exactly as stored. Verified against production rows (§6.4).
* **Dates**: no custom `DateTimeNormalizer` format is configured ⇒ Symfony's default
  `DateTimeInterface::RFC3339` → `2026-12-12T21:00:00+01:00`.
* **Timezone**: `App\Doctrine\Type\LocalDateTimeTzType` (`src/Doctrine/Type/LocalDateTimeTzType.php:22,37`)
  forces every `datetimetz` column into `Europe/Zurich` on load; the container's `date.timezone` is
  `Europe/Zurich` (`Dockerfile:114`, confirmed via `php -i`). So every emitted datetime carries
  `+01:00` or `+02:00`, never `Z`.

---

## 6. The serialization model

### 6.1 Which group each endpoint uses

| Endpoint | `serializerGroups` |
| --- | --- |
| `GET /events/` | `['default']` |
| `GET /events/count` | *(none — no groups ⇒ all attributes; irrelevant, data is scalars)* |
| `GET /events/sponsored` | `['default']` |
| `GET /events/{slug}` | `['reader']` |
| `POST /events/` | `['reader']` |
| `PUT /events/{id}` | `['reader']` |
| `DELETE /events/{id}` | *(none)* |
| `GET /events/similar/{slug}` | `['default']` |
| `GET /events/organization/{slug}` | `['default']` |
| `GET /events/place/{slug}` | `['default']` |
| `GET /organizations/` | `['default']` |
| `GET /organizations/{slug}` | `['reader']` |
| `GET /places/` | `['default']` |
| `GET /places/{slug}` | `['reader']` |
| `GET /affiliations/` | `['default']` |
| `GET /audiences/` | `['default']` |
| `GET /categories/` | **`['filters']`** |
| `GET /regions/` | `['default']` |

There is a fourth group, `archive`, used only by the admin archive feature — never by v1.

### 6.2 Group matrix, `Event` / `MainEvent` / `SubEvent`

Dumped with `php bin/console debug:serializer "App\Entity\MainEvent"` inside the container.
JSON key = snake_case of the property.

| Property | JSON key | `default` | `reader` | Declared in |
| --- | --- | :-: | :-: | --- |
| `id` | `id` | ✔ | ✔ | `Event.php:90` |
| `slug` | `slug` | ✔ | ✔ | `Event.php:95` |
| `oldSlug` | — | — | — | `Event.php:99` (never serialized) |
| `name` | `name` | ✔ | ✔ | `Event.php:105` |
| `eventStatus` | `event_status` | ✔ | ✔ | `Event.php:109` |
| `place` | `place` | ✔ | ✔ | `Event.php:114` |
| `categories` | `categories` | ✔ | ✔ | `Event.php:118` |
| `printCategory` | `print_category` | ✔ | ✔ | `Event.php:126` |
| `dateFrom` | `date_from` | ✔ | ✔ | `Event.php:130` |
| `dateTo` | `date_to` | ✔ | ✔ | `Event.php:134` |
| `openingTime` | `opening_time` | — | ✔ | `Event.php:138` |
| `description` *(deprecated, legacy untranslated)* | `description` | — | ✔ | `Event.php:145` |
| `specialRate` | `special_rate` | ✔ | ✔ | `Event.php:150` |
| `publicationStatus` | `publication_status` | ✔ | ✔ | `Event.php:154` |
| `publicationDate` | `publication_date` | ✔ | ✔ | `Event.php:158` |
| `images` | `images` | ✔ | ✔ | `Event.php:163` |
| `videos` | `videos` | ✔ | ✔ | `Event.php:167` |
| `rates` | `rates` | ✔ | ✔ | `Event.php:171` |
| `ticketings` | `ticketings` | ✔ | ✔ | `Event.php:175` |
| `audience` | `audience` | ✔ | ✔ | `Event.php:180` |
| `proposedBy` | `proposed_by` | ✔ | ✔ | `Event.php:185` |
| `nextDate` *(computed, not a column)* | `next_date` | ✔ | ✔ | `Event.php:188` |
| `relatedDates` | `related_dates` | — | ✔ | `Event.php:192` |
| `nextFilteredDate` *(computed)* | `next_filtered_date` | ✔ | — | `Event.php:200` |
| `sponsoredStartDate` | `sponsored_start_date` | ✔ | ✔ | `Event.php:205` |
| `sponsoredEndDate` | `sponsored_end_date` | ✔ | ✔ | `Event.php:210` |
| `placeProposed` | `place_proposed` | ✔ | ✔ | `Event.php:216` |
| `occurrences` | — | — | — | `Event.php:220` (never serialized) |
| `isMultiDayEvent` | `is_multi_day_event` | ✔ | ✔ | `Event.php:224` |
| `organization` | `organization` | ✔ | ✔ | `Event.php:229` |
| `user` | — | — | — | `Event.php:233` (never serialized) |
| `showInPrint` | `show_in_print` | ✔ | ✔ | `Event.php:237` |
| `ogImage` | `og_image` | ✔ | ✔ | `Event.php:242` |
| `archivedOrganization` / `archivedPlace` | — | — | — | `Event.php:245,248` |
| `labels` *(trait)* | `labels` | ✔ | ✔ | `Traits/TranslatableEntity.php:13` |
| `recurrence` *(MainEvent)* | `recurrence` | ✔ | ✔ | `MainEvent.php:38` |
| `recurrenceWeekDays` *(MainEvent)* | `recurrence_week_days` | ✔ | ✔ | `MainEvent.php:42` |
| `ticketingUrl` *(MainEvent, deprecated)* | `ticketing_url` | — | ✔ | `MainEvent.php:49` |
| `subEvents` *(MainEvent)* | — | — | — | `MainEvent.php:54` (never serialized) |
| `organization` *(SubEvent override)* | `organization` | ✔ | ✔ | `SubEvent.php:17` |

`SubEvent` additionally **delegates** `getRecurrence()`, `getRecurrenceWeekDays()`,
`getTicketingUrl()`, `getPublicationDate()`, `getUser()`, `getImages()`, `getRates()` to its
`mainEvent` (`SubEvent.php:30-63`) — so a sub-event's payload borrows its parent's images and rates.
`SubEvent::isMultiDayEvent()` always returns `true` (`SubEvent.php:68-71`).

### 6.3 Group matrix, every other entity reachable from v1

| Entity | `default` keys | `reader` keys | `filters` keys |
| --- | --- | --- | --- |
| `Place` (`src/Entity/Place.php`) | `id, slug, name, enabled, address, zip, city, region, latitude, longitude, labels` | **all of `default` plus** `private, about*, images, website, technical_sheets, capacity*, wheelchair_accessible, wheelchair_accessible_toilets, wheelchair_accessible_parking, pro_infirmis_id_source, pro_infirmis_detail_url, pro_infirmis_pictograms` | — |
| `Organization` (`src/Entity/Organization.php`) | `id, slug, name, enabled, sub_title*, categories, latitude, longitude, labels` | **all of `default` plus** `address, post_office_box, zip, city, region, about*, images, website, legal_status, contacts, users, places, affiliations` | — |
| `Category` (`src/Entity/Category.php`) | `id, label, tag_color, hidden` | `id, label, tag_color, hidden` | `id, label, tag_color, hidden, children` |
| `Region` (`src/Entity/Region.php`) | `id, label, hidden` | `id, label, hidden` | `id, label, hidden` |
| `Audience` (`src/Entity/Audience.php`) | `id, label` | `id, label` | `id, label` |
| `Affiliation` (`src/Entity/Affiliation.php`) | `id, label` | `id, label` | `id, label` |
| `Image` (`src/Entity/Image.php`) | `legend*, labels` | `id, legend*, file_name, position, labels` | — |
| `Rate` (`src/Entity/Rate.php`) | `id, price, designation*, labels` | same | — |
| `Ticketing` (`src/Entity/Ticketing.php`) | `id, labels` | `id, labels` | — |
| `Video` (`src/Entity/Video.php`) | *(nothing)* | `id, embed_link` | — |
| `EventProposedBy` | `firstname, lastname, email, phone, organization` | same | — |
| `PlaceProposed` | `id, name, address, zip, city, latitude, longitude` | same | — |
| `Contact` (`src/Entity/Contact.php`) | — | `id, email, designation_email*, phone_number, designation_phone*, labels` | — |
| `User` (`src/Entity/User.php`) | — | `id, email, enabled` | — |
| `TechnicalSheet` | — | `id, title*, file_name, labels` | — |

`*` = `@deprecated This field is now translatable` — superseded by `labels`.
`Category.id/label/tag_color` and `Region.id/label` are additionally in `archive`;
`Category.hidden`/`Region.hidden` are not.

**Important emergent behaviours:**

* `Video` has **no** `default`-group attributes ⇒ in every `default`-group event payload, each video
  serializes to the **empty array `[]`** (PHP empty array, not `{}`; `preserve_empty_objects` is off).
  The committed OpenAPI file reflects this (`Video: type: object` with no properties).
* `Ticketing.ticketingDesignation` has no group ⇒ a ticketing is `{"id": N, "labels": {...}}` in
  both groups. (BKA has **0** ticketing rows; `ACTIVATE_MULTI_TICKETINGS` is not set.)
* `Image` in `default` has neither `id` nor `file_name` — only `legend`, `labels` and the four URL
  keys injected by `ImageNormalizer`.
* **No serialization cycles exist** in `default`/`reader`: `Place.organization` and
  `User.organizations` carry no groups, `Category.children` only exists in `filters`, and
  `Image/Rate/Video/Ticketing.event` carry no groups. This is why
  `serializerEnableMaxDepthChecks: false` is safe. The `reader` graph is nonetheless large:
  `Event → organization → places[] → images[] + technical_sheets[]`.

### 6.4 Custom normalizers (`src/Serializer/Normalizer/`)

| Normalizer | Applies to | Effect |
| --- | --- | --- |
| `EventNormalizer` | every `Event` | adds `event_type` (`"mainevent"` / `"subevent"`), `mainevent_id` (int or `null`), `mainevent_slug` (string or `null`) |
| `ImageNormalizer` | every `Image` | adds `url`, `url_webp`, `url_webp_size_512_q_65`, `url_webp_size_1024_q_65` |
| `RateNormalizer` | every `Rate` | `price = (string)($price / 100)` **only when `!empty($price)`** |
| `CategoryNormalizer` | every `Category` | adds `level`: `1` if the category has children, `2` if it has no children but has a parent, else `1` |
| `TechnicalSheetNormalizer` | every `TechnicalSheet` | adds `url` |
| `EventOccurrenceNormalizer` | every `EventOccurrence` | sets `event.nextDate`/`event.nextFilteredDate` to the occurrence's `dateFrom` when it is after the `date_from` query filter (else `null`), then normalizes |

**None of these four extra fields** (`event_type`, `mainevent_id`, `mainevent_slug`, `level`) nor the
four image URLs are in the committed `public/openapi.yaml`. They *are* in the wire format.

`ImageNormalizer` URL construction (`src/Serializer/Normalizer/ImageNormalizer.php:22-25`):

```php
$data['url']     = $router->generate('index', [], ABSOLUTE_URL) . $object->getFileRelativePath(true);
$data['url_webp']                  = $cacheManager->getBrowserPath($object->getFileName(), 'webp');
$data['url_webp_size_512_q_65']    = $cacheManager->getBrowserPath($object->getFileName(), 'webp_size_512_q_65');
$data['url_webp_size_1024_q_65']   = $cacheManager->getBrowserPath($object->getFileName(), 'webp_size_1024_q_65');
```

* `getFileRelativePath(true)` = `'img/' . rawurlencode($fileName)` (`Image.php:141-154`).
* Because `liip_imagine.webp.generate: true`, `CacheManager::getBrowserPath()` **always** takes the
  `generateUrl()` branch (`vendor/liip/imagine-bundle/Imagine/Cache/CacheManager.php:109-122`), i.e.
  the `liip_imagine_filter` route with `ABSOLUTE_URL` → `/media/cache/resolve/{filter}/{path}`
  (verified in `debug:router`). It never returns a pre-resolved cached path.
* Filter sets defined in `config/packages/liip_imagine.yaml`: `cache`, `webp` (2000×2000 inset, q80 +
  cwebp q70), `webp_size_512_q_65` (512×512 inset, q65), `webp_size_1024_q_65` (1024×1024 inset, q65).
* `/img/{path}` is a 302 redirect to `R2_PUBLIC_BASE + '/img/' + path`, public (`max-age=86400`)
  (`src/Controller/ImageRedirectController.php:11-30`). Verified live:
  ```
  $ curl -s -D- -o /dev/null http://localhost:8080/img/6a0d6460b4ad7794802222.jpg
  HTTP/1.1 302 Found
  Cache-Control: max-age=86400, public, s-maxage=86400
  Location: /img/6a0d6460b4ad7794802222.jpg     # R2_PUBLIC_BASE is empty locally
  ```
* The `/media/cache/resolve/...` path 500s locally because `R2_ENDPOINT` is unset; in production it
  streams the filtered image. The URLs are still emitted regardless.

### 6.5 The `labels` JSON column

`src/Traits/TranslatableEntity.php:12-30`. One `labels` JSON column per translatable entity, shaped
`{ "<property>": { "<lang>": "<text>|null" } }`. Languages come from `LOCALES` — for BKA
`fr|de` (`docker-compose.yaml`), default `de`.

Real production value for event `37005` (abridged):

```json
{
  "description":      { "fr": null, "de": "<p>ZUSATZSHOW:<br>FHG PVP…</p>" },
  "printDescription": { "fr": null, "de": "<p>FHG PVP treten auf…</p>" },
  "ticketingUrl":     { "fr": null, "de": "https://mokka.ch/event/fhg-pvp-2/" }
}
```

Known `labels` property keys per entity: `Event` → `description`, `printDescription`,
`ticketingUrl`, `name`; `Place` → `name`, `about`, `capacity`; `Organization` → `name`, `subTitle`,
`about`; `Image` → `legend`, `alt`; `Rate` → `designation`; `Contact` → `designationEmail`,
`designationPhone`; `TechnicalSheet` → `title`. (Derived from the form `property_path`s and from
inspecting production rows; the column is schemaless so this list is descriptive, not enforced —
`src/Validator/labels.schema.json` exists for the admin side.)

**All legacy untranslated columns are empty in BKA production** — they always serialize as `null`:

```sql
SELECT count(*) FILTER (WHERE description <> '') FROM event;  -- 0
SELECT count(*) FILTER (WHERE legend      <> '') FROM image;  -- 0
SELECT count(*) FILTER (WHERE designation <> '') FROM rate;   -- 0
SELECT count(*) FILTER (WHERE about <> ''), count(*) FILTER (WHERE capacity <> '') FROM place; -- 0, 0
```

---

## 7. Endpoint reference

Common envelope for every successful v1 response:

```json
{ "code": <int>, "message": "Success", "data": <payload>, "total": <int, on list endpoints> }
```

`code` is a **body** field duplicating the HTTP status. `message` is the literal `"Success"` on
success and `"Error"` on controller-generated failures.

---

### 7.1 `GET /api/v1/events/` — `api_events_get_all`

`src/Controller/ApiEventController.php:46-171`

**Auth:** `IS_AUTHENTICATED_FULLY` (bearer). **Serializer group:** `default`.
**Status:** `200`.

Two completely different code paths, chosen by `USE_OPTIMIZED_EVENT_LOAD`
(`$useOptimizedEventLoad`, bound in `config/services.yaml:32`). **BKA sets it to `true`**, so the
optimized path is the one that matters; the legacy path is marked
`// should not be used anymore, TODO clean` (line 143).

```php
$params = $request->query->all();
if ($this->useOptimizedEventLoad) {                                  // BKA
    $events = $this->eventSearchEngine->optimizedSearchEvents($params);
    $total  = count($events);
    $events = $this->eventListManipulator->groupEventsArrayByMonth($events, $params);
} else {                                                             // In Situ legacy
    $events = $this->eventSearchEngine->searchEvents($params);
    foreach ($events as $k => $e) if (!$this->isGranted('view', $e)) unset($events[$k]);
    $total  = count($events);
    $events = $this->eventListManipulator->groupEventsByMonth($events, $params);
}
return View::create(['code'=>200,'message'=>'Success','data'=>$events,'total'=>$total], 200);
```

#### Query parameters

There is **no `ParamFetcher`** — the controller forwards `$request->query->all()` verbatim to the
search engine. The effective parameter list is therefore whatever
`EventOccurrenceRepository::occurrenceEngineSearch()` reads
(`src/Repository/EventOccurrenceRepository.php:50-309`):

| Parameter | Type | Default | Effect (optimized / BKA path) | Documented? |
| --- | --- | --- | --- | :-: |
| `date_from` | date string parsed by `new \DateTime()` | **now** | `eventOccurrence.dateTo >= :start`; also excludes occurrences starting during the previous calendar day (`dateFrom < dayBefore OR dateFrom > endOfDayBefore`). A malformed value is caught and becomes `null` → now. | ✔ |
| `date_to` | date string | none | `eventOccurrence.dateFrom <= :end`; if the time part is exactly `00:00:00`, `23:59:59` is added | ✔ |
| `keyword` | string | none | `ILIKE %kw%` over `event.name`, `place.city`, `place.name`, `placeProposed.name`, `organization.name`. Escaping via `LikeQueryHelpers::makeLikeParam()` (escape char `!`). | ✔ |
| `category` | int or int[] | none | `categories.id IN (:idsCat)` | ✘ (undocumented) |
| `place` | int or int[] | none | `event.place = :placeN` OR-ed | ✔ |
| `region` | int or int[] | none | `place.region = :regionN` OR-ed | ✘ |
| `audience` | int or int[] | none | `event.audience = :audienceN` OR-ed | ✘ |
| `affiliation` | int[] | none | inner-joins `place.organization.affiliations`, `a.id IN (:idsAff)` | ✘ |
| `accessibility_auto_declaration` | string[] | none | OR over `place.<prop> = true`; **the value is interpolated straight into DQL** (`'place.'.$accessibility`), valid values are `wheelchairAccessible`, `wheelchairAccessibleToilets`, `wheelchairAccessibleParking` (`Place::getAccessibilityAutoList()`) | ✘ |
| `accessibility_proinfirmis` | string[] (numeric ids) | none | `JSON_CONTAINS(JSON_EXTRACT(place.proInfirmisPictograms, '$[*].Id'), :x, '$') = 1` | ✘ |
| `geoNorthEast[lat] / [lng]` + `geoSouthWest[lat] / [lng]` | float | none | bounding box over `place` **or** `placeProposed` lat/lng | ✘ |
| `multi_day` | string, the literal `"false"` | none | `event.isMultiDayEvent = false`. Any other value (including `"0"`, `false`) is a no-op. | ✔ |
| `member` | **presence only** | none | if `ACTIVATE_MEMBERS` is on: `JOIN event.user u` + `u.member = true`. `member=0` and `member=false` behave identically to `member=true` — only `array_key_exists` is tested. | ✔ |
| `free` | truthy | none | `event.specialRate IN ('free_entry','free_price')` | ✔ |
| `limit` | int | **50** | page size; clamped to `1..2000` (out-of-range falls back to 50) | ✔ |
| `page` | int, 1-based | 1 | `setFirstResult(($page-1) * $limit)` | ✔ |

Baseline predicates always applied (`EventOccurrenceRepository.php:70-76`):
`event.publicationStatus = 'publish'` **AND** (`event.publicationDate IS NULL` **OR**
`event.publicationDate <= now`). Ordering: `eventOccurrence.dateFrom ASC`.

#### Security filtering inside the search

`EventSearchEngine::optimizedSearchEvents()` (`src/Event/EventSearchEngine.php:87-118`):

```php
if ($ignoreSecurity || isGranted('ROLE_ADMIN') || isGranted('ROLE_BROADCAST_PARTNER')) {
    $filterByUser = false;
} else {
    $user = $security->getUser();
    if (!$user instanceof User) throw new UnauthorizedHttpException('Bearer Token');
}
```

When `$filterByUser` is true the query adds an **inner** `join('place.organization','placeOrganization')`
plus `(event.user = :user) OR (place IS NOT NULL AND place.organization IS NOT NULL AND
placeOrganization.id IN (...))`. Because the join is inner, a non-admin token **never sees events
without a place**. All production token subjects are `ROLE_ADMIN` (§4.4), so in practice BKA v1
callers see everything published.

#### Shape of `data`

`EventListManipulator::groupEventsArrayByMonth()` (`src/Event/EventListManipulator.php:97-149`)
buckets the already-normalized event arrays by `YYYY_MM` of `next_date`:

```json
"data": [
  { "date": "2026_11", "events": [ {…event…}, {…} ] },
  { "date": "2026_12", "events": [ {…} ] }
]
```

Buckets are sorted chronologically. When an event has no `next_date`, the bucket key falls back to
`date_from` (the query param) when present, else to "now" if the event's own `date_from` is past.
There is a latent bug on line 119 (`$event->getDateFrom()` called on an **array**) that would fatal
if ever reached — it is unreachable in practice because `date_from` defaults to now.

#### `total` is the page size, not the match count

`$total = count($events)` where `$events` is the already-paginated page. `Paginator::count()` (the
real total) is never read. With the default `limit=50`, `total` can never exceed 50. **This is a
real quirk a stub must replicate if clients depend on it.**

#### Duplicate events

`optimizedSearchEvents()` returns **one entry per matching occurrence**, so a weekly recurring event
appears once per occurrence inside the window, with a different `next_date` each time. No
de-duplication is performed.

#### Example response **[reconstructed]**

Built from event `37005` ("ZUSATZSHOW: FHG PVP", mainevent, place 313, org 313, 1 image, 1 rate,
categories `{1}`, print category 1, audience 1) with `?date_from=2026-12-01&limit=1`:

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "date": "2026_12",
      "events": [
        {
          "id": 37005,
          "slug": "zusatzshow-fhg-pvp",
          "name": "ZUSATZSHOW: FHG PVP",
          "event_status": "confirmed",
          "place": {
            "id": 313,
            "slug": "cafe-bar-mokka",
            "name": "CAFE BAR MOKKA",
            "enabled": true,
            "address": "Allmendstrasse 14",
            "zip": "3600",
            "city": "Thun",
            "region": { "id": 13, "label": { "fr": "Thoune & Oberland bernois", "de": "Thun & Berner Oberland" }, "hidden": false },
            "latitude": 46.759849,
            "longitude": 7.623815,
            "labels": { "about": { "de": "<p><strong>CAFE BAR MOKKA</strong> bietet …</p>" }, "capacity": { "de": "180" } }
          },
          "categories": [
            { "id": 1, "label": { "fr": "Musique", "de": "Musik" }, "tag_color": "#AFD3AA", "hidden": false, "level": 1 }
          ],
          "print_category": { "id": 1, "label": { "fr": "Musique", "de": "Musik" }, "tag_color": "#AFD3AA", "hidden": false, "level": 1 },
          "date_from": "2026-12-12T21:00:00+01:00",
          "date_to": "2026-12-12T23:00:00+01:00",
          "special_rate": null,
          "publication_status": "publish",
          "publication_date": null,
          "images": [
            {
              "legend": null,
              "labels": { "legend": { "fr": null, "de": null } },
              "url": "https://admin.bka.ch/img/6a0d6460b4ad7794802222.jpg",
              "url_webp": "https://admin.bka.ch/media/cache/resolve/webp/6a0d6460b4ad7794802222.jpg",
              "url_webp_size_512_q_65": "https://admin.bka.ch/media/cache/resolve/webp_size_512_q_65/6a0d6460b4ad7794802222.jpg",
              "url_webp_size_1024_q_65": "https://admin.bka.ch/media/cache/resolve/webp_size_1024_q_65/6a0d6460b4ad7794802222.jpg"
            }
          ],
          "videos": [],
          "rates": [
            {
              "id": 13238,
              "price": "45",
              "designation": null,
              "labels": { "designation": { "fr": null, "de": "Regulärer Eintritt" } }
            }
          ],
          "ticketings": [],
          "audience": { "id": 1, "label": { "fr": "Tout public", "de": "Für alle" } },
          "proposed_by": null,
          "next_date": "2026-12-12T21:00:00+01:00",
          "next_filtered_date": "2026-12-12T21:00:00+01:00",
          "sponsored_start_date": null,
          "sponsored_end_date": null,
          "place_proposed": null,
          "is_multi_day_event": false,
          "organization": {
            "id": 313,
            "slug": "organisationen-von-home-mokka-ch",
            "name": "Café Bar Mokka",
            "enabled": true,
            "sub_title": null,
            "categories": [
              { "id": 1,  "label": { "fr": "Musique", "de": "Musik" },   "tag_color": "#AFD3AA", "hidden": false, "level": 1 },
              { "id": 23, "label": { "fr": "Divers", "de": "Diverses" }, "tag_color": "#2BAC6C", "hidden": false, "level": 1 }
            ],
            "latitude": 46.759849,
            "longitude": 7.623815,
            "labels": { "subTitle": { "de": null }, "about": { "de": "<p>Café Bar Mokka</p>" } }
          },
          "show_in_print": true,
          "og_image": null,
          "labels": {
            "description":      { "fr": null, "de": "<p>ZUSATZSHOW:<br>FHG PVP…</p>" },
            "printDescription": { "fr": null, "de": "<p>FHG PVP treten auf der Zusatzshow …</p>" },
            "ticketingUrl":     { "fr": null, "de": "https://mokka.ch/event/fhg-pvp-2/" }
          },
          "recurrence": "none",
          "recurrence_week_days": null,
          "event_type": "mainevent",
          "mainevent_id": null,
          "mainevent_slug": null
        }
      ]
    }
  ],
  "total": 1
}
```

Price `"45"` comes from the stored cents value `4500` divided by 100 by `RateNormalizer`.

#### Errors

| Status | When | Body |
| --- | --- | --- |
| 401 | missing header | `Full authentication is required to access this resource.` (plain text, `Content-Type: application/json`) |
| 401 | bad/expired token | `The resource server rejected the request.` |
| 401 | token resolves to a non-`User` principal and the caller is not admin/broadcast | `UnauthorizedHttpException('Bearer Token')` from `EventSearchEngine.php:98` → FOSRest `{"code":401,"message":…}` — **UNVERIFIED** (needs a token) |

---

### 7.2 `GET /api/v1/events/count` — `api_events_count_only`

`src/Controller/ApiEventController.php:173-199`

**Auth:** bearer. **No `serializerGroups`.** **Status:** `200`.
**Excluded from the OpenAPI document** by the nelmio `path_patterns` regex.

Accepts exactly the same query parameters as §7.1 and returns only a counter:

```json
{ "code": 200, "message": "Success", "total": 7 }
```

**Same page-size quirk:** `count($events)` over the paginated page ⇒ bounded by `limit`
(default 50, max 2000). The Postman request for this endpoint explicitly passes `limit=400`, which
strongly suggests the caller knows about the bound.

---

### 7.3 `GET /api/v1/events/sponsored` — `api_events_get_sponsored`

`src/Controller/ApiEventController.php:201-244`

**Auth:** bearer. **Group:** `default`. **Status:** `200` (also set on the `#[Rest\View]`).
**No query parameters. No `view` voter check.**

```php
$sponsoredEvents = $eventRepository->getSponsoredEvents();
if ($this->useOptimizedEventLoad) {
    $sponsoredEvents = $this->eventDatesCalculator->completeEventsNextDates($sponsoredEvents);
}
return View::create(['code'=>200,'message'=>'Success','data'=>$sponsoredEvents], 200);
```

`EventRepository::getSponsoredEvents()` (`src/Repository/EventRepository.php:357-371`):

```sql
e.sponsoredStartDate <= :today
AND e.sponsoredEndDate   >= :today
AND e.publicationStatus  = 'publish'
AND e.dateTo             >= :today
```
then `EventListManipulator::sortEventsByStartDate()` (nulls last).

**Note:** `data` is a **flat array** of events, and there is **no `total` key** — unlike every other
list endpoint.

**BKA reality:** `ACTIVATE_SPONSORED_EVENTS=false`, and
`SELECT count(*) FROM event WHERE sponsored_start_date IS NOT NULL` → **0**. The endpoint therefore
always answers:

```json
{ "code": 200, "message": "Success", "data": [] }
```

---

### 7.4 `GET /api/v1/events/{slug}` — `api_events_get_by_slug`

`src/Controller/ApiEventController.php:246-300`

**Auth:** bearer + `isGranted('view', $event)`. **Group:** `reader`. **Status:** `200`.

The `{slug}` argument is resolved by `App\Resolver\SlugEntityValueResolver`
(`src/Resolver/SlugEntityValueResolver.php`), explicitly attached via
`#[ValueResolver(SlugEntityValueResolver::class)]`:

1. `findOneBy(['slug' => $identifier])`
2. if `ACTIVATE_SLUG_GENERATOR_WITH_ID` is on: `findOneBy(['oldSlug' => $identifier])`
3. if still nothing and the identifier matches `/-(\d+)$/`: `find((int)$matches[1])`
4. otherwise `throw new NotFoundHttpException("App\\Entity\\Event not found.")` → **404**

`ACTIVATE_SLUG_GENERATOR_WITH_ID` is **not set** in `docker-compose.yaml`, so for BKA only step 1
applies — `%env(bool:…)` on a missing var resolves to false. (The var is also absent from `.env`;
whether production sets it is **UNVERIFIED**.)

Then:

```php
if (!$this->isGranted('view', $event)) return $this->handleForbiddenResponse('Not authorized to view this event');
if ($this->useOptimizedEventLoad) $event->setNextDate($this->eventDatesCalculator->getNextEventDate($event));
return View::create(['code'=>200,'message'=>'Success','data'=>$event], 200);
```

`EventDatesCalculator::getNextEventDate()` (`src/Event/EventDatesCalculator.php:11-53`): if the event
has no `recurrenceWeekDays`, returns `dateFrom` when it is `>= now`, else `null`; with weekly
recurrence it walks day-by-day from `max(dateFrom, now)` to `dateTo` and returns the first day whose
ISO weekday number is in `recurrenceWeekDays`, at the event's start time.

#### `reader` payload — delta vs the `default` payload of §7.1

Added keys (and their nested objects grow):

| Key | Value for event 37005 |
| --- | --- |
| `opening_time` | `null` |
| `description` | `null` (legacy untranslated column, always empty in BKA) |
| `related_dates` | `[{"date":"2026-12-12 21:00:00.000000","timezone_type":3,"timezone":"Europe/Zurich"}]` |
| `ticketing_url` | `null` (BKA stores the URL in `labels.ticketingUrl` instead) |

Removed key: `next_filtered_date` (it is `default`-only).

`related_dates` is a raw JSON column holding **PHP-serialized `DateTime` objects**, so it is an array
of `{date, timezone_type, timezone}` objects — **not** ISO-8601 strings, contrary to the committed
OpenAPI document. Verified against the production row for event 37005. It is written by
`OnFlushEventListener::updateRelatedDates()` (`src/EventListener/OnFlushEventListener.php:68-78`):
for `recurrence = 'week'` the weekly recurrence dates, otherwise `[mainEvent.dateFrom, …subEvent.dateFrom]`.

`place` and `organization` expand to their `reader` form:

```json
"place": {
  "id": 313, "slug": "cafe-bar-mokka", "name": "CAFE BAR MOKKA",
  "enabled": true, "private": false,
  "address": "Allmendstrasse 14", "zip": "3600", "city": "Thun",
  "region": { "id": 13, "label": { "fr": "Thoune & Oberland bernois", "de": "Thun & Berner Oberland" }, "hidden": false },
  "about": null,
  "images": [],
  "website": "http://WWW.MOKKA.CH",
  "latitude": 46.759849, "longitude": 7.623815,
  "technical_sheets": [],
  "capacity": null,
  "wheelchair_accessible": true,
  "wheelchair_accessible_toilets": true,
  "wheelchair_accessible_parking": false,
  "pro_infirmis_id_source": null,
  "pro_infirmis_detail_url": null,
  "pro_infirmis_pictograms": [],
  "labels": { "about": { "de": "<p><strong>CAFE BAR MOKKA</strong> …</p>" }, "capacity": { "de": "180" } }
},
"organization": {
  "id": 313, "slug": "organisationen-von-home-mokka-ch", "name": "Café Bar Mokka",
  "enabled": true, "sub_title": null,
  "categories": [ { "id": 1, …, "level": 1 }, { "id": 23, …, "level": 1 } ],
  "address": "Allmendstrasse 14", "post_office_box": null, "zip": "3600", "city": "Thun",
  "region": { "id": 13, … },
  "latitude": 46.759849, "longitude": 7.623815,
  "about": null,
  "images": [],
  "website": null,
  "legal_status": null,
  "contacts": [],
  "users": [
    { "id": 309, "email": "home1@venue-example.org",      "enabled": true },
    { "id": 310, "email": "person09@example.org", "enabled": true },
    { "id": 311, "email": "person06@example.org",     "enabled": true },
    { "id": 417, "email": "kontakt2@venue-example.org",   "enabled": true }
  ],
  "places": [ { …Place in reader form… } ],
  "affiliations": [],
  "labels": { "subTitle": { "de": null }, "about": { "de": "<p>Café Bar Mokka</p>" } }
}
```

> **Data-leak note for the port:** the `reader` group exposes the **e-mail address of every user
> attached to the organization** to any API consumer that can fetch a single event, place or
> organization. This is real production behaviour (verified in `debug:serializer`:
> `Organization.users → ["reader","archive"]`, `User.email → ["reader","archive"]`).

`images` on a `reader` image additionally carry `id`, `file_name`, `position`:

```json
{
  "id": 28346, "legend": null, "file_name": "6a0d6460b4ad7794802222.jpg", "position": 0,
  "labels": { "legend": { "fr": null, "de": null } },
  "url": "https://admin.bka.ch/img/6a0d6460b4ad7794802222.jpg",
  "url_webp": "https://admin.bka.ch/media/cache/resolve/webp/6a0d6460b4ad7794802222.jpg",
  "url_webp_size_512_q_65": "…/webp_size_512_q_65/6a0d6460b4ad7794802222.jpg",
  "url_webp_size_1024_q_65": "…/webp_size_1024_q_65/6a0d6460b4ad7794802222.jpg"
}
```

And `videos` become real objects in `reader`: `{"id": N, "embed_link": "…"}` (2 025 video rows in
production; `ACTIVATE_EVENT_VIDEOS=true` for BKA).

#### Errors

| Status | Body |
| --- | --- |
| 403 | `{"code":403,"message":"Not authorized to view this event"}` |
| 404 | slug not found → FOSRest flatten-exception shape (§9.4) |
| 401 | §9.1 |

---

### 7.5 `POST /api/v1/events/` — `api_events_create_event`

`src/Controller/ApiEventController.php:302-408`

**Auth:** bearer + `#[IsGranted('ROLE_USER')]` + `isGranted('edit', $event)` after binding.
**Group:** `reader`. **Success status:** `201` (note: the *body* says `"code": 200` — see below).
**Content-Type:** must be `application/json` (or a form encoding).

```php
$event = new MainEvent();
$form  = $this->createForm(ApiEventType::class, $event, [
    'organization_choices' => $this->organizationMagazine->getCurrentUserOrganizations(),
    'from_api'             => true,
]);
try { $form->submit($request->request->all()); }      // NOTE: $clearMissing defaults to true
catch (\Exception $e) { … return 400 with a string `errors` … }

if ($form->isValid()) {
    if (!$this->isGranted('edit', $event)) return $this->handleForbiddenResponse();
    $event->setLabels($this->htmlSanitizer->sanitizeTranslatableFields($event->getLabels()));
    $eventRepository->add($event, true);
    return View::create(['code' => 200, 'message' => 'Success', 'data' => $event], 201);  // 201 header, 200 body
}
return View::create(['code' => 400, 'message' => 'Error', 'errors' => $form], 400);
```

**Quirk:** on success the HTTP status is `201 Created` but the `code` field inside the body is
`200` (line 393 vs line 398). Any stub must reproduce this mismatch.

Only `MainEvent` can be created — there is no v1 route to create a bare `SubEvent`; sub-events are
created through the `subEvents` collection of the parent.

The event's `user` is **never** set by the controller, so `EventVoter::canPublishEvent()` falls back
to organization membership (or `ROLE_ADMIN`).

#### Side effects on persist

`OnFlushEventListener` (`src/EventListener/OnFlushEventListener.php:23-152`) runs on every insert and
update of an `Event`:

1. `related_dates` recomputed (weekly recurrence dates, or `[main.dateFrom, …subs.dateFrom]`).
2. `is_multi_day_event` recomputed from `MainEvent::isMultiDayEvent()` (true when there are
   sub-events, or when `dateTo` falls on a later day than `dateFrom` — except the "ends after
   midnight" case).
3. Every `SubEvent` is force-synced from its `MainEvent`: `name`, `eventStatus`, `place`,
   `organization`, `description`, `specialRate`, `publicationStatus`, `audience`, `labels`,
   `relatedDates`, `isMultiDayEvent`, `user`, `showInPrint`, `printCategory`, `categories`.
4. **All** `EventOccurrence` rows of the event are deleted and regenerated — one per event for
   `recurrence = none`, one per recurrence date otherwise.

`Event::archiveRelationNames()` (`#[ORM\PrePersist]`, `Event.php:265-276`) snapshots
`archived_organization` / `archived_place`; `refreshArchivedRelationNames()` (`#[ORM\PreUpdate]`)
refreshes them for non-past events.

The slug is generated by `#[Gedmo\Slug(fields: ['name'])]` (`Event.php:92-95`), unique, nullable.

#### HTML sanitisation

`HtmlSanitizerService::sanitizeTranslatableFields()` (`src/Service/HtmlSanitizerService.php:13-24`)
runs Symfony's `HtmlSanitizerInterface` over every string leaf of `labels`. No `framework.html_sanitizer`
block exists in `config/`, so the **default** sanitizer config applies (W3C Sanitizer API default
allow-list). Note: it sanitises only `labels`, not `name`.

#### Request body

See §8 for the full `ApiEventType` field table. Minimal body (from the Postman collection):

```json
{
  "name": "TEST Event Min",
  "eventStatus": "confirmed",
  "place": "65",
  "organization": "57",
  "categories": ["1"],
  "dateFrom": "2023-12-12T14:00:00",
  "dateTo": "2023-12-12T20:00:00",
  "recurrence": "none",
  "description": { "fr": "Test description fr", "de": "Test description de" },
  "audience": "1",
  "publicationStatus": "draft"
}
```

#### Responses

| Status | Body |
| --- | --- |
| 201 | `{"code":200,"message":"Success","data":{…Event in `reader` group…}}` |
| 400 (exception while submitting) | `{"code":400,"message":"Error","errors":"Error while submitting the data for event creation. Make sure you have a correct structure. A notification was sent to the platform's admins."}` — note `errors` is a **string** here, an **object** on validation failure |
| 400 (validation) | see §9.3 |
| 403 | `{"code":403,"message":"You are not authorized to manage events for this place"}` |
| 401 | §9.1 |
| 415 | unsupported `Content-Type` (§9.5) |

Submit exceptions are logged with the full payload
(`$this->logger->error($e->getMessage(), ['Exception Trace' => …, 'Data sent' => $request->request->all()])`).

---

### 7.6 `PUT /api/v1/events/{id}` — `api_events_modify_event`

`src/Controller/ApiEventController.php:410-516`. Path requirement `id ⇒ \d+`.

**Auth:** bearer + `#[IsGranted('ROLE_USER')]` + `isGranted('edit', $event)` **before** binding.
**Group:** `reader`. **Success status:** `200` (body `code` is also `200` here).

`$event` is resolved by Symfony's standard Doctrine `EntityValueResolver` on the `{id}` route
parameter (no custom resolver) — a missing id yields **404**.

```php
$form->submit($request->request->all(), true);   // $clearMissing = true (explicit)
```

`clearMissing = true` means **a PUT is a full replacement**: any field absent from the body is reset
to its empty value. Because almost every field carries `NotBlank`/`NotNull`, a partial PUT fails
validation rather than silently wiping data — but optional fields (`openingTime`, `printCategory`,
`specialRate`, `ticketingUrl`, `publicationDate`, `recurrenceWeekDays`, `images`, `rates`,
`subEvents`, `printDescription`) **are** cleared when omitted. There is no `PATCH` route in v1.

Notably `$event` here may be a `MainEvent` **or** a `SubEvent` (the form's `data_class` is
`MainEvent`, so binding a `SubEvent` would fail — **UNVERIFIED**, would need a token to confirm the
exact error).

After a successful save the controller additionally sets `nextDate`
(`$event->setNextDate($this->eventDatesCalculator->getNextEventDate($event))`) — unconditionally,
unlike the GET-by-slug path which guards on `useOptimizedEventLoad`.

| Status | Body |
| --- | --- |
| 200 | `{"code":200,"message":"Success","data":{…Event `reader`…}}` |
| 400 (exception) | `{"code":400,"message":"Error","errors":"Error while submiting the data for event modification. …"}` — note the typo **“submiting”**, different from the POST message |
| 400 (validation) | §9.3 |
| 403 | `{"code":403,"message":"You are not authorized to manage events for this place"}` |
| 404 | unknown id |

---

### 7.7 `DELETE /api/v1/events/{id}` — `api_events_delete_event`

`src/Controller/ApiEventController.php:518-567`. Path requirement `id ⇒ \d+`.

**Auth:** bearer + `#[IsGranted('ROLE_USER')]` + `isGranted('edit', $event)`.
**No serializer groups.** **Status:** `200`.

```php
if (!$this->isGranted('edit', $event)) return $this->handleForbiddenResponse();
$eventRepository->remove($event, true);
return View::create(['code' => 200, 'message' => 'Success'], 200);
```

Success body:

```json
{ "code": 200, "message": "Success" }
```

Cascades from the FK definitions (`\d event`): `event_category`, `video`, `ticketing`, `image`,
`rate`, `event_occurrence`, `place_proposed` are `ON DELETE CASCADE`; `event.mainevent_id` is
`ON DELETE RESTRICT`, so deleting a `MainEvent` that still has sub-events would fail at the DB level
unless Doctrine's `orphanRemoval: true` on `MainEvent::$subEvents` removes them first
(`MainEvent.php:53`). **UNVERIFIED** against a live call.

---

### 7.8 `GET /api/v1/events/similar/{slug}` — `api_events_get_similar`

`src/Controller/ApiEventController.php:569-628`

**Auth:** bearer. **Group:** `default`. **Status:** `200`. **No voter check.**

The `{slug}` is resolved by the **default** Doctrine resolver, i.e. by mapping the route parameter to
an `Event` field named `slug` — *not* by `SlugEntityValueResolver` (no `#[ValueResolver]` here), so
`oldSlug` / `-{id}` fallbacks do **not** apply on this route.

> This works because `doctrine.orm.controller_resolver.auto_mapping` is left unset in
> `config/packages/doctrine.yaml`, and DoctrineBundle resolves `null` to `true`
> (`vendor/doctrine/doctrine-bundle/src/DependencyInjection/DoctrineExtension.php:922-928`, with a
> deprecation notice). If that default ever flips to `false`, these three routes break. The same
> mechanism resolves `{id}` on `PUT`/`DELETE` and `{slug}` on `/events/organization/{slug}` and
> `/events/place/{slug}`.

| Query param | Type | Default |
| --- | --- | --- |
| `max_result` | int | `10` (`!empty($maxResult) ? $maxResult : 10`) |

`EventRepository::getSimilarEvents()` (`src/Repository/EventRepository.php:273-307`):

```sql
e.id != :id
AND e.publicationStatus = 'publish'
AND e.dateTo >= :today
AND categories IN (:categories)       -- the source event's category ids, LEFT JOINed
ORDER BY e.dateFrom ASC
LIMIT :maxResult
```
then re-sorted by `nextDate` via `EventListManipulator::sortEventsByStartDate()`.
There is **no `publicationDate` guard** here (unlike the list endpoint), so scheduled-future events
can leak into "similar".

Response:

```json
{ "code": 200, "message": "Success", "data": [ {…Event `default`…} ], "total": 10 }
```

---

### 7.9 `GET /api/v1/events/organization/{slug}` and `GET /api/v1/events/place/{slug}`

`src/Controller/ApiEventController.php:630-689` and `691-750`

**Auth:** bearer. **Group:** `default`. **Status:** `200`. **No voter check.**
Resolution of `{slug}` is again the **default** Doctrine resolver, on `Organization.slug` /
`Place.slug`.

| Query param | Type | Default |
| --- | --- | --- |
| `max_result` | int | `10` |

`getOrganizationEvents()` (`EventRepository.php:309-335`):

```sql
(p.organization = :organization OR e.organization = :organization)
AND e.publicationStatus = 'publish'
AND e.dateTo >= :today
ORDER BY e.dateFrom ASC
```
`setMaxResults` is **commented out**; the full result set is loaded, sorted by `nextDate` in PHP and
then `array_slice(…, 0, $maxResult)`.

`getPlaceEvents()` (`EventRepository.php:337-355`) is identical but with `e.place = :place`.

Both respond:

```json
{ "code": 200, "message": "Success", "data": [ … ], "total": <= max_result }
```

---

### 7.10 `GET /api/v1/organizations/` — `api_organizations_get_all`

`src/Controller/ApiOrganizationController.php:20-79`

**Auth:** bearer, then `isGranted('view', $organization)` per row — **rows that fail are `unset()`,
leaving a sparse PHP array**, which `json_encode` renders as a **JSON object keyed by the original
index**, not an array:

```php
foreach ($organizations as $key => $organization) {
    if (!$this->isGranted('view', $organization)) unset($organizations[$key]);
}
```

For an admin token nothing is removed and `data` is a normal array. For a non-admin token with
partial visibility, `data` becomes e.g. `{"0": {...}, "3": {...}}`. **UNVERIFIED** live (needs a
non-admin token) but it is a direct consequence of `unset()` without `array_values()`. The same
pattern exists on the legacy `getEvents` branch (`ApiEventController.php:146-150`), which *is*
followed by `groupEventsByMonth` and so is unaffected.

**Group:** `default`. **Status:** `200`.

`OrganizationRepository::engineSearch()` (`src/Repository/OrganizationRepository.php:55-103`):

| Query param | Type | Effect |
| --- | --- | --- |
| `keyword` | string | `ILIKE %kw%` over `o.name` **and** `JSON_KEY_VALUES_TEXT(o.labels,'name')` |
| `category` | int[] | inner join `o.categories`, `c.id IN (:ids)` (undocumented) |
| `limit` | int | `setMaxResults` |
| `geoNorthEast[lat|lng]` + `geoSouthWest[lat|lng]` | float | bounding box on `o.latitude/longitude` (undocumented) |

Always applied: `o.enabled = true`, `ORDER BY o.name ASC`.

```json
{
  "code": 200, "message": "Success",
  "data": [ { "id": 313, "slug": "organisationen-von-home-mokka-ch", "name": "Café Bar Mokka",
              "enabled": true, "sub_title": null, "categories": [ … ],
              "latitude": 46.759849, "longitude": 7.623815,
              "labels": { "subTitle": { "de": null }, "about": { "de": "<p>Café Bar Mokka</p>" } } } ],
  "total": 741
}
```

741 organizations exist in the BKA dump (`SELECT count(*) FROM organization`).

---

### 7.11 `GET /api/v1/organizations/{slug}` — `api_organizations_get_by_slug`

`src/Controller/ApiOrganizationController.php:81-131`

**Auth:** bearer + `isGranted('view', $organization)`. **Group:** `reader`. **Status:** `200`.
Slug resolution uses `#[ValueResolver(SlugEntityValueResolver::class)]` (slug → oldSlug → `-{id}`).

```json
{ "code": 200, "message": "Success", "data": { …Organization in `reader` form, see §7.4… } }
```

403: `{"code":403,"message":"Not authorized to view this organization"}`.
404 when the slug does not resolve.

---

### 7.12 `GET /api/v1/places/` — `api_places_get_all`

`src/Controller/ApiPlaceController.php:20-79`

**Auth:** bearer only. **No voter check, no `enabled` filter, no `private` filter.**
**Group:** `default`. **Status:** `200`.

`PlaceRepository::engineSearch()` (`src/Repository/PlaceRepository.php:47-85`) — note the
commented-out active filter on line 50:

| Query param | Type | Effect |
| --- | --- | --- |
| `keyword` | string | `ILIKE %kw%` over `p.name`, `p.city`, `JSON_KEY_VALUES_TEXT(p.labels,'name')` |
| `place` | int or int[] | `p.id = :placeN` OR-ed |
| `limit` | int | `setMaxResults` |

No `ORDER BY`. 1 276 places in the dump.

```json
{
  "code": 200, "message": "Success",
  "data": [ { "id": 313, "slug": "cafe-bar-mokka", "name": "CAFE BAR MOKKA", "enabled": true,
              "address": "Allmendstrasse 14", "zip": "3600", "city": "Thun",
              "region": { "id": 13, "label": {…}, "hidden": false },
              "latitude": 46.759849, "longitude": 7.623815,
              "labels": { "about": {…}, "capacity": { "de": "180" } } } ],
  "total": 1276
}
```

---

### 7.13 `GET /api/v1/places/{slug}` — `api_places_get_by_slug`

`src/Controller/ApiPlaceController.php:81-127`

**Auth:** bearer only. **No voter check at all** — the `403` branch documented in
`public/openapi.yaml` is never produced by this controller.
**Group:** `reader`. **Status:** `200`. Slug resolution via `SlugEntityValueResolver`.

```json
{ "code": 200, "message": "Success", "data": { …Place in `reader` form, see §7.4… } }
```

ProInfirmis fields live here: `pro_infirmis_id_source`, `pro_infirmis_detail_url`,
`pro_infirmis_pictograms` (array of
`{Id, Name, NameFr, NameIt, NameEn, LinkToPictogram, LinkToPictogramSvg, PictogramFileName}`,
documented at `src/Entity/Place.php:110-125`). In the BKA dump only **1** place has a
non-empty `pro_infirmis_pictograms` and **1** has a `pro_infirmis_id_source`, consistent with
`ACTIVATE_PROINFIRMIS=false` locally. (Whether production BKA enables it is **UNVERIFIED**; the
serialized fields exist in the contract either way, since the groups are unconditional.)

---

### 7.14 `GET /api/v1/categories/` — `api_categories_get_all`

`src/Controller/ApiCategoryController.php:17-58`

**Auth:** bearer. **Group:** `filters` (the only endpoint that uses it). **Status:** `200`.
No query parameters.

`CategoryRepository::findAllNotHidden(true)` (`src/Repository/CategoryRepository.php:42-78`):

```sql
WHERE c.hidden IS NULL OR c.hidden = false
```
then `getSortedCategories()` flattens into: each **root** category followed by its **non-hidden**
children. (`$visibleCategories` on line 62 is computed and never used — dead code.)

For the BKA data set (30 categories, 5 hidden: 2, 4, 6, 7, 13; 22 have a parent) the emitted order is

```
1, 3, 24, 25, 26, 27,  5,  8, 9, 10, 11, 12, 28, 29, 30,  14, 15, 16, 17, 18, 19, 20, 21, 22, 23
```
= **25 items**, `total: 25`.

**Two behaviours a stub must copy:**

1. Child categories appear **twice** — once nested inside the parent's `children` array and once as
   a flat top-level entry.
2. The nested `children` array is the raw Doctrine association and therefore **includes hidden
   children** (category 1's `children` contains the hidden ids 2 and 4; category 5's contains the
   hidden 6 and 7, even though 5 itself has no visible children).

`level` from `CategoryNormalizer`: `1` when `count(children) > 0` (hidden children count!), `2` when
no children and a parent exists, `1` otherwise. So category 5 reports `level: 1` while having an
empty visible subtree.

```json
{
  "code": 200,
  "message": "Success",
  "data": [
    {
      "id": 1, "label": { "fr": "Musique", "de": "Musik" }, "tag_color": "#AFD3AA", "hidden": false,
      "children": [
        { "id": 2,  "label": { "fr": "Concert", "de": "Konzert" },            "tag_color": "#AB9200", "hidden": true,  "children": [], "level": 2 },
        { "id": 3,  "label": { "fr": "Clubbing", "de": "Clubbing" },          "tag_color": "#E53429", "hidden": false, "children": [], "level": 2 },
        { "id": 4,  "label": { "fr": "Diffusion sonore", "de": "Tonübertragung" }, "tag_color": "#1961AC", "hidden": true, "children": [], "level": 2 },
        { "id": 24, "label": { "fr": "Classique", "de": "Klassik" },          "tag_color": "#2BAC6C", "hidden": false, "children": [], "level": 2 },
        { "id": 25, "label": { "fr": "Jazz", "de": "Jazz/Blues" },            "tag_color": "#F29EB7", "hidden": false, "children": [], "level": 2 },
        { "id": 26, "label": { "fr": "Pop/Rock", "de": "Pop/Rock" },          "tag_color": "#2A4033", "hidden": false, "children": [], "level": 2 },
        { "id": 27, "label": { "fr": "Expérimental", "de": "Experimental" },  "tag_color": "#A9C5E8", "hidden": false, "children": [], "level": 2 }
      ],
      "level": 1
    },
    { "id": 3, "label": { "fr": "Clubbing", "de": "Clubbing" }, "tag_color": "#E53429", "hidden": false, "children": [], "level": 2 },
    "… 23 more …"
  ],
  "total": 25
}
```

Full BKA category table (from the live DB):

| id | parent | hidden | tag_color | fr | de |
| --: | --: | :-: | --- | --- | --- |
| 1 | — | f | `#AFD3AA` | Musique | Musik |
| 2 | 1 | **t** | `#AB9200` | Concert | Konzert |
| 3 | 1 | f | `#E53429` | Clubbing | Clubbing |
| 4 | 1 | **t** | `#1961AC` | Diffusion sonore | Tonübertragung |
| 5 | — | f | `#AB9200` | Art | Kunst |
| 6 | 5 | **t** | `#E53429` | Arts visuels | Visuelle Künste |
| 7 | 5 | **t** | `#1961AC` | Design | Design |
| 8 | — | f | `#E53429` | Scène | Bühne |
| 9 | 8 | f | `#1961AC` | Théâtre | Theater |
| 10 | 8 | f | `#2BAC6C` | Danse | Tanz |
| 11 | 8 | f | `#F29EB7` | Opéra | Oper |
| 12 | 8 | f | `#2A4033` | Performance | Performance |
| 13 | 8 | **t** | `#A9C5E8` | Cirque | Zirkus |
| 14 | — | f | `#1961AC` | Film | Film |
| 15 | — | f | `#2BAC6C` | Littérature | Literatur |
| 16 | — | f | `#F29EB7` | Patrimoine | Ausstellungen & Kulturerbe |
| 17 | — | f | `#2A4033` | Réunion & médiation | Begegnungen |
| 18 | 17 | f | `#A9C5E8` | En conversation | Im Gespräch |
| 19 | 17 | f | `#AFD3AA` | Conférence | Konferenz |
| 20 | 17 | f | `#AB9200` | Atelier | Workshop |
| 21 | 17 | f | `#E53429` | Convention | Konvention |
| 22 | 17 | f | `#1961AC` | Visite guidée | Führung |
| 23 | — | f | `#2BAC6C` | Divers | Diverses |
| 24 | 1 | f | `#2BAC6C` | Classique | Klassik |
| 25 | 1 | f | `#F29EB7` | Jazz | Jazz/Blues |
| 26 | 1 | f | `#2A4033` | Pop/Rock | Pop/Rock |
| 27 | 1 | f | `#A9C5E8` | Expérimental | Experimental |
| 28 | 8 | f | `#AFD3AA` | Petit théâtre | Kleintheater |
| 29 | 8 | f | `#AB9200` | Poésie parlée | Spoken Word |
| 30 | 8 | f | `#F29EB7` | Art du spectacle | Artistik |

---

### 7.15 `GET /api/v1/regions/` — `api_regions_get_all`

`src/Controller/ApiRegionController.php:17-56`

**Auth:** bearer. **Group:** `default`. **Status:** `200`. No query parameters.
`RegionRepository::findAll()` — **hidden regions are included** (unlike categories), with the
`hidden` flag exposed so the client can filter.

```json
{
  "code": 200, "message": "Success",
  "data": [
    { "id": 1,  "label": { "fr": "Broye", "de": "Broye" }, "hidden": true },
    { "id": 2,  "label": { "fr": "Gruyère", "de": "Greyerz" }, "hidden": true },
    { "id": 3,  "label": { "fr": "Glâne", "de": "Glane" }, "hidden": true },
    { "id": 4,  "label": { "fr": "Lac", "de": "See" }, "hidden": true },
    { "id": 5,  "label": { "fr": "Sarine", "de": "Saane" }, "hidden": true },
    { "id": 7,  "label": { "fr": "Singine", "de": "Sense" }, "hidden": true },
    { "id": 8,  "label": { "fr": "Veveyse", "de": "Vivisbach" }, "hidden": true },
    { "id": 9,  "label": { "fr": "Broye-Vully (Vaud)", "de": "Broye-Vully (Waadt)" }, "hidden": true },
    { "id": 10, "label": { "fr": "Ville de Berne", "de": "Stadt Bern" }, "hidden": false },
    { "id": 11, "label": { "fr": "Région de Berne", "de": "Region Bern" }, "hidden": false },
    { "id": 13, "label": { "fr": "Thoune & Oberland bernois", "de": "Thun & Berner Oberland" }, "hidden": false },
    { "id": 14, "label": { "fr": "Bienne & Seeland", "de": "Biel & Seeland" }, "hidden": false },
    { "id": 15, "label": { "fr": "Reste du canton", "de": "Restlicher Kanton" }, "hidden": false }
  ],
  "total": 13
}
```

(Id `6` and `12` do not exist in the BKA dump. The 8 hidden regions are the Fribourg districts
inherited from In Situ; BKA uses the 5 Bern regions.)

---

### 7.16 `GET /api/v1/audiences/` — `api_audiences_get_all`

`src/Controller/ApiAudienceController.php:17-56`. **Group:** `default`. `findAll()`. No parameters.

```json
{
  "code": 200, "message": "Success",
  "data": [
    { "id": 1, "label": { "fr": "Tout public", "de": "Für alle" } },
    { "id": 2, "label": { "fr": "Adultes seulement", "de": "Nur für Erwachsene" } },
    { "id": 3, "label": { "fr": "Enfants et adolescents", "de": "Für Kinder und Jugendliche" } },
    { "id": 4, "label": { "fr": "Pour les seniors", "de": "Für Senior:innen" } }
  ],
  "total": 4
}
```

(The local variable is misleadingly named `$regions` — `ApiAudienceController.php:46`.)

---

### 7.17 `GET /api/v1/affiliations/` — `api_affiliations_get_all`

`src/Controller/ApiAffiliationController.php:17-56`. **Group:** `default`. `findAll()`. No parameters.

```json
{
  "code": 200, "message": "Success",
  "data": [
    { "id": 1, "label": { "fr": "AG culturel", "de": "Kultur-GA" } },
    { "id": 2, "label": { "fr": "Kulturlegi", "de": "Kulturlegi" } },
    { "id": 3, "label": { "fr": "AHV/IV", "de": "AHV/IV" } },
    { "id": 4, "label": { "fr": "Etudiant/e", "de": "Student:innen" } },
    { "id": 5, "label": { "fr": "Enfants", "de": "Kinder" } },
    { "id": 6, "label": { "fr": "Membres", "de": "Mitglieder" } },
    { "id": 7, "label": { "fr": "Réduit", "de": "Ermässigt" } }
  ],
  "total": 7
}
```

Note: `organization_affiliation` is **empty** in the BKA dump (0 rows), so the `affiliation` query
filter on `/events/` would match nothing, and every organization's `affiliations` array is `[]`.

---

## 8. The write side — `src/Form/ApiForm/*`

All four form types set `'csrf_protection' => false`.

### 8.1 `ApiEventType` (`src/Form/ApiForm/ApiEventType.php`)

`data_class: MainEvent`. Options: `organization_choices` (default `[]`, filled by the controller with
`OrganizationMagazine::getCurrentUserOrganizations()` — all organizations for `ROLE_ADMIN`, otherwise
the user's own), `from_api` (default `false`, set to `true` by both controllers — it switches
`ApiRateType` into cents conversion).

| Body field | Form type | Required | Constraints / notes |
| --- | --- | :-: | --- |
| `name` | inferred (`TextType`) | ✔ | `NotBlank`. Entity column `varchar(255)`. |
| `eventStatus` | `ChoiceType` | ✔ | `NotBlank`; choices `confirmed`, `canceled`, `postponed`, `full` (`Event::getEventStatusList()`) |
| `place` | `EntityType<Place>` | ✔ | `NotNull`; **unconstrained choice list** — any existing place id is accepted (`choice_label: name`) |
| `organization` | `EntityType<Organization>` | ✔ | `NotNull`; choices restricted to `organization_choices` |
| `showInPrint` | `CheckboxType` | ✔ (checkbox, so effectively optional-false) | no constraints; BKA only (`HAS_PRINT_OPTIONS=true`) |
| `categories` | `EntityType<Category>`, `multiple: true` | — | array of category ids; `choice_label` = `getLabel()['fr']` |
| `printCategory` | `EntityType<Category>` | ✘ (`required: false`) | single category id |
| `dateFrom` | `DateTimeType`, `widget: single_text`, `html5: false` | ✔ | `NotBlank`. `html5: false` ⇒ parsed with the **IntlDateFormatter / `Y-m-d H:i:s`** fallback, not strict ISO; the Postman payloads use `2023-12-12T14:00:00` |
| `dateTo` | `DateTimeType`, `single_text`, `html5: false` | ✔ | `NotBlank` |
| `openingTime` | inferred (`TextType`) | ✘ | entity column `varchar(5)`, e.g. `"20:00"` |
| `recurrence` | `ChoiceType` | ✔ | `NotBlank`; choices `none`, `week` (`Event::getRecurrenceList()`) |
| `recurrenceWeekDays` | `ChoiceType`, `multiple: true` | ✘ | choices `1..7` (`MainEvent::getWeekDays()`, ISO weekday numbers) |
| `subEvents` | `CollectionType<ApiSubEventType>` | ✘ | `allow_add`, `allow_delete`, `by_reference: false` |
| `description` | `MultilangCollectionType` → `labels[description]` | ✔ | `MultiLangCollectionNotEmpty` on the collection; each language is a `TextareaType` with `Length(max: 6400, normalizer: EventType::maxLenghtNormalizer)` |
| `printDescription` | `MultilangCollectionType` → `labels[printDescription]` | — | each language `Length(max: 256, normalizer: …)`; **no** `MultiLangCollectionNotEmpty` |
| `images` | `CollectionType<ApiImageType>` | ✘ | `allow_add`, `allow_delete`, `by_reference: false` |
| `rates` | `CollectionType<ApiRateType>` | ✘ | `entry_options: {convert_to_cents: true}` (because `from_api` is true) |
| `specialRate` | `ChoiceType` | ✘ | choices `free_entry`, `free_price` |
| `ticketingUrl` | inferred (`TextType`) | ✘ | entity column `varchar(2048)`; **BKA stores the URL in `labels.ticketingUrl` instead**, so this field is empty on all 34 279 production rows |
| `audience` | `EntityType<Audience>` | ✔ | `NotNull`; ids 1–4 |
| `publicationStatus` | `ChoiceType` | ✔ | `NotBlank`; choices `publish`, `draft`, `to_validate` |
| `publicationDate` | `DateType`, `single_text`, `html5: false` | ✘ | date only, e.g. `"2023-09-10"` |

Fields **not** settable through v1: `videos`, `ticketings`, `proposedBy`, `placeProposed`,
`sponsoredStartDate`/`EndDate`, `ogImage`, `slug`, `user`, `relatedDates`, `isMultiDayEvent`,
`name` translations (`labels.name`).

`MultilangCollectionType` (`src/Form/Type/MultilangCollectionType.php`) builds one child per language
from the `LOCALES` env var — for BKA `['fr','de']` — mapped by `ArrayToLanguagesMapper`, which always
writes **both** keys (missing languages become `null`/`''`). So:

```json
"description": { "fr": "…", "de": "…" }
```
and a body with only `de` still stores `{"fr": null, "de": "…"}`.
`MultiLangCollectionNotEmpty` (`src/Validator/MultiLangCollectionNotEmptyValidator.php`) passes as
soon as **one** language is non-empty; violation message key `multilang_collection.not_empty`.

> The committed `public/openapi.yaml` lists `_token` as a *required* property of
> `MultilangCollectionType`. That is a nelmio artifact from inspecting the type standalone (CSRF on by
> default); the API forms disable CSRF, so **no `_token` is expected or accepted**.

### 8.2 `ApiSubEventType` (`src/Form/ApiForm/ApiSubEventType.php`)

`data_class: SubEvent`.

| Body field | property_path | Type | Required | Constraints |
| --- | --- | --- | :-: | --- |
| `date_from` | `dateFrom` | `DateTimeType` `single_text` `html5:false` | ✔ | `NotBlank` |
| `date_to` | `dateTo` | `DateTimeType` `single_text` `html5:false` | ✔ | `NotBlank` |
| `openingTime` | `openingTime` | inferred | ✘ | — |

Note the **snake_case** keys here (`date_from`/`date_to`) versus camelCase everywhere else in the
same body. A `POST_SUBMIT` listener adds a French error on `date_from` when `dateTo < dateFrom`:
`"La date de fin ne peut pas être plus petite que la date de début"`.

### 8.3 `ApiImageType` (`src/Form/ApiForm/ApiImageType.php`)

`data_class: Image`.

| Body field | Mapped | Required | Constraints |
| --- | :-: | :-: | --- |
| `fileExtension` | **unmapped** | ✔ | `ChoiceType` with choices `.jpg`, `.jpeg`, `.png` |
| `base64File` | **unmapped** | ✔ | `TextType` + `NotBlank`; raw base64 (no data-URI prefix) |
| `legend` | → `labels[legend]` | ✘ | `MultilangCollectionType`, entries not required |

On `FormEvents::SUBMIT` the base64 payload is written to
`{projectDir}/var/tmp/{uniqid('image_')}{extension}` and handed to VichUploader as a
`ReplacingFile` (`ApiImageType.php:56-67`). **No size limit, no MIME sniffing, no image validation** —
whatever decodes is written. `Image::$position` is not settable from v1.

### 8.4 `ApiRateType` (`src/Form/ApiForm/ApiRateType.php`)

`data_class: Rate`. Option `convert_to_cents` (default `false`, set to `true` from the API).

| Body field | property_path | Required | Constraints |
| --- | --- | :-: | --- |
| `price` | `price` | ✔ | `NotBlank`; sent as a **decimal string in CHF**, e.g. `"2.50"` |
| `designation` | `labels[designation]` | ✔ | `MultilangCollectionType`, entries `required: true` + `Length(max: 24)`, collection `MultiLangCollectionNotEmpty` |

With `convert_to_cents`, a `SUBMIT` listener does `price = floatval($price) * 100`, so `"2.50"` is
stored as `250`. On the way out, `RateNormalizer` divides by 100 again (`"2.5"`).
**Asymmetry:** input `designation` is multilang (`{fr, de}`), output `designation` is the deprecated
scalar column (always `null` in BKA) plus `labels.designation`.

### 8.5 Not used by v1

`src/Formatter/UrlFormatter.php` (`setHttpUrl()` / `getUrlWithoutProtocol()`) is injected into
`PlaceType`, `OrganizationType` and `EventType` (admin UI). Only `PlaceType:336` and
`OrganizationType:303` call it (`$entity->setWebsite($this->urlFormatter->setHttpUrl($url))`);
`EventType` injects it and never calls it. **No `ApiForm` and no `Api*Controller` references it** —
grep over `src/` confirms. API-supplied URLs are therefore stored verbatim, without protocol
normalisation.

---

## 9. Error shapes

### 9.1 401 — unauthenticated (captured live)

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
Allow: GET
Content-Type: application/json
Cache-Control: no-cache, private
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Robots-Tag: noindex

Full authentication is required to access this resource.
```

With an invalid bearer token:

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
Vary: Authorization,Accept-Encoding
Content-Type: application/json

The resource server rejected the request.
```

**The body is bare text, not JSON**, despite `Content-Type: application/json`. It comes from
`OAuth2Authenticator::start()`
(`vendor/league/oauth2-server-bundle/src/Security/Authenticator/OAuth2Authenticator.php:62-65`):
`new Response($authException?->getMessage() ?? 'Authentication required', 401, ['WWW-Authenticate' => 'Bearer'])`.
A client that blindly `JSON.parse`s the body will throw. **A compatibility stub must reproduce this
or risk breaking error handling in the existing integrations.**

### 9.2 403 — controller-generated

```json
{ "code": 403, "message": "You are not authorized to manage events for this place" }
```
```json
{ "code": 403, "message": "Not authorized to view this event" }
```
```json
{ "code": 403, "message": "Not authorized to view this organization" }
```

HTTP status `403`. Produced by `AbstractApiController::handleForbiddenResponse()`.

A `403` raised by `#[IsGranted('ROLE_USER')]` instead goes through the FOSRest flatten-exception path
(§9.4) and looks like `{"code":403,"message":"Forbidden"}` in production (debug off) — **UNVERIFIED**
live.

### 9.3 400 — form validation errors

The controller puts the `Form` object itself into `errors`:

```php
return View::create(['code' => 400, 'message' => 'Error', 'errors' => $form], 400);
```

FOSRest's `FormErrorNormalizer`
(`vendor/friendsofsymfony/rest-bundle/Serializer/Normalizer/FormErrorNormalizer.php:29-70`) handles
any submitted-and-invalid `FormInterface`, producing its **own** `{code, message, errors}` envelope —
so the result is **double-nested**, and the inner `code` is the view's status code (the serialization
context carries `status_code`, set by `ViewHandler.php:246-248`):

```json
{
  "code": 400,
  "message": "Error",
  "errors": {
    "code": 400,
    "message": "Validation Failed",
    "errors": {
      "children": {
        "name":              { "errors": ["This value should not be blank."] },
        "eventStatus":       [],
        "place":             { "errors": ["This value should not be null."] },
        "organization":      [],
        "showInPrint":       [],
        "categories":        [],
        "printCategory":     [],
        "dateFrom":          [],
        "dateTo":            [],
        "openingTime":       [],
        "recurrence":        [],
        "recurrenceWeekDays":[],
        "subEvents":         [],
        "description":       { "children": { "fr": [], "de": [] } },
        "printDescription":  { "children": { "fr": [], "de": [] } },
        "images":            [],
        "rates":             [],
        "specialRate":       [],
        "ticketingUrl":      [],
        "audience":          [],
        "publicationStatus": [],
        "publicationDate":   []
      }
    }
  }
}
```

**Quirk:** `convertFormToArray()` returns an **empty PHP array** for a child with no errors and no
children, which `json_encode` renders as `[]`, not `{}`. So valid leaf fields appear as empty
*arrays* inside an object. Error messages are the translated constraint messages in the request
locale.

Exception during `$form->submit()` returns a different shape where `errors` is a **plain string**:

```json
{ "code": 400, "message": "Error",
  "errors": "Error while submitting the data for event creation. Make sure you have a correct structure. A notification was sent to the platform's admins." }
```
(`"Error while submiting the data for event modification. …"` — with the typo — for PUT.)

`src/Form/FormErrorSerializer.php` (the `{global: [...], fields: {dom_id: [...]}}` shape covered by
`tests/Form/FormErrorSerializerTest.php`) is used by `AjaxFormTrait` for the **admin UI**, *not* by
the v1 API.

### 9.4 404 / other HTTP exceptions (captured live)

```
$ curl -i http://localhost:8080/api/v1/nonexistent-thing
HTTP/1.1 404 Not Found
Content-Type: application/json
Vary: Accept,Accept-Encoding

{"code":404,"message":"No route found for \"GET http:\/\/localhost:8080\/api\/v1\/nonexistent-thing\""}
```

Produced by `FOS\RestBundle\Serializer\Normalizer\FlattenExceptionNormalizer`:

```php
return ['code' => $statusCode, 'message' => $message];
```

`$message` is the **real exception message only when `kernel.debug` is true or the exception class is
listed in `fos_rest.exception.messages`** (which is not configured). The local container runs with
`APP_DEBUG=1` (`docker-compose.yaml`), but the image default is `APP_DEBUG=0` (`Dockerfile:130-131`),
so **in real production the body is `{"code":404,"message":"Not Found"}`** — the generic
`Response::$statusTexts` entry. `fos_rest.exception.codes` additionally maps
`Doctrine\ORM\EntityNotFoundException` → 404.

`rfc7807` is not enabled, so the RFC-7807 `{type,title,status,detail}` shape is never emitted on v1.

### 9.5 405 and 415

```
$ curl -s -D- -X OPTIONS http://localhost:8080/api/v1/events/
HTTP/1.1 405 Method Not Allowed
Allow: GET, POST

$ curl -s -D- -X OPTIONS http://localhost:8080/api/v1/events/123
HTTP/1.1 405 Method Not Allowed
Allow: GET, PUT, DELETE
```

`415 Unsupported Media Type` is raised by `BodyListener` when a `POST`/`PUT` body arrives with a
`Content-Type` the decoder provider does not know (only `json` is registered):
message `Request body format '<format>' not supported`. Body is the flatten-exception shape.
**UNVERIFIED** live (would require an authenticated request).

### 9.6 CORS (captured live)

```
$ curl -s -D- -X OPTIONS -H "Origin: https://bka.ch" -H "Access-Control-Request-Method: GET" \
       http://localhost:8080/api/v1/events/
HTTP/1.1 200 OK
Access-Control-Allow-Methods: GET, OPTIONS, POST, PUT, PATCH, DELETE
Access-Control-Allow-Headers: content-type, authorization
Access-Control-Max-Age: 3600
```

`config/packages/nelmio_cors.yaml`: `origin_regex: true`, `allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']`
(`.env` default `^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$`), `expose_headers: ['Link']`,
applied to `^/` (all paths). No `Access-Control-Allow-Origin` was echoed for `https://bka.ch` because
the local regex does not match it — production must set `CORS_ALLOW_ORIGIN` appropriately
(**UNVERIFIED** what the production value is).

### 9.7 Security headers on every response (nelmio/security-bundle)

```
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer, strict-origin-when-cross-origin
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Robots-Tag: noindex
Content-Security-Policy: frame-ancestors http://*.localhost *.wepublish.cloud *.wepublish.dev
  *.wepublish.works *.wepublish.media *.in-situ.org insitu.live *.bka.ch bka.ch in-situ.org;
  report-uri /nelmio/csp/report
X-Content-Security-Policy: <same>
```

---

## 10. Tests

### 10.1 `tests/Controller/*` — the only v1 tests that exist

`tests/Controller/ApiEventControllerTest.php` (26 lines, `WebTestCase`):

```php
public function testUnauthorizedGetEvents(): void
{
    $client = static::createClient();
    $crawler = $client->request('GET', '/api/v1/events/');
    $response = $client->getResponse();
    $this->assertResponseStatusCodeSame(401);
}

public function testUnauthorizedGetEventsCounter(): void
{
    $client = static::createClient();
    $crawler = $client->request('GET', '/api/v1/events/count');
    $response = $client->getResponse();
    $this->assertResponseStatusCodeSame(401);
}
```

`tests/Controller/ApiCategoryControllerTest.php`:

```php
public function testGetCategories(): void
{
    $client = static::createClient();
    $crawler = $client->request('GET', '/api/v1/categories/');
    $this->assertResponseStatusCodeSame(401);
}
```

`tests/Controller/DefaultControllerTest.php` asserts `GET /` → `302`.

**That is the entire v1 test coverage: three assertions, all of them `401`.** There are **no**
fixtures and **no** response-shape assertions for v1 anywhere in the repository.

### 10.2 `tests/Functional/*` — all API **v2**

`AbstractApiTestCase` (`tests/Functional/AbstractApiTestCase.php`) sets
`Accept: application/ld+json`, and every request in `ApiAffiliationTest`, `ApiAudienceTest`,
`ApiCategoryTest`, `ApiEventTest`, `ApiImageTest`, `ApiImagePostTest`, `ApiOrganizationTest`,
`ApiPlaceTest`, `ApiRegionTest` targets `/api/v2/...` (verified by
`grep -n "api/v1\|api/v2" tests/Functional/*.php` — zero `api/v1` hits). They are therefore **not**
a source of v1 fixtures.

### 10.3 Other relevant tests

* `tests/Event/SearchEngineTest.php` — covers the search engine shared with v1.
* `tests/Form/MultilangCollectionTypeTest.php`, `tests/Validator/MultiLangCollectionNotEmptyValidatorTest.php`
  — cover the multilang machinery used by `ApiEventType`/`ApiRateType`/`ApiImageType`.
* `tests/Form/FormErrorSerializerTest.php` — covers the **admin AJAX** error serializer, *not* the
  v1 API error shape (§9.3).

---

## 11. The Postman collection (`postman_collection_20250116.json`)

Collection name `InSitu - local`, schema v2.1.0, exported 2025-01-16. Collection-level auth:

```json
{ "type": "bearer", "bearer": [ { "key": "token", "value": "{{API_ACCESS_TOKEN_LOCAL_FRISON}}", "type": "string" } ] }
```

Base host for every request: `http://in-situ-admin.localhost`. 16 requests, no folders:

| # | Name | Method | URL | Body / notes |
| --: | --- | --- | --- | --- |
| 1 | Get Organizations | GET | `/api/v1/organizations/?` | — |
| 2 | Get Places | GET | `/api/v1/places/?` | — |
| 3 | Get Places by slug | GET | `/api/v1/places/abyss-festival` | — |
| 4 | Get Events | GET | `/api/v1/events/?XDEBUG_SESSION_START=PHPSTORM` | — |
| 5 | Get Audiences | GET | `/api/v1/audiences/?XDEBUG_SESSION_START=PHPSTORM` | — |
| 6 | Add an Event (minimal) | POST | `/api/v1/events/?XDEBUG_SESSION_START=PHPSTORM` | raw JSON, see below |
| 7 | Add an Event (maximal) | POST | `/api/v1/events/?XDEBUG_SESSION_START=PHPSTORM` | raw JSON, see below |
| 8 | Get Main Events by slug | GET | `/api/v1/events/chaises-longues-de-reper-reper-liegestuhle?XDEBUG_SESSION_START=PHPSTORM` | — |
| 9 | Get Sub Events by slug | GET | `/api/v1/events/aleas-festival-de-cirque-et-2eme-edition-1?XDEBUG_SESSION_START=PHPSTORM` | — |
| 10 | IMG GEN: get events | GET | `/image_generator/events?XDEBUG_SESSION=PHPSTORM` | **not** a v1 route — `ImageGeneratorController::getEvents` (`src/Controller/ImageGeneratorController.php:45`), session-authenticated, returns `{"error": "..."}` + 401 for non-`User` principals |
| 11 | Get categories | GET | `/api/v1/categories?XDEBUG_SESSION=PHPSTORM` | no trailing slash → relies on the 301 redirect |
| 12 | Get regions | GET | `/api/v1/regions?XDEBUG_SESSION=PHPSTORM` | no trailing slash |
| 13 | Get events | GET | `/api/v1/events/count?XDEBUG_SESSION=PHPSTORM&limit=400` | has a **disabled** `member=true` query param |
| 14 | Get events members (formatlabs) | GET | `/api/v1/events?member=true` | no trailing slash |
| 15 | Get sponsored events | GET | `/api/v1/events/sponsored` | — |
| 16 | Get single event | GET | `/api/v1/events/thomas-yoloo?XDEBUG_SESSION=PHPSTORM` | — |

Requests 10–16 each carry a **disabled** hard-coded `Authorization: Bearer <JWT>` header. Decoding
that JWT's payload (it is a plain base64url segment in the file):

```json
{
  "aud": "1011d6e6d1af42b83053502b4b68db69",
  "jti": "<redacted-jti>",
  "iat": 1683019718.361712,
  "nbf": 1683019718.361713,
  "exp": 1998638918.352453,
  "sub": "person15@example.org",
  "scopes": ["api"]
}
```
— i.e. the exact claim set §4.3 describes. The client id and `jti` do not exist in the BKA
production dump, so this token is for a different (In Situ developer) environment.

No requests exist in the collection for `PUT /api/v1/events/{id}`, `DELETE /api/v1/events/{id}`,
`/api/v1/events/similar/{slug}`, `/api/v1/events/organization/{slug}`,
`/api/v1/events/place/{slug}`, `/api/v1/organizations/{slug}`, `/api/v1/affiliations/` or
`/api/token`.

### 11.1 Request 6 — "Add an Event (minimal)" (verbatim body)

```json
{
    "name": "TEST Event Min",
    "eventStatus": "confirmed",
    "place": "65",
    "organization": "57",
    "categories": [
        "1"
    ],
    "dateFrom": "2023-12-12T14:00:00",
    "dateTo": "2023-12-12T20:00:00",
    "recurrence": "none",
    "description": {
        "fr": "Test description fr",
        "de": "Test description de"
    },
    "audience" : "1",
    "publicationStatus": "draft"
}
```

### 11.2 Request 7 — "Add an Event (maximal)" (verbatim body, base64 payload elided)

```json
{
    "name": "TEST Event MAX",
    "eventStatus": "confirmed",
    "place": "65",
    "organization": "57",
    "categories": ["1", "2"],
    "dateFrom": "2023-12-12T19:00:00",
    "dateTo": "2023-12-12T24:00:00",
    "openingTime": "20:00",
    "recurrence": "none",
    "subEvents": [
        { "date_from": "2023-12-13T19:00:00", "date_to": "2023-12-13T24:00:00", "openingTime": "20:00" },
        { "date_from": "2023-12-14T18:00:00", "date_to": "2023-12-14T22:00:00", "openingTime": "19:00" }
    ],
    "description": { "fr": "Test description fr", "de": "Test description de" },
    "images": [
        {
            "fileExtension": ".png",
            "base64File": "iVBORw0KGgoAAAANSUhEUgAAAUwAAACYCAMAAAC4aCDg…<2.4 kB of base64>…",
            "legend": { "fr": "string", "de": "string" }
        }
    ],
    "rates": [
        { "price": "2.50", "designation": { "fr": "Adultes", "de": "Adultes DE" } },
        { "price": "1.0",  "designation": { "fr": "Enfants", "de": "Enfants DE" } }
    ],
    "specialRate": "free_price",
    "ticketingUrl": "https://ticketing.url.test",
    "audience": "1",
    "publicationStatus": "draft",
    "publicationDate": "2023-09-10"
}
```

Observations that matter for a stub:

* Entity references (`place`, `organization`, `audience`, `categories[]`) are sent as **strings**,
  not integers — Symfony's `EntityType` accepts both.
* `dateTo: "2023-12-12T24:00:00"` — hour 24 — is accepted by PHP's date parser as 00:00 the next day.
* `subEvents[]` keys are `date_from`/`date_to` (snake), while the top-level keys are camelCase.
* `showInPrint` and `printDescription` are absent from both bodies (they are the BKA-only print
  fields, added later than this collection's examples).

---

## 12. The published OpenAPI document

Two artefacts exist and they are **not** the same thing:

1. **Live nelmio generation** — `config/packages/nelmio_api_doc.yaml` configures it
   (servers `https://admin.insitu.live/` and `https://admin.bka.ch/`, title
   *"In Situ / BKA REST API"*, version `1.0.7`, `security: [bearerAuth]`, areas regex
   `^/api(?!/doc|/v1/events/count|/token|/authorize$)`). The generated JSON is **not routed** —
   the swagger/swagger-ui routes in `config/routes/nelmio_api_doc.yaml` are all commented out.
2. **A committed static snapshot** at `public/openapi.yaml` (51 863 bytes), served statically.
   `/api/doc` renders `templates/docs/openapi.html.twig` which loads a Stoplight Elements web
   component pointed at `/openapi.yaml?v1.0.1`. Captured live:

```html
<title>In Situ / BKa API documentations</title>
<script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
<elements-api apiDescriptionUrl="/openapi.yaml?v1.0.1" router="hash" layout="sidebar"
              hideExport="true" hideSchemas="true" />
```

`/api/doc` is **publicly reachable** (firewall `api_doc: security: false`); `/openapi.yaml` is a
static file and equally public.

### 12.1 Where the snapshot disagrees with the running code

| Snapshot says | Reality |
| --- | --- |
| `Event` has no `print_category`, `recurrence`, `recurrence_week_days`, `ticketings` | all four **are** in `default` and `reader` (`debug:serializer`) |
| No `event_type` / `mainevent_id` / `mainevent_slug` | added to every event by `EventNormalizer` |
| `Image` has no URL fields | `url`, `url_webp`, `url_webp_size_512_q_65`, `url_webp_size_1024_q_65` added by `ImageNormalizer` |
| `Category` has no `level` | added by `CategoryNormalizer` |
| `TechnicalSheet` has no `url` | added by `TechnicalSheetNormalizer` |
| `Event2.related_dates` = array of `date-time` **strings** | array of `{date, timezone_type, timezone}` objects (verified against the DB) |
| `label` / `labels` typed as **array** of objects | they are plain JSON **objects** |
| `MultilangCollectionType` requires `_token` | CSRF is disabled on API forms |
| `/api/v1/places/{slug}` documents a `403` | the controller never emits one |
| Query params `category`, `region`, `audience`, `affiliation`, `accessibility_auto_declaration`, `accessibility_proinfirmis`, `geoNorthEast`, `geoSouthWest` | all supported, **none documented** |
| `/api/v1/events/count` | not documented at all |
| 401 described as a documented response | body is bare text, not JSON |
| `Place2.region` `oneOf Region2` nullable | correct, but `Place.organization` is intentionally absent (no groups) |
| `ApiEventType` requires `printDescription` | the form adds no `NotBlank`/`MultiLangCollectionNotEmpty` there; it is effectively optional |

The snapshot's `Event` vs `Event2` naming is nelmio's disambiguation of the same class serialized
with `default` (`Event`, `Place`, `Category2`, `Image`, `Rate`, `Organization`, `Region`) vs `reader`
(`Event2`, `Place2`, `Category3`, `Image2`, `Rate2`, `Organization2`, `Region2`, `Audience2`,
`Video2`, `EventProposedBy2`, `PlaceProposed2`).

---

## 13. BKA-specific behaviour

Flags from `docker-compose.yaml` (the BKA deployment), bound in `config/services.yaml:17-41`:

| Env var | BKA value | Effect on API v1 |
| --- | --- | --- |
| `SYLIUS_THEME` | `in-situ-admin/bka` | **none** — themes only affect Twig templates; v1 returns JSON only |
| `USE_OPTIMIZED_EVENT_LOAD` | `true` | `GET /events/` and `/events/count` use `EventOccurrenceRepository::occurrenceEngineSearch` + `Paginator`; `page` works; `next_date` comes from the occurrence; `/events/sponsored`, `/similar`, `/organization`, `/place` get `completeEventsNextDates()`; `GET /events/{slug}` sets `nextDate` explicitly; `EventDoctrineListener::postLoadEvent` does **not** set `nextDate` on load |
| `ACTIVATE_MEMBERS` | `true` | the `member` query param on `/events/` and `/events/count` is honoured (`JOIN event.user`, `user.member = true`) |
| `HAS_PRINT_OPTIONS` | `true` | `showInPrint` / `printDescription` / `printCategory` are meaningful; 21 987 of 34 279 events have `show_in_print = true`, 21 981 have a `print_category_id` |
| `ACTIVATE_EVENT_VIDEOS` | `true` | 2 025 `video` rows; `videos[]` is populated (but empty `[]` objects in the `default` group — §6.3) |
| `ACTIVATE_PROPOSAL_PLACE` | `true` | `place_proposed` can be non-null; 1 823 `place_proposed` rows |
| `ACTIVATE_SPONSORED_EVENTS` | `false` | `/events/sponsored` always returns `data: []` (0 rows with `sponsored_start_date`) |
| `ACTIVATE_PROINFIRMIS` | `false` *(locally)* | the `pro_infirmis_*` fields are serialized unconditionally; only the ingestion job is gated. 1 place has pictograms, 1 has an id-source. **Production value UNVERIFIED** |
| `LIST_OWN_EVENTS_ONLY` | `true` | **no effect on v1** — `$listOwnEventsOnly` is only read by `EventController` (admin UI), lines 49/68/283/302/332. v1's equivalent is the `$filterByUser` logic inside `EventSearchEngine` |
| `LOCALES` | `fr\|de` | `MultilangCollectionType` builds `fr` + `de` children; every `labels.<prop>` has exactly these two keys |
| `DEFAULT_LOCALE` | `de` | the "default language" of the multilang widget; also the fallback for `getLabelWithLocales()` |
| `CLIPBOARD_EVENT_LINKS`, `SHOW_MANUAL` | `true` | admin UI only, no v1 effect |
| `ACTIVATE_SLUG_GENERATOR_WITH_ID` | *(unset ⇒ false)* | `SlugEntityValueResolver` only matches on `slug`; the `oldSlug` and `-{id}` fallbacks are off |
| `ACTIVATE_MULTI_TICKETINGS` | *(unset ⇒ false)* | 0 `ticketing` rows; `ticketings` is always `[]` |
| `ACTIVATE_EVENT_NAME_TRANSLATABLE` | *(unset ⇒ false)* | `labels.name` is not written by the admin; `name` is the scalar column |

---

## 14. Production data measurements (all `SELECT`-only)

```sql
SELECT count(*) AS events,
       count(*) FILTER (WHERE publication_status='publish') AS published,
       count(*) FILTER (WHERE type='mainevent')             AS mainevents,
       count(*) FILTER (WHERE type='subevent')              AS subevents,
       count(*) FILTER (WHERE show_in_print)                AS show_in_print,
       count(*) FILTER (WHERE special_rate IS NOT NULL)     AS with_special_rate,
       count(*) FILTER (WHERE sponsored_start_date IS NOT NULL) AS sponsored
FROM event;
```
| events | published | mainevents | subevents | show_in_print | with_special_rate | sponsored |
| --: | --: | --: | --: | --: | --: | --: |
| 34 279 | 34 076 | 21 116 | 13 163 | 21 987 | 8 103 | **0** |

| Table | Rows |
| --- | --: |
| `event_occurrence` | 118 021 |
| `image` | 27 571 |
| `rate` | 12 697 |
| `video` | 2 025 |
| `ticketing` | **0** |
| `place_proposed` | 1 823 |
| `event_proposed_by` | 4 366 |
| `place` | 1 276 |
| `organization` | 741 |
| `technical_sheet` | 1 |
| `organization_affiliation` | **0** |
| `category` | 30 (25 not hidden, 22 with a parent) |
| `region` | 13 (8 hidden) |
| `audience` | 4 |
| `affiliation` | 7 |
| `user` | 427 |

`special_rate` distribution: `free_entry` 5 103, `free_price` 3 000, `NULL` 26 176.
Top `rate.price` values (stored in cents, `varchar`): `2000` ×1 701, `2500` ×1 391, `3000` ×1 296,
`1500` ×1 025, `1000` ×684, `3500` ×599, `4000` ×479, `0` ×411.

> `rate.price = "0"` is the one value `RateNormalizer` skips (`!empty("0")` is false), so it is
> emitted as `"0"` rather than `"0"` divided by 100 — the same result, but a stub reimplementing the
> division must guard the same way to avoid `"0"` becoming `0`.

---

## 15. Quick reference — complete v1 surface in one table

| Method | Path | Auth | Groups | Success | Envelope |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/affiliations/` | bearer | default | 200 | `{code,message,data[],total}` |
| GET | `/api/v1/audiences/` | bearer | default | 200 | `{code,message,data[],total}` |
| GET | `/api/v1/categories/` | bearer | filters | 200 | `{code,message,data[],total}` |
| GET | `/api/v1/regions/` | bearer | default | 200 | `{code,message,data[],total}` |
| GET | `/api/v1/places/` | bearer | default | 200 | `{code,message,data[],total}` |
| GET | `/api/v1/places/{slug}` | bearer | reader | 200 | `{code,message,data{}}` |
| GET | `/api/v1/organizations/` | bearer + `view` per row | default | 200 | `{code,message,data[],total}` |
| GET | `/api/v1/organizations/{slug}` | bearer + `view` | reader | 200 | `{code,message,data{}}` |
| GET | `/api/v1/events/` | bearer (+ internal org filter) | default | 200 | `{code,message,data[{date,events[]}],total}` |
| GET | `/api/v1/events/count` | bearer | — | 200 | `{code,message,total}` |
| GET | `/api/v1/events/sponsored` | bearer | default | 200 | `{code,message,data[]}` *(no `total`)* |
| GET | `/api/v1/events/{slug}` | bearer + `view` | reader | 200 | `{code,message,data{}}` |
| POST | `/api/v1/events/` | bearer + `ROLE_USER` + `edit` | reader | **201** (body `code:200`) | `{code,message,data{}}` |
| PUT | `/api/v1/events/{id}` | bearer + `ROLE_USER` + `edit` | reader | 200 | `{code,message,data{}}` |
| DELETE | `/api/v1/events/{id}` | bearer + `ROLE_USER` + `edit` | — | 200 | `{code,message}` |
| GET | `/api/v1/events/similar/{slug}` | bearer | default | 200 | `{code,message,data[],total}` |
| GET | `/api/v1/events/organization/{slug}` | bearer | default | 200 | `{code,message,data[],total}` |
| GET | `/api/v1/events/place/{slug}` | bearer | default | 200 | `{code,message,data[],total}` |

---

## 16. Porting notes *(opinion, clearly separated from the facts above)*

These are suggestions for the We.Publish port, not descriptions of existing behaviour.

1. **Decide whether a v1 stub is needed at all.** v1 is marked `@deprecated` in favour of v2, has
   four OAuth 2 clients in the production DB (`bka-frontend`, `guidle`, `heiko_dachstock.ch`,
   `punktzwei`), and its access tokens are unrevoked. Before building a stub, confirm with the BKA
   team which of those four still calls `/api/v1/*` — the restored environment has no access logs to
   answer this.

2. **If a stub is built, the hardest parts to reproduce faithfully are not the happy paths:**
   * the bare-text `401` bodies under `Content-Type: application/json` (§9.1);
   * the `201`-header / `code: 200`-body mismatch on `POST /events/` (§7.5);
   * `total` meaning *page size*, not match count, on `/events/` and `/events/count` (§7.1, §7.2);
   * the double-nested form-error envelope with `[]` for clean fields (§9.3);
   * `related_dates` being PHP-serialized `DateTime` objects, not ISO strings (§7.4);
   * `/events/sponsored` returning no `total` key at all (§7.3);
   * categories appearing both nested and flat, with hidden children leaking into `children` (§7.14).

3. **OAuth 2 is a separate problem from the data model.** We.Publish authenticates with sessions and
   its own tokens. Emulating `POST /api/token` with the `refresh_token` grant and RS256 JWTs whose
   `jti` is checked against a revocation table is a meaningful amount of work. An alternative is to
   issue the four existing clients new We.Publish API keys and accept a breaking auth change while
   keeping the response shapes — but that requires coordinating with Guidle and the two agencies.

4. **The `reader` group leaks organization members' e-mail addresses** to any token holder
   (§7.4). Do not carry this forward unreviewed; it is almost certainly unintentional.

5. **Map the shape, not the storage.** The v1 contract is one flat `Event` object with embedded
   `place`, `organization`, `categories`, `images`, `rates`. We.Publish's block-content + revision
   model has no natural equivalent, so a stub will need an explicit projection layer that renders a
   *published* revision into this shape. `labels` (`{prop: {fr, de}}`) maps reasonably onto
   We.Publish's per-locale fields; `related_dates`/`next_date`/`next_filtered_date` map onto a
   materialised occurrence table analogous to `event_occurrence` (118 021 rows today).

6. **The write side is probably not worth stubbing.** `POST`/`PUT`/`DELETE /api/v1/events` accept
   base64 image uploads with no size or MIME validation, do full-replacement `PUT` with
   `clearMissing: true`, and regenerate all occurrences on every save. If any client writes through
   v1, prefer migrating it to the new API rather than emulating `ApiEventType`.

7. **Things that are already dead and can be dropped:** `/events/sponsored` (0 sponsored rows,
   flag off), `ticketings` (0 rows), `organization_affiliation` (0 rows), every deprecated
   untranslated column (`event.description`, `image.legend`, `rate.designation`, `place.about`,
   `place.capacity`, `organization.sub_title`, `organization.about`, `technical_sheet.title`,
   `contact.designation_*` — all empty in BKA), and the non-optimized `searchEvents()` branch
   (`USE_OPTIMIZED_EVENT_LOAD=true` on BKA). Keeping the *keys* in the response (as `null`/`[]`) is
   cheap insurance; keeping the *code* is not.

8. **Pin the behaviour with contract tests the original never had.** v1 ships with three `401`
   assertions and nothing else (§10). Before touching anything, capture real authenticated responses
   from BKA production for each of the 18 endpoints and freeze them as fixtures — this document is
   derived from code and DB rows, and a captured payload would upgrade every
   **[reconstructed]** example here to verified.
