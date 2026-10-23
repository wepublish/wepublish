# Who may do what: BKa today and We.Publish as built

**How to read this**

- **BKa** means the Symfony admin in `/Users/itrulia/Documents/insitu-admin`. BKa paths below are relative to that folder. **WeP** means HEAD `8128d3eb7` of `f/bka-backend-migration`, with paths relative to the repo root. The slice F editor-role change is still in progress and is not in HEAD.
- In the event, organisation and place tables, BKa cells describe the **admin UI and its voters**. BKa's two APIs often behave differently, so they have their own table (6). Where it matters, a cell names the BKa surface: UI (list or form), voter, v1 (OAuth/FOSRest) or v2 (API Platform).
- In WeP, what you may do is **role permission × relationship to the record**. The member, venue and owner columns assume a role that holds the event permission the row needs. Section 2 lists what the predefined editor role actually holds today.
- ✓ yes · ✗ no · — not applicable, or no such actor on that side · **⚠Qn** means BKa and WeP differ here; see question n at the end.

---

## 1. Role map

| BKa role / relationship | Production (BKa snapshot) | Closest in WeP | Gap |
| --- | --- | --- | --- |
| Anonymous visitor | — | anonymous | BKa: login, password reset, `/img`, the public proposal form, API docs. No anonymous data API.¹ WeP: the public GraphQL API. |
| `ROLE_USER` (organiser) | 397 users hold only this role. 412 are in ≥1 organisation, 87 in ≥2, 15 in none. 103 still have the onboarding flag `org_creation=needed`.² | predefined **editor** role + `OrganizationMember` | BKa scopes everything by organisation membership. WeP does the same through `event-scope.ts`. |
| Member of the **venue's** organisation (BKa's "validator") | no separate role | editor + membership of the place's organisation | BKa: may edit, publish and delete foreign events at the venue. WeP: may edit and request review, but not publish or delete (D3, D48). |
| Event **owner** (`event.user_id`) | 21,378 of 34,279 events have one³ | `Event.ownerId` (D35) | Set to the creator or copier. Neither BKa API sets it. |
| Event **proposer** (`proposedBy.email`) | 329 events are reachable only this way⁴ | none (D2, D8, D32) | Public-form submitters get a `ROLE_USER` login with no organisation. |
| `user.member` flag | 269 of 427 users⁵ (D11 says 279 of 670: different dump, reconcile before quoting) | `Organization.partner` (D11, D14a): a data flag, not a role | BKa: the flag is per person and only unlocks print fields and the admin-only members list. WeP: per organisation, sensitive (D37), grants nothing. |
| `ROLE_BROADCAST_PARTNER` | 0 users⁶ | none (a key with read scopes comes closest) | BKa: read-only, sees all published events and previews drafts. |
| `ROLE_ADMIN` ("Super-admin" in the UI) | 30 users⁶ | WeP **admin** (AllPermissions). The planned Agenda-Admin role (D3, D4) **is not built**. | — |
| `ROLE_SUPER_ADMIN` | 0 users; exists only in the hierarchy | — | Only route to impersonation, so nobody can impersonate. |
| API v1 OAuth2 token | 7, minted on the command line | `ApiToken` with scopes, optional `organizationId` (D36, D41) | BKa tokens act as their owner user with all its roles. No organisation binding. |
| API v2 `UserToken` (JWT) | 5, self-service | same | 3 of 4 partner integrations (guidle, punktzwei, bka-frontend) use **admin-owned** tokens.⁷ |

¹ `config/packages/security.yaml:24-26,43-48,54-56,82-86` (`/api/doc` and `/api/token` are `security:false`; `^/api/v2` is open at firewall level, but the resources demand a role) · ² `docs/bka-migration/research/bka-06-security-auth-roles.md:82-100,571-581` · ³ bka-06:539-541 · ⁴ bka-06:546-549 · ⁵ bka-06:94; bka-02 · ⁶ bka-06:48-51,82-88 · ⁷ bka-06:788-796,966-995

### What "my event" means in BKa, by surface

BKa has no single rule. The same user sees a different set of events depending on where they look.

| BKa surface | "My event" = | Source |
| --- | --- | --- |
| Admin list `/events` (and `/events/archived`) | event's organisation is mine, OR I proposed it | `src/Controller/EventController.php:137-146,326-407` |
| Admin voter: view, edit, delete, copy, sponsor | I own it, OR its organisation is mine, OR its venue's organisation is mine, OR I proposed it | `src/Security/Voters/EventVoter.php:59-102` |
| Admin voter: publish | same, without the proposer branch | `EventVoter.php:87-105` |
| API v2 `/events` | owner OR event organisation OR venue organisation (published only) | `src/ApiPlatform/EventExtension.php:87-138` |
| API v2 edit/delete voter | owner OR venue organisation, **not** the event's own organisation | `src/Security/Voters/EventApiVoter.php:57-72` |
| API v1 `/events` and v2 `/occurrences` | owner OR venue organisation. v1 additionally lists only events whose venue has an organisation (inner join), and returns HTTP 500 for a user with no organisation | `src/Repository/EventOccurrenceRepository.php:79-97`; `src/ApiPlatform/OccurrenceExtension.php:119-135` |
| API v1 `/events/organization/{slug}`, `/place/{slug}`, `/similar/{slug}`, `/sponsored` | no filter: every published upcoming event | `src/Controller/ApiEventController.php:229-231,610-614,671-675,732-736` |
| API v1 `GET /events/{slug}` | same as the admin voter, **drafts included** | `ApiEventController.php:283-287` |
| *WeP, for comparison* | list: own organisation OR owned · open/edit: organisation OR venue organisation OR owned · publish: organisation member, or owner of an event with no organisation · delete: organisation member | `libs/event/api/src/lib/event-scope.ts:158-218` |

---

## 2. The We.Publish editor role today (HEAD)

| Permission | Editor role | Effect |
| --- | --- | --- |
| `CAN_GET_EVENT`, `CAN_CREATE_EVENT`, `CAN_UPDATE_EVENT`, `CAN_DELETE_EVENT` | ✓ | Opens, creates, edits and deletes events it can reach (own organisation, its venues, owned). Deletes only own-organisation events. |
| `CAN_GET_EVENTS` | ✗ | The events list stays the public, published-only list. **Slice F (in progress):** list own organisation's and own events. |
| `CAN_PUBLISH_EVENT` | ✗ | Can only request a review. **Slice F (in progress):** publish own organisation's events, not foreign ones. |
| any `CAN_*_OTHER_ORGANIZATION_*` | ✗ | Never crosses organisations. `CAN_GET_OTHER_ORGANIZATION_EVENTS` already exists as the "see all" permission. |
| `CAN_CREATE/UPDATE/DELETE_ORGANIZATION` | ✗ | Cannot manage organisations or venues. |
| `CAN_CREATE_API_TOKEN`, `CAN_GET_ALL_API_TOKENS`, `CAN_REVOKE_ALL_API_TOKENS` | ✓ | Mints keys, **and sees and revokes every user's keys**. |

Source: `libs/permissions/src/lib/permissions.ts:1513-1592` (tokens 1537-1541, events 1568-1571, `CanGetOtherOrganizationEvents` 751-755); `libs/permissions/api/src/lib/predefined-permissions.ts:16-22` (admin = AllPermissions).

---

## 3. Events

Columns: **Anon** = anonymous · **No org** = logged in, no organisation · **Event org** = member of the event's organisation · **Venue org** = member of the venue's organisation, event organised by someone else · **Owner** · **Proposer** (BKa only) · **Admin** = BKa `ROLE_ADMIN` / WeP admin.

| Action | Anon | No org | Event org | Venue org | Owner | Proposer | Admin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| List in admin [E1] | BKa: ✗ / WeP: ✗ | BKa: only events they proposed / WeP: only events they own ⚠Q1 | BKa: ✓ / WeP: ✓ (+ owned) | BKa: ✗ (link only) / WeP: ✗ (link only) | BKa: only if filed under one of their organisations / WeP: ✓ always ⚠Q2 | BKa: ✓ / WeP: — ⚠Q1 | BKa: ✓ all / WeP: ✓ all |
| Open a draft [E2] | BKa: ✗ / WeP: ✗ | BKa: proposed only / WeP: owned only ⚠Q1 | BKa: ✓ / WeP: ✓ | BKa: ✓ / WeP: ✓ | BKa: ✓ / WeP: ✓ | BKa: ✓ / WeP: — ⚠Q1 | BKa: ✓ / WeP: ✓ |
| Create [E3] | BKa: only via public form / WeP: ✗ (form not built) ⚠Q5 | BKa: ✗ (organisation required, none to pick) / WeP: ✓ organisation-less event they own ⚠Q3 | BKa: ✓ becomes owner / WeP: ✓ becomes owner | — | — | — | BKa: ✓ any venue incl. private and disabled / WeP: ✓ private yes, disabled no ⚠Q4 |
| Publish at creation [E4] | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✓ even at a foreign venue; venue is only told afterwards / WeP: ✗ always a draft first ⚠Q6 | — | — | — | BKa: ✓ / WeP: draft first, then publish ⚠Q6 |
| Edit facts (dates, venue, prices) [E5] | BKa: ✗ / WeP: ✗ | BKa: proposed only / WeP: owned ⚠Q1 | BKa: ✓ / WeP: ✓ | BKa: ✓ live at once / WeP: ✓ live at once | BKa: ✓ / WeP: ✓ | BKa: ✓ / WeP: — ⚠Q1 | BKa: ✓ / WeP: ✓ |
| Edit content (texts, images) [E6] | BKa: ✗ / WeP: ✗ | BKa: proposed, live at once / WeP: owned, saved as draft ⚠Q7 | BKa: ✓ live at once / WeP: ✓ draft; live after publish ⚠Q7 | BKa: ✓ live at once / WeP: ✓ draft; cannot make it live ⚠Q7 | BKa: ✓ live / WeP: ✓ draft ⚠Q7 | BKa: ✓ live / WeP: — ⚠Q1 | BKa: ✓ live / WeP: ✓ draft, then publish ⚠Q7 |
| Print fields [E7] | BKa: ✗ / WeP: ✗ | BKa: only with member flag / WeP: ✓ ⚠Q8 | BKa: only with member flag / WeP: ✓ ⚠Q8 | BKa: only with member flag / WeP: ✓ ⚠Q8 | BKa: only with member flag / WeP: ✓ ⚠Q8 | BKa: ✗ (form accounts have no flag) / WeP: — | BKa: ✓ / WeP: ✓ |
| Publish / unpublish [E8] | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: own organisation-less event, with `CAN_PUBLISH_EVENT` ⚠Q3 | BKa: ✓ / WeP: ✓ with `CAN_PUBLISH_EVENT` | BKa: ✓ (this is BKa's validation) / WeP: ✗, requests review ⚠Q9 | BKa: ✓ even if filed under another organisation / WeP: only organisation-less events ⚠Q10 | BKa: ✗ (copy loophole, conditional) / WeP: — | BKa: ✓ / WeP: ✓ |
| Send for review (`to_validate`) [E9] | BKa: ✓ every public-form submission / WeP: ✗ ⚠Q5 | BKa: ✗ / WeP: on owned events they cannot publish ⚠Q3 | BKa: ✓ by choosing the status / WeP: only if they cannot publish ⚠Q11 | BKa: not needed, may publish / WeP: ✓ their only route ⚠Q9 | BKa: ✓ / WeP: only if they cannot publish ⚠Q11 | BKa: ✗ (status locked) / WeP: — | BKa: ✓ / WeP: ✗ (refused, can publish) ⚠Q11 |
| Delete [E10] | BKa: ✗ / WeP: ✗ | BKa: proposed events / WeP: ✗ ⚠Q13 | BKa: ✓ / WeP: ✓ | BKa: ✓ / WeP: ✗ ⚠Q12 | BKa: ✓ / WeP: ✗ unless in the event's organisation ⚠Q13 | BKa: ✓ (though they cannot publish) / WeP: — ⚠Q13 | BKa: ✓ / WeP: ✓ |
| Duplicate [E11] | BKa: ✗ / WeP: ✗ | BKa: proposed events (but cannot save the copy) / WeP: owned organisation-less events ⚠Q3 | BKa: ✓ copier owns a draft / WeP: ✓ same | BKa: ✓ copy stays under the other organisation / WeP: ✗ (except organisation-less events) ⚠Q14 | BKa: ✓ / WeP: only if organisation-less or a member ⚠Q14 | BKa: ✓ / WeP: — | BKa: ✓ / WeP: ✓ |
| Change event's organisation [E12] | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ (only "none") | BKa: ✓ between own organisations / WeP: ✓ same, **or to none** ⚠Q3 | BKa: ✓ can pull it into their own organisation / WeP: ✗ (D47) ⚠Q15 | BKa: ✓ into own organisations / WeP: only an organisation-less event ⚠Q15 | BKa: ✗ (field locked) / WeP: — | BKa: ✓ except past events / WeP: ✓ any ⚠Q16 |
| Change venue [E13] | BKa: ✗ / WeP: ✗ | BKa: enabled, public venues / WeP: same | BKa: enabled, public or own / WeP: same | BKa: same / WeP: same | BKa: same / WeP: same | BKa: same / WeP: — | BKa: any incl. disabled / WeP: not disabled ⚠Q4 |
| Change owner [E14] | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: — | BKa: ✗ (no field anywhere) / WeP: ✓ ⚠Q17 |
| Sponsor (highlight) [E15] | BKa: ✗ / WeP: ✗ | BKa: proposed events / WeP: not built ⚠Q18 | BKa: ✓ / WeP: not built ⚠Q18 | BKa: ✓ / WeP: not built ⚠Q18 | BKa: ✓ / WeP: not built ⚠Q18 | BKa: ✓ / WeP: — | BKa: ✓ / WeP: not built ⚠Q18 |

**Footnotes**

- **E1.** BKa: `src/Controller/EventController.php:68-72` (admin skips the own-only filter), `:134` (shows only events with `dateTo >= today`; past events sit in `/events/archived` under the same rule, `:326-407`), `:137-146` (`organization IN myOrgs OR LOWER(proposedBy.email) = me`), `:243-248` (`/events/members-only` is admin-only). bka-06:532-533. `ROLE_BROADCAST_PARTNER`: `/` redirects to `/user-token` (`src/Controller/DefaultController.php:14`). EventVoter never checks `ROLE_USER`, and the user form offers organisations to every user type, so a partner put into an organisation would see, edit, publish, copy and delete that organisation's events (`EventVoter.php:38-56,87-105`; `src/Form/UserType.php:86-96`). WeP: `libs/event/api/src/lib/event-scope.ts:158-172`, `event.resolver.ts:111` (needs `CAN_GET_EVENTS`), `event-editor-mode.decorator.ts:11-16` (preview header, D46). D19 `docs/bka-migration/decisions.md:797`, D35 `:1543`.
- **E2.** BKa: `EventVoter.php:47-49` (admin), `:59-66` (view = partner or edit), `:68-85` (owner, proposer email), `:94-102` (event organisation, venue organisation); used by edit and preview, `EventController.php:488,653`. WeP: `event-scope.ts:175-202` (`reachableEventsWhere` / `canReachEvent`); `event.service.ts:188` (public = published only); `event.resolver.ts:378-383`.
- **E3.** BKa: `EventController.php:409-417` (needs `ROLE_USER`; owner = creator `:416`; no default place `:417`); `src/Form/EventType.php:121-132,235-246` (organisation NotNull, choices = own organisations + current), `:218-219` (admin may pick any place); `src/Repository/PlaceRepository.php:87-112`; `src/Controller/ProposeEventController.php:258`. WeP: `event.service.ts:351-419`; `event-scope.ts:127-144` (selectable venues), `:220-226`; `event.resolver.ts:128`. D32 `decisions.md:1486-1505`; D54 `:2312-2347` (admin and disabled venues is still open).
- **E4.** BKa: `EventType.php:850` (`can_publish` defaults to true), `EventController.php:438` (create passes no `can_publish`), `:454-457` (mail 1a to the creator at a foreign or organisation-less venue, whatever the status), `:460-466` (1b if `to_validate`, else 3b to the venue's organisation), `:516` (admins skip all mails); `docs/bka-migration/research/bka-03-emails.md:28,33`. **So BKa does not enforce validation at create.** WeP: `event.service.ts:351-419` (create never publishes); D3 `decisions.md:77`, D4 `:159`.
- **E5.** BKa: `EventVoter.php:68-102`; `EventController.php:485-488,494,500` (archived fields are admin-only, after the last end date); `EventType.php:126-132,235-246,701-720`. The relaxed organisation field exists only on proposed events, so a no-organisation owner cannot save their own event. Inconsistency: the BKa archive list hides the edit icon for published past events, for admins too, but the route stays open (`themes/bka/templates/datatables/event-archived-actions.html.twig:8`). WeP: `event-scope.ts:204-208` (`canModifyEvent`); `event.service.ts:425`; `decisions.md:1570-1585`.
- **E6.** BKa: one form, one save (`EventController.php:488`). WeP: `event.service.ts:530-551`; `event.resolver.ts:152-162`.
- **E7.** BKa: `EventController.php:436,494`; `EventType.php:136,251`. WeP: `event.service.ts:400,493` (`showInPrint` is written without a check).
- **E8.** BKa: `EventVoter.php:87-105`; `EventController.php:501`; `EventType.php:564-569`; validation mails `EventController.php:520-531,557-562`. Proposer copy loophole: `src/Event/EventDuplicator.php:57-58,72-77`. It works only if an admin already set an organisation on the original (the form never does) or the proposer belongs to an organisation (`EventDuplicator.php:58,88-90`; `EventType.php:126-132,235-246`). WeP: `event-scope.ts:210-214`; `event.service.ts:567,633-640`; `event.resolver.ts:164,177`; D48 `decisions.md:2136-2163`.
- **E9.** BKa: `EventType.php:564-569,850`; `EventController.php:454-462`; `ProposeEventController.php:258`; 90 of 109 `to_validate` rows come from the public form (`bka-02-live-data-profile.md:606-633`). WeP: `event.service.ts:791-827` (refused for those who can publish, `:798-802`); `event.resolver.ts:205`; D58 `decisions.md:2440`.
- **E10.** BKa: `EventController.php:638-643` (no delete attribute; delete reuses edit; a GET link with no CSRF, bka-06:1111). Inconsistency: the upcoming list shows the delete icon to edit holders (`templates/datatables/event-actions.html.twig:2,27`), the archive list only to admins (`themes/bka/templates/datatables/event-archived-actions.html.twig:14`), and the route is open to edit holders either way. WeP: `event-scope.ts:216-218`; `event.resolver.ts:188`; D49 `decisions.md:2167-2183`.
- **E11.** BKa: `EventController.php:593-606`; `EventDuplicator.php:57-58,72-77,88-90`. Not available in either API. WeP: `event.service.ts:674-696,727-737`; `event-scope.ts:204-208,220-226` (a venue member can copy an organisation-less event at their venue); D57 `decisions.md:2412`.
- **E12.** BKa: `EventType.php:121-132` (admin: all, `:122-124`), `:199-248` + `EventController.php:500` (past events: organisation and place become read-only archived fields, even for admins), `:701-720` (locked for non-admins on proposed events). WeP: `event-scope.ts:232-250` (null target allowed, `:246-249`); `event.service.ts:429-437`; D47 `decisions.md:2098`.
- **E13.** BKa: `PlaceRepository.php:87-112`; `EventType.php:212-222`. WeP: `event-scope.ts:127-144`; `event.service.ts:884-901`.
- **E14.** BKa: `EventController.php:416`; `EventDuplicator.php:72-73`; `EventType.php:118-250` (no user field); `ApiEventController.php:355-401` and `src/ApiResource/EventApi.php:609-610` (APIs set no owner); deleting a user nulls `event.user_id` (bka-06:645-650). WeP: `event-scope.ts:228-230,252-253`; `event.service.ts:358-374,439-447`.
- **E15.** BKa: `EventController.php:609-626` (gated by the edit voter). WeP: no sponsor field anywhere in `libs/event/api` at HEAD.

---

## 4. Organisations

Columns: **Anon** · **No org** = logged in, no organisation · **Member** = member of *this* organisation · **Admin**.

| Action | Anon | No org | Member | Admin |
| --- | --- | --- | --- | --- |
| See on public site / API [O1] | BKa: ✗ (no anonymous API) / WeP: ✓ enabled ones, public fields ⚠Q19 | BKa: ✗ via API / WeP: ✓ enabled ones ⚠Q19 | BKa: API shows own only / WeP: ✓ all enabled ⚠Q19 | BKa: ✓ / WeP: ✓ |
| List in admin [O2] | BKa: ✗ / WeP: ✗ | BKa: ✓ all, incl. disabled / WeP: enabled only ⚠Q20 | BKa: ✓ all, incl. disabled / WeP: enabled + own disabled ⚠Q20 | BKa: ✓ all / WeP: ✓ all |
| Read sensitive fields (contacts, members, partner) [O3] | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: own ✓ / WeP: own ✓ | BKa: ✓ / WeP: ✓ |
| Create [O4] | BKa: ✗ / WeP: ✗ | BKa: once, at sign-up / WeP: only with `CAN_CREATE_ORGANIZATION` (not in editor role) ⚠Q21 | BKa: ✗, unless the sign-up flag is still set / WeP: same as left ⚠Q21 | BKa: ✓ / WeP: ✓ |
| Edit details [O5] | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✓ / WeP: ✓ with `CAN_UPDATE_ORGANIZATION` (not in editor role) | BKa: ✓ / WeP: ✓ |
| Enable / disable [O6] | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✓ / WeP: ✗ ⚠Q22 | BKa: ✓ / WeP: ✓ |
| Set member/partner flag [O7] | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✓ per person / WeP: ✓ per organisation ⚠Q23 |
| Delete [O8] | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: with `CAN_DELETE_ORGANIZATION` (not in editor role) ⚠Q24 | BKa: ✓ / WeP: ✓ |
| Add / remove members [O9] | BKa: ✗ / WeP: ✗ | BKa: joins only the organisation they create at sign-up / WeP: joins the organisation they create | BKa: ✗ / WeP: ✗ | BKa: ✓ via the user form / WeP: ✓ |

**Footnotes**

- **O1.** BKa: `security.yaml:91`; `src/ApiResource/OrganizationApi.php:76`; `src/Controller/ApiOrganizationController.php:59-69`; `src/ApiPlatform/OrganizationExtension.php:125-138`. The public bka.ch site reads through the bka-frontend OAuth client, one of whose tokens belongs to an admin (bka-06:968-988). WeP: `event-scope.ts:67-77`; `organization/organization.resolver.ts:31-52`; D37 `decisions.md:1673`.
- **O2.** BKa: `src/Controller/OrganizationController.php:40-78` (unfiltered unless `?mine=1`). WeP: `event-scope.ts:67-77`.
- **O3.** BKa: `OrganizationController.php:51-64,159`; `src/Security/Voters/OrganizationVoter.php:51-56`. BKa API v1 also leaks these fields through events (see T7). WeP: `organization/organization.model.ts:28-35`; `event-scope.ts:86-92`.
- **O4.** BKa: `OrganizationController.php:117-122`; `EventController.php:162-230`. Onboarding is gated only by `config.org_creation=needed`, not by having no organisation: 103 users carry the flag and only 15 have no organisation, so at least 88 members could still create one (bka-06:97-100,117). WeP: `organization.resolver.ts:54`; `organization.service.ts:118-156` (creator becomes a member, `:144-147`).
- **O5.** BKa: `OrganizationVoter.php:51-56`; `OrganizationController.php:159`. WeP: `organization.service.ts:165`; `event-scope.ts:94-99`.
- **O6.** BKa: `src/Form/OrganizationType.php:91-98` (no admin gate). Disabling hides the organisation from API v2 (`OrganizationExtension.php:125`). WeP: `organization.service.ts:269-283`.
- **O7.** BKa: `src/Form/UserType.php:51-55,108-114`; `security.yaml:88-89`. Organisation "affiliations" are discount-card types, editable by members, and are not a partner flag (`OrganizationType.php:282-293`; bka-02:1860-1875). WeP: `organization.service.ts:269-283`; D11, D14a.
- **O8.** BKa: `OrganizationController.php:187-193` (admin only, a GET link). WeP: `organization.resolver.ts:76`; `organization.service.ts:192`.
- **O9.** BKa: `UserType.php:86-96`; `OrganizationType.php:57-293` (no users field); `EventController.php:204`. WeP: `organization.resolver.ts:87-101`.

---

## 5. Places (venues)

Columns: **Anon** · **No org** · **Member** = member of the venue's organisation · **Admin**.

| Action | Anon | No org | Member | Admin |
| --- | --- | --- | --- | --- |
| See publicly [P1] | BKa: ✗ (only the public form's venue picker) / WeP: ✓ enabled venues ⚠Q19 | (as Anon) | (as Anon; API reads in T8) | BKa: ✓ / WeP: ✓ |
| List in admin [P2] | BKa: ✗ / WeP: ✗ | BKa: ✓ all / WeP: enabled only ⚠Q20 | BKa: ✓ all / WeP: enabled + own disabled ⚠Q20 | BKa: ✓ / WeP: ✓ |
| Create [P3] | BKa: ✗ / WeP: ✗ | BKa: one hidden venue at sign-up / WeP: ✗ ⚠Q21 | BKa: ✗ / WeP: ✓ with `CAN_UPDATE_ORGANIZATION` (not in editor role) ⚠Q25 | BKa: ✓ / WeP: ✓ (also with no organisation) |
| Edit [P4] | BKa: ✗ / WeP: ✗ | BKa: ✗ / WeP: ✗ | BKa: ✓ / WeP: ✓ with `CAN_UPDATE_ORGANIZATION` | BKa: ✓ / WeP: ✓ |
| Move to another organisation [P5] | — | — | BKa: ✗ / WeP: ✓ between own organisations ⚠Q26 | BKa: ✓ / WeP: ✓ |
| Private / enabled [P6] | — | — | BKa: ✓ / WeP: ✓ | BKa: ✓ / WeP: ✓ |
| Delete [P7] | — | — | BKa: ✗ / WeP: ✓ (no future dates) ⚠Q27 | BKa: ✓ if no upcoming events / WeP: ✓ if no future dates |

**Footnotes**

- **P1.** BKa: `security.yaml:91`; `src/ApiResource/PlaceApi.php:53`; `PlaceRepository.php:87-112`. WeP: `event-scope.ts:112-124`; `place/place.resolver.ts:42-55`; D54.
- **P2.** BKa: `src/Controller/PlaceController.php:36-75`. WeP: `event-scope.ts:112-124`.
- **P3.** BKa: `PlaceController.php:88-92`; `EventController.php:212-223` (onboarding venue, created disabled). WeP: `place.resolver.ts:58`; `place.service.ts:145`; `event-scope.ts:146-152`; D55 `decisions.md:2351`.
- **P4.** BKa: `src/Security/Voters/PlaceVoter.php:51-66`; `PlaceController.php:128`. WeP: `place.service.ts:176-190`.
- **P5.** BKa: `src/Form/PlaceType.php:282-293` (admin only). WeP: `place.service.ts:182-190`.
- **P6.** BKa: `PlaceType.php:112-124`. `private` only narrows the event-form and public-form pickers, and both APIs ignore it (`PlaceRepository.php:94-96`; bka-04:1150). WeP: `place.service.ts:202-203`; `event-scope.ts:127-144`.
- **P7.** BKa: `PlaceController.php:160-172`. WeP: `place.service.ts:220-237`.

---

## 6. Accounts and public submission

| Action | Anonymous | Any logged-in non-admin | Admin |
| --- | --- | --- | --- |
| Propose an event [A1] | BKa: ✓ 6-step public form, embeddable, always `to_validate` / WeP: ✗ not built (D32 keeps it) ⚠Q5 | — | — |
| Propose a venue [A2] | BKa: ✓ inside the form, stored as a proposal, not a real venue / WeP: ✗ (open question) ⚠Q28 | — | — |
| Create an account [A3] | BKa: ✓ automatically, for an unknown submitter email: an admin login with no organisation and a set-password mail / WeP: ✓ self-registration as a website member, no admin rights ⚠Q29 | BKa: ✗ / WeP: ✗ | BKa: ✓ (no invitation mail; command-line xlsx import too) / WeP: ✓ |
| Grant roles [A4] | — | BKa: ✗ / WeP: ✗ | BKa: ✓ user type + admin tick; super admin cannot be granted / WeP: ✓ any role incl. admin; can also edit what a role contains |
| Change own account [A5] | — | BKa: email and language only; password only via reset link / WeP: not compared | — |
| Disable / delete users [A6] | — | BKa: ✗ / WeP: not compared | BKa: ✓ (delete is a GET link; their events become ownerless; a disabled user's v1 token keeps working) / WeP: not compared |

**Footnotes**

- **A1.** BKa: `security.yaml:85`; `ProposeEventController.php:34-38,226-267`. WeP: `decisions.md:1486-1505`.
- **A2.** BKa: `ProposeEventController.php:53-61,74-77`; `docker-compose.yaml:52` (`ACTIVATE_PROPOSAL_PLACE=true`); 1,823 rows (bka-02:1556). WeP: `decisions.md:2733-2735`.
- **A3.** BKa: `ProposeEventController.php:262-276`; `src/Controller/UserController.php:102-135`; `src/Command/ImportUsersXlsxCommand.php:74-86`. WeP: `libs/session/api/src/lib/register.resolver.ts:16-34`; `register.service.ts:25`; `libs/user/api/src/lib/user.resolver.ts:80-84`.
- **A4.** BKa: `UserType.php:66-107`; `security.yaml:89`; bka-06:105-115. Impersonation is switched on, but only `ROLE_SUPER_ADMIN` carries it, so nobody can impersonate (`security.yaml:17,77`). WeP: `user.resolver.ts:80-94`; `user.model.ts:244`; `user-role.resolver.ts:58-70` (HEAD; that file is being edited right now).
- **A5.** BKa: `UserController.php:137-147`; `UserType.php:51-55`.
- **A6.** BKa: `UserController.php:172-197`; `UserType.php:103-107`; bka-06 §12.5 (v1 token of a disabled user).

---

## 7. API clients

Columns: **With org** = BKa token of a `ROLE_USER` who is in organisations / WeP key bound to an organisation · **Without org** = BKa token of a `ROLE_USER` with no organisation / WeP platform key · **Admin-level** = BKa admin-owned token (3 of 4 integrations) / WeP key with cross-organisation scopes · **Partner** = BKa `ROLE_BROADCAST_PARTNER` (0 holders).

| Action | With org | Without org | Admin-level | Partner |
| --- | --- | --- | --- | --- |
| Read published events [T1] | BKa v1 `/events`: owned or at its venues (venue must have an organisation); 4 other v1 lists return everything. v2: owned, its organisation or its venues / WeP: ✓ all (public) ⚠Q30 | BKa v1 `/events`: HTTP 500; the 4 other lists return everything; v2: owned only / WeP: ✓ all (public) ⚠Q30 | BKa: ✓ all / WeP: ✓ all | BKa: ✓ all / WeP: — |
| Read unpublished events [T2] | BKa v1 by slug: ✓ owned, its organisation, its venues, proposed; v2: ✗ / WeP: ✓ with event scope + preview header ⚠Q31 | BKa v1: proposed ones by slug; v2: ✗ / WeP: ✗ | BKa v1: ✓ any by slug; v2: ✗ / WeP: ✓ any ⚠Q31 | BKa v1: ✓ any by slug; v2: ✗ / WeP: — |
| Create events [T3] | BKa v1: ✓ under owner's organisation, any venue, any status; v2: ✓ no organisation, any status; no owner on either / WeP: ✓ under its organisation, allowed venues only, always draft ⚠Q32 | BKa v1: ✗; v2: ✓ but the event then has no owner or organisation and the token loses it / WeP: ✓ same flaw | BKa: ✓ / WeP: ✓ | BKa: ✗ / WeP: — |
| Edit events [T4] | BKa v1: owned, its organisation, its venues, proposed, but must re-file under own organisation; v2: owned or its venues only, drafts too, may move to any venue / WeP: its organisation's events and its venues' events ⚠Q33 | BKa v1: ✗; v2: owned only / WeP: ✗ unless cross-organisation scope | BKa: ✓ / WeP: ✓ | BKa: ✗ / WeP: — |
| Publish / unpublish / send for review [T5] | BKa: any status, for whoever may create or edit / WeP: publish only its organisation's events, with `CAN_PUBLISH_EVENT` ⚠Q6 ⚠Q9 | BKa v1: ✗; v2: at creation only / WeP: needs publish + cross-organisation | BKa: ✓ / WeP: ✓ | BKa: ✗ / WeP: — |
| Delete events [T6] | BKa v1: owned, its organisation, its venues, proposed; v2: owned or its venues / WeP: its organisation's only ⚠Q12 | BKa v1: owned or proposed; v2: owned / WeP: ✗ unless cross-organisation scope | BKa: ✓ / WeP: ✓ | BKa: ✗ / WeP: — |
| Read organisations [T7] | BKa: own only, **with contacts and members' emails**; v1 event responses also embed them / WeP: all enabled (public); sensitive only for its own ⚠Q19 ⚠Q34 | BKa: none / WeP: all enabled (public) ⚠Q19 | BKa: all with sensitive (v2: enabled) / WeP: ✓ with `CAN_GET_OTHER_ORGANIZATIONS` | BKa v1: ✗; v2: all enabled / WeP: — |
| Read venues [T8] | BKa v1: all, incl. disabled and private; v2: own only / WeP: all enabled ⚠Q19 | BKa v1: all; v2: none / WeP: all enabled ⚠Q19 | BKa: all / WeP: all | BKa: all / WeP: — |
| Write organisations / venues [T9] | BKa: ✗ (read-only in both APIs) / WeP: edit its organisation, manage its venues, even delete its organisation (given scopes) ⚠Q35 | BKa: ✗ / WeP: with cross-organisation scopes, create organisations, set enabled and partner, manage members ⚠Q35 | BKa: ✗ / WeP: ✓ with scopes ⚠Q35 | BKa: ✗ / WeP: — |

**Key management**

| Action | Ordinary organiser | WeP editor role | Admin |
| --- | --- | --- | --- |
| Create a key [K1] | BKa: ✓ v2 for themselves, carries all their rights, no expiry limit; v1 only by operator command line / WeP: with `CAN_CREATE_API_TOKEN`, scopes ≤ own rights, ≤ 3 years, optional organisation ⚠Q36 | WeP: ✓ | BKa: ✓ for any owner / WeP: ✓ |
| See and revoke other people's keys [K2] | BKa: ✗ own only / WeP: ✗ | BKa: — / WeP: ✓ **all keys of all users** ⚠Q37 | BKa: ✓ / WeP: ✓ |
| Key after its creator leaves [K3] | BKa: keeps acting as its owner; a disabled user's v1 token still works / WeP: an organisation key stops when its creator leaves that organisation or is deleted ⚠Q38 | — | WeP: a key created by a cross-organisation admin keeps working |

**Footnotes**

- **T1.** BKa: `src/Repository/EventOccurrenceRepository.php:70-71,79-97` (inner join on `place.organization` at `:84`; `Expr::in()` over a literal empty array renders `IN()`, a DQL error, see `vendor/doctrine/orm/src/Query/Expr.php:393-407`, `Expr/Func.php:44-46`); `ApiEventController.php:137,182` (list and count), `:201,229-231,569,610-614,630,671-675,691,732-736` (the unfiltered lists, no `isGranted`); `src/Repository/EventRepository.php:291-366`; `EventExtension.php:87-138`; `OccurrenceExtension.php:119-135`. WeP: `event-scope.ts:154-156`; `event.service.ts:221`.
- **T2.** BKa: `ApiEventController.php:283-287`; `src/Resolver/SlugEntityValueResolver.php:39-58` (no status filter); `EventVoter.php:47-49,59-105`; `EventExtension.php:73-77,87-96` (v2 forces published). WeP: `event-scope.ts:158-202`; `event-editor-mode.decorator.ts:11-16`. A WeP key with no organisation that sends the preview header gets an **empty** list (`event-scope.ts:158-170`).
- **T3.** BKa: `ApiEventController.php:354-401`; `src/Form/ApiForm/ApiEventType.php:53-66,179-185` (any Place, organisation NotNull from own organisations); `EventApi.php:387-390,566-568` (organisation read-only); `src/Mapper/EventApiToEntityMapper.php:51-79`. WeP: `event.service.ts:351-419`; `event-scope.ts:220-226,255-258`.
- **T4.** BKa: `ApiEventController.php:462-474,490` (`clearMissing`, `organization_choices` = own organisations); `src/Organization/OrganizationMagazine.php:22-31`; `EventApiVoter.php:43-72`; `EventApi.php:393-397`; `EventApiToEntityMapper.php:61-63` (place written from the payload). v2 PATCH and DELETE load `MainEvent`, so `EventExtension` (which checks `Event::class`) is skipped and drafts are writable by id (`EventExtension.php:58-77`; `vendor/api-platform/doctrine-orm/State/ItemProvider.php:53,82`). That comes from reading the code and was not probed at runtime. WeP: `event-scope.ts:204-208`.
- **T5.** BKa: `ApiEventType.php:179-185`; `ApiEventController.php:381,465`; `EventApi.php:387-397`; `EventApiToEntityMapper.php:78`; `EventApiVoter.php:57-72`. The "proposer publishes over v1" route needs the proposer to be in an organisation and to re-file the event there, so accounts created by the public form cannot use it. WeP: `event-scope.ts:25-27,210-214`.
- **T6.** BKa: `ApiEventController.php:552-556`; `EventApi.php:399-401`; `EventApiVoter.php:57-72`. WeP: `event-scope.ts:216-218`.
- **T7.** BKa: `ApiOrganizationController.php:59-69,81-121`; `src/Entity/Organization.php:96,138-147`; `src/Entity/Contact.php:22-39`; `src/Entity/Event.php:229-230` + `ApiEventController.php:246-250,285` (v1 event responses embed the organisation's `reader` group, contacts and member emails included, for anyone who may view the event: venue members, proposers, partners); `OrganizationApi.php:163-171`; `src/ApiResource/UserApi.php:22-31`; `OrganizationExtension.php:125-138`; `OrganizationVoter.php:51-56` (no partner branch). WeP: `event-scope.ts:29-31,36-47,67-92`; D36 `decisions.md:1597,1636-1638`.
- **T8.** BKa: `src/Controller/ApiPlaceController.php:65-79,118-127`; `src/ApiPlatform/PlaceExtension.php:95-114`. WeP: `event-scope.ts:112-124`.
- **T9.** BKa: `ApiOrganizationController.php:20,81`; `OrganizationApi.php:20,70`; `PlaceApi.php:20,47`. WeP: `organization.service.ts:122-130,165,269-283`; `organization.resolver.ts:87-101` (checks only the permission); `place.service.ts:145,176,220`; `event-scope.ts:94-99,146-152`; `decisions.md:1654-1655`.
- **K1–K3.** BKa: `src/Controller/UserTokenController.php:25-26,61-64,85-97,124-129` (revoke is a GET link); `src/Security/Voters/UserTokenVoter.php:43-49`; bka-06:897-905,999,1017. WeP: `libs/api-token/api/src/lib/api-token.service.ts:86-108,221-301`; `api-token.strategy.ts:18-28`; `api-token.resolver.ts:49-102`; `permissions.ts:1537-1541`; D41 `decisions.md:1874`.

---

## 8. Gaps in our build found while comparing (for us, not for BKa)

1. A member, or an organisation-bound key, can move an event to "no organisation" (`event-scope.ts:246-249`). After that only its owner or a cross-organisation user can reach it.
2. A key with `CAN_CREATE_EVENT` creates events with no owner. A platform key's events also have no organisation, and it cannot edit them afterwards (`event-scope.ts:204-208,220-226`). BKa v2 has the same flaw.
3. `duplicateEvent` copies `placeId` without the venue check (`event.service.ts:728`).
4. A venue member can duplicate an organisation-less event at their venue (`event.service.ts:689-696`; `event-scope.ts:220-226`), which contradicts the D57 cell.
5. Place `enabled` and `private` are free for any place manager (`place.service.ts:202-203`), while organisation `enabled` is privileged.
6. The editor role holds `CAN_GET_ALL_API_TOKENS` and `CAN_REVOKE_ALL_API_TOKENS` (`permissions.ts:1537-1541`).
7. `showInPrint` is not gated (`event.service.ts:400,493`).

Also BKa-side, for context. Destructive admin actions are GET links with no CSRF: event delete and copy, organisation, place, user and token delete (bka-06:1111). 2,558 events have no owner, organisation or place, so no non-admin can reach them. Nobody holds `ROLE_BROADCAST_PARTNER` or `ROLE_SUPER_ADMIN`.

---

## 9. Questions to settle with BKa

1. **Q1** Should people who submitted an event through the public form be able to log in later to see, change or delete it? Today they can, but they cannot publish it.
2. **Q2** Should someone always see the events they entered themselves in their list, even when the event is filed under an organisation they don't belong to, or under none? Today such events don't appear in their list.
3. **Q3** Can someone who belongs to no organisation enter, copy or publish events in the admin, or must every event belong to an organisation? And should an organiser be able to take an event out of every organisation?
4. **Q4** Should BKa staff be able to place events at a venue that has been switched off (disabled)?
5. **Q5** Do you still need the public "propose an event" form, and who should check what comes in through it?
6. **Q6** Should organisers be able to publish their own events straight away, including at another organisation's venue (as today, where the venue only gets an email afterwards)? Or should some events wait for approval first? The same question applies to events sent in through the API.
7. **Q7** When an organiser changes the text or pictures of an event that is already online, should the change appear immediately (as today) or only after it has been approved or published again?
8. **Q8** Should the print fields stay visible only to people with the "member" tick and to BKa staff, or be open to everyone?
9. **Q9** When another organisation puts an event at your venue, should your venue's team be able to publish it or take it offline themselves (as today)? Or should they only be able to correct it and send it back for approval?
10. **Q10** If someone entered an event that is filed under an organisation they are not part of, should they still be able to publish it or take it offline?
11. **Q11** Do organisers who are allowed to publish ever set their own events to "to validate" on purpose? If so, what for?
12. **Q12** Should a venue's team be able to delete events that another organisation has put at their venue (as today)?
13. **Q13** Should the person who entered or submitted an event be able to delete it, even when they are not part of the event's organisation?
14. **Q14** Should a venue's team, or the person who entered an event, be able to copy an event that belongs to another organisation? Today the copy stays under the other organisation.
15. **Q15** Should a venue's team, or the event's creator, be able to move an event into their own organisation? Today they can, simply by editing it.
16. **Q16** Does BKa staff ever need to change the organisation or venue of an event that is already over? Today the admin blocks this.
17. **Q17** Should BKa staff be able to hand an event over to another person, so that it changes owner? Today nobody can.
18. **Q18** Is "sponsoring" (highlighting) an event still used, and who should be allowed to do it? Today anyone who can edit the event can.
19. **Q19** Should the list of organisations and venues (names, addresses, websites) be visible to everyone on the public site and API? Today it is visible only to logged-in partners.
20. **Q20** Do organisers need to see other organisations and venues that have been switched off, as they do in today's admin lists?
21. **Q21** Should new users keep the ability to create their own organisation (and a first, hidden venue) themselves when they sign up, or should BKa create organisations?
22. **Q22** Should an organisation be able to switch itself off (hide itself), or only BKa?
23. **Q23** Is "member" (partner) a property of a person, as today, or of the whole organisation?
24. **Q24** Should an organisation ever be able to delete itself, or only BKa?
25. **Q25** Should organisations be able to add new venues themselves, or only BKa?
26. **Q26** Should an organisation be able to move one of its venues to another organisation it also belongs to?
27. **Q27** Should an organisation be able to delete its own venue when no future events are planned there, or only BKa?
28. **Q28** When someone proposes a new venue through the public form, what should happen to it?
29. **Q29** Submitting the public form currently creates an admin login for the submitter automatically. Should that continue?
30. **Q30** Should every connected partner see all published events through the API, or only their own and those at their venues?
31. **Q31** Does any connected system read events that are not yet published through the API today? Which one, and why?
32. **Q32** Should events sent in by connected systems arrive as drafts, or be allowed to go live immediately?
33. **Q33** Which connected systems change events through the API, and whose events: their own organisation's, those at their venues, or both?
34. **Q34** Does any connected system rely on getting contact persons or members' email addresses of organisations through the API?
35. **Q35** Should connected systems ever change organisation or venue details, or is that always done by people in the admin?
36. **Q36** Who should be allowed to create API keys: every organiser, or only BKa? And should keys expire (we cap them at 3 years)?
37. **Q37** Should anyone besides BKa staff be able to see or cancel API keys that belong to other people?
38. **Q38** If the person who set up an integration leaves the organisation, should the integration keep working or stop?
