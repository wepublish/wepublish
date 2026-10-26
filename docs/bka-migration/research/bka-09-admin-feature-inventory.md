# BKA admin backoffice — complete feature inventory

Scope: every screen of the Symfony/Twig admin backoffice of `/Users/itrulia/Documents/insitu-admin` as it behaves
for the **BKA** product (`SYLIUS_THEME=in-situ-admin/bka`), and everything a user can do on each one. This covers the
web controllers (`src/Controller/*`, excluding the `Api*` controllers), every Symfony FormType under `src/Form/**`,
the Twig templates in `templates/**` plus the BKA theme overrides in `themes/bka/templates/**` (which win), the
`src/Twig/Components/*` live components, the Stimulus controllers that drive the dynamic parts of the forms,
`src/Validator/*`, and the DataTables configuration. API v1/v2 (`/api/...`) is explicitly **out of scope** here.
Everything was checked against the running BKA instance at `http://localhost:8080` (logged in as
`admin@wepublish.ch`, GET + DataTables-callback POSTs only, no mutating submits) and against the restored BKA
production database.

---

## 1. How the facts below were obtained

| Source | What it proves |
| --- | --- |
| `docker exec insitu-admin-app-1 php bin/console debug:router` | the authoritative route list (reproduced in §4) |
| `docker exec insitu-admin-app-1 env` | the feature-flag values actually in force in the running BKA container |
| `curl` GETs against `http://localhost:8080` with a cookie jar | rendered field names, labels, enabled/disabled state, HTTP codes |
| DataTables callback POSTs (`_dt=<name>&draw=1&start=0&length=1`) | the real column set and row counts of each list screen |
| `docker exec insitu-admin-postgres-1 psql …` | production usage figures (how much each feature is actually used) |

Row counts observed on the live BKA data (2026-10-17):

| List screen | DataTables `recordsTotal` |
| --- | --- |
| `/events/` (upcoming) | 473 |
| `/events/members-only` | 378 |
| `/events/archived` | 20 717 |
| `/places/` | 1 276 |
| `/organizations/` | 741 |
| `/admin/users/` | 427 |
| `/user-token/` | 5 |

`event` table totals: 21 116 rows `type='mainevent'` + 13 163 rows `type='subevent'` = 34 279.

---

## 2. Feature-flag env vars — complete list

All flags are wired in `config/services.yaml:16-41` (constructor binding) and `config/packages/twig.yaml:6-18`
(Twig globals). Defaults come from `.env`.

| Env var | Default (`.env`) | BKA value (container env) | Bound as | Exactly what it changes |
| --- | --- | --- | --- | --- |
| `LIST_OWN_EVENTS_ONLY` | `false` | **true** | `$listOwnEventsOnly` | `EventController::index/archived/members_only`: for **non-admins** forces `listOwn=true`, restricting the event lists to events whose organization is one of the user's orgs **or** whose `proposedBy.email` equals the user's email (case-insensitive). Admins are unaffected. `src/Controller/EventController.php:66-70, 283, 302, 330-336` |
| `ACTIVATE_PROINFIRMIS` | `true` | **false** (local compose; see note) | `$proinfirmisActivated` + Twig `proinfirmisActivated` | Adds the `proInfirmisIdSource` select to the place form (`src/Form/PlaceType.php:257-268`) and renders it (`templates/includes/form/place_form.html.twig:51-53`). The POST_SUBMIT hook that copies pictograms + detail URL from the ProInfirmis cache (`PlaceType.php:296-331`) runs **regardless** of the flag, but only when `proInfirmisIdSource` is already set. **Note:** the compose value is unreliable; production data shows 7 places carry `pro_infirmis_pictograms` and 1 carries `pro_infirmis_id_source`, so the integration has been live at some point. |
| `ACTIVATE_GINTO` | `false` | *unset* → false | — | Swaps the ProInfirmis data source from ZUERST to the Ginto GraphQL API (README §2). No UI change. |
| `CLIPBOARD_EVENT_LINKS` | `false` | **true** | Twig `clipboardEventLinks` | Adds a `content_copy` icon to every editable row of the event list that copies the literal string `` event=<slug> `` to the clipboard (`templates/datatables/event-actions.html.twig:11-15`, `assets/app.tsx:133-146`). |
| `ACTIVATE_SPONSORED_EVENTS` | `false` | **false** | `$sponsoredEventsActivated` + Twig | Adds a `star` icon + "sponsor" confirm modal to published rows of the event list, linking to `events_sponsor` (`event-actions.html.twig:3-10, 54-72`). The `/events/sponsor/{slug}` route itself stays reachable even when off (verified: HTTP 200). |
| `ACTIVATE_MEMBERS` | `false` | **true** | `$membersActivated` | Adds the `member` boolean column to the users list (`UserController.php:71-78`), the `member` checkbox to the user form (`UserType.php:108-114`), and enables the `member` search param in `EventSearchEngine`/`EventOccurrenceRepository` (API only). |
| `JOIN_US_LINK` | `` (empty) | `TODO` | Twig `joinUsLink` | BKA login page only: renders the "Join us" button (`themes/bka/templates/security/login.html.twig:12-19`). |
| `ACTIVATE_EVENT_VIDEOS` | `false` | **true** | `$eventVideosActivated` + Twig | Adds the `videos` collection to the event form (`EventType.php:471-485`) and renders it with its help text (`templates/includes/form/event_form.html.twig:121-127`). 2 025 video rows exist in production. |
| `ACTIVATE_PROPOSAL_PLACE` | `false` | **true** | `$activateProposalPlace` | (a) Propose-event step 1 gains the "use a new place" checkbox + the whole `PlaceProposed` sub-form (`ProposeEventController.php:75`, `ProposeEventStep1Type.php:43-70`). (b) On the event edit screen the `place` field becomes **optional** when the event carries a `placeProposed` (`EventController.php:499`) and a read-only summary of the proposed place is shown (`event_form.html.twig:35-47`). 1 823 `place_proposed` rows exist. |
| `USE_OPTIMIZED_EVENT_LOAD` | `false` | **true** | `$useOptimizedEventLoad` | API-only: switches `ApiEventController` to the `event_occurrence` based search, and enables `EventDoctrineListener`. **No admin-UI effect.** |
| `HAS_PRINT_OPTIONS` | `false` | **true** | `$hasPrintOptions` + Twig | (a) Event create/edit: `showInPrint` checkbox + `printCategory` select + `printDescription` multilang textarea, shown only when `user.isMember() OR ROLE_ADMIN` (`EventType.php:136`, `EventController.php:436, 494`). (b) Events index: shows the "see members-only events" button for admins (`templates/event/events.html.twig:29-36`). (c) Propose-event step 1 pre-sets `showInPrint=false` on the new event (`ProposeEventController.php:66-69`). 21 987 events have `show_in_print = true`. |
| `ACTIVATE_IMAGE_GENERATOR` | `false` | **false** | `$imageGeneratorActivated` + Twig | Adds the "Tools → Bildgenerator" nav dropdown (`includes/header.html.twig:115-132`) and an `image` icon per event row (`event-actions.html.twig:16-20`). The `/image_generator*` routes stay reachable when off (verified: HTTP 200). |
| `SHOW_MANUAL` | `false` | **true** | Twig `showManual` | Adds a "Manual zum erfassen von Mitgliederanlässen" PDF link on the event **create** and **edit** screens, pointing at `public/documents/Manual_BKa_Mitglieder.pdf` (`templates/event/create.html.twig:12-17`, `edit.html.twig:11-16`). |
| `ACTIVATE_MULTI_TICKETINGS` | `false` | *unset* → **false** | `$multiTicketingsActivated` + Twig | ON: event form and propose-step-3 render a `ticketings` collection (designation enum + multilang URL) instead of the single multilang `ticketingUrl` field. OFF (BKA): the single `ticketingUrl` multilang field. Production `ticketing` table is **empty (0 rows)**, confirming OFF. |
| `ACTIVATE_EVENT_NAME_TRANSLATABLE` | `false` | **true** (set via `.env.local`, *not* via `docker-compose.yaml`) | `$activateEventNameTranslatable` | Turns `name` into a `MultilangCollectionType` (one tab per locale, stored in `labels[name]`) on `EventType`, `ProposeEventStep2Type`, `OrganizationType`, `PlaceType`, and turns `orgName`/`placeName` multilang on `OrgCreationType`. A POST_SUBMIT hook back-fills the legacy scalar `name` for API compatibility. **Verified on the live BKA instance**: `/events/create` renders `event[name][fr]` and `event[name][de]`. |
| `ACTIVATE_SLUG_GENERATOR_WITH_ID` | `false` | *unset* → false | `$slugGeneratorWithIdActivated` | API-only (`SlugEntityToDtoItemProvider`, `SlugEntityValueResolver`). No admin-UI effect. |
| `LOCALES` | `fr\|de` | `fr\|de` | `$locales` / Twig `app_locales` | Which languages the multilang tabs render, which locales the user-language select offers, and which `_locale` values the propose-event routes accept (route `condition`). |
| `DEFAULT_LOCALE` | `fr` | **de** | parameter `locale` | Symfony default locale + translation fallback; used to pick which translated `name` back-fills the legacy scalar. |
| `GOOGLE_MAP_API_KEY` / `GOOGLE_MAP_ID` | empty | empty | Twig globals | The "search an address" autocomplete + map preview on the place / organization / proposed-place forms. **Empty in this deployment → the map is dead on screen.** |
| `R2_PUBLIC_BASE` | — | empty locally | — | Public base of the image CDN; also used by `ImageRedirectController` for `/img/{path}` 302s. |

> **UNVERIFIED:** the true production values of `ACTIVATE_PROINFIRMIS`, `ACTIVATE_EVENT_NAME_TRANSLATABLE` and
> `ACTIVATE_MULTI_TICKETINGS`. The local compose file omits two of them and the DB evidence (pictograms present,
> `ticketing` empty, `labels` populated) is the best signal available. Reading the real deployment's env would settle it.

---

## 3. Roles, firewalls and voters

### 3.1 Roles

`config/packages/security.yaml:15-17`

```yaml
role_hierarchy:
    ROLE_ADMIN:       ROLE_USER
    ROLE_SUPER_ADMIN: [ROLE_ADMIN, ROLE_ALLOWED_TO_SWITCH]
```

Three user *types* exist in the UI (`src/Entity/User.php:20-28`), mapped onto roles by `UserType::onPostSubmit`
(`src/Form/UserType.php:137-169`):

| UI user type (`user.userType.choices.*`) | German label | Roles written | `config.org_creation` written |
| --- | --- | --- | --- |
| `admin` ("Admin-Konto") | Admin | `ROLE_USER` (+ `ROLE_ADMIN` if the separate "Chef-Verwalter/in" checkbox is ticked) | `needed` (or kept `done`) |
| `admin_additional` ("Zusätzliches Admin-Konto") | Zusätzlicher Admin | `ROLE_USER` | `ignored` |
| `broadcast_partner` ("Partner") | Übertragungspartner | `ROLE_BROADCAST_PARTNER` | `ignored` |

Production role distribution (427 users): `["ROLE_USER"]` × 397, `["ROLE_USER","ROLE_ADMIN"]` × 28,
`["ROLE_ADMIN","ROLE_USER"]` × 2. **No `ROLE_SUPER_ADMIN` and no `ROLE_BROADCAST_PARTNER` users exist in BKA
production** — so user impersonation (which needs `ROLE_ALLOWED_TO_SWITCH`) is effectively dead, and the
broadcast-partner path is unused. 269 of 427 users are flagged `member = true`.
All 427 users have `locale = 'de'`.

### 3.2 Firewall access control

`config/packages/security.yaml:81-92` (first match wins):

```yaml
- { path: ^/login$,                      roles: PUBLIC_ACCESS }
- { path: ^/img/,                        roles: PUBLIC_ACCESS }
- { path: ^/reset-password,              roles: PUBLIC_ACCESS }
- { path: ^/(fr|de)/proposer-un-evenement, roles: PUBLIC_ACCESS }
- { path: ^/api/v2,                      roles: PUBLIC_ACCESS }
- { path: ^/admin/users/edit/\d+$,       roles: IS_AUTHENTICATED_REMEMBERED }   # own account
- { path: ^/admin,                       roles: ROLE_ADMIN }
- { path: ^/api/authorize,               roles: IS_AUTHENTICATED_REMEMBERED }
- { path: ^/api,                         roles: IS_AUTHENTICATED_FULLY }
- { path: ^/,                            roles: IS_AUTHENTICATED_REMEMBERED }
```

Also on the `main` firewall: `form_login` with CSRF, `login_throttling`, `remember_me` (4 weeks), `switch_user: true`.
`SecurityListener::onCheckPassport` rejects a login when `user.enabled = false`; `onLoginSuccess` stamps `lastLogin`.
`UserLocaleSubscriber` switches the UI to the user's stored `locale` on login unless a language was explicitly picked
in the session's language switcher.

### 3.3 Voters

| Voter | Attributes | Rule (admins always win) |
| --- | --- | --- |
| `EventVoter` (`src/Security/Voters/EventVoter.php`) | `view`, `edit`, `publish` | `publish` = user owns the event (`event.user`) **or** is a member of `event.organization` **or** of `event.place.organization`. `edit` = `publish` **or** `event.proposedBy.email` case-insensitively equals the user's email. `view` = `edit` **or** `ROLE_BROADCAST_PARTNER`. |
| `OrganizationVoter` | `view`, `edit` (`create`/`delete` declared but never supported) | `user.organizations.contains(org)` |
| `PlaceVoter` | `view`, `edit` | any of the user's organizations has this place |
| `UserTokenVoter` | `USER_TOKEN_MANAGE` | `token.owner === user` |

---

## 4. Route table (web/admin routes only)

Taken verbatim from `debug:router`, annotated with controller, guard and purpose. API routes (`/api/v1`, `/api/v2`,
`/api/token`, `/api/authorize`), the LiipImagine, Bazinga-translation, NelmioSecurity and UX-LiveComponent routes are
omitted.

| Route name | Path | Methods | Controller::action | Required role / guard | Screen / effect |
| --- | --- | --- | --- | --- | --- |
| `index` | `/` | ANY | `DefaultController::index` | `IS_AUTHENTICATED_REMEMBERED` | Redirects `ROLE_BROADCAST_PARTNER` → `user_token_index`, everyone else → `events_index`. |
| `api_doc` | `/api/doc` | ANY | `DefaultController::apiDoc` | firewall `api_doc` = **public** | Stoplight Elements viewer over `/openapi.yaml` (`templates/docs/openapi.html.twig`). |
| `app_login` | `/login` | ANY | `SecurityController::index` | public | BKA login card (`themes/bka/templates/security/login.html.twig`): "Mitglieder-Login", username/password, CSRF, forgot-password link, Join-us button, language switcher. |
| `app_logout` | `/logout` | GET | handled by the firewall | authenticated | Logs out. |
| `app_forgot_password_request` | `/reset-password` | ANY | `ResetPasswordController::request` | public | "Passwort-Wiederherstellung" — email field (§13). |
| `app_check_email` | `/reset-password/check-email` | ANY | `ResetPasswordController::checkEmail` | public | "Zurücksetzung gesendet" confirmation (always shown, even for unknown emails). |
| `app_reset_password` | `/reset-password/reset/{token}` | ANY | `ResetPasswordController::reset` | public | Stores the token in the session, redirects to the token-less URL, then shows the repeated new-password form. |
| `events_index` | `/events/` | ANY | `EventController::index` | `IS_AUTHENTICATED_REMEMBERED` | Upcoming-events list + the one-off org-creation modal (§12). |
| `events_members_only` | `/events/members-only` | ANY | `EventController::members_only` | explicit `ROLE_ADMIN` check → 403 otherwise | Upcoming events whose owning **user** has `member = true`. |
| `events_archived` | `/events/archived` | ANY | `EventController::archived` | `IS_AUTHENTICATED_REMEMBERED` | Past events list (`dateTo < now`). |
| `events_create` | `/events/create` | ANY | `EventController::create` | `#[IsGranted('ROLE_USER')]` | Full event form (§6). |
| `events_edit` | `/events/edit/{slug}` | ANY | `EventController::edit` | `denyAccessUnlessGranted('edit', $event)` | Full event form, pre-filled; sends notification mails on save. |
| `events_copy` | `/events/copy/{slug}` | ANY | `EventController::copy` | `edit` on the event | **No confirmation.** Duplicates immediately and redirects to the copy's edit screen with a success flash. |
| `events_sponsor` | `/events/sponsor/{slug}` | ANY | `EventController::sponsor` | `edit` on the event | Two date fields (sponsoring window). Only linked when `ACTIVATE_SPONSORED_EVENTS=true` (OFF for BKA) but reachable by URL. |
| `events_delete` | `/events/delete/{slug}` | ANY (a plain `<a href>`) | `EventController::delete` | `edit` on the event | **Hard delete**, no CSRF token; the confirmation is a Bootstrap modal in the list. Redirects to `events_index`. |
| `events_preview` | `/events/preview/{slug}` | ANY | `EventController::preview` | `view` on the event | **Dead + broken.** Not linked from any template; returns HTTP 500 — `templates/event/preview.html.twig:19` calls `event.nextEventDate`, which no longer exists on `MainEvent`. |
| `organizations_index` | `/organizations/` | ANY | `OrganizationController::index` | `IS_AUTHENTICATED_REMEMBERED` | Organizations list. |
| `organizations_create` | `/organizations/create` | ANY | `OrganizationController::createOrganization` | `#[IsGranted('ROLE_USER')]` **plus** an inner `denyAccessUnlessGranted('ROLE_ADMIN')` | Organization form. |
| `organizations_edit` | `/organizations/edit/{id}` (`id` = `\d+`) | ANY | `OrganizationController::editOrganization` | `edit` on the organization | Organization form. |
| `organizations_delete` | `/organizations/delete/{id}` | ANY | `OrganizationController::deletePlace` *(sic — misnamed)* | `ROLE_ADMIN` | Hard delete, no CSRF. |
| `places_index` | `/places/` | ANY | `PlaceController::index` | `IS_AUTHENTICATED_REMEMBERED` | Places list. |
| `places_create` | `/places/create` | ANY | `PlaceController::createPlace` | `ROLE_ADMIN` | Place form. |
| `places_edit` | `/places/edit/{id}` | ANY | `PlaceController::editPlace` | `edit` on the place | Place form; back-fills `region` from the owning organization when empty. |
| `places_delete` | `/places/delete/{id}` | ANY | `PlaceController::deletePlace` | `ROLE_ADMIN` | Refuses with a danger flash and redirects back to the edit screen when `eventRepository->countEventsForPlace()` > 0; otherwise hard delete. |
| `users_index` | `/admin/users/` | ANY | `UserController::index` | `ROLE_ADMIN` (firewall) | Users list. |
| `users_create` | `/admin/users/create` | ANY | `UserController::createUser` | `ROLE_ADMIN` (firewall) | User form with password (§9). |
| `users_edit` | `/admin/users/edit/{id}` | ANY | `UserController::editUser` | `IS_AUTHENTICATED_REMEMBERED`; controller rejects non-admins editing someone else | Admin: full form. Non-admin editing self: **email + language only** (`self_service` option). |
| `users_delete` | `/admin/users/delete/{id}` | ANY | `UserController::deleteUser` | `ROLE_ADMIN` | Refuses to delete the logged-in account; catches `ForeignKeyConstraintViolationException` and shows a danger flash instead of a 500. |
| `users_password` | `/admin/users/password/{id}` | ANY | `UserController::editPassword` | `ROLE_ADMIN` (firewall only — **no per-user check in the controller**) | Repeated-password form; re-hashes and saves. |
| `user_token_index` | `/user-token/` | ANY | `UserTokenController::index` | class-level `#[IsGranted(expr "ROLE_USER or ROLE_BROADCAST_PARTNER")]` | API-token list; non-admins only see their own. |
| `user_token_create` | `/user-token/create` | ANY | `UserTokenController::create` | same | Creates a JWT; the raw token is shown **once** in a warning flash. |
| `user_token_show` | `/user-token/show/{id}` | ANY | `UserTokenController::show` | `USER_TOKEN_MANAGE` | Shows name + the stored token string. |
| `user_token_delete` | `/user-token/delete/{id}` | ANY | `UserTokenController::delete` | `USER_TOKEN_MANAGE` | Hard delete, **no confirmation modal**, warning flash. |
| `app_image_generator` | `/image_generator` | ANY | `ImageGeneratorController::index` | `IS_AUTHENTICATED_REMEMBERED` | React app mount point (`templates/image_generator/index.html.twig`). Reachable (200) even with the flag off; just unlinked. |
| `app_image_generator_event` | `/image_generator/event/{eventId}` | ANY | `ImageGeneratorController::indexWithEvent` | same | Same screen, pre-selecting an event. |
| `app_image_generator_get_events` | `/image_generator/events` | ANY | `ImageGeneratorController::getEvents` | same | JSON: upcoming events, filtered to the user's organizations for non-admins. |
| `upload_og_images` | `/image_generator/upload-og-images` | POST | `ImageGeneratorController::uploadOgImages` | inner `ROLE_USER` check | Stores `ogImageFr` / `ogImageDe` under `public/img/event-og-images/`, writes `event.og_image`. |
| `remove_og_images` | `/image_generator/remove-og-images` | POST | `ImageGeneratorController::removeOgImages` | inner `ROLE_USER` check | Unlinks the files for every locale in `LOCALES` and nulls `event.og_image`. |
| `legacy_image_redirect` | `/img/{path}` (`path` = `.+`) | ANY | `ImageRedirectController::__invoke` | firewall `images` = **public** | 302 to `R2_PUBLIC_BASE/img/{path}` with a 1-day cache; rejects paths containing `..`. |
| `propose_event_step1` | `/{_locale}/proposer-un-evenement/lieu` | ANY | `ProposeEventController::proposeEventStep1` | public (locale must be in `LOCALES`) | Wizard step 1 (§11). |
| `propose_event_step2` | `/{_locale}/proposer-un-evenement/infos` | ANY | `…Step2` | public | Wizard step 2. |
| `propose_event_step3` | `/{_locale}/proposer-un-evenement/billetterie` | ANY | `…Step3` | public | Wizard step 3. |
| `propose_event_step4` | `/{_locale}/proposer-un-evenement/coordonnees` | ANY | `…Step4` | public | Wizard step 4. |
| `propose_event_step5` | `/{_locale}/proposer-un-evenement/resume` | ANY | `…Step5` | public | Wizard step 5 — the only step that persists. |
| `propose_event_step6` | `/{_locale}/proposer-un-evenement/validation` | ANY | `…Step6` | public | Wizard step 6 — clears the session. |

Note that **every admin route accepts any HTTP method** — deletes are plain GET links with no CSRF token.

---

## 5. Application chrome

### 5.1 Header (`templates/includes/header.html.twig`, BKA overrides only the logo + frontend link)

* Brand logo → `index`. BKA logo: `themes/bka/templates/includes/svg/bka_logo_horizontal.html.twig`.
* "Zur BKA" button → `https://bka.ch/` in a new tab (`themes/bka/templates/includes/header_frontend_link.html.twig`).
* Account block: `account_circle` icon + the logged-in email, linking to `users_edit` for **oneself**. Dropdown:
  * "Abmelden" → `app_logout` — *or*, when impersonating, "Exit impersonation" → `impersonation_exit_path(users_index)`.
  * "Einstellungen" → `users_edit` for oneself.
* "Verwaltung" dropdown: Veranstaltungen (`events_index`), Orte (`places_index`), Organisationen
  (`organizations_index`), Archiv der Veranstaltungen (`events_archived`), divider, **Nutzer\*innen (`users_index`,
  `ROLE_ADMIN` only)**, API-Zugangstoken (`user_token_index`).
* "Tools → Bildgenerator" dropdown — only when `ACTIVATE_IMAGE_GENERATOR` (OFF for BKA).
* Language switcher (`De`/`Français`) — rendered because `LOCALES` has 2 entries. The switcher appends `?_locale=xx`,
  which `LocaleSubscriber` stores in the session and flags as "chosen by the user"; it never changes
  `user.locale` in the database.
* Mobile: a bare `logout` icon.

### 5.2 Layouts

| Layout | Used by | Shape |
| --- | --- | --- |
| `layout-fullwidth.html.twig` | all list screens, sponsor, users, tokens, image generator | header + flash area + `.container py-18` |
| `layout-fullwidth-no-container.html.twig` | event create/edit | header + flash area + full-bleed sections |
| `layout-cover.html.twig` | **BKA login** | centred card, no header/sidebar |
| `layout-login.html.twig` | In Situ login (not used by BKA) | public sidebar nav + signup panel |
| `layout-propose-event.html.twig` | propose-event wizard | **BKA override** (`themes/bka/templates/layout-propose-event.html.twig`): just the 6-step indicator + content; the In Situ version's long "I have an account / I don't have an account" preamble is **dropped**. Loads `iframeResizer.contentWindow.js` so the wizard can be embedded in an iframe on bka.ch. |

### 5.3 Flash messages

`templates/includes/alerts.html.twig` renders `success`, `info`, `warning`, `danger` bags as dismissible
full-width alerts, rendered **raw** (HTML allowed — used by the "here is your new API token" flash).

### 5.4 Ajax form submission

Every form on the admin carries `data-controller="ajax-form"` (`assets/controllers/ajax-form_controller.js`).
Mechanics:

* The submit is sent with the `X-Ajax-Form` header.
* On a validation failure the controller returns `422` with
  `{errors: {global: [...], fields: {<domId>: [...]}}, flashes: {...}}` (`src/Form/AjaxFormResponder.php`,
  `src/Form/FormErrorSerializer.php`); the JS paints the errors onto the existing DOM so picked files, TinyMCE
  instances and Choices.js selects survive.
* On success the controller still returns a redirect; `AjaxFormResponseListener` converts it to
  `{"redirect": "<url>"}` and the browser navigates. The same conversion covers the security redirect to `/login`
  when the session expired mid-form.
* Error strings: `misc.form.networkError`, `misc.form.serverError`.

---

## 6. List screens

### 6.1 Shared DataTables behaviour

`config/packages/datatables.yaml`:

```yaml
options:
    lengthMenu: [10, 25, 50, 100]
    pageLength: 25
    dom: "<'row' <'col-sm-12' f><'col-sm-12' t>><'row' <'col align-self-start'l><'col align-self-end'pi>>"
    orderCellsTop: true
    ordering: true
    searching: true
template_parameters:
    className: 'table table-striped'
translation_domain: 'tables'
```

* Server-side processing, `method: POST`, state kept in the URL fragment (`"state":"fragment"`).
* `templates/includes/datatables_script.html.twig` overrides `dom` to `lrtip` (removing the native search box) and
  wires the page's own pill-shaped `#custom-search-input` to `dt.search(...)`, with a `#clear-search-input` cross.
  The placeholder is `misc.search_in_list` ("in der Liste suchen").
* Every search uses `LOWER(UNACCENT(field)) LIKE %pattern%` via `App\Search\SearchNormalizer::containsPattern`.
* Language file is pulled from the DataTables CDN (`//cdn.datatables.net/plug-ins/1.10.15/i18n/German.json`).
* A small script sets `title` attributes on truncated cells.
* **There are no bulk actions, no row checkboxes, and no export buttons anywhere.**
* Column header labels live in `translations/tables.de.yml` / `tables.fr.yml`.

### 6.2 `/events/` — upcoming events (`EventController::index`)

Headline `misc.event.manageFutur` ("Verwaltung der Veranstaltungen") + `misc.event.manage_info` + the support
contact block (`includes/contact.html.twig`, BKA → `support@bka.ch`).

**Query** (`EventController.php:92-150`): `MainEvent e LEFT JOIN e.place p LEFT JOIN e.organization o WHERE
e.dateTo >= :today`, **OR** `e.id IN (ids of main events that have at least one SubEvent with dateTo >= today)`.
With `listOwn` the main query and the sub-event pre-query additionally require
`o.id IN :userOrganizations OR LOWER(pb.email) = :userEmail`.

| # | Column (`event.columns.*` de) | Type | Source | Searchable | Sortable | Width class |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | ID | `NumberColumn` | `e.id` | no | yes | `col-width-7p text-start` |
| 1 | Startdatum | `TwigColumn` `datatables/event-dateFrom-modal.html.twig` | `e.dateFrom` | no | yes | `col-width-10p` |
| 2 | Name | `TextColumn` | `e.name` | yes | yes | `col-width-26p` |
| 3 | Ort | `TextColumn` | `p.name` | yes | yes | `col-width-13p` |
| 4 | Verantwortliche:r der Organisation | `TwigColumn` `datatables/event-organizer.html.twig` | `o.name` | yes | yes (via field) | `col-width-16p` |
| 5 | Status der Veranstaltung | `TextColumn`, rendered through `event.eventStatus.options.*` | `e.eventStatus` | yes (default) | yes | `col-width-10p` |
| 6 | Status der Veröffentlichung | `TextColumn`, rendered through `event.publicationStatus.options.*` | `e.publicationStatus` | yes (default) | yes | `col-width-10p` |
| 7 | Aktionen | `TwigColumn` `datatables/event-actions.html.twig` | — | no | no | `col-width-auto text-end` |

Default sort: `dateFrom DESC`.

**Screen controls**

* "Eine Veranstaltung erstellen" primary button (`ROLE_USER` only) → `events_create`.
* "Nur Veranstaltungen von Mitgliedern anzeigen →" light button, **only when `HAS_PRINT_OPTIONS && ROLE_ADMIN`** →
  `events_members_only`.
* "Meine Veranstaltungen anzeigen" toggle: links to `events_index?mine=1` / `?mine=0`; active state swaps the icon
  from `visibility` to `close`. Server side `mine=1` forces `listOwn`.
* The global search box.

**Row actions** (`templates/datatables/event-actions.html.twig`, all wrapped in `is_granted('edit', row)`)

| Icon | Condition | Action |
| --- | --- | --- |
| `star` | `sponsoredEventsActivated && publicationStatus == 'publish'` (OFF for BKA) | Opens the "Sponsoring" confirm modal → `events_sponsor`. Turns amber while the sponsoring window is live. |
| `content_copy` | `clipboardEventLinks` (**ON for BKA**) | `window.saveEventToClipBoardForWePublish(slug)` → writes `event=<slug>` to the clipboard, swaps the icon to a tick for 800 ms. |
| `image` | `imageGeneratorActivated` (OFF) | → `app_image_generator_event` |
| `file_copy` | always | → `events_copy` — duplicates **without confirmation** (tooltip `misc.event.copy` = "Duplizieren"). |
| `edit_square` | always | → `events_edit` |
| `delete` (red) | always | Opens the delete modal: title `misc.event.deleteTitle`, body `misc.event.deleteContent` with `%event%`, buttons Abbrechen / Löschen → `events_delete`. |

**Date cell modal** (`event-dateFrom-modal.html.twig`): the cell shows `dateFrom|date('d.m.Y')` plus a tiny "+" button.
The modal has three shapes:

1. `recurrence == 'week'` → "Wöchentlich wiederkehrender Zeitplan", the from–to date range, the weekday names
   (`weekday_name` Twig filter), and up to three time boxes (Öffnung / Anfang / Schließen).
2. otherwise, `relatedDates()|length > 1` → "Personalisierter wiederkehrender Zeitplan" listing every related date.
3. otherwise → "Veranstaltungstermine" with the single date range and the time boxes.

**Organizer cell** (`event-organizer.html.twig`): if `proposedBy` is null it prints `organization.name`; otherwise it
prints "Externe Organisation" plus a "+" button opening a modal with the proposer's full name, email, phone and
organization. (The modal's close button label is hardcoded French: `Fermer`.)

### 6.3 `/events/members-only` (`EventController::members_only`)

Admin-only (explicit `createAccessDeniedException`). Same base query as the index plus
`LEFT JOIN e.user u AND u.member = true`. Differences from the index:

* **No `id` column.** Columns: `dateFrom` (plain `DateTimeColumn`, format `d.m.Y`, **no modal**), `name`, `place`,
  `organizer` (plain `TextColumn` on `o.name`, **no proposedBy modal**), `eventStatus`, `publicationStatus`, `actions`
  (the normal `event-actions` template). Verified live: `['DT_RowId','dateFrom','name','place','organizer','eventStatus','publicationStatus','actions']`.
* No width classes.
* The only screen control is a "← Alle Veranstaltungen anzeigen" button back to `events_index`. No create button,
  no "mine" toggle, no search box markup is rendered (the shared `#custom-search-input` block is inside the
  `events_index` branch only) — so the JS falls back to no external search, and the native filter is hidden.
* `listOwnEventsOnly` logic is still applied for non-admins — unreachable, since the action already requires admin.

### 6.4 `/events/archived` (`EventController::archived`)

Headline `misc.event.manageArchived` ("Archiv der Veranstaltungen"). Query: `MainEvent e WHERE e.dateTo < :today`
(plus the `listOwn` org/proposer restriction). **Sub-events are not folded in here.**

| # | Column | Notes |
| --- | --- | --- |
| 0 | ID | as index |
| 1 | Startdatum | same modal template as index |
| 2 | Name | as index |
| 3 | Ort | field `e.archivedPlace`; displayed value is `row.archivedPlace ?? row.place?.name ?? ''`; **`orderable: false`** |
| 4 | Verantwortliche:r der Organisation | field `e.archivedOrganization`; displayed value `row.archivedOrganization ?? row.organization?.name ?? ''`; **`orderable: false`** |
| 5 | Status der Veranstaltung | as index |
| 6 | Status der Veröffentlichung | as index |
| 7 | Aktionen | `datatables/event-archived-actions.html.twig` — **BKA overrides this template** |

Default sort `dateFrom DESC`. Screen controls: only the "Meine Veranstaltungen anzeigen" toggle
(`events_archived?mine=…`) and the search box. **No create button.**

**Archived row actions — BKA override** (`themes/bka/templates/datatables/event-archived-actions.html.twig`):

| Icon | Condition | Action |
| --- | --- | --- |
| `file_copy` | `is_granted('edit', row)` | `events_copy` |
| `edit_square` | `is_granted('edit', row) and publicationStatus != 'publish'` | `events_edit` |
| `delete` | `ROLE_ADMIN` | delete modal → `events_delete` |

The In Situ default template additionally shows a `visibility` icon linking to `https://www.insitu.live/…/evenement/<slug>`
and gives admins an `edit_square` for published rows too; **the BKA override removes both**, so an admin cannot edit a
*published* archived event from the archive list (they can still reach `/events/edit/{slug}` directly, and the
`archivedPlace`/`archivedOrganization` fields then appear, see §7.5).

Why the snapshot columns exist: `ArchivedRelationNameListener` keeps `event.archived_organization` /
`event.archived_place` in sync on **upcoming** events whenever an organization or place is renamed, so past events
retain the historical name. Production: 31 717 events have `archived_place`, 27 949 have `archived_organization`.

### 6.5 `/places/` (`PlaceController::index`)

Headline `misc.place.manage` ("Verwaltung der Veranstaltungsorte") + BKA-specific `manage_info` text + support block.

Query: `Place p LEFT JOIN p.organization o`; with `?mine=1`, `:user MEMBER OF o.users`.

| # | Column | Type | Field | Search | Sort |
| --- | --- | --- | --- | --- | --- |
| 0 | ID | NumberColumn | `p.id` | no | yes |
| 1 | Name | TextColumn | `p.name` | yes | yes |
| 2 | Strasse | TextColumn | `p.address` | yes | yes |
| 3 | Ortschaft | TextColumn | `p.city` | yes | yes |
| 4 | PLZ | TextColumn | `p.zip` | yes | yes |
| 5 | Admin Organisation | TextColumn | `o.name` | yes | yes |
| 6 | Status des Ortes | BoolColumn (`Aktiv` / `Inaktiv` / `-`) | `p.enabled` | no | yes |
| 7 | Aktionen | TwigColumn `place-actions` | — | no | no |

Default sort `name ASC`. Controls: "Einen Ort erstellen" (admin only), "Meine Orte anzeigen" toggle, search.
Row actions: `edit_square` (voter `edit`) and, for admins, `delete` with a confirm modal
(`misc.place.deleteTitle` / `deleteContent`).

### 6.6 `/organizations/` (`OrganizationController::index`)

Headline `misc.organization.manage` + `manage_info` + support block.

| # | Column | Type | Field | Search | Sort |
| --- | --- | --- | --- | --- | --- |
| 0 | ID | NumberColumn | `o.id` | no | yes |
| 1 | Name | TextColumn | `o.name` | yes | yes |
| 2 | Ortschaft | TextColumn | `o.city` | yes | yes |
| 3 | PLZ | TextColumn | `o.zip` | yes | yes |
| 4 | Verwaltete Orte | TwigColumn `organization-places` (comma-joined place names, `-` when empty) | none | no | marked `orderable: true` but there is no order field — **sorting on this column is a no-op** (verified: ordering by column 4 returns rows in id order) |
| 5 | Aktivitätsstatus | BoolColumn (`Aktiv` / `Inactiv` / `-`) | `o.enabled` | no | yes |
| 6 | Aktionen | TwigColumn `organization-actions` | — | no | no |

Default sort `name ASC`. The global search is **custom** (`OrganizationController.php:79-104`): it replaces the
default criteria provider so that one search term matches `o.name`, `o.city`, `o.zip` **or** the name of any
related `Place`, via an `EXISTS` sub-query (deliberately not a join, to keep `COUNT` correct).

Controls: "Eine Organisation erstellen" (admin only), "Meine Organisationen anzeigen" toggle, search.
Row actions: `edit_square` (voter), `delete` + modal (admin only).

### 6.7 `/admin/users/` (`UserController::index`)

Headline `misc.user.manage`. Query: all users, no filter.

| # | Column | Type | Source | Search | Sort |
| --- | --- | --- | --- | --- | --- |
| 0 | ID | TextColumn | `u.id` | no | yes |
| 1 | E-mail | TextColumn | `u.email` | yes | yes |
| 2 | Letzte Anmeldung | DateTimeColumn `d.m.Y H:i` | `u.lastLogin` | no | yes |
| 3 | Art des Kontos | TextColumn, `field: null`, computed | comma-joined list of `Super-admin` (if `ROLE_ADMIN`), `Admin` (if `ROLE_USER`), `Broadcast-partner` (if `ROLE_BROADCAST_PARTNER`) | no | no |
| 4 | Aktiv | BoolColumn, hardcoded `Oui`/`Non`/`-` (**French strings even in the German UI**) | `u.enabled` | no | yes |
| 5 | Mitglied | BoolColumn, `Oui`/`Non`/`-`; **only when `ACTIVATE_MEMBERS`** (ON for BKA) | `u.member` | no | yes |
| 6 | Aktionen | TwigColumn `user-actions` | — | no | no |

Default sort `email ASC`. Controls: "Créer un utilisateur" primary button (translation key
`misc.user.create_a_user` is **untranslated in German — it still reads French**) and the search box.

Row actions (`templates/datatables/user-actions.html.twig`):

| Icon | Condition | Action |
| --- | --- | --- |
| `edit_square` | always | `users_edit` |
| `key` | always (tooltip `reset_password.new_password`) | `users_password` |
| `login` | `ROLE_ALLOWED_TO_SWITCH && !IS_IMPERSONATOR` | `path('index')?_switch_user=<email>` — **unreachable in BKA prod**: nobody has `ROLE_SUPER_ADMIN`. |
| `delete` | `ROLE_ADMIN` | delete modal → `users_delete` |

### 6.8 `/user-token/` (`UserTokenController::index`)

Headline `user_token._labels.Manage` ("Verwaltung der API-Zugangstoken").

| # | Column | Type | Source | Search | Sort |
| --- | --- | --- | --- | --- | --- |
| 0 | ID | TextColumn | `ut.id` | no | yes |
| 1 | Besitzer | TextColumn, `field: null`, computed `owner.email` | — | no | no |
| 2 | Name | TextColumn | `ut.name` | yes | yes |
| 3 | Verfall | DateTimeColumn `d.m.Y H:i` | `ut.expiresAt` | no | yes |
| 4 | *(empty header)* | TwigColumn `user-token-actions` | — | no | no |

Non-admins only see `ut.owner = currentUser`. **No default ordering is declared.** Controls: "Benutzertoken
erstellen" button and the search box.

Row actions: `visibility` → `user_token_show`; `delete` → `user_token_delete` **immediately, with no confirmation
modal** (the only destructive action in the whole admin without one).

`user_token_show` renders only `<h1>API-Zugangstoken · {name}</h1>` and the raw token string.

---

## 7. The event form (`EventType`, 853 lines)

Used by `/events/create` and `/events/edit/{slug}`; data class `MainEvent`. Rendered through
`templates/includes/form/event_form.html.twig`, split into five titled sections.

### 7.1 Form options

| Option | Default | Set by the controller |
| --- | --- | --- |
| `data_class` | `MainEvent` | — |
| `place_required` | `true` | edit: `!activateProposalPlace || !event.placeProposed` |
| `display_archived_fields` | `false` | edit: `ROLE_ADMIN && eventDatesCalculator.getLastDateTo(event) < now` |
| `can_publish` | `true` | edit: `isGranted('publish', $event)` |

`create` does **not** pass any of them, so the create screen always has a required place, no archived fields and an
enabled publication-status select.

`$showPrintFields = (user.isMember() || ROLE_ADMIN) && HAS_PRINT_OPTIONS` is computed identically in the controller
(for the template) and in the form type.

### 7.2 Complete field table

Verified against the live render of `/events/create` (field names in DOM order):
`name[fr] name[de] eventStatus place organization showInPrint categories[] printCategory schedule recurrence
recurrenceWeekDays[] openingTime dateFrom slotTimeOpening slotTimeFrom slotTimeTo dateTo specialRate
ticketingUrl[fr] ticketingUrl[de] description[fr] description[de] printDescription[fr] printDescription[de]
audience publicationStatus publicationDate _token` (+ the `rates`, `images`, `videos`, `subEvents` collection
prototypes).

| Field | Widget | Required | Maps to | Validation | Default / help | Conditional |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `MultilangCollectionType` (TextType per locale, pill tabs) | yes | `labels[name]`; a POST_SUBMIT hook also writes the legacy scalar `name` | `MultiLangCollectionNotEmpty`; per entry `Length(max 130)`; `maxLength=130` attr | label `event.name._label`; BKA help "Name der Veranstaltung, Ausgabe, Name der Künstler:innen etc." | multilang only when `ACTIVATE_EVENT_NAME_TRANSLATABLE` (ON); otherwise a single `TextType` with `NotBlank` |
| `eventStatus` | `ChoiceType` (`select`) | yes | `eventStatus` | `NotBlank` | choices `confirmed`/`canceled`/`postponed`/`full` → `event.eventStatus.options.*` (Bestätigt / Annuliert / Verschoben / Ausverkauft) | — |
| `place` | `EntityType<Place>` (`select-html`, searchable) | `place_required` | `place` | `NotNull` when `place_required` | placeholder `-`; admins get **all** places ordered by name, others `PlaceRepository::findActiveAndNotPrivate($user)` = enabled AND (not private OR belonging to one of the user's orgs); each option carries `data-custom-properties={"desc":"<zip> <city>"}` | hidden when `display_archived_fields` |
| `organization` | `EntityType<Organization>` (`select`) | yes | `organization` | `NotNull` | admins: all organizations; others: the user's organizations **plus** the event's current organization if it is not among them | hidden when `display_archived_fields`; **rebuilt in POST_SET_DATA when `event.proposedBy != null`** → becomes `required: false` and, for non-admins, `disabled` |
| `archivedOrganization` | `TextType`, `disabled` | no | `archivedOrganization` | — | label `event.organization._label` | only when `display_archived_fields` |
| `archivedPlace` | `TextType`, `disabled` | no | `archivedPlace` | — | label `event.place._label` | only when `display_archived_fields` |
| `showInPrint` | `CheckboxType` | no | `showInPrint` | — | BKA label "BKa Mitgliederanlass", help "Wenn dieses Kästchen aktiviert ist, erscheint die Veranstaltung in der Printausgabe."; **POST_SET_DATA forces `true` when the value is null** (new events — except from the wizard, which pre-sets `false`) | only when `$showPrintFields` |
| `printCategory` | `EntityType<Category>` (`select`) | no (but see hook) | `printCategory` | — at build time; POST_SUBMIT adds a `FormError` `event.flashError.printCategory` when `showInPrint` is true and no category is picked | placeholder `-`; choices = `CategoryRepository::findAllNotHidden()` (parents followed by their visible children, children tagged `data-custom-properties="styled-subchoices"`); labels from `category.label[locale]`; BKA label "Print-Kategorie" | only when `$showPrintFields`; row hidden by `printCategory_controller.js` while `showInPrint` is unchecked; POST_SUBMIT nulls it when `showInPrint` is false |
| `categories` | `EntityType<Category>` multiple (`select`, `data-max-item-count=3`) | yes | `categories` | `NotNull`, `Count(min 1, max 3)` | help `event.categories._help_members` when `$showPrintFields`, else `_help`; `help_html: true` | — |
| `dateFrom` | `DateType` html5 `single_text` | yes | `dateFrom` | `NotBlank` only (`getDateConstraints(true)` → past dates **allowed**) | `data-action="change->eventDates#updateDateToMinDate"` | — |
| `dateTo` | `DateType` html5 `single_text` | yes | `dateTo` | `NotBlank` (past allowed) | PRE_SUBMIT derives it from `dateFrom` + `slotTimeFrom`/`slotTimeTo` when left empty (+1 day when the end time wraps past midnight) | — |
| `openingTime` | `TextType`, `pattern="([01]?[0-9]\|2[0-3]):[0-5][0-9]"` | no | `openingTime` | — | placeholder `event.openingTime._placeholder` | mapped, but kept inside a `d-none` wrapper in the component; the visible control is `slotTimeOpening` |
| `schedule` | `ChoiceType` expanded radios, **unmapped** | yes | — | `NotBlank` | choices `continuous` / `recurrent`; each radio shows `_label`, `_help` and `_example`; POST_SET_DATA pre-selects `recurrent` when `recurrence == 'week'` or sub-events exist, else `continuous` | — |
| `recurrence` | `ChoiceType` (`select-recurrence`) | yes | `recurrence` | `NotBlank` | choices `none` ("Daten und Uhrzeiten anpassen") / `week` ("Wöchentliche Wiederholung der ausgewählten Tage") | only visible in `recurrent` mode |
| `recurrenceWeekDays` | `ChoiceType` multiple expanded (7 checkboxes) | no | `recurrenceWeekDays` (JSON array of 1..7) | — | labels `event.weekdays.1..7`, section label `event.weekdays.days_of_week` = "Betreffende(r) Tag(e) *" | only visible when `recurrence == 'week'` |
| `subEvents` | `CollectionType<SubEventType>`, allow add/delete, prototype | no | `subEvents` | per entry | `entry_options.allow_past_dates = true` on the admin form | only visible in `recurrent` + `recurrence == none` mode; one row is auto-added by JS when empty |
| `slotTimeOpening` | `ChoiceType`, **unmapped**, placeholder `--:--` | no | written to `openingTime` in POST_SUBMIT when not null | — | 96 choices, `00:00`…`23:45` in 15-minute steps (`TimeChoiceGenerator`) | — |
| `slotTimeFrom` | `ChoiceType`, **unmapped** | yes | combined with `dateFrom` into the `dateFrom` datetime in POST_SUBMIT | `NotBlank` | same 96 choices; default `20:00` on new events, otherwise `dateFrom\|H:i` | — |
| `slotTimeTo` | `ChoiceType`, **unmapped** | yes | combined with `dateTo` into the `dateTo` datetime | `NotBlank` | default `23:30` on new events, otherwise `dateTo\|H:i`; the JS rebuilds and re-sorts the options by duration relative to `slotTimeFrom` and labels them `HH:MM (N Std)` | — |
| `description` | `MultilangCollectionType` of `TextareaType` with `class="tinymce"` | yes | `labels[description]` | `MultiLangCollectionNotEmpty`; per entry `Length(max 6400)` with the `maxLenghtNormalizer` (strips tags, decodes entities, removes CR/LF, trims) | `help_html: true`; BKA help mentions a ~160-char SEO first paragraph | — |
| `printDescription` | `MultilangCollectionType` of `TextareaType` (`tinymce`, `data-maxlength=256`) | no | `labels[printDescription]` | per entry `Length(max 256)` + normalizer | BKA label "Kurzbeschreibung für de Printausgabe (nur BKA Mitglieder)", help "max. 256 Zeichen" | only when `$showPrintFields` |
| `images` | `CollectionType<ImageType>`, allow add/delete, prototype, `block_name: images_lists` | no | `images` | per entry | label `images._label` (BKA "Bilder (optional)") | — |
| `videos` | `CollectionType<VideoType>`, allow add/delete, prototype | no | `videos` | per entry | label `event.videos._label` | only when `ACTIVATE_EVENT_VIDEOS` (ON) |
| `rates` | `CollectionType<RateType>`, allow add/delete, prototype, `error_bubbling: false` | no | `rates` | per entry | label `event.rates._label` | — |
| `specialRate` | `ChoiceType` expanded radios with a placeholder option | no | `specialRate` | — | placeholder `event.specialRates.none` ("Ohne"); choices `free_entry` ("Freier Eintritt (gratis)") and `free_price` (BKA override "Freie Preiswahl oder Kollekte") | — |
| `ticketings` | `CollectionType<TicketingType>`, allow add/delete | no | `ticketings` | per entry | PRE_SET_DATA seeds one `Ticketing` from the legacy `labels[ticketingUrl]`; POST_SUBMIT mirrors the first ticketing's URL back into `labels[ticketingUrl]`, or deletes that label when the collection is empty | only when `ACTIVATE_MULTI_TICKETINGS` (**OFF for BKA**) |
| `ticketingUrl` | `MultilangCollectionType` (TextType per locale) | no | `labels[ticketingUrl]` | per entry `TicketingUrl` (must start with `http://`, `https://`, `mailto:` or `tel:`) | placeholder `https://www.meinekasse.ch/veranstaltung` | the BKA/`!multiTicketings` branch |
| `audience` | `EntityType<Audience>` (`select`) | yes | `audience` | `NotNull` | labels from `audience.label[locale]`; 4 rows in prod: Für alle / Nur für Erwachsene / Für Kinder und Jugendliche / Für Senior:innen | — |
| `publicationStatus` | `ChoiceType` (`select`) | yes | `publicationStatus` | `NotBlank` | choices `publish` / `draft` / `to_validate` → Publizieren / Entwurf / zur Prüfung; **`disabled` when `!can_publish`** | — |
| `publicationDate` | `DateType` html5 `single_text`, `min = today` | no | `publicationDate` | none | label "Spätere Veröffentlichung (optional)" | — |

### 7.3 Section layout (`templates/includes/form/event_form.html.twig`)

1. **`event.section.general`** (★ icon, tinted): name + eventStatus; place + organization (or the two disabled
   archived fields); `showInPrint`; the read-only "proposed place" summary block when
   `activateProposalPlace && event.placeProposed != null` (name, address, zip, city, latitude, longitude);
   categories; printCategory.
2. **`event.section.schedule`** (calendar icon): the `EventDates` live component (§7.4).
3. **`event.section.rates`** (ticket icon, tinted): the rates collection, a `<hr>` + `event.rates._help`,
   specialRate, then either the `EventTicketings` component or the single `ticketingUrl` multilang row.
4. **`event.section.details`** (info icon): description, printDescription.
5. *(tinted)* the images gallery.
6. *(plain)* videos + their help text, then `audience`.
7. **`event.section.publication`** (checkmark icon, tinted): publicationStatus + publicationDate, then
   **Speichern** (submit) and, when a `Referer` header is present, an **Abbrechen** link back to `events_index`.

### 7.4 The `EventDates` live component and its Stimulus controller

`src/Twig/Components/EventDates.php` (`#[AsLiveComponent]`) receives ten `FormView`s; the markup lives in
`templates/components/EventDates.html.twig` and the behaviour in `assets/controllers/eventDates_controller.js`.
`handleStartTimeChange` / `handleEndTimeSelection` live in `assets/js/timeHandling.js`.

The two schedule radios are rendered as large clickable cards (clicking the card checks the radio). Based on the
selection the controller **physically moves** the date/time wrappers into one of three slots:

| Mode | Visible | Hidden |
| --- | --- | --- |
| **continuous** (`schedule=continuous`) | `dateFrom`, the slot wrapper (`slotTimeOpening`, `slotTimeFrom`, a spacer SVG, `slotTimeTo`), `dateTo` — all inside the first card | the recurrence select, the sub-events collection, the custom-recurrence spot, the weekday checkboxes |
| **recurrent + `recurrence = none`** ("custom dates") | the recurrence select, a "Datum 1" block holding `dateFrom` + the slot wrapper, the sub-events collection with an "Ein Datum anfügen" add button; `dateTo` is cleared and hidden | weekday checkboxes |
| **recurrent + `recurrence = week`** | the recurrence select, `dateFrom` + `dateTo` side by side, the weekday checkboxes, the slot wrapper | the custom spot, the sub-events collection |

Other behaviours:

* Changing `dateFrom` sets `dateTo`'s `min` attribute.
* Choosing a start time rebuilds the end-time list: every quarter-hour of the day, **sorted by duration**
  (so the next slot after the start time comes first), each labelled `HH:MM (N Std)`; wrap-around past midnight is
  handled by adding 24 h to the duration.
* Choosing an end time auto-fills `dateTo`: same day normally, `+1 day` when the end time is ≤ the start time,
  `+7 days` when `recurrence == 'week'`.
* Entering custom-recurrence mode auto-clicks "add" once if the sub-event collection is empty.
* Sub-event rows are numbered from 2 (the main event is "1"); the trash icon clicks the hidden a2lix remove button.
* `SubEventType` fields per row: `dateFrom` (DateType, required, `min = today` unless `allow_past_dates`),
  `openingTime` (ChoiceType, optional, placeholder `–:–`), `timeFrom` (ChoiceType, unmapped, `NotBlank`, default
  `20:00`), `timeTo` (ChoiceType, unmapped, `NotBlank`, default `23:30`), `dateTo` (DateType, no constraint, derived
  in PRE_SUBMIT exactly like the main event). POST_SUBMIT recombines date+time and adds the hardcoded French error
  `"La date de fin ne peut pas être plus petite que la date de début"` when the dates are inverted.

### 7.5 Lifecycle hooks on `EventType` (in execution order)

| Hook | Effect |
| --- | --- |
| `PRE_SET_DATA` | When multi-ticketings is on, the collection is empty and `labels[ticketingUrl]` exists, seed one `Ticketing` from it. |
| `POST_SET_DATA` | Default `showInPrint` to `true` when null. Pre-fill `slotTimeOpening/From/To` from the entity (existing events) or with `20:00` / `23:30` (new). Pre-select `schedule` and `recurrence`. When `event.proposedBy != null`, rebuild the `organization` field as optional (and `disabled` for non-admins). |
| `PRE_SUBMIT` | Drop `subEvents` entirely when `schedule == continuous` **or** `recurrence == week`. Derive `dateTo` from `dateFrom` + the slot times when it is empty. |
| `POST_SUBMIT` | Write `openingTime` from `slotTimeOpening`. Null `printCategory` when `showInPrint` is false, else error if missing. Normalise recurrence (`continuous` → `recurrence=none`, no week days, remove all sub-events; `week` → remove all sub-events; `none` → clear week days). Concatenate date+time into `dateFrom`/`dateTo` and error (`event.flashError.dateTo`) on inversion. Mirror the first ticketing URL into `labels[ticketingUrl]` / delete that label. Back-fill the legacy scalar `name`. |
| Doctrine `onFlush` (`OnFlushEventListener`) | For every inserted/updated `Event`: recompute `relatedDates`, set `isMultiDayEvent`, propagate main↔sub-event fields, and regenerate `event_occurrence` rows. |

### 7.6 Create vs. edit differences and the notification mails

**`events_create`** (`EventController::create`, lines 408-478)

1. A fresh `MainEvent` is created with `user = currentUser`.
2. For non-admins, the first **enabled** place of the user's organizations is pre-selected as `place`.
3. On success, `eventRepository->add($event, true)`, then:
   * if the chosen place has **no** organization, **or** an organization the user is not a member of:
     * always send `newEventCreatedByAnotherOrganizationUser` (template `emails/admin_event_1a`) to the author;
     * if `publicationStatus == to_validate` → `newEventCreatedByAnotherOrganizationAdmin` (`1b`) to the place admins;
     * otherwise → `newEventProposedByPublishedAdmin` (`3b`) to the place admins.
4. Flash `event.flashSuccess.added`, redirect to `events_index`.
5. On an invalid submit, flash `event.flashError.general` (danger) and re-render.

> `event.getPlace()` is dereferenced unguarded at `EventController.php:515` — with `ACTIVATE_PROPOSAL_PLACE` the
> create form still requires a place, so this is reachable only if the required-ness is ever relaxed.

**`events_edit`** (lines 480-593). After a successful save and **only for non-admins**:

| Situation | Mail |
| --- | --- |
| `proposedBy != null` and status moved `to_validate` → `publish` | `eventPublished` (`3a`) to `proposedBy.email`, **plus** `newEventProposedByPublishedAdmin` (`3b`) to the *other* admins of the place's organization |
| `proposedBy != null` and the editor's email equals `proposedBy.email` | `eventModifiedByEventOwner` (`4b`) to the place admins (only when a place is set) |
| `proposedBy != null`, edited by someone else | `eventModifiedByOwnerAdminPlace` (`4a`, `eventProposedByExternalPerson = true`) to `proposedBy.email` |
| `proposedBy == null`, `event.user != null`, editor ≠ owner, status moved `to_validate` → `publish` | `eventPublished` (`3a`) to `event.user.email` |
| `proposedBy == null`, `event.user != null`, editor ≠ owner, otherwise | `eventModifiedByOwnerAdminPlace` (`4a`) to `event.user` |
| `proposedBy == null`, editor **is** the owner | `eventModifiedByEventOwner` (`4b`) to the place admins |

Then: if `getLastDateTo(event) < now` → redirect to `events_archived`, else to `events_index`.
Flash `event.flashSuccess.edited`.

`Mailer` builds **one email per recipient language** (`User.locale`, falling back to the current locale), always
`from = MAILER_FROM_ADDRESS`, `replyTo`/`returnPath` set for notifications, plus every `MAILER_BCC_ADDRESS`.
Emails with no recipient at all are skipped; send failures are swallowed and logged `critical`.

### 7.7 Duplicate (`events_copy` → `EventDuplicator`)

Immediate, no confirmation, requires `edit`. Copies: all `labels` (every translated `name` prefixed via
`event.copy.name` = "Kopie von %name%", truncated to 130 chars), `eventStatus`, `place`, `organization`, `audience`,
`dateFrom`/`dateTo` (cloned), `openingTime`, `description`, `specialRate`, `showInPrint`, `printCategory`,
`recurrence`, `recurrenceWeekDays`, `ticketingUrl`, all categories, sub-events (dates + openingTime only), images
(**each stored file is physically copied in the R2 bucket to a new `uniqid()` name**, with legend/labels/position
preserved; a failed copy is logged and that image is skipped), videos, rates, ticketings.

Deliberately **not** copied: slug (regenerated), sponsoring dates, `proposedBy`, `placeProposed`, the generated
og:image, occurrences and related dates. `user` becomes the copying user. `publicationStatus` is forced to `draft`
and `publicationDate` to `null`. Flash `event.flashSuccess.copied`; redirect to the copy's edit page.

### 7.8 Sponsor (`events_sponsor` → `SponsorEventType`)

Two fields, both `DateType` html5 single text with `NotBlank`: `sponsoredStartDate`
("Sponsoring-Startdatum") and `sponsoredEndDate` ("Sponsoring-Enddatum"). Save → flash
`event.flashSuccess.sponsored`, redirect to `events_index`. **0 events in BKA production carry sponsoring dates.**

### 7.9 Delete

`events_delete` performs `eventRepository->remove($event, true)` with the `edit` voter, flashes
`event.flashSuccess.deleted` and redirects to `events_index` — even when the deletion was triggered from the
archive list.

---

## 8. Organization form (`OrganizationType`)

Create (`organization/create.html.twig`) and edit (`organization/edit.html.twig`) share
`templates/includes/form/organization_form.html.twig`. Field names verified live.

| Field | Widget | Required | Maps to | Validation | Notes |
| --- | --- | --- | --- | --- | --- |
| `name` | `MultilangCollectionType` (flag on) / `TextType` | yes | `labels[name]` + legacy `name` | `MultiLangCollectionNotEmpty`; entry `Length(max 100)` | placeholder "La Tour Vagabonde" |
| `enabled` | `ChoiceType` (two options) | yes | `enabled` | — | `Aktiv` / `Inactiv` |
| `subTitle` | `MultilangCollectionType` | no | `labels[subTitle]` | entry `Length(max 85)` | "Untertitel (optional)" |
| `categories` | `EntityType<Category>` multiple, `data-max-item-count=3` | yes | `categories` | `NotNull`, `Count(1..3)` | same hierarchical choice list as the event form |
| *(unmapped)* `Site_locationSearch` | raw `<input>` in the template | no | — | — | Google-Places autocomplete that fills address/zip/city/lat/lng; `data-map-key` is **empty** in this deployment |
| `address` | `TextType` | yes | `address` | `NotBlank`, `Length(max 85)` | "Strasse und Hausnummer" |
| `postOfficeBox` | `TextType` | no | `postOfficeBox` | `Length(max 12)` | "Postfach (optional)" |
| `zip` | `NumberType` | yes | `zip` | `NotBlank`, `Length(max 4)` | — |
| `city` | `TextType` | yes | `city` | `NotBlank`, `Length(max 85)` | — |
| `region` | `EntityType<Region>` | yes | `region` | `NotNull` | `RegionRepository::findAllNotHidden()`, placeholder `-`, **re-sorted alphabetically in `finishView`**. BKA-visible regions: Stadt Bern, Region Bern, Thun & Berner Oberland, Biel & Seeland, Restlicher Kanton (the 8 Fribourg regions are `hidden = true`) |
| `latitude` / `longitude` | `NumberType` scale 6 | yes | `latitude` / `longitude` | `NotBlank` | a `#google-map` div (300 px) sits below, with `organization.lng_lat_help` |
| `about` | `MultilangCollectionType` of `TextareaType` (`tinymce`, rows 6) | yes | `labels[about]` | `MultiLangCollectionNotEmpty`; entry `Length(max 6400)` + normalizer | — |
| `images` | `CollectionType<ImageType>` | no | `images` | — | same gallery widget as events |
| `contacts` | `CollectionType<ContactType>` | no | `contacts` | — | JS caps the collection at **6 entries** (`assets/app.tsx:102`); help "Es können bis zu 6 E-Mails und Nummern hinzugefügt werden." |
| `website` | `TextType` | no | `website` | `Length(max 70)` | POST_SUBMIT runs `UrlFormatter::setHttpUrl` to prefix a scheme |
| `legalStatus` | `ChoiceType` | no | `legalStatus` | — | 10 options: association, entreprise_individuelle, societe_simple, societe_collectif, societe_commandite, societe_anonyme, societe_responsabilite_limitee, societe_cooperative, fondation, collectif |
| `affiliations` | `EntityType<Affiliation>` multiple | no | `affiliations` | — | BKA label "Mitgliedschaft(en)/Vergünstigung(en) (optional)". 7 rows: Kultur-GA, Kulturlegi, AHV/IV, Student:innen, Kinder, Mitglieder, Ermässigt |

`ContactType` entry fields: `email` (`EmailType`, `Email` + `NotBlank`), `designationEmail`
(`MultilangCollectionType`, optional, `Length(max 24)`), `phoneNumber` (`PhoneNumberType`, default region `CH`,
national format, optional), `designationPhone` (multilang, optional, `Length(max 24)`).

Buttons: **Speichern**; **Abbrechen** (when a referer exists) → `organizations_index`; on the edit screen an admin
also gets a red **Löschen** button opening the same confirm modal as the list row.

Flashes: `organization.flashSuccess.added` / `.edited` / `.deleted`, `organization.flashError.general`.

---

## 9. Place form (`PlaceType`)

| Field | Widget | Required | Maps to | Validation | Notes |
| --- | --- | --- | --- | --- | --- |
| `name` | multilang / `TextType` | yes | `labels[name]` + legacy `name` | `MultiLangCollectionNotEmpty`; entry `Length(max 130)` | — |
| `enabled` | `ChoiceType` | yes | `enabled` | — | "Status des Ortes": Aktiv / Inaktiv |
| `private` | `CheckboxType` | no | `private` | — | "Dieser Ort ist privat" — a private place is only offered to its own administrators in the event form. 255 of 1 276 places are private. |
| *(unmapped)* `Site_locationSearch` | raw input | no | — | — | as in the organization form |
| `address` | `TextType` | yes | `address` | `NotBlank`, `Length(max 85)` | — |
| `zip` | `NumberType` | yes | `zip` | `NotBlank`, `Length(max 4)` | — |
| `city` | `TextType` | yes | `city` | `NotBlank` | — |
| `region` | `EntityType<Region>` | yes | `region` | `NotNull` | alphabetically re-sorted; on edit the controller copies the owning organization's region when the place has none |
| `latitude` / `longitude` | `NumberType` scale 6 | yes | — | `NotBlank` | + 300 px map + `place.lng_lat_help` |
| `about` | multilang `TextareaType` (`tinymce`) | yes | `labels[about]` | `MultiLangCollectionNotEmpty`; entry `Length(max 6400)` | BKA label "Beschreibung" |
| `images` | `CollectionType<ImageType>` | no | `images` | — | — |
| `website` | `TextType` | no | `website` | — (no length cap here) | POST_SUBMIT prefixes the scheme |
| `technicalSheets` | `CollectionType<TechnicalSheetType>` | no | `technicalSheets` | per entry | entry = `title` (multilang, required, `MultiLangCollectionNotEmpty`) + `file` (`VichFileType`, accepts `application/pdf` and `application/acad`, `NotBlank` on create; on edit the `NotBlank` is dropped). **1 technical sheet exists in production.** |
| `capacity` | `MultilangCollectionType` | no | `labels[capacity]` | entry `Length(max 35)` | placeholder "500 bis 600 Plätze" |
| `proInfirmisIdSource` | `ChoiceType` | no | `proInfirmisIdSource` | — | choices built from `ProInfirmisAPICacheManager::getData()['Pois']` keyed by `Name` → `IdSource`, with a `_placeholder` empty option. **Only rendered when `ACTIVATE_PROINFIRMIS`** (verified absent on the live BKA form) |
| `wheelchairAccessible` | `CheckboxType` | no | — | — | grouped under "Zugänglichkeit - Selbsterklärung (optional)" with the OK:GO logo and blurb. 59 places ticked. |
| `wheelchairAccessibleToilets` | `CheckboxType` | no | — | — | 44 places |
| `wheelchairAccessibleParking` | `CheckboxType` | no | — | — | 25 places |
| `organization` | `EntityType<Organization>` | no | `organization` | — | **only rendered for `ROLE_ADMIN`**; placeholder `-`; "Autorisierte Organisation (optional)" |

POST_SUBMIT also resolves the ProInfirmis pictogram list + `LinkToDetailView` from the cached API payload whenever
`proInfirmisIdSource` is set (logs a warning when the id is not found).

Delete is blocked while the place still has upcoming events: flash `place.flashError.upcomingEvent` and a redirect
back to the edit screen.

---

## 10. User screens

### 10.1 `UserType` field table

| Field | Widget | Required | Maps to | Validation | Shown when |
| --- | --- | --- | --- | --- | --- |
| `email` | `EmailType` | yes | `email` | `NotBlank`, `Email` | always |
| `locale` | `ChoiceType` (`select`, search disabled) | yes | `locale` | — | always. Choices derived from `LOCALES`, labelled with the native language name title-cased (`Deutsch`, `Français`). Help: it drives both the admin UI language *and* the language of the notification emails. |
| `password` | embedded `UserPasswordType` (`inherit_data: true`) → `RepeatedType<PasswordType>` | yes | `password` (hashed in the controller) | `NotBlank`; mismatch message `user.password.invalid_message` (**untranslated French** in the German catalogue) | `creation` only |
| `userType` | `ChoiceType` (`select-html`), **unmapped** | yes | roles + `config.org_creation` via POST_SUBMIT | — | not in self-service; **`disabled` on edit** (help text says: to change it, delete the account and create a new one). Each option carries a `data-custom-properties` description. |
| `organizations` | `EntityType<Organization>` multiple | no | `organizations` | — | not in self-service |
| `adminRole` | `CheckboxType`, **unmapped** | no | adds/removes `ROLE_ADMIN` in POST_SUBMIT | — | not in self-service. "Chef-Verwalter/in" |
| `enabled` | `CheckboxType` | no | `enabled` | — | not in self-service |
| `member` | `CheckboxType` | no | `member` | — | not in self-service, and only when `ACTIVATE_MEMBERS` (**ON for BKA**) |

`onPostSetData` pre-fills `adminRole` from the roles and derives `userType`
(`broadcast_partner` if the role is present, else `admin_additional` when `config.org_creation == 'ignored'`,
else `admin`).

### 10.2 Create / edit / self-service / password

* **`/admin/users/create`** renders `includes/form/user_form.html.twig`: email, locale, password (repeated),
  userType, organizations, adminRole, enabled, member, Speichern + Abbrechen. The controller hashes the password
  before persisting. Flash `user.flashSuccess.added`.
* **`/admin/users/edit/{id}` as an admin** renders `user/edit.html.twig` (`<h1>` = the email) with every field
  except the password. Redirect to `users_index` on success.
* **`/admin/users/edit/{id}` as oneself (non-admin)** passes `self_service: true`, so `UserType::buildForm` returns
  after `email` + `locale`. The template's `{% if form.X is defined %}` guards hide everything else, and the
  controller redirects back to the same edit page. This is the only screen a plain `ROLE_USER` can reach under
  `/admin`.
* **`/admin/users/password/{id}`** (`UserPasswordType`) — a single `RepeatedType<PasswordType>` with labels
  `user.password._label` / `user.password.repeat` and `NotBlank`. Admin-only via the firewall; there is **no
  additional ownership check in the controller**. Flash `user.flashSuccess.edited`, redirect to `users_index`.
* **Delete** refuses self-deletion (`user.flashError.deleteSelf`) and converts an FK violation into
  `user.flashError.deleteFailed`.

### 10.3 API tokens (`UserTokenType`)

| Field | Widget | Required | Validation | Shown when |
| --- | --- | --- | --- | --- |
| `name` | `TextType` | yes | `NotNull` | always |
| `expiresAt` | `DateTimeType` `single_text`, `min = now` | yes | `NotNull`, `GreaterThanOrEqual(now)` with message `date.not_in_past` | `with_expires_at` (default `true`; never overridden) |
| `owner` | `EntityType<User>` by email | yes | `NotNull` | `with_owner` = `isGranted('ROLE_ADMIN')` |

On submit: if no owner was chosen the current user becomes the owner; `JWTGenerator::generateAndSaveJwt` mints and
stores the JWT; a **warning** flash renders `user_token._texts.Save-your-new-token` followed by the raw token
(the flash is printed with `|raw`). Redirect to `user_token_index`.

---

## 11. The one-off organization-creation modal (`OrgCreationType`)

Rendered on `/events/` itself (`EventController::index:154-234`), not on a route of its own. It fires when the
logged-in user has `config.org_creation == 'needed'` — i.e. the user type is `admin` and the onboarding has not been
completed. Production: 103 users are in `needed`, 21 in `done`, 1 `ignored`, 302 have no config at all.

The modal is `static`-backdrop and non-dismissable (`templates/event/events.html.twig:130-178`); it is auto-opened
by `assets/app.tsx`. Title `org_creation.title` ("Willkommen im Admin-Bereich"), a language switcher in the header,
a long explanatory column, and:

| Field | Widget | Required | Validation | Notes |
| --- | --- | --- | --- | --- |
| `orgName` | `MultilangCollectionType` (flag on) / `TextType` | yes | `MultiLangCollectionNotEmpty` (or `NotBlank`), entry `Length(max 100)` | "Name Ihrer Organisation", placeholder "Beispiel: Équilibre - Nuithonie" |
| `placeName` | `MultilangCollectionType` / `TextType` | conditionally | `PlaceRequiredUnlessNoPlaceMulti` (or `PlaceRequiredUnlessNoPlace`) + entry `Length(max 130)` | "Name Ihres Veranstaltungsorts *"; the validator fails with `form.place_required_unless_no_place` unless the `noPlace` checkbox is ticked |
| `noPlace` | `CheckboxType` | no | — | "Keine Verwaltung eines Ortes"; `assets/app.tsx` disables/clears the placeName inputs while it is ticked |

Buttons: **Abbrechen und beenden** → `app_logout`; **Bestätigen** → submit.

On a valid submit the controller:

1. Builds an `Organization`: name (and `labels[name]` when multilang) from `orgName`; `address = ''`;
   `zip = (int) user.create_defaults.zip` (**BKA: `3000`**); `city = user.create_defaults.city` (**BKA: `Bern`**);
   `region = regionRepository->findAllNotHidden()[0]`; `enabled = true`; adds the current user. Persists.
2. If a place name was given, builds a `Place` with the same address/zip/city/region, `organization` set,
   `private = false`, all three wheelchair flags `false`, and **`enabled = false`**. Persists.
3. Sets `config.org_creation = 'done'` on the user and saves; the modal disappears on the next load.

> The region picked is simply the first non-hidden region returned by Doctrine, which for BKA is **"Stadt Bern"**
> (id 10) in practice but is not explicitly ordered — UNVERIFIED whether a different row could come back first.

---

## 12. The "propose an event" wizard

Six steps, all public, all under `/{_locale}/proposer-un-evenement/…` with `_locale ∈ LOCALES` enforced by the route
`condition`. All state lives in the **session key `PROPOSE_EVENT`**, which holds a serialized `MainEvent` graph.
Every step after the first redirects to step 1 when that key is missing. Before each render the controller re-attaches
the detached `Place`, `Category` and `Audience` entities with `EntityManager::find` (`ProposeEventController::mergeEvent`).

BKA chrome: `themes/bka/templates/layout-propose-event.html.twig` — **only** the step indicator plus the content;
the In Situ preamble ("I have an account" / "I don't have an account", guide PDF, Google-Forms signup link) is
**not** part of the BKA wizard. The indicator (`themes/bka/templates/propose_event/steps.html.twig`) renders six
material icons — `location_on`, `info`, `payments`, `account_circle`, `checklist`, `check_circle` — with
`active` / `passed` classes; passed steps are clickable links back; the chevrons at either end go back one step or
`requestSubmit()` the current form. Each step submit button is disabled by JS after the first click.

### Step 1 — `/lieu` — "Ort" (`ProposeEventStep1Type`)

| Field | Widget | Required | Validation |
| --- | --- | --- | --- |
| `place` | `EntityType<Place>` (`select-html`) via `PlaceRepository::findActiveAndNotPrivate()` (no user → enabled + non-private only), placeholder `-`, options carry the `zip city` description | yes, unless "use a new place" is ticked | `NotNull`, with a dynamic `validation_groups` callback that returns `false` (skip) when `useProposedPlace` is checked |
| `useProposedPlace` | `CheckboxType`, **unmapped**, data = whether the session event already carries a `placeProposed` | no | — |
| `placeProposed` | embedded `PlaceProposedType` | only when the checkbox is ticked | same dynamic `validation_groups` trick in reverse |

`PlaceProposedType` fields: `name` (`TextType`, `NotBlank`, `Length(max 65)`), `address` (`NotBlank`,
`Length(max 85)`), `zip` (`NumberType`, `NotBlank`, `Length(max 4)`), `city` (`NotBlank`), `latitude` /
`longitude` (`NumberType` scale 6, `NotBlank`). The template wraps them in `#placeProposedContainer`
(`display:none` until the checkbox is ticked, driven by `assets/js/placeProposed.ts`) together with the
`Site_locationSearch` Google autocomplete and a 300 px map.

A `SUBMIT` listener nulls whichever of `place` / `placeProposed` is not in use (important because the whole object
goes into the session). **Nothing is persisted.** On success the merged `MainEvent` is stored in the session and the
user is redirected to step 2.

Only `ACTIVATE_PROPOSAL_PLACE` (ON for BKA) adds `useProposedPlace` + `placeProposed`. Verified live: the rendered
field names are `propose_event_step1[place]`, `[useProposedPlace]`, `[placeProposed][name|address|zip|city|latitude|longitude]`.

### Step 2 — `/infos` — "Informationen" (`ProposeEventStep2Type`)

Same shape as the admin event form's general + schedule + details + images sections, minus everything
admin-specific.

| Field | Differences from `EventType` |
| --- | --- |
| `name` | identical (multilang when the flag is on) |
| `categories` | identical, but always uses `event.categories._help` (never the member variant) |
| `dateFrom`, `dateTo` | **`min = today` and `GreaterThanOrEqual('today')` with message `date.not_in_past`** — unlike the admin form, past dates are rejected |
| `openingTime`, `schedule`, `recurrence`, `recurrenceWeekDays`, `subEvents`, `slotTimeOpening/From/To` | identical, except `SubEventType` is built **without** `allow_past_dates`, so sub-event start dates must be ≥ today |
| `description` | identical (multilang TinyMCE, max 6400 normalised) |
| `images` | identical gallery |
| `audience` | identical; the label uses the **main** request's locale |
| — | **no** `eventStatus`, `place`, `organization`, `showInPrint`, `printCategory`, `printDescription`, `videos`, `publicationStatus`, `publicationDate` |

Same PRE_SUBMIT / POST_SET_DATA / POST_SUBMIT hooks as `EventType` (minus the print/ticketing parts).

**Between steps:** on a valid submit the controller walks `data.getImages()` and, for every image whose `file` is an
`UploadedFile`, runs `UploadHandler::upload($image, 'file')` **immediately** — so image files are written to the R2
bucket at step 2, *before* the event is persisted. The `File` object is then nulled to keep the entity serializable
into the session. On an invalid submit the same nulling is applied so the step can be re-rendered.

### Step 3 — `/billetterie` — "Tarife" (`ProposeEventStep3Type`)

| Field | Widget | Required | Notes |
| --- | --- | --- | --- |
| `rates` | `CollectionType<RateType>` | no | entry: `price` (`MoneyType`, currency `CHF`, divisor 100, `NotBlank`, `maxLength 12`; BKA label "Tarif in CHF") + `designation` (`MultilangCollectionType`, required, entry `Length(max 24)`, collection-level `RateDesignationNotEmpty`) |
| `specialRate` | expanded radios + placeholder "Ohne" | no | identical to the admin form |
| `ticketings` | `CollectionType<TicketingType>` | no | only when `ACTIVATE_MULTI_TICKETINGS` (OFF) |
| `ticketingUrl` | `MultilangCollectionType` | no | the BKA branch; entry constraint `TicketingUrl` |

**The BKA template override hardcodes `form_row(form.ticketingUrl)`** (`themes/bka/templates/propose_event/step3.html.twig:17-19`)
— it has no `multiTicketingsActivated` branch, so turning that flag on would make this step crash.

POST_SUBMIT mirrors / deletes `labels[ticketingUrl]` exactly as in `EventType`. Nothing persisted.

### Step 4 — `/coordonnees` — "Meine Kontaktdaten" (`ProposeEventStep4Type`)

A single embedded `EventProposedByType` mapped to `Event::proposedBy`:

| Field | Widget | Required | Validation |
| --- | --- | --- | --- |
| `lastname` | `TextType` | yes | `NotBlank` |
| `firstname` | `TextType` | yes | `NotBlank` |
| `email` | `EmailType` | yes | `NotBlank`, `Email`, **`CheckEmailMx`** (a live `checkdnsrr($host,'MX')` DNS lookup) |
| `phone` | `PhoneNumberType`, region `CH`, national format | yes | `NotBlank` |
| `organization` | `TextType` (free text, **not** a relation) | yes | `NotBlank` |

Nothing persisted; stored in the session.

### Step 5 — `/resume` — "Zusammenfassung" — the commit point

Redirects back to step 4 when `event.proposedBy` is null. Renders a read-only recap grouped by step, each block
with a "Ändern" link back to that step:

* **Ort**: `placeProposed.name` if set, else `place.name`.
* **Informationen**: name, the category badges (coloured with `category.tagColor`), the German date sentence
  `Vom <d.m.Y> um <H.i> Uhr bis zum <d.m.Y> um <H.i> Uhr[, Türöffnung <HH:MM>]`, one line per sub-event in the same
  shape, the weekday names, the description (raw HTML), the uploaded image thumbnails with their legends, and the
  audience label.
* **Tarife**: `designation price CHF` per rate (price via the `price_formatted` filter, i.e. `/100`, 2 decimals)
  plus the special-rate label.
* **Meine Kontaktdaten**: firstname lastname, phone, email, organization.

The only form on the page is an **empty** `createFormBuilder($event)` — the submit button simply posts it.
On submit (`ProposeEventController.php:255-287`):

1. `event.eventStatus = confirmed`, `event.publicationStatus = to_validate`.
2. `eventRepository->add($event, true)` — **this is the first and only write of the whole wizard** (the event, its
   sub-events, images, rates, `event_proposed_by` row and, if used, the `place_proposed` row).
3. **User-created path**: if no `User` exists with `proposedBy.email`, one is created with
   `member = false`, `roles = ['ROLE_USER']`, `locale = request locale`, and a random password from
   `PasswordGenerator`. A reset-password token is generated and `Mailer::accountCreatedChangePassword` is sent so
   the proposer can set their own password. Because `EventVoter::canEditEvent` matches on
   `proposedBy.email == user.email`, that new account can then log in and edit exactly this event.
   **4 288 events in production carry a `proposed_by_id`; 4 366 `event_proposed_by` rows exist.**
4. `Mailer::newEventProposedBy` (`emails/admin_event_2a`) → the proposer.
5. `Mailer::newEventProposedByExternalPerson` (`emails/admin_event_2b`) → every user of
   `event.place.organization`, or `MAILER_REPLYTO_ADDRESS` when the place has no organization. The BKA version of
   that mail carries a "Den/die Antrag/e verwalten" button linking straight to `events_edit`.
6. Redirect to step 6.

> **Defect:** `templates/propose_event/user-created.html.twig:10` calls `url('app_user.created', …)`, and **no route
> with that name exists** (confirmed against `debug:router`). Rendering the account-created email therefore throws,
> `Mailer::sendEmail` swallows the exception and logs it `critical` — so the proposer **never receives the
> set-your-password mail**, even though the account is created. The German step-6 copy explicitly promises that email.

### Step 6 — `/validation` — "Bestätigung"

Removes the `PROPOSE_EVENT` session key, then renders a centred `check_circle` icon,
`propose_event.validation.title` ("Übermittelter Vorschlag") and the BKA `content` text, which points at
`support@bka.ch` and promises the account-creation email.

---

## 13. Password-reset flow

| Screen | Form | Fields |
| --- | --- | --- |
| `/reset-password` | `ResetPasswordRequestFormType` | `email` (`EmailType`, `autocomplete=email`, `NotBlank` with the hardcoded English message "Please enter your email") |
| `/reset-password/check-email` | — | Confirmation page; a **fake** token is generated when none is in the session so the existence of an account is never leaked |
| `/reset-password/reset/{token}` → `/reset-password/reset` | `ChangePasswordFormType` | `plainPassword` `RepeatedType<PasswordType>`, **unmapped**, first option `NotBlank` (`reset_password.change_password_form.password_not_blank`) + `Length(min 6, max 4096)`; mismatch message `reset_password.change_password_form.password_mismatch`; labels "Neues Passwort" / "Passwort wiederholen" |

The token is moved from the URL into the session on first hit, consumed once, and the session is cleaned after the
change; the user is then redirected to `/login`. Failures add a `reset_password_error` flash and bounce back to the
request page. The email uses `reset_password/email.html.twig` via `Mailer::resetPasswordRequest`
(`notification: false`, i.e. no reply-to/return-path).

---

## 14. Shared form widgets

### 14.1 `MultilangCollectionType`

`src/Form/Type/MultilangCollectionType.php` + the form theme blocks in `templates/form/multilang.html.twig`.

* Builds one child per locale in `LOCALES`, all through `entry_type` (default `TextType`).
* `property_path` is **required** and always points at `labels[<key>]`.
* Rendered as a Bootstrap pill nav (`fr` / `de`) above a tab pane per language; the tab matching
  `app.request.locale` is active.
* Only the field for the current request locale inherits the parent's `required` flag.
* `POST_SET_DATA` migrates a legacy untranslated scalar into the default-language tab — but only when **every**
  language tab is still empty, so a fallback value is never silently saved as a translation.
* `finishView` fills every empty language input's `placeholder` with the plain-text content of another language, so
  translators see what they are translating. TinyMCE forwards that placeholder into the editor.
* Validation: `MultiLangCollectionNotEmpty` ("Es muss mindestens eine Übersetzung vorgelegt werden.") on the
  collection, plus per-entry `Length` constraints.
* `error_bubbling` is forced to `false`, so errors stay on the field.
* Data mapping is done by `ArrayToLanguagesMapper`.

### 14.2 The image gallery (`ImageType` + `image-collection_controller.js` + `templates/form/fields.html.twig`)

Per image row: a numbered index square, a draggable handle, a red trash square, a thumbnail with a
"⭐ Hauptbild" badge on the first row, then the multilang `legend` and `alt` fields, then the (visually hidden but
still present) file input, then the hidden `position` input.

| Entry field | Widget | Required | Maps to | Validation |
| --- | --- | --- | --- | --- |
| `file` | `VichFileType` on create / `VichImageType` on edit (swapped in PRE_SET_DATA when a filename exists) | yes on create, no on edit | the Vich `image` mapping (`UniqidNamer`, R2 bucket, public base `R2_PUBLIC_BASE/img`) | `Image(mimeTypes: jpg/jpeg/png, message key validators.image_mime_only_jpg_png)`, `NotBlank("Veuillez ajouter une image")` — **hardcoded French**, `File(maxSize: 10M)` |
| `legend` | `MultilangCollectionType` | no | `labels[legend]` | `Length(max 125)`, `maxlength` attr |
| `alt` | `MultilangCollectionType` | no | `labels[alt]` | `Length(max 125)`, `maxlength` attr |
| `position` | `HiddenType` | — | `position` | written by the drag-and-drop controller (0-based) |

Controller behaviour: multi-file picking through one hidden `<input type=file multiple accept=.png,.jpg,.jpeg>`;
non-jpeg/png files are dropped with a `%count% file(s) were ignored` message (`images.add._rejected`); drag-and-drop
reordering rewrites every `position` and re-numbers the rows; a page-wide guard swallows stray file drops so a
half-filled form is never lost; `maxlength` inputs get a live `· n/125` counter.
`assets/js/ImageResizer.ts` client-side downscales/recompresses any file over **10 MB** before it is attached
(max 12 iterations, JPEG quality stepping down from 0.85 to 0.6, then dimensions); server-side
`ResizeImageUploadedListener` caps uploads at 2000×2000 and runs jpegoptim/pngquant.

### 14.3 Other shared types

| Type | Used by | Fields |
| --- | --- | --- |
| `RateType` | event form, propose step 3 | `price` (`MoneyType` CHF, divisor 100, `NotBlank`, `maxLength 12`), `designation` (multilang, required, `Length(max 24)`, `RateDesignationNotEmpty`) |
| `TicketingType` | event form, propose step 3 (flag off for BKA) | `ticketingDesignation` (`EnumType<TicketingDesignation>`, `NotBlank`, disabled/hidden placeholder) with 13 cases — eventbrite, eventfrog, fnactickets, idticketing, infomaniak, monbillet, petzi, smeetz, starticket, ticketcorner, ticketmaster, weezevent, other; `ticketingUrl` (multilang, required, entry `TicketingUrl`, collection `TicketingUrlNotEmpty`). POST_SUBMIT writes the translated designation into `labels['designation'][lang]` for every locale. |
| `VideoType` | event form | `embedLink` (`UrlType`, `NotBlank("Please enter a video URL")` + `Url("Please enter a valid URL")` — **hardcoded English**), placeholder a YouTube URL |
| `ContactType` | organization form | see §8 |
| `TechnicalSheetType` | place form | see §9 |
| `SubEventType` | event form, propose step 2 | see §7.4 |
| `EventProposedByType` | propose step 4 | see §12 |
| `PlaceProposedType` | propose step 1 | see §12 |
| `DateTimePickerType` | **nobody** — dead code, only the `date_time_picker_widget` theme block references its block prefix | `date` + `time`, unmapped, recombined on SUBMIT |

### 14.4 TinyMCE

`assets/js/editor.ts`: selector `.tinymce`, plugins `advlist link lists autoresize`, toolbar
`undo redo | bold i | link`, no menubar, `paste_as_text: true`, links default to `target=_blank`, language from the
`<html lang>` attribute (`de_DE` / `fr_FR`), and a custom status bar showing a live character count (line breaks
stripped) against the field's `data-maxlength`.

---

## 15. Custom validators (`src/Validator/*`)

| Constraint | Target | Message key / text | Used by |
| --- | --- | --- | --- |
| `MultiLangCollectionNotEmpty` | multilang array | `multilang_collection.not_empty` — "Es muss mindestens eine Übersetzung vorgelegt werden." | event/place/organization `name`, `description`, `about`, technical-sheet `title`, org-creation `orgName` |
| `RateDesignationNotEmpty` | multilang array | `rate.designation.not_empty` | `RateType.designation` |
| `TicketingUrl` | string | `ticketing_url.must_start_with` — must start with `http://`, `https://`, `mailto:` or `tel:` | every ticketing URL entry |
| `TicketingUrlNotEmpty` | multilang array | `ticketing.url.not_empty` | `TicketingType.ticketingUrl` |
| `PlaceRequiredUnlessNoPlace` / `…Multi` | form field | `form.place_required_unless_no_place` | `OrgCreationType.placeName` |
| `CheckEmailMx` | string | "This value is not a valid email address." (English default) | `EventProposedByType.email` — performs a real DNS MX lookup |
| `GeoCoordinates` | `{lat,lng}` array | "Must be a valid coordinate." | API resources only |
| `Labels` | labels array | JSON-schema shape check + mandatory keys | API resources only |
| `EventDescription` / `EventPrintDescription` / `RateDesignation` | labels array | max-length per language, after stripping tags/entities (6400 / 256 / 24) | API resources only |
| `EventImages` | image collection | "You do not have permission to reassign the image ({{ image }})." | API resources only |
| `DatesFromToConsistent` | class | from must be before to | API resources only |

Framework-level: `email_validation_mode: html5`; the CSRF-expired message is overridden to
"Das Formular ist abgelaufen. Aktualisiere die Seite, um fortzufahren."
(`translations/validators.de.yml`, `translations/security.de.yml`).

---

## 16. Known defects and dead code found while inventorying

1. **`/events/preview/{slug}` returns HTTP 500.** `templates/event/preview.html.twig:19` uses
   `event.nextEventDate`, which no longer exists on `MainEvent`. The route is also not linked from any template.
2. **The propose-event "account created" email never sends.** `templates/propose_event/user-created.html.twig:10`
   references the non-existent route `app_user.created`; `Mailer::sendEmail` catches the throwable and logs it.
3. **Sorting the organizations list by "Verwaltete Orte" does nothing** — the column is `orderable: true` but has
   no order field (verified empirically).
4. **`DateTimePickerType` is unused.**
5. **Untranslated strings in the German UI**: the users-list create button (`misc.user.create_a_user` = "Créer un
   utilisateur"), the users-list `Aktiv`/`Mitglied` booleans (`Oui`/`Non`), `event.flashError.dateTo` (French),
   `user.password.invalid_message` (French), the proposer modal's close button ("Fermer"), the hardcoded errors in
   `SubEventType` (French), `ImageType` (French) and `VideoType` (English).
6. **Every destructive action is a GET link without a CSRF token** (`/events/delete/...`, `/places/delete/...`,
   `/organizations/delete/...`, `/admin/users/delete/...`, `/user-token/delete/...`).
7. **`user_token_delete` has no confirmation dialog** at all.
8. **`UserController::editPassword` has no ownership check** beyond the `^/admin` firewall rule.
9. `OrganizationController::deletePlace` is the organization delete action (copy-paste naming).
10. The Google Maps key/ID are empty in this deployment, so the "Eine Adresse suchen" autocomplete and the 300 px map
    placeholder on the place / organization / proposed-place forms are inert.
11. The BKA `propose_event/step3` override hardcodes the single-ticketing branch, so enabling
    `ACTIVATE_MULTI_TICKETINGS` would break the public wizard.
12. `EventController::create` dereferences `$event->getPlace()->getOrganization()` without a null check.

---

## Porting notes

*Everything above is observed behaviour; this section is opinion.*

* **The screen inventory to reproduce is small**: events (upcoming / members-only / archived), places,
  organizations, users, API tokens, and the public 6-step wizard. Everything else (image generator, sponsoring,
  preview, broadcast partners, ProInfirmis picker) is either flag-off, unused in production, or broken.
* **The event form is the whole product.** Three quarters of the behaviour lives in `EventType` + the `EventDates`
  component: the continuous / weekly / custom-dates tri-state, the derived `dateTo`, the duration-sorted end-time
  list, and the sub-event collection. Reproducing the *data model* (main event + sub-events + occurrences) without
  reproducing this interaction model would make the editor unusable for BKA's existing 400+ active editors.
* **Multilang-by-labels maps cleanly onto We.Publish revisions only if you decide per field.** `labels` is a JSON
  blob with a sub-map per field per locale (`name`, `description`, `printDescription`, `ticketingUrl`, `legend`,
  `alt`, `designation`, `about`, `capacity`, `subTitle`, `title`). The legacy scalar columns (`name`,
  `description`, `ticketing_url`) are kept in sync purely for API compatibility and can be dropped in the port.
* **Draft / pending / published already exists in spirit**: `publication_status ∈ {draft, publish, to_validate}`
  plus a `publication_date` for scheduled publication. `to_validate` is not a draft — it is a *cross-organization
  approval request*, driven by `EventVoter::canPublishEvent` and eight notification emails. Mapping
  `to_validate` onto We.Publish's "pending" needs care: pending in We.Publish means *scheduled*, here it means
  *awaiting another organization's approval*.
* **The archived snapshot columns (`archived_place`, `archived_organization`) are a denormalisation that a revision
  system makes unnecessary** — a published revision already freezes the place/organization name at publish time.
* **`LIST_OWN_EVENTS_ONLY` + the three voters are the real permission model**, not roles. A user may edit an event
  when they own it, when they belong to its organization, when they belong to its *place's* organization, or when
  their email matches the external proposer. That last rule is what makes the wizard's user-created accounts work
  and must survive the port.
* **The wizard's session-held entity graph is a liability**: images are uploaded at step 2 but the event is only
  persisted at step 5, so an abandoned wizard leaves orphan files in the bucket. A port should either persist a
  draft from step 1 or keep uploads in a staging area.
* **Nothing needs bulk actions, exports, or column filters** — there are none today, and the only filter on any list
  is the "mine" toggle plus one global accent-insensitive search box.
