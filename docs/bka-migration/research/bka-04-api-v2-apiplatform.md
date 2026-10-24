# BKA public API v2 (API Platform) — exhaustive reference

Scope: everything served under `/api/v2` by the Symfony 6.4 / API Platform 4.2.6 application in
`/Users/itrulia/Documents/insitu-admin`, as it behaves for the **BKA** product
(`SYLIUS_THEME=in-situ-admin/bka`). This covers all 18 `src/ApiResource/*` DTOs, every operation and
route, every query parameter a client can send and how it is actually parsed, the five Doctrine ORM
query extensions plus the IRI-converter decorator that together encode the "which events are
visible" rules, the MicroMapper DTO⇄entity mapping layer, the state providers/processors, the
serializer normalizers, the custom DQL functions used for accent-insensitive and JSON search, and
the pagination/serialization-group machinery. Claims are grounded in file paths + line numbers, in
the OpenAPI document generated from the running container
(`php bin/console api:openapi:export`), in `debug:router` / `debug:container` output from that
container, in unauthenticated `curl` probes of `http://localhost:8080`, and in SQL run against the
restored BKA production Postgres. The legacy `/api/v1` FOSRest API (`src/Controller/Api*Controller`)
is **out of scope** and is only referenced where v2 code points at it.

---

## 1. How the API is mounted and configured

### 1.1 Routing prefix

`/Users/itrulia/Documents/insitu-admin/config/routes/api_platform.yaml`

```yaml
api_platform:
    resource: .
    type: api_platform
    prefix: /api/v2
```

Everything API Platform generates is therefore under `/api/v2`. The JWT login route is declared
separately in `config/routes.yaml:4-6`:

```yaml
jwt_auth:
  path: /api/v2/auth
  methods: ['POST']
```

### 1.2 Global API Platform configuration

`/Users/itrulia/Documents/insitu-admin/config/packages/api_platform.yaml` (full file):

| Setting | Value | Effect |
| --- | --- | --- |
| `title` | `InSitu/BKA API` | OpenAPI `info.title` |
| `version` | `2.0.3` | OpenAPI `info.version` |
| `show_webby` | `false` | hides the API Platform mascot in the HTML docs |
| `formats` | `jsonld: [application/ld+json]`, `json: [application/json]` | two output formats; **jsonld is the default** (first entry) |
| `docs_formats` | `jsonld`, `html` | docs available as JSON-LD and HTML |
| `patch_formats` | `json: [application/merge-patch+json]` | PATCH bodies must be `application/merge-patch+json` |
| `defaults.stateless` | `true` | no session is started for API requests |
| `defaults.cache_headers.vary` | `['Content-Type', 'Authorization', 'Origin']` | `Vary` response header |
| `defaults.pagination_client_items_per_page` | `true` | clients may send `itemsPerPage` |
| `defaults.pagination_maximum_items_per_page` | `500` | hard cap |
| `defaults.normalization_context.skip_null_values` | `false` | **null fields are emitted**, not omitted |
| `collection.pagination.items_per_page_parameter_name` | `itemsPerPage` | (explicit default) |
| `swagger.api_keys.JWT` | header `Authorization` | overridden at runtime by `OpenApiFactoryDecorator` |

Default page size is API Platform's built-in **30** — confirmed in the generated spec:
`{"name":"itemsPerPage","in":"query","schema":{"type":"integer","default":30,"minimum":0,"maximum":500}}`.

### 1.3 Serializer naming

`config/packages/framework.yaml:30-32`

```yaml
    serializer:
        name_converter: 'serializer.name_converter.camel_case_to_snake_case'
```

All DTO properties are exposed in **snake_case** (`date_from`, `event_status`, `url_webp_size_512_q_65`,
`mainevent_slug`, …). PHP property names in `src/ApiResource/*` are camelCase.

### 1.4 Relevant package versions (`composer.lock`)

```
api-platform/* v4.2.6     doctrine/orm 3.5.7
symfony/framework-bundle v6.4.27
lexik/jwt-authentication-bundle v3.1.1
symfonycasts/micro-mapper v0.2.1
scienta/doctrine-json-functions 6.3.0
nelmio/api-doc-bundle v4.38.5   (documents /api/v1 only — see §13)
```

### 1.5 CORS

`config/packages/nelmio_cors.yaml` — `allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']` with
`origin_regex: true`, methods `GET, OPTIONS, POST, PUT, PATCH, DELETE`, allowed headers
`Content-Type, Authorization`, exposed header `Link`, `max_age: 3600`, applied to `^/`.
The checked-in default (`/Users/itrulia/Documents/insitu-admin/.env:54`) is
`^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$`; production sets its own value (UNVERIFIED — not in
the repo).

---

## 2. Authentication and authorization

### 2.1 Firewall

`config/packages/security.yaml:30-41`

```yaml
        api_platform:
            pattern: '^/api/v2'
            lazy: true
            stateless: true
            json_login:
                check_path: jwt_auth
                username_path: email
                password_path: password
                success_handler: lexik_jwt_authentication.handler.authentication_success
                failure_handler: lexik_jwt_authentication.handler.authentication_failure
            jwt:
                authenticator: app.custom_jwt_authenticator
```

`access_control` has `- { path: ^/api/v2, roles: PUBLIC_ACCESS }` (line 86), so **the firewall itself
lets anonymous requests through**; authorization is enforced per-resource by the `security:`
expressions on the `#[ApiResource]` attributes. Verified live: `GET /api/v2` returns **200** with the
Hydra entrypoint and no credentials, while `GET /api/v2/categories` returns
`401 {"code":401,"message":"JWT Token not found"}`.

### 2.2 The custom JWT authenticator

`src/Security/CustomJWTAuthenticator.php:30-54` extends Lexik's `JWTAuthenticator` and adds two
checks after the standard signature/expiry validation:

1. the payload **must** contain a `uuid` claim, else `InvalidPayloadException('uuid')`;
2. a `user_token` row with that `uuid` must exist and its owner must be `enabled`, else
   `InvalidTokenException('Invalid JWT Token')`.

Tokens are minted only by `src/Security/JWTGenerator.php:29-37`:

```php
$token = $this->JWTTokenManager->createFromPayload($userToken->getOwner(), [
    'exp'  => $userToken->getExpiresAt()->getTimestamp(),
    'uuid' => $userToken->getUuid()->toRfc4122(),
]);
```

called from the **admin UI** (`src/Controller/UserTokenController.php:95`, route
`/user-token/create`). The token string is stored in `user_token.token` and shown once in a flash
message.

> **Consequence worth noting for the port:** the `POST /api/v2/auth` json_login endpoint uses
> Lexik's stock `AuthenticationSuccessHandler`, which calls `$this->jwtManager->create($user)`
> (`vendor/lexik/jwt-authentication-bundle/Security/Http/Authentication/AuthenticationSuccessHandler.php:55`).
> That payload has no `uuid` claim and there is no `JWT_CREATED` listener anywhere in `src/`
> (`grep -rn "JWTCreatedEvent" src/` → no match). A token obtained from `/api/v2/auth` is therefore
> rejected by `CustomJWTAuthenticator` on the next request. In practice the **only** usable
> credential is a long-lived `user_token` JWT created from the admin UI.
> (UNVERIFIED end-to-end: verifying would require POSTing to `/api/v2/auth`, which is outside the
> read-only brief.)

The live DB holds 5 `user_token` rows (`SELECT count(*) FROM user_token` → 5).
Schema: `id, owner_id, name, expires_at timestamptz, token text, created_at, updated_at, uuid uuid UNIQUE`.

### 2.3 Roles

`config/packages/security.yaml:17-20`

```yaml
    role_hierarchy:
        ROLE_ADMIN:       ROLE_USER
        ROLE_SUPER_ADMIN: [ROLE_ADMIN, ROLE_ALLOWED_TO_SWITCH]
```

`ROLE_BROADCAST_PARTNER` is **not** in the hierarchy — it does not imply `ROLE_USER`. This matters:

* every `#[ApiResource]` carries `security: 'is_granted("ROLE_USER") or is_granted("ROLE_BROADCAST_PARTNER")'`
  (read access for both);
* `POST /api/v2/events` and `POST /api/v2/images` require `is_granted("ROLE_USER")` only — a
  broadcast partner gets **403**. Confirmed by `tests/Functional/ApiEventTest.php:4347-4382`
  (`testPostEventsAsPartner` → `assertStatus(403)`).

### 2.4 Operation-level security and voters

| Operation | `security:` expression | Source |
| --- | --- | --- |
| every resource (default) | `is_granted("ROLE_USER") or is_granted("ROLE_BROADCAST_PARTNER")` | e.g. `src/ApiResource/EventApi.php:406` |
| `POST /api/v2/events` | `is_granted("ROLE_USER")` | `EventApi.php:392` |
| `PATCH /api/v2/events/{slug}` | `is_granted("EVENT_API_EDIT", object)` | `EventApi.php:396` |
| `DELETE /api/v2/events/{slug}` | `is_granted("EVENT_API_EDIT", object)` | `EventApi.php:400` |
| `POST /api/v2/images` | `is_granted("ROLE_USER")` | `ImageApi.php:56` |
| `DELETE /api/v2/images/{id}` | `is_granted("IMAGE_API_EDIT", object)` | `ImageApi.php:60` |

**`EventApiVoter`** (`src/Security/Voters/EventApiVoter.php`): subject must be `EventApi` or null.
Returns false if the token user is not a `User` or lacks `ROLE_USER`; true for `ROLE_ADMIN`; true if
the subject is null (so a create passes). Otherwise grants when `$event->user === $user`
(the `EventApi::$user` field is `#[Ignore]`d from serialization but populated by the mapper,
`EventEntityToApiMapper.php:169`), or when the event's **place's** organization is one of the user's
organizations (lines 63-70).

**`ImageApiVoter`** (`src/Security/Voters/ImageApiVoter.php`): same preamble; then looks the entity
up by id and grants if the image's `event->getUser() === $user`, or the user is in the image's
`organization->getUsers()`, or in the image's `place->getOrganization()->getUsers()`. An image
attached to nothing ("orphan") is editable by any `ROLE_USER` (line 85).

### 2.5 Parameter validation runs **before** security

Verified live, unauthenticated:

```
$ curl -s -H 'Accept: application/ld+json' http://localhost:8080/api/v2/events/agenda/organization
{"@context":"/api/v2/contexts/ConstraintViolation","@type":"ConstraintViolation","status":422,
 "violations":[{"propertyPath":"slug","message":"Dieser Wert sollte nicht null sein.", ...}], ...}
```

i.e. a missing required query parameter yields **422** even with no JWT, whereas the same endpoint
with `?slug=x` yields 401. The `NotNull` constraint comes from
`vendor/api-platform/validator/Util/ParameterValidationConstraints.php:133-135`
(`if ($required && false !== $allowEmptyValue) { $assertions[] = new NotNull(); }`). The German
message confirms `DEFAULT_LOCALE=de` for BKA.

---

## 3. Response envelope, formats, errors

### 3.1 Formats

* `application/ld+json` (default) — Hydra envelope.
* `application/json` — **bare** payloads: collections serialize as a plain JSON array with no
  `totalItems` and no `view` links (generated spec: `application/json: {schema: {type: array, items: …}}`).
* `ImageApi` restricts `outputFormats` to jsonld only (`src/ApiResource/ImageApi.php:63`).
* PATCH input must be `application/merge-patch+json`.
* `POST /api/v2/images` input is `multipart/form-data` only (`ImageApi.php:29`).

### 3.2 Hydra collection envelope

```jsonc
{
  "@context": "/api/v2/contexts/Event",
  "@id": "/api/v2/events",
  "@type": "Collection",
  "totalItems": 123,
  "member": [ /* items */ ],
  "view": { "@id": "...", "@type": "PartialCollectionView",
            "first": "...", "last": "...", "previous": "...", "next": "..." }
}
```

(`HydraCollectionBaseSchema` / `HydraCollectionBaseSchemaNoPagination` in the generated spec.)
Items carry `@id` + `@type` (`HydraItemBaseSchema`, both required).

### 3.3 `@id` values

Identifier properties are declared with `#[ApiProperty(identifier: true)]`:

| Resource | identifier | `@id` pattern |
| --- | --- | --- |
| Event | `slug` | `/api/v2/events/{slug}` |
| Place | `slug` | `/api/v2/places/{slug}` (forced by `ItemApiIriConverterDecorator`) |
| Organization | `slug` | `/api/v2/organizations/{slug}` (forced by the decorator) |
| Image | `id` | `/api/v2/images/{id}` |
| Category / Region / Audience / Affiliation / Rate / Ticketing / Video / Contact / User / TechnicalSheet / SubEvent / PlaceProposed / EventProposedBy / Occurrence | `id` | `/api/v2/{plural}/{id}` (a `not_exposed` route, see §5.2) |

`Event.id` and `Place.id` / `Organization.id` are declared `identifier: false` so the integer id is
*also* emitted as a normal property.

### 3.4 Error shapes observed live

| Situation | Status | Body |
| --- | --- | --- |
| no JWT on a protected collection | 401 | `{"code":401,"message":"JWT Token not found"}` |
| missing required query parameter | 422 | Hydra `ConstraintViolation` (`violations[]`) |
| `not_exposed` item route | 404 | `{"@type":"Error","detail":"This route does not aim to be called"}` |
| `ApiPlatform\Metadata\Exception\InvalidArgumentException` thrown in an extension | 400 | Hydra `Error` — default mapping in `vendor/api-platform/symfony/Bundle/DependencyInjection/Configuration.php:562-567` |
| `NotFoundHttpException` thrown in `OccurrenceExtension` (unknown slug) | 404 | Hydra `Error` |
| non-array value passed to an array parameter (`?region=2`) | 400 | Symfony `BadRequestException` from `ParameterBag::all()` (`vendor/symfony/http-foundation/ParameterBag.php:47-49`) |
| write validation failure | 422 | Hydra `ConstraintViolation` |


---

## 4. Complete endpoint table

Every route under `/api/v2`, taken verbatim from
`php bin/console debug:router --show-controllers` inside `insitu-admin-app-1`. "Auth" is the
effective requirement after firewall + resource/operation `security:`.

### 4.1 Callable endpoints

| # | Method | Path | API Platform operation name | Auth | Query parameters actually honoured | Response |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | GET | `/api/v2` (`/api/v2/{index}.{_format}`) | `api_entrypoint` | **public** | – | Hydra `Entrypoint` listing affiliation, audience, category, event, image, organization, place, region |
| 2 | GET | `/api/v2/contexts/{shortName}.{_format}` | `api_jsonld_context` | **public** | – | JSON-LD `@context` |
| 3 | GET | `/api/v2/errors/{status}.{_format}` | `_api_errors` | public | – | Hydra `Error` |
| 4 | GET | `/api/v2/validation_errors/{id}` | `_api_validation_errors_*` | public | – | Hydra `ConstraintViolation` |
| 5 | POST | `/api/v2/auth` | `jwt_auth` | public | body `{email, password}` | `{token}` — but see §2.2, the token lacks `uuid` and is rejected afterwards |
| 6 | GET | `/api/v2/affiliations` | `_api_/affiliations{._format}_get_collection` | ROLE_USER \| ROLE_BROADCAST_PARTNER | `page`, `itemsPerPage` | Hydra collection of `Affiliation` |
| 7 | GET | `/api/v2/audiences` | `…/audiences…_get_collection` | ROLE_USER \| PARTNER | `page`, `itemsPerPage` | collection of `Audience` (group `api:audience:read-collection`) |
| 8 | GET | `/api/v2/categories` | `…/categories…_get_collection` | ROLE_USER \| PARTNER | `page`, `itemsPerPage` | collection of `Category` (group `api:category:read`), hidden categories removed by `CategoryExtension` |
| 9 | GET | `/api/v2/regions` | `…/regions…_get_collection` | ROLE_USER \| PARTNER | `page`, `itemsPerPage` | collection of `Region` — **no** hidden filter |
| 10 | GET | `/api/v2/events` | `get_published_events` | ROLE_USER \| PARTNER | `page`, `itemsPerPage`, `date_from`, `keyword`, `region[]`, `onlyMainEvents` | collection of `Event`, group `api:event:read-collection`, ordered `event.dateFrom ASC` |
| 11 | GET | `/api/v2/events/agenda` | `get_published_events_occurrences` | ROLE_USER \| PARTNER | documented: `multi_day`, `free`, `group_by_month`, `count_only`; **also honoured** (undocumented on this path): `member`, `date_from`, `date_to`, `keyword`, `category[]`, `place[]`, `region[]`, `audience[]`, `affiliation[]`, `accessibility_auto_declaration[]`, `accessibility_proinfirmis[]`, `geoNorthEast[lat]`, `geoNorthEast[lng]`, `geoSouthWest[lat]`, `geoSouthWest[lng]` | collection of `Event`, group `api:occurrence:read-collection`, one member **per occurrence**, ordered `occurrence.dateFrom ASC` |
| 12 | GET | `/api/v2/events/agenda-lite` | `get_published_events_occurrences_lite` | ROLE_USER \| PARTNER | all of the above (fully documented here) | same as #11 but group `api:occurrence:read-lite-collection` (fewer fields) |
| 13 | GET | `/api/v2/events/agenda/organization` | `get_published_events_for_organization` | ROLE_USER \| PARTNER | `slug` **(required)**, `page`, `itemsPerPage` | collection of `Event`, group `api:occurrence:read-collection` |
| 14 | GET | `/api/v2/events/agenda/place` | `get_published_events_for_place` | ROLE_USER \| PARTNER | `slug` **(required)**, `page`, `itemsPerPage` | same |
| 15 | GET | `/api/v2/events/agenda/similar` | `get_published_events_similar` | ROLE_USER \| PARTNER | `slug` **(required)**, `region[]`, `page`, `itemsPerPage` | same |
| 16 | GET | `/api/v2/events/agenda/sponsored` | `get_published_events_sponsored` | ROLE_USER \| PARTNER | `page`, `itemsPerPage` | same — always empty on BKA (§14) |
| 17 | GET | `/api/v2/events/{slug}` | `_api_/events/{slug}_get` | ROLE_USER \| PARTNER | – | single `Event`, group `api:event:read-item` |
| 18 | POST | `/api/v2/events` | `_api_/events{._format}_post` | **ROLE_USER** | – | 201 + `Event` (group `api:event:read-item`); body group `api:event:write-item` |
| 19 | PATCH | `/api/v2/events/{slug}` | `_api_/events/{slug}{._format}_patch` | `EVENT_API_EDIT` | – | 200 + `Event`; `Content-Type: application/merge-patch+json` |
| 20 | DELETE | `/api/v2/events/{slug}` | `_api_/events/{slug}{._format}_delete` | `EVENT_API_EDIT` | – | 204 |
| 21 | GET | `/api/v2/organizations` | `…/organizations…_get_collection` | ROLE_USER \| PARTNER | `page`, `itemsPerPage`, `keyword`, `category[]`, `geoNorthEast[lat]`, `geoNorthEast[lng]`, `geoSouthWest[lat]`, `geoSouthWest[lng]` | collection, group `api:organization:read-collection` |
| 22 | GET | `/api/v2/organizations/{slug}` | `_api_/organizations/{slug}_get` | ROLE_USER \| PARTNER | – | item, group `api:organization:read-item` |
| 23 | GET | `/api/v2/places` | `…/places…_get_collection` | ROLE_USER \| PARTNER | `page`, `itemsPerPage`, `keyword`, `place[]`, `region[]` | collection, group `api:place:read-collection` |
| 24 | GET | `/api/v2/places/{slug}` | `_api_/places/{slug}_get` | ROLE_USER \| PARTNER | – | item, group `api:place:read-item` |
| 25 | GET | `/api/v2/images` | `…/images…_get_collection` | ROLE_USER \| PARTNER | `page`, `itemsPerPage` | collection, group `api:image:read-item`, **jsonld only** |
| 26 | GET | `/api/v2/images/{id}` | `_api_/images/{id}{._format}_get` | ROLE_USER \| PARTNER | – | item |
| 27 | POST | `/api/v2/images` | `_api_/images{._format}_post` | **ROLE_USER** | – | 201; `multipart/form-data` with `file` (binary) and `labels` (JSON string) |
| 28 | DELETE | `/api/v2/images/{id}` | `_api_/images/{id}{._format}_delete` | `IMAGE_API_EDIT` | – | 204 |

Note on #10 vs #11/#12: there is **no** `ORDER BY` set by `OccurrenceExtension` for the agenda and
agenda-lite operations, so `OrderExtension` applies the resource-level `order: ['dateFrom' => 'ASC']`
(`EventApi.php:405`) against the **root alias**, which for those operations is `EventOccurrence`
(`stateOptions: new Options(entityClass: EventOccurrence::class)`) → `occurrence.date_from ASC`.
For #13–#16 the extension calls `->orderBy($rootAlias.'.dateFrom','ASC')` explicitly and
`OrderExtension` then bails out (`vendor/api-platform/doctrine-orm/Extension/OrderExtension.php:43-47`:
"Do not apply order if already defined on queryBuilder").

### 4.2 `not_exposed` routes (exist only to mint IRIs; always 404)

All of these are wired to `api_platform.action.not_exposed`. They are generated because the DTO is
referenced from another resource and needs an IRI, while its `#[ApiResource]` declares `operations: []`.

```
GET /api/v2/affiliations/{id}        GET /api/v2/audiences/{id}
GET /api/v2/categories/{id}          GET /api/v2/contacts/{id}
GET /api/v2/event_proposed_bies/{id} GET /api/v2/occurrences/{id}
GET /api/v2/place_proposeds/{id}     GET /api/v2/rates/{id}
GET /api/v2/regions/{id}             GET /api/v2/sub_events/{id}
GET /api/v2/technical_sheets/{id}    GET /api/v2/ticketings/{id}
GET /api/v2/users/{id}               GET /api/v2/videos/{id}
GET /api/v2/.well-known/genid/{id}
```

Verified: `curl -s http://localhost:8080/api/v2/contacts/1` →
`404 {"@type":"Error","detail":"This route does not aim to be called"}` (no auth required to see it).

They are nonetheless **accepted as input IRIs** on writes: `POST /api/v2/events` takes
`"audience": "/api/v2/audiences/3"` and `"categories": ["/api/v2/categories/1", …]`
(`tests/Functional/ApiEventTest.php:4362-4367`).

### 4.3 The Hydra entrypoint (live)

```json
{
  "@context": "/api/v2/contexts/Entrypoint",
  "@id": "/api/v2",
  "@type": "Entrypoint",
  "affiliation": "/api/v2/affiliations",
  "audience": "/api/v2/audiences",
  "category": "/api/v2/categories",
  "event": "/api/v2/events",
  "image": "/api/v2/images",
  "organization": "/api/v2/organizations",
  "place": "/api/v2/places",
  "region": "/api/v2/regions"
}
```

---

## 5. Serialization groups

Twelve groups exist. Which group is active is set per operation via `normalizationContext` /
`denormalizationContext`.

| Group | Used by |
| --- | --- |
| `api:event:read-collection` | `GET /api/v2/events` |
| `api:event:read-item` | `GET /api/v2/events/{slug}`, and the response of `POST`/`PATCH /api/v2/events` |
| `api:event:write-item` | request body of `POST`/`PATCH /api/v2/events` |
| `api:occurrence:read-collection` | `/events/agenda`, `/events/agenda/{organization,place,similar,sponsored}` |
| `api:occurrence:read-lite-collection` | `/events/agenda-lite` |
| `api:organization:read-collection` | `GET /api/v2/organizations` |
| `api:organization:read-item` | `GET /api/v2/organizations/{slug}` |
| `api:place:read-collection` | `GET /api/v2/places` |
| `api:place:read-item` | `GET /api/v2/places/{slug}` |
| `api:category:read` | `GET /api/v2/categories` (resource-level `normalizationContext`) |
| `api:audience:read-collection` | `GET /api/v2/audiences` |
| `api:image:read-item` | all Image operations (resource-level `normalizationContext`) |

`GET /api/v2/affiliations` and `GET /api/v2/regions` declare **no** normalization group. Because
`AffiliationApi`/`RegionApi` properties are all tagged with *other* groups, serialization falls back
to "no groups ⇒ serialize everything", so they return `{@id, @type, id, label}` and
`{@id, @type, id, label, hidden}` respectively.

An important emergent rule: **when a nested DTO has no property in the active group, it is rendered
as an IRI string instead of an object.** Two instances in the generated spec:

* `Event-api.event.read-collection.organization` → `{"type":["string","null"],"format":"iri-reference"}`
  (OrganizationApi has no property in `api:event:read-collection`);
* every relation in `api:event:write-item` whose target DTO has no writable property in that group:
  `place`, `audience`, `print_category` (scalars) and `categories[]`, `images[]` (arrays) are all
  `iri-reference`.

---

## 6. Resource catalogue

Field tables below give: PHP property → exposed JSON key, PHP type, nullable, write/read, the groups
it appears in, and notes. "Groups" abbreviations:
`E-C` = `api:event:read-collection`, `E-I` = `api:event:read-item`, `E-W` = `api:event:write-item`,
`O-C` = `api:occurrence:read-collection`, `O-L` = `api:occurrence:read-lite-collection`,
`Org-C` / `Org-I` = organization collection/item, `P-C` / `P-I` = place collection/item,
`Cat` = `api:category:read`, `Aud` = `api:audience:read-collection`, `Img` = `api:image:read-item`.

### 6.1 `EventApi` — `src/ApiResource/EventApi.php`

`shortName: 'Event'`, entity `App\Entity\Event` (resource level), `MainEvent` for POST/PATCH/DELETE,
`EventOccurrence` for the agenda operations. Provider `EntityToDtoProvider`
(overridden per operation), processor `EntityClassDtoStateProcessor`, class-level constraint
`#[DatesFromToConsistent]`.

| JSON key | PHP | Type | Null | Groups | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | `$id` | `int` | yes | E-C, E-I, O-C, O-L | read-only, `identifier: false` |
| `slug` | `$slug` | `string` | yes | E-C, E-I, O-C, O-L | read-only, **identifier** → `@id` |
| `name` | `$name` | `string` | yes | E-C, E-I, E-W, O-C, O-L | `NotBlank`, `Length(max:130)`; documented as DEPRECATED in favour of `labels.name` |
| `event_status` | `$eventStatus` | `string` | yes | E-C, E-I, E-W, O-C, O-L | `NotBlank`; one of `confirmed, canceled, postponed, full` (`Event::getEventStatusList()`) |
| `place` | `$place` | `PlaceApi` | yes | E-C, E-I, E-W, O-C, O-L | `NotBlank`; IRI on write |
| `categories` | `$categories` | `CategoryApi[]` | yes | E-C, E-I, E-W, O-C, O-L | `NotBlank`; IRIs on write |
| `date_from` | `$dateFrom` | `\DateTime` | yes | E-C, E-I, E-W, O-C, O-L | `NotBlank` |
| `date_to` | `$dateTo` | `\DateTime` | yes | E-C, E-I, E-W, O-C, O-L | `NotBlank` |
| `opening_time` | `$openingTime` | `string` | yes | E-C, E-I, E-W, O-C | `Length(max:5)`, e.g. `"12:30"` |
| `recurrence` | `$recurrence` | `string` | yes | E-C, E-I, E-W, O-C | `NotBlank`, default `none`; one of `none, week` |
| `recurrence_week_days` | `$recurrenceWeekDays` | `int[]` | yes | E-C, E-I, E-W, O-C | ISO-8601 weekday numbers 1–7 (`MainEvent::getWeekDays()`) |
| `sub_events` | `$subEvents` | `SubEventApi[]` | yes | **E-W only** | PATCH replaces all sub-events |
| `images` | `$images` | `ImageApi[]` | yes | E-C, E-I, E-W, O-C, O-L | `#[EventImages]`; IRIs on write |
| `videos` | `$videos` | `VideoApi[]` | yes | E-C, E-I, E-W, O-C | `Valid`; PATCH replaces all |
| `rates` | `$rates` | `RateApi[]` | yes | E-C, E-I, E-W, O-C | `Valid`; PATCH replaces all |
| `special_rate` | `$specialRate` | `string` | yes | E-C, E-I, E-W, O-C | one of `free_entry, free_price` |
| `ticketing_url` | `$ticketingUrl` | `string` | yes | E-C, E-I, O-C | read-only (not in E-W); DEPRECATED in favour of `labels.ticketingUrl` |
| `ticketings` | `$ticketings` | `TicketingApi[]` | yes | E-C, E-I, E-W, O-C | `Valid`; PATCH replaces all |
| `audience` | `$audience` | `AudienceApi` | yes | E-C, E-I, E-W, O-C | `NotBlank`; IRI on write |
| `publication_status` | `$publicationStatus` | `string` (non-null) | no | E-C, E-I, E-W, O-C | `NotBlank`, default `draft`; one of `publish, draft, to_validate` |
| `publication_date` | `$publicationDate` | `\DateTime` | yes | E-C, E-I, E-W, O-C | |
| `proposed_by` | `$proposedBy` | `EventProposedByApi` | yes | E-C, E-I, O-C | read-only |
| `next_date` | `$nextDate` | `\DateTime` | yes | E-C, E-I, O-C, O-L | computed, see §8.4 |
| `next_filtered_date` | `$nextFilteredDate` | `\DateTime` | yes | E-C, E-I, O-C, O-L | always identical to `next_date` |
| `related_dates` | `$relatedDates` | `array` | yes | E-C, E-I, O-C | raw PHP-serialised DateTime array (see §14.5) |
| `sponsored_start_date` | `$sponsoredStartDate` | `\DateTime` | yes | E-C, E-I, O-C | |
| `sponsored_end_date` | `$sponsoredEndDate` | `\DateTime` | yes | E-C, E-I, O-C | |
| `place_proposed` | `$placeProposed` | `PlaceProposedApi` | yes | E-C, E-I, O-C | only informative, not a real Place |
| `is_multi_day_event` | `$isMultiDayEvent` | `bool` | yes | E-C, E-I, O-C | denormalised column `event.is_multi_day_event` |
| `organization` | `$organization` | `OrganizationApi` | yes | E-C, E-I, O-C, O-L | **IRI string** in E-C (see §5) |
| `show_in_print` | `$showInPrint` | `bool` | yes | E-C, E-I, O-C | "only for BKA" per the `ApiProperty` description |
| `print_category` | `$printCategory` | `CategoryApi` | yes | E-C, E-I, E-W, O-C | single category for the print edition |
| `og_image` | `$ogImage` | `array` | yes | E-C, E-I, O-C | locale→filename map (`Event::getOgImageForLocale`) |
| `labels` | `$labels` | `array` | yes | E-C, E-I, E-W, O-C, O-L | `NotBlank`, `#[Labels(mandatoryKeys:['description'])]`, `#[EventDescription]`, `#[EventPrintDescription]`; `description` is **stripped** in E-C (see §8.3) |
| `event_type` | `$eventType` | `string` | yes | E-C, E-I, O-C | `"mainevent"` or `"subevent"` |
| `mainevent_id` | `$maineventId` | `int` | yes | E-C, E-I, O-C | set only for sub-events |
| `mainevent_slug` | `$maineventSlug` | `string` | yes | E-C, E-I, O-C | set only for sub-events |
| `tags` | `$tags` | `string[]` | yes | E-C, E-I, O-C, O-L | currently only `["bdc"]` when the owning user's `config.bdc === true` |
| *(not exposed)* | `$user` | `User` | yes | `#[Ignore]` | populated by the mapper for `EventApiVoter` |

`api:occurrence:read-lite-collection` is the trimmed set: `id, slug, name, event_status, place,
categories, date_from, date_to, images, next_date, next_filtered_date, organization, labels, tags`
(confirmed against the generated schema `Event-api.occurrence.read-lite-collection`).

### 6.2 `PlaceApi` — `src/ApiResource/PlaceApi.php`

`shortName: 'Place'`, entity `App\Entity\Place`, provider `EntityToDtoProvider` /
`SlugEntityToDtoItemProvider`. No processor ⇒ read-only.

| JSON key | Type | Null | Groups |
| --- | --- | --- | --- |
| `id` | int | yes | P-C, P-I, Org-I, E-C, E-I, O-C, O-L |
| `slug` | string | yes | P-C, P-I, Org-I, E-C, E-I, O-C, O-L — **identifier** |
| `name` | string | yes | same as slug; `NotBlank`, `Length(max:90)`, DEPRECATED |
| `enabled` | bool | yes | same |
| `private` | bool | yes | P-I, Org-I only |
| `address` | string | yes | P-C, P-I, Org-I, E-C, E-I, O-C, O-L |
| `zip` | string | yes | same |
| `city` | string | yes | same |
| `region` | `RegionApi` | yes | same |
| `about` | string | yes | P-I, Org-I |
| `images` | `ImageApi[]` | yes | P-I, Org-I |
| `website` | string | yes | P-I, Org-I |
| `latitude` | float | yes | P-C, P-I, Org-I, E-C, E-I, O-C, O-L |
| `longitude` | float | yes | same |
| `technical_sheets` | `TechnicalSheetApi[]` | yes | P-I, Org-I |
| `capacity` | string | yes | P-I, Org-I |
| `wheelchair_accessible` | bool (non-null, default false) | no | P-I, Org-I, E-I |
| `wheelchair_accessible_toilets` | bool | no | P-I, Org-I, E-I |
| `wheelchair_accessible_parking` | bool | no | P-I, Org-I, E-I |
| `pro_infirmis_id_source` | string | yes | P-I, Org-I, E-I |
| `pro_infirmis_detail_url` | string | yes | P-I, Org-I, E-I |
| `pro_infirmis_pictograms` | array of objects `{Id, Name, NameFr, NameIt, NameEn, LinkToPictogram, LinkToPictogramSvg, PictogramFileName}` | yes | P-I, Org-I, E-I |
| `labels` | array (non-null, default `[]`) | no | P-C, P-I, Org-I, E-C, E-I, O-C — **absent from O-L** |

### 6.3 `OrganizationApi` — `src/ApiResource/OrganizationApi.php`

| JSON key | Type | Null | Groups |
| --- | --- | --- | --- |
| `id` | int | yes | Org-C, O-C, Org-I, E-I, O-L |
| `slug` | string | yes | Org-C, O-C, Org-I, E-I — **identifier**, absent from O-L |
| `name` | string | yes | Org-C, O-C, Org-I, E-I, O-L; `NotBlank`, `Length(max:100)`, DEPRECATED |
| `enabled` | bool | yes | Org-C, O-C, Org-I, E-I |
| `sub_title` | string | yes | Org-C, O-C, Org-I, E-I, O-L |
| `categories` | `CategoryApi[]` | yes | Org-C, O-C, Org-I, E-I |
| `address` | string | yes | Org-I, E-I |
| `post_office_box` | string | yes | Org-I |
| `zip` | string | yes | Org-I, E-I |
| `city` | string | yes | Org-I, E-I |
| `region` | `RegionApi` | yes | Org-I |
| `latitude` | float | yes | Org-C, O-C, Org-I, E-I, O-L |
| `longitude` | float | yes | same |
| `about` | string | yes | Org-I |
| `images` | `ImageApi[]` | yes | Org-I |
| `website` | string | yes | Org-I; `Length(max:70)` |
| `legal_status` | string | yes | Org-I |
| `contacts` | `ContactApi[]` | yes | Org-I |
| `users` | `UserApi[]` | yes | Org-I |
| `places` | `PlaceApi[]` | yes | Org-I |
| `affiliations` | `AffiliationApi[]` | yes | Org-I, E-I |
| `labels` | array | yes | Org-C, O-C, Org-I, O-L |

### 6.4 `ImageApi` — `src/ApiResource/ImageApi.php`

Operations: `GetCollection`, `Get`, `Post` (multipart), `Delete`. `outputFormats: jsonld` only.
`normalizationContext: ['groups' => ['api:image:read-item']]` at resource level.

| JSON key | Type | Null | Writable | Groups | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | int | yes | no | P-I, Org-I, Img, E-C, O-C, E-I, O-L | identifier |
| `legend` | string | yes | no | same | legacy, superseded by `labels.legend` |
| `file` | binary | yes | **write-only** | (no group ⇒ multipart only) | `#[UploadableField(mapping:'image', fileNameProperty:'fileName')]`, `#[Assert\NotNull]`. Comment at line 82: "TODO only jpg jpeg and png extensions" — i.e. the extension whitelist in the docs is **not enforced in code** |
| `file_name` | string | yes | no | P-I, Org-I, Img | |
| `alt` | `array<string,string>` | yes | no | P-I, Org-I, Img, E-C, O-C, E-I, O-L | `Image::getAltLabels()` = `labels['alt'] ?? null` |
| `labels` | array | yes | yes | same as `alt` | e.g. `{"legend":{"fr":…,"de":…},"alt":{…}}` |
| `url` | string | yes | no | same | `<absolute base URL>` + `img/` + `rawurlencode(fileName)` |
| `url_webp` | string | yes | no | same | LiipImagine filter `webp` |
| `url_webp_size_512_q_65` | string | yes | no | same | LiipImagine filter `webp_size_512_q_65` |
| `url_webp_size_1024_q_65` | string | yes | no | same | LiipImagine filter `webp_size_1024_q_65` |
| `file_relative_path` | string | yes | no | *(serialized only in the group-less `Image` schema)* | from `getFileRelativePath()` |

LiipImagine filter definitions (`config/packages/liip_imagine.yaml`):
`webp` = thumbnail inset 2000×2000, q80, cwebp q70; `webp_size_512_q_65` = inset 512×512, q65,
cwebp q70; `webp_size_1024_q_65` = inset 1024×1024, q65, cwebp q70. Loader is a Flysystem loader on
`r2_image.storage` (Cloudflare R2); resolver is `web_path` under `public/`.

The POST OpenAPI body is hand-written (`ImageApi.php:30-55`):

```
multipart/form-data:
  labels: string(json)  e.g. {"legend":{"fr":"legend FR","de":"legend DE"},"alt":{"fr":"alt FR","de":"alt DE"}}
  file:   string(binary)
```

### 6.5 `CategoryApi` — `src/ApiResource/CategoryApi.php`

| JSON key | Type | Groups | Notes |
| --- | --- | --- | --- |
| `id` | int | Cat, Org-C, Org-I, E-C, E-I, O-C, O-L | identifier |
| `label` | `array` (non-null, default `[]`) | same | `{"fr":"Musique","de":"Musik"}` |
| `tag_color` | string\|null | same | `#01646A` |
| `hidden` | bool\|null | same | |
| `children` | `CategoryApi[]`\|null | **Cat only** | only non-hidden children (`CategoryEntityToApiMapper.php:40-49`) |
| `level` | int\|null | Cat, Org-C, Org-I, E-C, E-I, O-C, O-L | 1 if it has children **or** has no parent, 2 if it is a leaf with a parent |

### 6.6 `RegionApi`, `AudienceApi`, `AffiliationApi`

| Resource | Fields | Groups |
| --- | --- | --- |
| `RegionApi` | `id` (identifier), `label: array`, `hidden: bool\|null` (default false) | P-C, P-I, Org-I, E-C, E-I, O-C, O-L |
| `AudienceApi` | `id` (identifier), `label: array` | Aud, E-C, E-I, O-C, O-L |
| `AffiliationApi` | `id` (identifier), `label: array` | Org-I, E-I |

### 6.7 Nested-only resources (`operations: []`)

| Resource | Fields (JSON keys) | Appears in |
| --- | --- | --- |
| `ContactApi` | `id`, `email`, `designation_email`, `phone_number`, `designation_phone`, `labels` | Org-I |
| `UserApi` | `id`, `email`, `enabled` | Org-I |
| `TechnicalSheetApi` | `id`, `title`, `file_name`, `labels`, `url` | P-I, Org-I |
| `RateApi` | `id`, `price: float\|null`, `designation: string\|null` (DEPRECATED), `labels: array` | E-I, E-C, O-C, O-L; `price` + `labels` also in E-W |
| `TicketingApi` | `id`, `labels: array`, `ticketing_designation: string` | E-I, E-C, O-C; both writable fields in E-W |
| `VideoApi` | `id`, `embed_link: string` (`NotBlank`) | E-I, E-C, O-C; `embed_link` also in E-W |
| `SubEventApi` | `id`, `date_from`, `date_to`, `opening_time` | **E-W only**; class constraint `#[DatesFromToConsistent]` |
| `PlaceProposedApi` | `id`, `name`, `address`, `zip`, `city`, `latitude`, `longitude` | E-I, E-C, O-C |
| `EventProposedByApi` | `id`, `firstname`, `lastname`, `email`, `phone`, `organization: string` | E-I, E-C, O-C |
| `OccurrenceApi` | `id`, `date_from`, `date_to`, `event: EventApi` | O-C — but it is only used as the declared `input:` of the agenda operations; the actual output is `EventApi` |

`TicketingApi.ticketing_designation` is constrained to `App\Enum\TicketingDesignation::VALUES`:
`eventbrite, eventfrog, fnactickets, idticketing, infomaniak, monbillet, petzi, smeetz, starticket,
ticketcorner, ticketmaster, weezevent, other`.

### 6.8 Label (translation) validation

`#[Labels]` (`src/Validator/Labels.php`, validator `LabelsValidator.php`) validates the `labels`
array against `src/Validator/labels.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "patternProperties": {
    ".*": {
      "type": "array",
      "patternProperties": { "^[a-z]{2}$": { "type": ["string","null"] } },
      "minItems": 1,
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

i.e. `labels` is a map `key → { twoLetterLocale → string|null }`. Mandatory keys per resource:
`EventApi.labels` ⇒ `description`; `RateApi.labels` ⇒ `designation`;
`TicketingApi.labels` ⇒ `ticketingUrl` **and** `designation`.

Length limits (after `strip_tags` + `html_entity_decode` + `trim`, measured with `strlen`, i.e. **bytes**):

| Constraint | Field | Max |
| --- | --- | --- |
| `EventDescriptionValidator::DESCRIPTION_MAX_LENGTH` | `labels.description.<lang>` | 6400 |
| `EventPrintDescriptionValidator::PRINT_DESCRIPTION_MAX_LENGTH` | `labels.printDescription.<lang>` | 256 |
| `RateDesignationValidator::DESIGNATION_MAX_LENGTH` | `labels.designation.<lang>` | 24 |

`#[EventImages]` (`EventImagesValidator`) rejects a write whose `images[]` contains an image the
current user may not edit (skipped for `ROLE_ADMIN`).
`#[DatesFromToConsistent]` rejects `dateFrom > dateTo` on `EventApi` and `SubEventApi`.
`RateApi.price` additionally has `NotBlank`, `PositiveOrZero`, `Range(0..10000)`.

---

## 7. State providers and processors (`src/State/*`)

### 7.1 `EntityToDtoProvider` (default provider for every resource)

`src/State/EntityToDtoProvider.php`

* Collections: delegates to API Platform's `CollectionProvider` (which runs the ORM extensions and
  pagination), asserts the result is a `Paginator`, maps each entity through MicroMapper into the
  resource DTO, and returns a `TraversablePaginator` preserving `currentPage`, `itemsPerPage`,
  `totalItems` (lines 31-56).
* Special case: for `get_published_events` it adds `'calculateNextDate' => true` to the mapping
  context (lines 39-43) — the **only** place `next_date` is computed for non-occurrence operations.
* Items: delegates to `ItemProvider`, returns `null` when nothing found, else maps to DTO.

### 7.2 `SlugEntityToDtoItemProvider`

`src/State/SlugEntityToDtoItemProvider.php` — provider for `GET /api/v2/events/{slug}`,
`/organizations/{slug}`, `/places/{slug}`.

Reimplements `ItemProvider` but looks up by `slug` instead of the identifier link:

1. resolve the entity class from `stateOptions`;
2. read `$request->attributes->get('slug')`;
3. `findEntity($repository, 'slug', $identifier, …)`;
4. **if `ACTIVATE_SLUG_GENERATOR_WITH_ID` is true** also try `oldSlug`, then, if the identifier
   matches `/-(\d+)$/`, try that numeric `id` (lines 52-71);
5. `findEntity()` builds `SELECT o FROM <Entity> o WHERE o.<field> = :<field>` and then runs **every**
   service tagged `api_platform.doctrine.orm.query_extension.item` against it.

Item extensions in registration order (`debug:container --tag=api_platform.doctrine.orm.query_extension.item`):

```
App\ApiPlatform\EventExtension           (priority default 0)
App\ApiPlatform\OrganizationExtension    (0)
App\ApiPlatform\PlaceExtension           (0)
api_platform.doctrine.orm.query_extension.eager_loading   (-8)
api_platform.doctrine.orm.extension.parameter_extension   (-9)
```

So `GET /api/v2/events/{slug}` is subject to the same publish + ownership WHERE clauses as the
collection (§9.2).

BKA config: `ACTIVATE_SLUG_GENERATOR_WITH_ID` is not set in `docker-compose.yaml`, and
`.env:94` has `ACTIVATE_SLUG_GENERATOR_WITH_ID=false` → the `-{id}` and `oldSlug` fallbacks are
**off** for BKA. (`.env.test:9` turns it on for the test suite, which is why
`tests/Functional/ApiEventTest.php:331` `testGetEventWithIdSuccess` passes with `fake-slug-{id}`.)
Production value is UNVERIFIED — the production env file is not in the repo; note that `event`,
`place` and `organization` all have an `old_slug` column in the live DB, so the feature has been
exercised at some point.

### 7.3 `OccurrenceEntityToEventDtoProvider`

`src/State/OccurrenceEntityToEventDtoProvider.php` — provider for all six `/events/agenda*`
operations.

1. Gets a `Paginator` of `EventOccurrence` from `CollectionProvider` (extensions already applied).
2. Computes `$dateFromFilter`: for `organization`/`place`/`similar`/`sponsored` it is forced to
   `new \DateTime()`; for `agenda`/`agenda-lite` it is `date_from` parsed as
   `\DateTimeInterface::ATOM`, defaulting to now; a malformed value throws
   `InvalidArgumentException('Wrong format for "date_from" query parameter.')` → 400.
3. For each occurrence, maps `occurrence->getEvent()` to `EventApi` with
   `MicroMapperInterface::MAX_DEPTH => 3` and the operation's groups, then **overwrites**
   `nextDate` and `nextFilteredDate` with `occurrence->getDateFrom()` (lines 73-74).
4. `count_only=true` ⇒ `$dtos = []` (totalItems still reported).
5. `group_by_month=true` ⇒ `$dtos = EventListManipulator::groupApiEventsArrayByMonth($dtos, $dateFromFilter, $query)`.
6. Returns a `TraversablePaginator` using the **occurrence** pagination numbers
   (comment at line 87: "trick here, we use the occurrence pagination even if we return events dtos").

Consequence: `totalItems` on every `/events/agenda*` endpoint counts **occurrences**, not events,
and the same event appears once per matching occurrence.

`EventListManipulator::groupApiEventsArrayByMonth` (`src/Event/EventListManipulator.php:154-190`):

```php
foreach ($events as $event) {
    $date = $event->nextDate;
    if (null === $date || $date < $dateFromFilter) { $date = $dateFromFilter; }
    $key = $date->format('Y').'_'.$date->format('m');   // e.g. "2025_01"
    // append to the bucket, creating {date, events: []} when missing
}
usort(...)  // chronological
```

The member array then becomes `[{ "date": "2024_12", "events": [ …Event… ] }, …]` — a different
response schema, as the OpenAPI description warns.

### 7.4 `EntityClassDtoStateProcessor`

`src/State/EntityClassDtoStateProcessor.php` — processor for `EventApi` (all writes) and the
resource-level processor of `ImageApi`.

```php
$entityClass = $operation->getStateOptions()->getEntityClass();
$entity = $this->microMapper->map($dto, $entityClass);        // DTO -> entity
if ($operation instanceof DeleteOperationInterface) { $removeProcessor->process($entity, …); return null; }
$persistProcessor->process($entity, …);                        // flush
return $this->microMapper->map($entity, get_class($data), ['groups' => $normalizationGroups]);
```

Note the write path never sets `Event::$user` — nothing in `EventApiToEntityMapper` assigns the
authenticated user to a newly created event (see §15, defect D6).

### 7.5 `ImageEntityDtoPostStateProcessor`

`src/State/ImageEntityDtoPostStateProcessor.php` — only for `POST /api/v2/images`. Same as above but
hardcodes the response group `api:image:read-item` and never deletes.

---

## 8. DTO ⇄ entity mapping (`src/Mapper/*`, symfonycasts/micro-mapper 0.2.1)

### 8.1 How MicroMapper depth works

`vendor/symfonycasts/micro-mapper/src/MicroMapper.php`: each mapper has `load()` (create the target
object and set its identifier) and `populate()` (fill everything else). `MAX_DEPTH => N` in the
context means `populate()` is skipped once `currentDepth >= maxDepth`, so the deepest objects carry
**only their identifier** — which is exactly what the serializer needs to render them as an IRI.
A circular reference while fully populating throws `Max depth reached` / "Circular reference
detected with micro mapper".

### 8.2 Mapper inventory

| Mapper file | From | To | Notes |
| --- | --- | --- | --- |
| `EventEntityToApiMapper.php` | `Event` | `EventApi` | the big one, see §8.3 |
| `EventApiToEntityMapper.php` | `EventApi` | `MainEvent` | write path, see §8.5 |
| `OccurrenceEntityToApiMapper.php` | `EventOccurrence` | `OccurrenceApi` | maps `dateFrom`, `dateTo`, and `event` — **but maps the event to `OccurrenceApi`, not `EventApi`** (line ~40, almost certainly a copy/paste bug; unreachable in practice because the agenda operations use `OccurrenceEntityToEventDtoProvider`) |
| `PlaceEntityToApiMapper.php` | `Place` | `PlaceApi` | `$readItem` gate, see §8.4 |
| `PlaceApiToEntityMapper.php` | `PlaceApi` | `Place` | `load()` = `find($dto->id)` or `new Place()`; `populate()` is a no-op |
| `OrganizationEntityToApiMapper.php` | `Organization` | `OrganizationApi` | `$readItem` gate |
| `ImageEntityToApiMapper.php` | `Image` | `ImageApi` | builds `url`, `url_webp*` |
| `ImageApiToEntityMapper.php` | `ImageApi` | `Image` | sets `labels` and `file` |
| `CategoryEntityToApiMapper.php` | `Category` | `CategoryApi` | filters hidden children, computes `level` |
| `CategoryApiToEntityMapper.php` | `CategoryApi` | `Category` | lookup-only |
| `AudienceEntityToApiMapper.php` / `AudienceApiToEntityMapper.php` | `Audience` | `AudienceApi` | both directions; `populate()` is a no-op on write |
| `RegionEntityToApiMapper.php` | `Region` | `RegionApi` | |
| `AffiliationEntityToApiMapper.php` | `Affiliation` | `AffiliationApi` | |
| `ContactEntityToApiMapper.php` | `Contact` | `ContactApi` | |
| `UserEntityToApiMapper.php` | `User` | `UserApi` | only `email`, `enabled` |
| `TechnicalSheetEntityToApiMapper.php` | `TechnicalSheet` | `TechnicalSheetApi` | builds absolute `url` |
| `RateEntityToApiMapper.php` | `Rate` | `RateApi` | `price = intval(entity.price) / 100` |
| `RateApiToEntityMapper.php` | `RateApi` | `Rate` | `entity.price = dto.price * 100` |
| `TicketingEntityToApiMapper.php` / `TicketingApiToEntityMapper.php` | `Ticketing` | `TicketingApi` | both directions; `TicketingDesignation` enum ⇄ string |
| `VideoEntityToApiMapper.php` / `VideoApiToEntityMapper.php` | `Video` | `VideoApi` | both directions; only `embedLink` |
| `SubEventApiToEntityMapper.php` | `SubEventApi` | `SubEvent` | `dateFrom`, `dateTo`, `openingTime` |
| `PlaceProposedEntityToApiMapper.php` | `PlaceProposed` | `PlaceProposedApi` | |
| `EventProposedByEntityToApiMapper.php` | `EventProposedBy` | `EventProposedByApi` | |

There is deliberately **no** `Organization → entity`, `Region → entity`, `Contact → entity`, etc.
mapper: those resources are read-only.

`rate.price` is a `VARCHAR(255)` in Postgres storing **integer cents** (sampled rows: `3500`, `4000`),
so the API exposes `35`, `40`.

### 8.3 `EventEntityToApiMapper` in detail

`src/Mapper/EventEntityToApiMapper.php`

* `load()` creates `new EventApi()` and sets only `slug` (so a depth-limited Event becomes
  `/api/v2/events/{slug}`).
* `populate()` copies the scalar columns verbatim, then:

| Target | Nested mapping depth | Notes |
| --- | --- | --- |
| `place` | `MAX_DEPTH => 2`, groups forwarded | |
| `categories[]` | `MAX_DEPTH => 1` | the Category itself is fully populated; its own `children` stop at `load()` (and `children` is not in any event group anyway) |
| `images[]`, `videos[]`, `rates[]`, `ticketings[]` | `MAX_DEPTH => 1` | |
| `audience`, `proposedBy`, `placeProposed`, `printCategory` | `MAX_DEPTH => 1` | |
| `organization` | `MAX_DEPTH => 2`, groups forwarded | |

* `calculateNextDate` context ⇒ `nextDate = nextFilteredDate = EventDatesCalculator::getNextEventDate($entity, new \DateTime())`
  (lines 121-125).
* **Collection trimming**: when `api:event:read-collection` is active, `labels['description']` is
  `unset()` before assignment — "specifically remove the description field that caused problem in
  lists" (lines 148-155). `labels.printDescription` and `labels.ticketingUrl` survive.
* `eventType` = `'mainevent'` / `'subevent'`; `maineventId` / `maineventSlug` only for `SubEvent`.
* `tags` = `['bdc']` iff `$entity->getUser()?->getConfig()['bdc'] === true` ("Bulle de culture"),
  otherwise left `null`.
* `$dto->user = $entity->getUser()` — `#[Ignore]`d but read by `EventApiVoter`.

### 8.4 Group-gated population

`PlaceEntityToApiMapper::populate()` and `OrganizationEntityToApiMapper::populate()` check the
context groups and only fill the expensive fields when the group is an *item* group:

```php
// PlaceEntityToApiMapper.php:44-48
if (in_array('api:place:read-item', $groups)
 || in_array('api:organization:read-item', $groups)
 || in_array('api:event:read-item', $groups)) { $readItem = true; }
```

Gated on Place: `private`, `about`, `images`, `website`, `technicalSheets`, `capacity`,
`wheelchairAccessible*`, `proInfirmis*`.
Gated on Organization: `postOfficeBox`, `region`, `about`, `images`, `website`, `legalStatus`,
`contacts`, `users`, `places`, `affiliations`.

This is a second, independent filter on top of the serializer groups — i.e. even if a group allowed
a field, the mapper would leave it null.

**`next_date` on the item endpoint is always `null`.** The mapper never copies
`$entity->getNextDate()`; it only sets `nextDate` when `calculateNextDate` is in the context
(collection `/api/v2/events` only) or when `OccurrenceEntityToEventDtoProvider` overwrites it.
`EventDoctrineListener` (`src/EventListener/EventDoctrineListener.php:20-29`) would have computed it
on `postLoad`, but it is disabled when `USE_OPTIMIZED_EVENT_LOAD` is true — which is the BKA setting
(`docker-compose.yaml:52`).

### 8.5 `EventApiToEntityMapper` (write path)

`src/Mapper/EventApiToEntityMapper.php`

* `load()`: `$dto->slug ? $eventRepository->findOneBy(['slug' => $dto->slug]) : new MainEvent()`.
  So POST creates a `MainEvent`; PATCH re-reads by slug.
* `populate()` assigns `name, eventStatus, place, dateFrom, dateTo, openingTime, recurrence,
  recurrenceWeekDays, specialRate, audience, publicationDate, publicationStatus, labels`
  unconditionally — **including when a PATCH omits them**, because API Platform denormalizes the
  merge-patch onto the existing DTO first and the DTO is then fully copied.
* Collection fields are only touched when not `null`
  (`subEvents, categories, printCategory, images, videos, rates, ticketings`), and are **replaced
  wholesale** via `PropertyAccessor::setValue($entity, '<field>', $newArray)` — hence the repeated
  `ApiProperty(description: 'NOTICE: PATCH on … will automatically remove old … and create new ones')`.
* Setting `subEvents` also forces `$entity->setUpdatedAt(new \DateTime())` so Doctrine sees a change.
* `place`, `audience`, `categories`, `printCategory` are mapped with `MAX_DEPTH => 0`, i.e. only
  `load()` runs → they resolve to the **existing** entity by id/slug and are never modified.
* Nothing sets `Event::$user`, `$organization`, `$showInPrint`, `$sponsored*`, `$ticketingUrl`,
  `$proposedBy`, `$placeProposed` from the API.

### 8.6 What happens on flush (relevant to API writes)

`src/EventListener/OnFlushEventListener.php` is registered for `onFlush` (`config/services.yaml:55-57`)
and runs for every inserted/updated `Event`:

1. `updateRelatedDates()` — for `recurrence === 'week'` fills `relatedDates` with every matching
   weekday between `dateFrom` and `dateTo`; otherwise with the main event's `dateFrom` plus each
   sub-event's `dateFrom`.
2. `setIsMultiDayEvent($event->isMultiDayEvent())`.
3. For a `MainEvent`: pushes `name, eventStatus, place, organization, description, specialRate,
   publicationStatus, audience, labels, relatedDates, isMultiDayEvent, user, showInPrint,
   printCategory` and the whole category set down onto every `SubEvent`.
4. `updateOccurrences()` — **deletes all existing `event_occurrence` rows for the event and
   recreates them**: one row for `recurrence = none`, or one row per weekly recurrence date
   (`EventDatesCalculator::getFromToRelatedRecurrenceDates`).

So a single `PATCH /api/v2/events/{slug}` can rewrite hundreds of occurrence rows and mutate every
sub-event.

---

## 9. The ORM query extensions — the real visibility rules

All five live in `src/ApiPlatform/`. They are autoconfigured (`config/services.yaml:13-15`
`autoconfigure: true`) with **no explicit priority**, so they run at priority 0, i.e. **before** all
built-in extensions:

```
App\ApiPlatform\CategoryExtension          (0)
App\ApiPlatform\EventExtension             (0)
App\ApiPlatform\OccurrenceExtension        (0)
App\ApiPlatform\OrganizationExtension      (0)
App\ApiPlatform\PlaceExtension             (0)
api_platform…query_extension.filter        (-16)
api_platform…extension.parameter_extension (-16)
api_platform…filter_eager_loading          (-17)
api_platform…eager_loading                 (-18)
api_platform…query_extension.order         (-32)
api_platform…query_extension.pagination    (-64)
```

(`php bin/console debug:container --tag=api_platform.doctrine.orm.query_extension.collection`.)

Each extension guards on the **entity** class (not the DTO class), because `stateOptions` makes the
Doctrine providers pass the entity class through.

> There are **no** API Platform `ApiFilter` declarations anywhere in the codebase
> (`grep -rn "ApiFilter" src/` → no match). Every `QueryParameter` in `src/ApiResource/*` is
> documentation + validation only; the actual filtering is hand-written in these extensions reading
> `$context['request']->query` directly. This is why undocumented parameters still work on
> `/events/agenda` (§4.1 row 11).

### 9.1 `CategoryExtension`

`src/ApiPlatform/CategoryExtension.php` — collection only, `Category::class`.

```sql
AND (c.hidden IS NULL OR c.hidden = false)
```

Live data: 25 of 30 categories are visible (`hidden` false/null). Hidden in BKA prod: ids 2
(Concert), 4 (Diffusion sonore), 6 (Arts visuels), 7 (Design), 13 (Cirque).

### 9.2 `EventExtension`

`src/ApiPlatform/EventExtension.php` — collection **and** item, `Event::class`.
Docblock: "1. Limit to only published events … 2. Limit to owner, same organizations of related
place or admin. 3. other parameters."

**`applyCommonRules()` (lines 84-140), applied to both item and collection:**

```sql
AND e.publicationStatus = 'publish'
AND (e.publicationDate IS NULL OR e.publicationDate <= :now)      -- :now = request time
LEFT JOIN e.place place                                            -- always added
-- if NOT (ROLE_ADMIN or ROLE_BROADCAST_PARTNER) and a user is logged in:
LEFT JOIN e.organization organization
LEFT JOIN place.organization pOrganization
AND (
     (e.user IS NOT NULL AND e.user = :user)
  OR (e.organization IS NOT NULL AND organization.id IN (:userOrganizations))
  OR (e.place IS NOT NULL AND place.organization IS NOT NULL AND pOrganization.id IN (:userOrganizations))
)
```

`:userOrganizations` = ids of `$user->getOrganizations()`. If no user is authenticated the ownership
clause is skipped entirely (comment: "ignore unlogged queries, will be caught later by security").

**`getPublishedEventsOperation()` (lines 142-189), only for `get_published_events`:**

| Query param | Effect |
| --- | --- |
| `date_from` | parsed with `\DateTime::createFromFormat(\DateTimeInterface::ATOM, …)`; `false` ⇒ `InvalidArgumentException('Wrong format for "date_from" query parameter.')` → 400. Adds `AND e.dateFrom >= :dateFrom` |
| `keyword` | adds the OR block below |
| `region[]` | `OccurrenceExtension::checkAddRegionFilter($request, $qb, 'place')` → `AND (place.region = :region_0 OR place.region = :region_1 …)` |
| `onlyMainEvents` | **string comparison** `'true' === $onlyMainEvents` ⇒ `AND e INSTANCE OF App\Entity\MainEvent` (i.e. `event.type = 'mainevent'`) |

keyword OR block (lines 166-175):

```
ILIKE(e.name, :keyword) = true
OR ILIKE(e.archivedOrganization, :keyword) = true
OR ILIKE(e.archivedPlace, :keyword) = true
OR ILIKE(place.name, :keyword) = true
OR ILIKE(JSON_KEY_VALUES_TEXT(e.labels, 'name'), :keyword) = true
```

`:keyword` = `makeLikeParam($keyword)` = `%<escaped>%`.

**`toArrayOfIntegers()` (static, lines 31-50)** is the shared id-list parser used by every `*[]`
filter:

```php
$valuesToProcess = $array;
if (1 === count($array)) { $valuesToProcess = explode(',', $array[0]); }   // "2,3" in a single entry
foreach ($valuesToProcess as $string) {
    $int = intval($string);
    if (0 === $int) { return false; }        // anything non-numeric, or a literal 0, fails
    $intArray[] = $int;
}
```

So `?region[]=2,3` and `?region[0]=2&region[1]=3` both work; `?region[]=0` or `?region[]=abc`
produce a 400. `?region=2` (scalar, no brackets) produces a Symfony `BadRequestException` → 400
before the extension runs, because `InputBag::all('region')` requires an array
(`vendor/symfony/http-foundation/ParameterBag.php:47-49`). Confirmed in
`tests/Functional/ApiPlaceTest.php:332-343` (`place[]=invalid,input` → 400).

### 9.3 `OccurrenceExtension`

`src/ApiPlatform/OccurrenceExtension.php` (472 lines) — collection only, `EventOccurrence::class`.
Docblock: "WARNING: must be aligned with `App\Security\Voters\EventVoter`" and "must be aligned
with what's in `EventOccurrenceRepository::occurrenceEngineSearch()`, representing still in use api
v1 search."

Operation-name constants:

```php
OPERATION_NAME_GET_PUBLISHED_EVENTS_FOR_ORGANIZATION = 'get_published_events_for_organization'
OPERATION_NAME_GET_PUBLISHED_EVENTS_FOR_PLACE        = 'get_published_events_for_place'
OPERATION_NAME_GET_PUBLISHED_EVENTS_SIMILAR          = 'get_published_events_similar'
OPERATION_NAME_GET_PUBLISHED_EVENTS_SPONSORED        = 'get_published_events_sponsored'
OPERATION_NAME_GET_PUBLISHED_EVENTS_OCCURRENCES      = 'get_published_events_occurrences'
OPERATION_NAME_GET_PUBLISHED_EVENTS_OCCURRENCES_LITE = 'get_published_events_occurrences_lite'
```

**Common preamble (lines 76-144), all six operations:**

```sql
LEFT JOIN o.event      event
LEFT JOIN event.place  place
LEFT JOIN place.organization organization
WHERE event.publicationStatus = 'publish'
  AND (event.publicationDate IS NULL OR event.publicationDate <= :fromDate)
```

`:fromDate` is the parsed `date_from` for `agenda`/`agenda-lite`, and `now()` for the other four
(lines 105-110). `$dateFrom` itself defaults to `now()`.

Non-admin / non-partner ownership clause (lines 119-144):

```sql
AND ( (event.user IS NOT NULL AND event.user = :user)
   OR (event.place IS NOT NULL AND place.organization IS NOT NULL
       AND organization.id IN (:userOrganizations)) )
```

**Note the asymmetry with `EventExtension`: there is no `event.organization` branch here.** An event
owned by one of the user's organizations but with no place (or a place belonging to another
organization) is visible on `/api/v2/events` but invisible on `/api/v2/events/agenda*`.
In BKA prod 2 562 of 34 279 events have `place_id IS NULL` while 27 949 have an `organization_id`,
so the difference is material.

**Per-operation branches:**

`get_published_events_for_organization` (lines 147-173) — `slug` required (`NotFoundHttpException`
if absent, and if no `Organization` matches):

```sql
AND (place.organization = :organization OR event.organization = :organization)
AND o.dateFrom >= :now
ORDER BY o.dateFrom ASC
```

`get_published_events_for_place` (175-196) — `slug` → `Place`:

```sql
AND event.place = :place
AND o.dateFrom >= :now
ORDER BY o.dateFrom ASC
```

`get_published_events_similar` (198-231) — `slug` → `Event`; applies `region[]` against `place`; then:

```sql
LEFT JOIN event.categories categories
AND event.id != :id
AND o.dateFrom >= :now
AND categories IN (:categories)        -- the source event's category ids
ORDER BY o.dateFrom ASC
```

`get_published_events_sponsored` (233-242):

```sql
AND event.sponsoredStartDate <= :now
AND event.sponsoredEndDate   >= :now
AND o.dateFrom >= :now
ORDER BY o.dateFrom ASC
```

`get_published_events_occurrences` **and** `…_lite` (244-470) — the full filter set. Extra joins
added first: `LEFT JOIN event.placeProposed placeProposed`, `LEFT JOIN event.categories categories`.

| Param | Parsing | SQL added |
| --- | --- | --- |
| `member` | presence only (`null !== $member`, so `member=false` still triggers it) | `INNER JOIN event.user user` + `AND (event.user IS NOT NULL AND user.member = true)` |
| `date_from` | ATOM; default `now()` | the window below |
| `date_to` | ATOM; if time is exactly `00:00:00`, `+23:59:59` is added | `AND o.dateFrom <= :end` |
| *(always)* | | `AND o.dateTo >= :start` where `:start` = `date_from` |
| *(always)* | | `AND (o.dateFrom < :dayBefore OR o.dateFrom > :endOfDayBefore)` with `:dayBefore` = `date_from -1 day 00:00:00`, `:endOfDayBefore` = `date_from -1 day 23:59:59` — "ignore current events with starting date the day before startDate" |
| `keyword` | string | 10-way OR, see §10 |
| `category[]` | `toArrayOfIntegers` | `AND categories.id IN (:idsCat)` |
| `place[]` | `toArrayOfIntegers` | `AND (event.place = :place_0 OR …)` |
| `region[]` | `toArrayOfIntegers` | `AND (place.region = :region_0 OR …)` |
| `audience[]` | `toArrayOfIntegers` | `AND (event.audience = :audience_0 OR …)` |
| `affiliation[]` | `toArrayOfIntegers` | `INNER JOIN place.organization placeOrganization INNER JOIN placeOrganization.affiliations affiliations` + `AND affiliations.id IN (:idsAff)` — note this uses a **second** alias for the same `place.organization` join and therefore ignores `event.organization` affiliations |
| `accessibility_auto_declaration[]` | each value validated against `Place::getAccessibilityAutoList()` = `wheelchairAccessible`, `wheelchairAccessibleToilets`, `wheelchairAccessibleParking`; invalid ⇒ `InvalidArgumentException` → 400 | `AND (place.<value> = true OR …)` — the value is **interpolated into DQL** after the whitelist check |
| `accessibility_proinfirmis[]` | `toArrayOfIntegers` | `AND (JSON_CONTAINS(JSON_EXTRACT(place.proInfirmisPictograms, '$[*].Id'), :accessibility<N>, '$') = 1 OR …)` — **MySQL-only SQL, see §10.4** |
| `geoNorthEast[lat\|lng]`, `geoSouthWest[lat\|lng]` | both corners required (else `InvalidArgumentException`), each validated by `#[GeoCoordinates]` (`preg_match('/^[0-9]+\.?[0-9]*$/')` on both components — **negative coordinates are rejected**) | `AND ((place.latitude BETWEEN :a AND :c AND place.longitude BETWEEN :b AND :d) OR (placeProposed.latitude BETWEEN :a AND :c AND placeProposed.longitude BETWEEN :b AND :d))` |
| `multi_day` | **only `'false'` does anything** | `AND event.isMultiDayEvent = false`. `multi_day=true` is a no-op |
| `free` | **only `'true'` does anything** | `AND (event.specialRate = 'free_entry' OR event.specialRate = 'free_price')` |
| `group_by_month` | handled in the provider, not the query | reshapes `member` |
| `count_only` | handled in the provider | empties `member` |

`checkAddRegionFilter()` is a public static helper (lines 40-59) shared with `EventExtension` and
`PlaceExtension`.

### 9.4 `OrganizationExtension`

`src/ApiPlatform/OrganizationExtension.php` — collection **and** item, `Organization::class`.
Docblock: "must be aligned with `App\Security\Voters\OrganizationVoter`".

`applyCommonRules()` (lines 120-143), item **and** collection:

```sql
AND o.enabled = true
-- unless ROLE_ADMIN or ROLE_BROADCAST_PARTNER:
AND o.id IN (:ids)          -- ids of $user->getOrganizations()
```

Collection-only filters:

| Param | SQL |
| --- | --- |
| `keyword` | `AND (ILIKE(o.name, :keyword) = true OR ILIKE(JSON_KEY_VALUES_TEXT(o.labels, 'name'), :keyword) = true)` |
| `category[]` | `INNER JOIN o.categories c` + `AND c.id IN (:ids)` — **validated through `toArrayOfIntegers` but the raw strings are bound** (line 71 binds `$categoryIds`, not `$ids`) |
| `geoNorthEast` / `geoSouthWest` | both required; validated by `#[GeoCoordinates]`; `AND o.latitude BETWEEN :a AND :c AND o.longitude BETWEEN :b AND :d` |

Live data: 585 of 741 organizations are `enabled`.

### 9.5 `PlaceExtension`

`src/ApiPlatform/PlaceExtension.php` — collection **and** item, `Place::class`.
Docblock: "must be aligned with `App\Security\Voters\PlaceVoter`".

`applyCommonRules()` (lines 93-117), item **and** collection — ownership only:

```sql
-- unless ROLE_ADMIN or ROLE_BROADCAST_PARTNER, and only when a user is authenticated:
AND p.id IN (:ids)   -- every place of every organization the user belongs to; [] if none
```

Collection-only:

```sql
AND p.enabled = true
```

plus:

| Param | SQL |
| --- | --- |
| `keyword` | `AND (ILIKE(p.name, :keyword) = true OR ILIKE(p.city, :keyword) = true)` — note: **no** `JSON_KEY_VALUES_TEXT` here, unlike Event/Organization |
| `place[]` | `AND (p.id = :place_0 OR …)` — validated through `toArrayOfIntegers` but, like `OrganizationExtension`, the loop binds the **raw** `$placeIds` values (lines 73-76) |
| `region[]` | `OccurrenceExtension::checkAddRegionFilter($request, $qb, $rootAlias)` |

**Asymmetry worth porting carefully:** the `enabled = true` filter is applied only for the
collection, so `GET /api/v2/places/{slug}` can return a **disabled** place, whereas
`GET /api/v2/organizations/{slug}` cannot return a disabled organization.
Live data: 1 013 of 1 276 places are enabled; 255 are `private` (the `private` flag has **no** effect
on API visibility, it is only exposed as a field in the item groups).

### 9.6 `ItemApiIriConverterDecorator`

`src/ApiPlatform/ItemApiIriConverterDecorator.php`, `#[AsDecorator(decorates: 'api_platform.iri_converter')]`.

`getIriFromResource()`:

* `OrganizationApi` ⇒ `'/api/v2/organizations/'.$resource->slug`, or
  `InvalidArgumentException('Invalid item')` if the slug is null;
* `PlaceApi` ⇒ `'/api/v2/places/'.$resource->slug`, same guard;
* anything else ⇒ delegate.

`getResourceFromIri()`:

* IRI starting with `/api/v2/organizations/` ⇒ strip the prefix, `OrganizationRepository::findOneBy(['slug' => …])`,
  `ItemNotFoundException` if missing, then MicroMapper to `OrganizationApi`;
* IRI starting with `/api/v2/places/` ⇒ same with `PlaceRepository` → `PlaceApi`;
* otherwise delegate.

This is what makes `"place": "/api/v2/places/my-venue"` work as a write payload, and what produces
slug-based `@id`s for nested organizations/places. Note that these lookups **bypass the ORM
extensions** — `getResourceFromIri` uses `findOneBy`, so a write can reference a disabled or
foreign-organization place. The write is still gated by `EVENT_API_EDIT` on PATCH, but `POST`
only requires `ROLE_USER`.

### 9.7 `OpenApiFactoryDecorator`

`src/ApiPlatform/OpenApiFactoryDecorator.php`, `#[AsDecorator('api_platform.openapi.factory')]`:

* replaces the `JWT` security scheme with `SecurityScheme(type: 'http', scheme: 'bearer')`;
* walks every schema and injects a `description` of the allowed values into the properties
  `event_status`, `recurrence`, `recurrence_week_days`, `special_rate`, `publication_status`,
  sourced from `Event::getEventStatusList()`, `Event::getRecurrenceList()`,
  `MainEvent::getWeekDays()`, `Event::getSpecialRateList()`, `Event::getPublicationStatusList()`.

Confirmed in the generated spec, e.g.
`"recurrence": {"default":"none","type":["string","null"],"description":"One of \"none\", \"week\""}`.

---

## 10. Search behaviour

### 10.1 Custom DQL functions

Registered in `config/packages/doctrine.yaml:27-35`:

```yaml
        dql:
            string_functions:
                JSON_CONTAINS:        Scienta\DoctrineJsonFunctions\Query\AST\Functions\Mysql\JsonContains
                JSON_EXTRACT:         Scienta\DoctrineJsonFunctions\Query\AST\Functions\Mysql\JsonExtract
                JSON_VALUE:           Scienta\DoctrineJsonFunctions\Query\AST\Functions\Mariadb\JsonValue
                ILIKE:                App\DQL\ILike
                UNACCENT:             App\DQL\Unaccent
                JSON_VALUES_TEXT:     App\DQL\JsonValuesText
                JSON_KEY_VALUES_TEXT: App\DQL\JsonKeyValuesText
```

| DQL | Emitted SQL | Source |
| --- | --- | --- |
| `ILIKE(field, :param)` | `(unaccent(CAST(field AS TEXT)) ILIKE unaccent(CAST(:param AS TEXT)) ESCAPE '!')` | `src/DQL/ILike.php:18-23` |
| `UNACCENT(x)` | `unaccent(CAST(x AS TEXT))` | `src/DQL/Unaccent.php:20` |
| `JSON_VALUES_TEXT(col)` | `jsonb_path_query_array(CAST(col AS JSONB), '$.** ? (@.type() == "string")')::text` | `src/DQL/JsonValuesText.php:25-27` |
| `JSON_KEY_VALUES_TEXT(col, 'key')` | `jsonb_path_query_array(CAST(col AS JSONB), '$.<key>.** ? (@.type() == "string")')::text` | `src/DQL/JsonKeyValuesText.php:27-31` |
| `JSON_CONTAINS(a, b, path)` / `JSON_EXTRACT(col, path)` | literal `JSON_CONTAINS(...)` / `JSON_EXTRACT(...)` — MySQL/MariaDB functions | vendor (scienta) |

`JsonKeyValuesText` validates the key with `preg_match('/^[A-Za-z0-9_]+$/')` and calls
`$parser->syntaxError()` otherwise, because the key is interpolated directly into the jsonpath
literal (lines 44-48).

The `unaccent` extension **is** installed on the production database:

```
$ docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin -c "SELECT extname FROM pg_extension;"
 plpgsql | pg_stat_statements | unaccent
```

and it works as advertised against real data:

```sql
SELECT count(*) FILTER (WHERE unaccent(CAST(name AS TEXT)) ILIKE unaccent('%zurich%') ESCAPE '!') AS name_zurich,
       count(*) FILTER (WHERE name ILIKE '%zurich%')  AS plain,
       count(*) FILTER (WHERE name ILIKE '%zürich%')  AS umlaut
FROM event;
--  name_zurich | plain | umlaut
--          157 |     0 |    156
```

### 10.2 LIKE escaping

`src/DQL/LikeQueryHelpers.php` (trait, used by `EventExtension`, `OccurrenceExtension`,
`OrganizationExtension`, `PlaceExtension`):

```php
makeLikeParam('foo')        === '%foo%'
makeLikeParam('gloves_pink')=== '%gloves!_pink%'   // '_' and '%' and '!' escaped with '!'
```

The escape character `!` is declared inline in the generated SQL by `ILike::getSql()`
(`ESCAPE '!'`). So a user searching for `100%` will not get a wildcard.

### 10.3 Which columns each `keyword` searches

| Endpoint | OR terms |
| --- | --- |
| `GET /api/v2/events` | `event.name`, `event.archivedOrganization`, `event.archivedPlace`, `place.name`, `JSON_KEY_VALUES_TEXT(event.labels,'name')` |
| `GET /api/v2/events/agenda`, `/agenda-lite` | `event.archivedOrganization`, `event.archivedPlace`, `event.name`, `place.city`, `place.name`, `placeProposed.name`, `organization.name`, `JSON_KEY_VALUES_TEXT(place.labels,'name')`, `JSON_KEY_VALUES_TEXT(organization.labels,'name')`, `JSON_KEY_VALUES_TEXT(event.labels,'name')` |
| `GET /api/v2/organizations` | `organization.name`, `JSON_KEY_VALUES_TEXT(organization.labels,'name')` |
| `GET /api/v2/places` | `place.name`, `place.city` |

`archivedOrganization` / `archivedPlace` are denormalised name snapshots kept on `event`
(`src/Entity/Event.php:246-296`, maintained by `src/EventListener/ArchivedRelationNameListener.php`)
so that a search still finds events whose place or organization was deleted.

**In BKA production none of the `labels` JSON columns contain a `name` key**, so every
`JSON_KEY_VALUES_TEXT(..., 'name')` term evaluates to the literal `[]` and never matches:

```sql
SELECT k, count(*) FROM event e, LATERAL jsonb_object_keys(CAST(e.labels AS JSONB)) k GROUP BY 1;
--  description      | 34279
--  ticketingUrl     | 28334
--  printDescription | 25164

-- place.labels (object rows):      about (1018), capacity (1018)
-- organization.labels (object):    subTitle (587), about (587)
-- image.labels:                    legend (27571)
```

This matches `ACTIVATE_EVENT_NAME_TRANSLATABLE=false` (`.env:93`; not overridden in
`docker-compose.yaml`). Note also that 258 `place.labels` and 154 `organization.labels` rows store
`[]` (a JSON **array**, not an object) — `jsonb_path_query_array` copes, but any consumer expecting
an object must not.

Corollary: `ImageApi.alt` (`labels['alt']`) is **always null** in BKA production, since
`image.labels` only ever has a `legend` key.

### 10.4 The ProInfirmis accessibility filter is broken on PostgreSQL

`OccurrenceExtension.php:412` emits

```sql
JSON_CONTAINS(JSON_EXTRACT(place.proInfirmisPictograms, '$[*].Id'), :accessibilityN, '$') = 1
```

PostgreSQL has neither function, and the database defines no replacements:

```sql
SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE p.proname ILIKE 'json%' AND n.nspname='public';     -- (0 rows)

SELECT JSON_EXTRACT('{"a":1}', '$.a');
-- ERROR:  function json_extract(unknown, unknown) does not exist

SELECT JSON_CONTAINS('[1]','1','$');
-- ERROR:  function json_contains(unknown, unknown, unknown) does not exist
-- (server: PostgreSQL 18.3)
```

The functional test `tests/Functional/ApiEventTest.php:3785-3912`
(`testGetAgendaEventsAccessibilityProInfirmis`) asserts this filter works — it was written against
MySQL/MariaDB (`.env.local` still carries `DATABASE_URL=mysql://root:secret@mariadb/...`, and
`docker-compose.yaml` still ships a `mariadb:11.4` service). Conversely the `ILIKE`/`unaccent`/
`jsonb_path_query_array` SQL is PostgreSQL-only, so the two filter families cannot both work against
one database. Production runs PostgreSQL (`docker-compose.yaml:28`
`DATABASE_URL: "pgsql://postgres:secret@postgres/insitu-admin"`, and `unaccent` is installed), so
**`accessibility_proinfirmis[]` must currently 500 on production**.

UNVERIFIED end-to-end: confirming the 500 would require a valid JWT, which I did not mint. What is
verified is that the two SQL functions do not exist in the production database.

Data context: exactly **1** of 1 276 places has a non-empty `pro_infirmis_pictograms` value, so the
filter would select almost nothing anyway. `ACTIVATE_PROINFIRMIS` is `false` in the local compose
file but `true` in `.env`/`.env.local`; either way the flag is only consulted by
`src/Form/PlaceType.php:257` (the admin form) and never by API v2 code.

### 10.5 `SearchNormalizer` (not used by API v2)

`src/Search/SearchNormalizer.php`

```php
Transliterator::create('Any-Latin; Latin-ASCII; Lower()')
static::containsPattern($v) === '%'.normalize($v).'%'
```

It mirrors the DB-side `LOWER(UNACCENT(...))` for the **admin DataTables** (`leftExpr`/`rightExpr`
callbacks, e.g. `src/Controller/UserTokenController.php:51`). No API v2 code path references it
(`grep -rn "SearchNormalizer" src/ApiPlatform src/State src/ApiResource` → no match). It is in scope
only because it documents the intended normalisation semantics: `"zurich"` must find `"Zürich"`,
`"cafe"` must find `"Café"`.

### 10.6 `SlugEntityValueResolver` (not used by API v2)

`src/Resolver/SlugEntityValueResolver.php` is a Symfony `ValueResolverInterface` that turns a
`{slug}` route attribute into an entity for **controller** arguments, with the same three-step
slug / oldSlug / `-{id}` fallback as `SlugEntityToDtoItemProvider`. API Platform operations do not
use controller argument resolution, so this serves the Twig admin and the v1 API. It is listed here
because the two implementations must stay in sync.

---

## 11. Serializer normalizers (`src/Serializer/Normalizer/*`)

All six normalizers declare `supportsNormalization()` on **entity** classes
(`App\Entity\Category`, `Event`, `EventOccurrence`, `Image`, `Rate`, `TechnicalSheet`) — API v2
never serializes entities, it serializes the `*Api` DTOs. They therefore belong to the legacy
`/api/v1` FOSRest controllers. Their logic has been **duplicated into the MicroMapper mappers** for
v2; the table shows both so the port can confirm one behaviour:

| Normalizer | Adds | v2 equivalent |
| --- | --- | --- |
| `CategoryNormalizer` | `level` = 1 if it has children, 2 if leaf-with-parent, else 1 | `CategoryEntityToApiMapper.php:52-58` (identical) |
| `EventNormalizer` | `event_type`, `mainevent_id`, `mainevent_slug` | `EventEntityToApiMapper.php:158-160` (identical) |
| `EventOccurrenceNormalizer` | sets `event.nextDate`/`nextFilteredDate` to the occurrence's `dateFrom` **only if it is after `date_from`**, else null | `OccurrenceEntityToEventDtoProvider.php:73-74` sets it **unconditionally** — behaviour differs |
| `ImageNormalizer` | `url`, `url_webp`, `url_webp_size_512_q_65`, `url_webp_size_1024_q_65` | `ImageEntityToApiMapper.php:46-49` (identical) |
| `RateNormalizer` | `price` ⇒ `(string)($price / 100)` | `RateEntityToApiMapper.php` ⇒ `intval($price)/100` as a **float** — v1 returns a string, v2 a number |
| `TechnicalSheetNormalizer` | `url` | `TechnicalSheetEntityToApiMapper.php` (identical) |
| `UploadedFileDenormalizer` | returns the `File` untouched so Vich can handle the upload | **used by v2** — this is what lets `multipart` `file` reach `ImageApi::$file` |

---

## 12. Pagination

* Driven entirely by API Platform's `PaginationExtension` (priority -64, last).
* `page` (default 1) and `itemsPerPage` (default 30, min 0, max 500) — both client-controllable
  because `pagination_client_items_per_page: true`.
* No operation disables pagination and no operation overrides the page size.
* `TraversablePaginator` in both custom providers preserves `currentPage` / `itemsPerPage` /
  `totalItems` from the underlying Doctrine `Paginator`, so `view.first/last/next/previous` links
  stay correct even though the DTO list has been transformed.
* For `/events/agenda*`, `totalItems` counts **occurrences**. With `group_by_month=true` the member
  array is regrouped *after* pagination, so a bucket only contains the events on the current page.
* With `count_only=true`, `member` is `[]` but `totalItems` is still the full occurrence count.

---

## 13. The OpenAPI documents

There are **two unrelated** OpenAPI documents in this repository.

### 13.1 `public/openapi.yaml` — **v1 only, not v2**

1 812 lines; `info.version: 1.0.7`; the only paths it documents are

```
/api/v1/affiliations/   /api/v1/audiences/   /api/v1/categories/
/api/v1/events/         /api/v1/events/sponsored
/api/v1/organizations/  /api/v1/places/      /api/v1/regions/
```

It is a static export of the NelmioApiDoc description configured in
`config/packages/nelmio_api_doc.yaml`, whose `areas.path_patterns` is
`^/api(?!/doc|/v1/events/count|/token|/authorize$)` and whose security scheme is OAuth2 + bearer
(the v1 `/api/token` flow). **It does not describe `/api/v2` at all** and must not be used as the
contract for this port. Its `servers` list is `https://admin.insitu.live/` and
`https://admin.bka.ch/`.

### 13.2 The live API Platform document

Generated at runtime by API Platform + `OpenApiFactoryDecorator`. Reproduced with:

```
docker exec insitu-admin-app-1 php bin/console api:openapi:export --yaml   # 9 509 lines
docker exec insitu-admin-app-1 php bin/console api:openapi:export          # JSON
```

`info.title: InSitu/BKA API`, `info.version: 2.0.3`, 153 component schemas (one per
resource × serialization group × {plain, `.jsonld`}). This is the authoritative v2 contract and is
what §4 and §6 are derived from.

HTML/JSON-LD docs are served by API Platform's own docs controller; `/api/v2/docs` returns 404 in
this deployment (verified), while `/api/v2` (entrypoint) and `/api/v2/contexts/{shortName}` are
public and return 200.

---

## 14. Measurements against the restored BKA production database

All numbers from `docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin`, run
2026-10-17.

### 14.1 Event volumes and publication state

```sql
SELECT type, publication_status, count(*) FROM event GROUP BY 1,2 ORDER BY 1,2;
```

| type | publication_status | count |
| --- | --- | --- |
| mainevent | draft | 68 |
| mainevent | publish | 20 955 |
| mainevent | to_validate | 93 |
| subevent | draft | 26 |
| subevent | publish | 13 121 |
| subevent | to_validate | 16 |

`publication_status='publish' AND (publication_date IS NULL OR publication_date <= now())` → **34 076**
rows, i.e. what `GET /api/v2/events` would report as `totalItems` for an admin with no filters.
With `onlyMainEvents=true` → **20 955**.

### 14.2 Agenda volumes

Reproducing the `get_published_events_occurrences` WHERE clause for an admin with no parameters:

```sql
SELECT count(*) AS occurrences, count(DISTINCT e.id) AS distinct_events
FROM event_occurrence o JOIN event e ON e.id = o.event_id
WHERE e.publication_status = 'publish'
  AND (e.publication_date IS NULL OR e.publication_date <= now())
  AND o.date_to >= now()
  AND (o.date_from <  date_trunc('day', now() - interval '1 day')
    OR o.date_from >  date_trunc('day', now() - interval '1 day') + interval '23:59:59');
--  occurrences | distinct_events
--        45262 |             648
```

45 262 occurrences for 648 distinct future events — on average ~70 occurrences per event, so the
`/events/agenda*` endpoints repeat the same event that many times across pages.
`event_occurrence` holds 118 021 rows in total.

### 14.3 Reference data

| Table | Rows | Visible via API |
| --- | --- | --- |
| `category` | 30 | 25 (`CategoryExtension` hides 5) |
| `region` | 13 | 13 (5 with `hidden=false`, 8 with `hidden=true` — **all** returned) |
| `audience` | 4 | 4 |
| `affiliation` | 7 | 7 |
| `organization` | 741 | 585 enabled |
| `place` | 1 276 | 1 013 enabled (255 `private`, which does **not** hide them) |
| `image` | 27 571 | all |
| `video` | 2 025 | all |
| `rate` | 12 697 | all |
| `ticketing` | **0** | – (`ACTIVATE_MULTI_TICKETINGS=false`) |
| `technical_sheet` | 1 | – |
| `contact` | 90 | – |
| `event_proposed_by` | 4 366 | – |
| `place_proposed` | 1 823 | – |
| `organization_affiliation` | 85 | – |
| `user` | 427 (269 with `member = true`) | – |
| `user_token` | 5 | API credentials |

Regions (id → `{fr, de}`, hidden): 1 Broye/Broye ✔hidden, 2 Gruyère/Greyerz ✔, 3 Glâne/Glane ✔,
4 Lac/See ✔, 5 Sarine/Saane ✔, 7 Singine/Sense ✔, 8 Veveyse/Vivisbach ✔,
9 Broye-Vully (Vaud)/Broye-Vully (Waadt) ✔, **10 Ville de Berne/Stadt Bern**,
**11 Région de Berne/Region Bern**, **13 Thoune & Oberland bernois/Thun & Berner Oberland**,
**14 Bienne & Seeland/Biel & Seeland**, **15 Reste du canton/Restlicher Kanton** (bold = not hidden,
i.e. the BKA-relevant Bern regions; the Fribourg regions are In Situ legacy and hidden).

Audiences: 1 `Tout public / Für alle`, 2 `Adultes seulement / Nur für Erwachsene`,
3 `Enfants et adolescents / Für Kinder und Jugendliche`, 4 `Pour les seniors / Für Senior:innen`.

Affiliations: 1 `AG culturel / Kultur-GA`, 2 `Kulturlegi`, 3 `AHV/IV`,
4 `Etudiant/e / Student:innen`, 5 `Enfants / Kinder`, 6 `Membres / Mitglieder`,
7 `Réduit / Ermässigt`.

Category tree (30 rows, `parent_id`): roots 1 Musique/Musik, 5 Art/Kunst, 8 Scène/Bühne,
14 Film, 15 Littérature/Literatur, 16 Patrimoine/Ausstellungen & Kulturerbe,
17 Réunion & médiation/Begegnungen, 23 Divers/Diverses. Children: 2,3,4,24,25,26,27 under 1;
6,7 under 5; 9,10,11,12,13,28,29,30 under 8; 18,19,20,21,22 under 17.

### 14.4 BKA-specific event fields

```sql
SELECT count(*) FILTER (WHERE show_in_print)                 AS show_in_print,       -- 21 987
       count(*) FILTER (WHERE print_category_id IS NOT NULL) AS with_print_cat,      -- 21 981
       count(*) FILTER (WHERE place_proposed_id IS NOT NULL) AS with_place_proposed, --  1 823
       count(*) FILTER (WHERE organization_id IS NOT NULL)   AS with_org,            -- 27 949
       count(*) FILTER (WHERE user_id IS NOT NULL)           AS with_user,           -- 21 378
       count(*) FILTER (WHERE place_id IS NULL)              AS no_place             --  2 562
FROM event;
```

Sponsored events: `sponsored_start_date` and `sponsored_end_date` are **NULL on all 34 279 rows**
(`ACTIVATE_SPONSORED_EVENTS=false`), so `GET /api/v2/events/agenda/sponsored` returns
`totalItems: 0` on BKA. The endpoint is still routed — no feature flag gates it.

### 14.5 Shape of the free-form JSON columns

`event.related_dates` is a `TEXT` column holding a `json`-typed Doctrine array of **PHP-serialised
`DateTime` objects**, emitted verbatim by the API:

```json
[{"date":"2024-09-12 18:30:00.000000","timezone_type":3,"timezone":"Europe\/Zurich"},
 {"date":"2024-09-13 18:30:00.000000","timezone_type":3,"timezone":"Europe\/Zurich"}]
```

`event.og_image` is a locale→filename map; the sampled production rows are `[]`.
`place.pro_infirmis_pictograms` holds the raw ProInfirmis payload:

```json
[{"Id":8,"Name":"Eingeschränkt rollstuhlgängig","NameFr":"Partiellement accessible en fauteuil roulant",
  "NameIt":"Parzialmente accessibile in sedia a rotelle","NameEn":"Partially wheelchair-accessible",
  "LinkToPictogram":"https://zuerst.proinfirmis.ch/Pictograms/08_eingeschraenkt_zugaenglich.jpg",
  "LinkToPictogramSvg":"https://zuerst.proinfirmis.ch/Pictograms/svg/08_eingeschraenkt_zugaenglich.svg",
  "PictogramFileName":"08_eingeschraenkt_zugaenglich.jpg"}, …]
```

### 14.6 Schema notes relevant to the exposed shape

* `event.date_from` / `date_to`, `event_occurrence.date_from` / `date_to`, `publication_date`,
  `sponsored_*` are all `timestamp with time zone`. `config/packages/doctrine.yaml:11-13` remaps
  `datetimetz`/`datetimetz_immutable` to `App\Doctrine\Type\LocalDateTimeTz(Immutable)Type`
  "to convert loaded timestamptz values to the app timezone instead of the DB session one".
* `event` uses single-table inheritance: `#[ORM\InheritanceType('SINGLE_TABLE')]`,
  `#[ORM\DiscriminatorColumn(name:'type')]`,
  `#[ORM\DiscriminatorMap(['mainevent' => MainEvent::class, 'subevent' => SubEvent::class])]`
  (`src/Entity/Event.php:23-27`).
* `SubEvent` **delegates** `getRecurrence()`, `getRecurrenceWeekDays()`, `getTicketingUrl()`,
  `getPublicationDate()`, `getUser()`, `getImages()`, `getRates()` to its `MainEvent`
  (`src/Entity/SubEvent.php:30-63`). So the API exposes the parent's images/rates/ticketing URL on
  every sub-event.
* Indexes that exist specifically for these queries: `idx_event_pub_status_date` on
  `(publication_status, publication_date)`, `idx_252833_datefrom_idx` / `idx_252833_dateto_idx` on
  `event_occurrence`, `idx_place_lat_lon` on `place(latitude, longitude)`,
  `idx_252807_event_name_idx` on `event(name)`, `place_name_idx`, `place_city_idx`.
  There is **no** index supporting `unaccent(...) ILIKE '%…%'` or the `jsonb_path_query_array`
  expressions — keyword search is a full scan.

---

## 15. Master query-parameter reference

Every parameter a client can send to any v2 endpoint, with how it is read, validated and applied.
"Declared" = appears as a `QueryParameter` in `src/ApiResource/*` (and therefore in the OpenAPI
document); "Honoured" = actually read by an extension/provider.

| Parameter | Declared on | Honoured on | Read via | Type / format | Semantics | Failure mode |
| --- | --- | --- | --- | --- | --- | --- |
| `page` | all collections | all collections | API Platform | integer, default 1 | Hydra page | – |
| `itemsPerPage` | all collections | all collections | API Platform | integer, default 30, 0…500 | page size | >500 rejected by schema constraint (`Range`) |
| `date_from` | `/events`, `/events/agenda-lite` | `/events`, `/events/agenda`, `/events/agenda-lite` (and read by the provider for the grouping baseline) | `query->get('date_from')` | ATOM, e.g. `2024-10-05T13:30:00+02:00` | `/events`: `event.dateFrom >= v`. agenda: becomes `:start` for `o.dateTo >= :start`, the "day before" exclusion window, **and** the `publicationDate <= :fromDate` bound | unparsable ⇒ 400 `Wrong format for "date_from" query parameter.` |
| `date_to` | `/events/agenda-lite` | `/events/agenda`, `/events/agenda-lite` | `query->get` | ATOM | `o.dateFrom <= v`; a midnight value is bumped to 23:59:59 | unparsable ⇒ 400 |
| `keyword` | `/events`, `/events/agenda-lite`, `/organizations`, `/places` | those + `/events/agenda` | `query->get` | string | see §10.3 | array value ⇒ 400 (`InputBag::get` non-scalar) |
| `region[]` | `/events`, `/events/agenda-lite`, `/events/agenda/similar`, `/places` | those + `/events/agenda` | `query->all('region')` | array of int (or one CSV entry) | `place.region = …` OR-ed | non-int or `0` ⇒ 400 `Region IDs must be an array of int.`; scalar `?region=2` ⇒ 400 BadRequest |
| `onlyMainEvents` | `/events` | `/events` | `query->get` | string compared to `'true'` | `event INSTANCE OF MainEvent` | any other value is silently ignored |
| `category[]` | `/events/agenda-lite`, `/organizations` | those + `/events/agenda` | `query->all('category')` | array of int | agenda: `categories.id IN (…)`; organizations: `INNER JOIN o.categories c … c.id IN (…)` | ⇒ 400 `Category ids must be an array of int.` |
| `place[]` | `/events/agenda-lite`, `/places` | those + `/events/agenda` | `query->all('place')` | array of int | agenda: `event.place = …` OR-ed; places: `p.id = …` OR-ed | ⇒ 400 `Place IDs must be an array of int.` |
| `audience[]` | `/events/agenda-lite` | `/events/agenda`, `/events/agenda-lite` | `query->all('audience')` | array of int | `event.audience = …` OR-ed | ⇒ 400 `Audience IDs must be an array of int.` |
| `affiliation[]` | `/events/agenda-lite` | `/events/agenda`, `/events/agenda-lite` | `query->all('affiliation')` | array of int | inner-joins `place.organization.affiliations`, `affiliations.id IN (…)` — **inner join narrows the result to events with a place that has an organization** | ⇒ 400 `Affiliation IDs must be an array of int.` |
| `accessibility_auto_declaration[]` | `/events/agenda-lite` | `/events/agenda`, `/events/agenda-lite` | `query->all(...)` | array of enum: `wheelchairAccessible`, `wheelchairAccessibleToilets`, `wheelchairAccessibleParking` | `place.<flag> = true` OR-ed | invalid value ⇒ 400 `Invalid value "x". Must be one of …` |
| `accessibility_proinfirmis[]` | `/events/agenda-lite` | `/events/agenda`, `/events/agenda-lite` | `query->all(...)` | array of int (pictogram ids) | `JSON_CONTAINS(JSON_EXTRACT(place.proInfirmisPictograms,'$[*].Id'), id, '$') = 1` OR-ed | non-int ⇒ 400; **on PostgreSQL the SQL itself fails** (§10.4) |
| `geoNorthEast[lat]`, `geoNorthEast[lng]`, `geoSouthWest[lat]`, `geoSouthWest[lng]` | `/events/agenda-lite`, `/organizations` | those + `/events/agenda` | `query->all('geoNorthEast')` / `all('geoSouthWest')` | decimal strings matching `/^[0-9]+\.?[0-9]*$/` | bounding box on `place`+`placeProposed` lat/lng (agenda) or `organization` lat/lng | only one corner ⇒ 400 "you must provide both…"; bad coordinate ⇒ 400; **negative values are rejected by the regex** |
| `multi_day` | `/events/agenda`, `/events/agenda-lite` | both | `query->get` | string compared to `'false'` | `event.isMultiDayEvent = false` | `multi_day=true` is a **no-op** |
| `free` | `/events/agenda`, `/events/agenda-lite` | both | `query->get` | string compared to `'true'` | `special_rate IN ('free_entry','free_price')` | `free=false` is a **no-op** |
| `group_by_month` | `/events/agenda`, `/events/agenda-lite` | both | provider | string compared to `'true'` | regroups `member` into `[{date:"YYYY_MM", events:[…]}]` | – |
| `count_only` | `/events/agenda`, `/events/agenda-lite` | both | provider | string compared to `'true'` | `member: []`, `totalItems` preserved | – |
| `member` | `/events/agenda-lite` | `/events/agenda`, `/events/agenda-lite` | `query->get('member')` | **presence only** (`null !== $member`) | `INNER JOIN event.user user` + `user.member = true` | `member=false` **still activates the filter** (unlike the v1 `EventOccurrenceRepository::occurrenceEngineSearch`, which also checks the `ACTIVATE_MEMBERS` flag) |
| `slug` | `/events/agenda/{organization,place,similar}` | same | `query->get('slug')` | string, **required** | resolves the Organization / Place / Event by slug | missing ⇒ **422** Hydra ConstraintViolation (before auth); unknown ⇒ 404 |

---

## 16. Feature flags vs. API v2

`config/services.yaml:26-41` binds eleven env flags as constructor arguments. Searching the whole of
`src/` for their usage shows **API v2 ignores all of them except one**:

| Flag | BKA value (`docker-compose.yaml`) | Used by API v2? | Where it is used |
| --- | --- | --- | --- |
| `LIST_OWN_EVENTS_ONLY` | `true` | **no** | `src/Controller/EventController.php` (admin list only) |
| `ACTIVATE_MEMBERS` | `true` | **no** (v2 `member` filter is unconditional) | `src/Repository/EventOccurrenceRepository.php:102` (v1), `src/Form/UserType.php` |
| `ACTIVATE_EVENT_VIDEOS` | `true` | **no** | `src/Form/EventType.php:471` |
| `ACTIVATE_PROPOSAL_PLACE` | `true` | **no** | `EventController`, `ProposeEventController` |
| `USE_OPTIMIZED_EVENT_LOAD` | `true` | **indirectly** — disables `EventDoctrineListener`'s `postLoad` `nextDate` computation, so v2 `next_date` depends solely on the provider/mapper | `src/EventListener/EventDoctrineListener.php:22`, `src/Controller/ApiEventController.php` (v1) |
| `HAS_PRINT_OPTIONS` | `true` | **no** (v2 always exposes `show_in_print` / `print_category`) | `src/Form/EventType.php:136` |
| `CLIPBOARD_EVENT_LINKS` | `true` | **no** | Twig/admin |
| `SHOW_MANUAL` | `true` | **no** | Twig/admin |
| `ACTIVATE_SPONSORED_EVENTS` | `false` | **no** — `/events/agenda/sponsored` is always routed | admin forms only |
| `ACTIVATE_PROINFIRMIS` | `false` locally, `true` in `.env`/`.env.local` | **no** — the `accessibility_proinfirmis[]` filter and the `pro_infirmis_*` fields are always present | `src/Form/PlaceType.php:257` |
| `ACTIVATE_MULTI_TICKETINGS` | unset ⇒ `.env` default `false` | **no** — `ticketings` is always readable and writable through v2 | `src/Form/EventType.php:518`, `ProposeEventStep3Type` |
| `ACTIVATE_EVENT_NAME_TRANSLATABLE` | unset ⇒ `.env` default `false` | **no**, but it determines whether `labels.name` ever gets written, which in turn decides whether the `JSON_KEY_VALUES_TEXT(..., 'name')` search terms can match (they cannot, in BKA prod) | `src/Form/EventType.php:147`, `PlaceType`, `OrganizationType` |
| `ACTIVATE_SLUG_GENERATOR_WITH_ID` | unset ⇒ `.env` default `false` | **yes** | `src/State/SlugEntityToDtoItemProvider.php:52`, `src/Resolver/SlugEntityValueResolver.php:39` |
| `LOCALES` / `DEFAULT_LOCALE` | `fr\|de` / `de` | indirectly | validation messages are returned in the request locale (observed German in the live 422) |

---

## 17. Test coverage of the v2 API

`tests/Functional/` (5 901 lines) is the executable spec. All tests authenticate with a real
`UserToken` JWT from `App\Story\UsersStory`.

| File | Lines | Tests |
| --- | --- | --- |
| `ApiEventTest.php` | 4 522 | 58 |
| `ApiOrganizationTest.php` | 512 | 13 |
| `ApiPlaceTest.php` | 367 | 11 |
| `ApiImageTest.php` | 147 | 6 |
| `ApiImagePostTest.php` | 90 | 2 |
| `ApiCategoryTest.php` | 79 | 4 |
| `ApiAffiliationTest.php` / `ApiAudienceTest.php` / `ApiRegionTest.php` | 53 each | 3 each |
| `AbstractApiTestCase.php` | 25 | sets `Accept: application/ld+json` by default |

`ApiEventTest` test names, in file order — a usable checklist for the port:

```
GetEventsNoAuth, GetEventsWrongToken, GetEventsSuccess, GetEventsWithUser, GetEventsFromDate,
GetEventsKeyword, GetOneEvent, GetEventWithIdSuccess, DeleteEvent, DeleteEventWithUser,
PostSimpleEvent, PostCompleteEventRecurrenceNone, PostCompleteEventRecurrenceWeek,
PostEventInconsistentDates, PostEventWrongLabels, PostEventWrongRateLabels, PostEventWrongRatePrice,
PatchSimpleEvent, PatchEventLabels, PatchEventPlace, PatchEventCategories, PatchEventDates,
PatchEventRecurrenceSubEvents, PatchEventImages, PatchEventVideos, PatchEventRates, PatchEventAudience,
GetEventsOrganizationSlug, GetEventsPlaceSlug, GetEventsSimilar, GetEventsSponsored,
GetAgendaEventsSimple, GetAgendaEventsOccurrences, GetAgendaEventsFilterMember,
GetAgendaEventsFilterDateFrom, GetAgendaEventsFiltersDate, GetAgendaEventsWeekFiltersDate,
GetAgendaEventsPublicationFiltersDate, GetAgendaEventsKeyword, GetAgendaEventsCategories,
GetAgendaEventsPlace, GetAgendaEventsRegion, GetAgendaEventsAudience, GetAgendaEventsAffiliation,
GetAgendaEventsAccessibilityAuto, GetAgendaEventsAccessibilityProInfirmis, GetAgendaEventsGeoCoordinates,
GetAgendaEventsFilterMultiDay, GetAgendaEventsFilterFree, GetAgendaEventsGroupByMonth,
GetAgendaEventsCountOnly, GetEventsAsPartnerSuccess, GetEventsAsPartnerDisabled,
GetEventsAgendaAsPartnerSuccess, GetEventsAgendaAsPartnerDisabled, PostEventsAsPartner,
PostEventsMultiTicketings, PostEventsWrongMultiTicketings
```

Behaviours these tests pin down that are not obvious from the code:

* `GET /api/v2/events` with no JWT ⇒ 401; with a syntactically valid but unknown token ⇒ 401
  (`ApiEventTest.php:29-45`).
* Disabling the owning user **invalidates existing tokens immediately** ⇒ 401
  (`testGetEventsAsPartnerDisabled`, line 4282) — this is the `CustomJWTAuthenticator` DB check.
* `POST /api/v2/events` as `ROLE_BROADCAST_PARTNER` ⇒ **403** (line 4347).
* `DELETE /api/v2/events/{slug}` (`testDeleteEventWithUser`, lines 371-447): deleting a **sub-event**
  slug ⇒ **404** (the operation's `stateOptions` entity class is `MainEvent`, so a `SubEvent` is not
  found); deleting one's own main event ⇒ 204; deleting another user's event ⇒ **403**; deleting an
  event one does not own but whose place belongs to one of one's organizations ⇒ 204.
  The same `stateOptions` restriction applies to `PATCH`: sub-events cannot be written through v2.
* `group_by_month` member items are `{date, events[]}` with `events[0]."@type" === "Event"`
  (line 4164).
* `count_only=true` ⇒ `length("member") === 0` while `totalItems` is non-zero (line 4214).
* `multi_day=false` keeps only single-day events (line 4040): the fixture builds one event with
  3 sub-events (multi-day) and one single-day event; unfiltered ⇒ 3 occurrences in the window,
  filtered ⇒ 1.
* `free=true` keeps `free_entry`/`free_price` only (line 4104).
* `accessibility_proinfirmis[]=unknown value` ⇒ 400 (line 3900).
* Multi-ticketings round-trip preserves order and per-item `@id` (line 4387); an unknown
  `ticketing_designation` ⇒ 422 (line 4467).

---

## 18. Defects and sharp edges found while reading

| # | Where | Description |
| --- | --- | --- |
| D1 | `src/ApiPlatform/PlaceExtension.php:66-77` | `place[]` is validated through `EventExtension::toArrayOfIntegers()` into `$ids`, but the binding loop iterates the **raw** `$placeIds`. With `?place[]=2,3` the validator passes (CSV split) yet `place_0` is bound to the string `"2,3"`. |
| D2 | `src/ApiPlatform/OrganizationExtension.php:61-72` | Same class of bug for `category[]`: `$ids` is computed and discarded, `setParameter('ids', $categoryIds)` binds the raw array. |
| D3 | `src/ApiPlatform/OccurrenceExtension.php:412` | `JSON_CONTAINS`/`JSON_EXTRACT` are MySQL functions; production is PostgreSQL 18 and has no such functions (§10.4). |
| D4 | `src/ApiPlatform/OccurrenceExtension.php:128-142` vs `EventExtension.php:120-135` | The two ownership clauses differ: the occurrence one omits the `event.organization IN (:userOrganizations)` branch, so non-admin users see a different event set on `/events` than on `/events/agenda*`. |
| D5 | `src/ApiPlatform/PlaceExtension.php:84-91` | `applyToItem` does not add `enabled = true`, so `GET /api/v2/places/{slug}` can return a disabled place. `OrganizationExtension` does apply it on both paths. |
| D6 | `src/Mapper/EventApiToEntityMapper.php` | Nothing assigns the authenticated user (or organization) to an event created through `POST /api/v2/events`. The created `MainEvent` has `user_id = NULL`, so it is immediately invisible to its creator unless they are an admin or the chosen place belongs to one of their organizations. |
| D7 | `src/Mapper/OccurrenceEntityToApiMapper.php` | `$dto->event = $this->microMapper->map($entity->getEvent(), OccurrenceApi::class, …)` — maps an `Event` to `OccurrenceApi`; there is no such mapper, so this would throw `No mapper found for App\Entity\MainEvent -> App\ApiResource\OccurrenceApi`. Unreachable today because `OccurrenceApi` has `operations: []` and the agenda operations use `OccurrenceEntityToEventDtoProvider`. |
| D8 | `src/Validator/GeoCoordinatesValidator.php:22` | `preg_match('/^[0-9]+\.?[0-9]*$/', $item)` rejects negative latitudes/longitudes, so the bounding-box filters cannot express boxes in the western/southern hemispheres. Fine for Switzerland, wrong in general. |
| D9 | `src/ApiPlatform/OccurrenceExtension.php:250-259` | `member` activates on **presence**, so `?member=0` / `?member=false` filters to members. |
| D10 | `src/ApiPlatform/OccurrenceExtension.php:453-457` / `460-469` | `multi_day` only reacts to the literal string `'false'`, `free` only to `'true'`. `multi_day=1`, `free=1`, `free=yes` are silently ignored. |
| D11 | `config/packages/security.yaml:33-39` + `src/Security/CustomJWTAuthenticator.php:39-41` | Tokens issued by `POST /api/v2/auth` carry no `uuid` claim and are rejected on use (§2.2). |
| D12 | `src/ApiPlatform/OccurrenceExtension.php:367-372` | The `affiliation[]` filter adds a **second** join alias (`placeOrganization`) for `place.organization`, which is already joined as `organization`, and uses `INNER JOIN`, silently dropping events without a place or without a place organization. |
| D13 | `src/ApiResource/ImageApi.php:82` | `// TODO only jpg jpeg and png extensions` — the documented "only jpg/jpeg/png allowed" restriction is not implemented; `#[Assert\NotNull]` is the only constraint on `$file`. |
| D14 | `src/ApiPlatform/ItemApiIriConverterDecorator.php:52-76` | IRI→entity resolution uses bare `findOneBy`, bypassing `PlaceExtension`/`OrganizationExtension`. A `POST /api/v2/events` can therefore attach any place in the database, including a disabled one or one belonging to a different organization. |
| D15 | §2.5 | Query-parameter validation (422) happens before authentication (401), so an anonymous caller learns which parameters are required. |
| D16 | `src/ApiPlatform/OccurrenceExtension.php:271-282` | The hard-coded "ignore events starting the day before `date_from`" window is applied unconditionally on `/events/agenda*`, with no way to turn it off. Events whose occurrence starts between `date_from - 1 day 00:00:00` and `date_from - 1 day 23:59:59` are invisible even though they are still running. |
| D17 | no `ImageExtension` exists | `GET /api/v2/images` has **no** ORM extension at all, so any `ROLE_USER` or `ROLE_BROADCAST_PARTNER` can page through every image in the system (27 571 rows in BKA production) and read each one at `/api/v2/images/{id}`. Only `DELETE` is ownership-checked. |

---

## 19. Porting notes

*(Opinion, clearly separated from the facts above.)*

1. **The contract to preserve is the live API Platform document, not `public/openapi.yaml`.**
   The latter describes v1. Export the v2 spec from the running container
   (`php bin/console api:openapi:export`) and treat it as the acceptance target; 153 schemas, 28
   callable routes, 25 distinct query parameters.

2. **Two very different read models.** `/api/v2/events` is event-rooted and ordered by
   `event.dateFrom`; `/api/v2/events/agenda*` is **occurrence-rooted**, returns one copy of the
   event per occurrence, paginates over occurrences, and reports `totalItems` in occurrences.
   In We.Publish terms an "occurrence" is closest to a materialised date row; a GraphQL port will
   need either an explicit `EventOccurrence` type with a connection, or a documented change in
   pagination semantics. Hiding the duplication (DISTINCT on event) would change `totalItems` from
   45 262 to 648 on today's data — a visible behaviour change for every consumer.

3. **Visibility rules are duplicated in four places** that the code itself warns must stay aligned:
   `EventExtension`, `OccurrenceExtension`, `EventVoter`/`EventApiVoter`, and
   `EventOccurrenceRepository::occurrenceEngineSearch` (v1). They have already drifted (D4). In the
   NestJS port this should be **one** predicate builder used by every resolver and by the
   authorization layer.

4. **Publication model.** v2 exposes a flat `publication_status ∈ {draft, to_validate, publish}` plus
   a `publication_date` gate (`publish` AND `publicationDate IS NULL OR <= now`). We.Publish's
   draft/pending/published revision model maps naturally: `draft` → draft revision,
   `to_validate` → pending, `publish` + future `publication_date` → pending with a publish date,
   `publish` + past date → published. Keep the string field in the API response for backwards
   compatibility.

5. **Occurrence regeneration is a write-time side effect.** `OnFlushEventListener` deletes and
   recreates all `event_occurrence` rows and pushes ~14 fields from a main event onto every
   sub-event on *every* save. Any port must reproduce that (or replace it with a derived/virtual
   occurrence calculation) or the agenda endpoints will go stale.

6. **Labels are the translation mechanism.** `{key: {locale: string}}` with a JSON-Schema shape and
   per-key byte limits (6400 / 256 / 24). BKA uses `description`, `printDescription`,
   `ticketingUrl` on events; `about`, `capacity` on places; `subTitle`, `about` on organizations;
   `legend` on images; `designation` on rates. `name` is **never** translated in BKA, so the
   `labels.name` search terms and the "DEPRECATED, use labels.name" notes are dead weight that can
   be dropped — but `name`, `designation`, `ticketing_url` must keep being emitted as the legacy
   scalar fields.

7. **Block content.** Nothing in v2 is block-structured today: the event body is
   `labels.description` (an HTML-ish string up to 6400 bytes, validated after `strip_tags`), plus
   flat `images[]` and `videos[]` arrays. Mapping that onto We.Publish block content means the v2
   compatibility layer has to flatten blocks back into a `labels.description` string and an
   `images`/`videos` array, or the response shape changes.

8. **Keyword search.** Accent-insensitive substring match over a handful of columns with no index.
   Postgres `unaccent()` + `ILIKE '%…%'` is exactly reproducible from Prisma via `$queryRaw`, or can
   be upgraded to a `pg_trgm`/tsvector index — but note the escape semantics (`!` as the LIKE escape
   char) and that `archived_organization`/`archived_place` snapshots participate in the match.

9. **Things that are already dead or broken** and need an explicit product decision rather than a
   faithful port: `accessibility_proinfirmis[]` (D3, and only one place has pictograms),
   `/events/agenda/sponsored` (always empty on BKA), `ticketings` (0 rows), `alt` on images (always
   null), `POST /api/v2/auth` (D11), `related_dates` emitting PHP-serialised DateTime objects,
   `multi_day=true` / `free=false` being no-ops (D10), negative geo-coordinates being rejected (D8),
   and `POST /api/v2/events` not recording an owner (D6).

10. **Auth.** One long-lived JWT per `user_token` row, revocable by deleting the row or disabling the
    user, checked against the DB on **every** request. If We.Publish issues stateless JWTs, the
    revocation semantics (`testGetEventsAsPartnerDisabled`) must be reproduced, e.g. with a token
    table or a short TTL plus a denylist.

11. **Role model.** `ROLE_BROADCAST_PARTNER` is a read-everything, write-nothing role that is
    *not* a `ROLE_USER`. It bypasses every ownership filter in all five extensions but is rejected
    by both write voters. Model it as a distinct permission set, not as "admin minus write".

12. **Undocumented-but-working parameters.** Because filtering is hand-written against the raw query
    bag, `/events/agenda` honours the whole `agenda-lite` parameter set. Real clients may depend on
    that. Re-implement the union on both endpoints, then document it.

---

## Appendix A — how the facts above were obtained

Read-only commands, all re-runnable.

```bash
# Route table (authoritative list of every /api/v2 endpoint + its controller)
docker exec insitu-admin-app-1 php bin/console debug:router --show-controllers | grep /api/v2

# The live v2 OpenAPI contract
docker exec insitu-admin-app-1 php bin/console api:openapi:export --yaml   > apiv2-openapi.yaml
docker exec insitu-admin-app-1 php bin/console api:openapi:export          > apiv2-openapi.json

# Extension ordering
docker exec insitu-admin-app-1 php bin/console debug:container \
  --tag=api_platform.doctrine.orm.query_extension.collection
docker exec insitu-admin-app-1 php bin/console debug:container \
  --tag=api_platform.doctrine.orm.query_extension.item

# Unauthenticated probes (GET only)
curl -s -H 'Accept: application/ld+json' http://localhost:8080/api/v2
curl -s -H 'Accept: application/ld+json' http://localhost:8080/api/v2/contexts/Event
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8080/api/v2/events          # 401
curl -s -H 'Accept: application/ld+json' http://localhost:8080/api/v2/events/agenda/organization  # 422
curl -s http://localhost:8080/api/v2/contacts/1                                        # 404 not_exposed

# Production data checks (SELECT only)
docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin -c "SELECT extname FROM pg_extension;"
docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin -c "SELECT JSON_EXTRACT('{\"a\":1}','\$.a');"
docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin -c "\d event"
```

### What I could **not** verify

* Any authenticated v2 response body. Minting a usable JWT requires either a `POST` to
  `/api/v2/auth` (excluded by the read-only brief, and anyway broken per D11) or reading an existing
  `user_token.token` value out of the production database (blocked). Everything about response
  *shapes* therefore comes from the generated OpenAPI document plus the DTO/mapper source, which
  agree with each other and with the functional tests.
* The real production environment variables (`CORS_ALLOW_ORIGIN`, `ACTIVATE_PROINFIRMIS`,
  `ACTIVATE_SLUG_GENERATOR_WITH_ID`, `ACTIVATE_EVENT_NAME_TRANSLATABLE`). The repo contains
  `.env` defaults, a developer `.env.local`, and the BKA `docker-compose.yaml` overrides; the three
  disagree in places and none is the production deployment.
* Whether `accessibility_proinfirmis[]` actually returns a 500 in production (the two SQL functions
  provably do not exist there; the HTTP outcome was not observed).
