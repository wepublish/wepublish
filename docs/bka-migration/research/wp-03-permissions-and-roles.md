# We.Publish — Permissions, Roles, and How to Add Them

Scope: everything in `libs/permissions/**` (the permission catalogue, the guard, the
decorators, `hasPermission`, `addPredefinedPermissions`, the `PreviewMode` param
decorator and the GraphQL `Permission` model), the Prisma `UserRole` model and every
place a role row is created, the editor's permission helpers and the role-editing UI,
how `CanLoginEditor` and `CanPreview` actually work, and — the part decisions
[D3](../decisions.md#d3--validation-is-cross-organisation-publishing-not-a-publication-state),
[D4](../decisions.md#d4--canpublishevent-decides-who-needs-validating) and
[D5](../decisions.md#d5--ready-for-review-is-an-explicit-action-backed-by-a-field-on-the-event)
depend on — whether a permission can be scoped to an object today, and what the nearest
existing per-record authorisation pattern is. Everything below describes the repository
as it stands at commit `360b36ccb`. A short "Porting notes" section at the end draws
implications; everything before it is description.

---

## 1. The shape of the system in one paragraph

A **permission** is a frozen TypeScript object literal — `{id, description, deprecated}` —
living in one 1,451-line file, `libs/permissions/src/lib/permissions.ts`. A **role** is a
Postgres row in `users.roles` carrying a `String[]` of permission **ids**. A **user** carries
a `String[]` of role **ids** (`users.roleIDs`, no foreign key). At request time Passport
loads the session, looks the roles up by id, and passes each through
`addPredefinedPermissions`, which *injects* the permission list of the three hard-coded
system roles (`admin`, `editor`, `peer`) — those three rows are stored with an **empty**
`permissionIDs` array and get their permissions in code, not from the database. The
`@Permissions(...)` decorator attaches the permission objects as route metadata and adds
`PermissionsGuard` to a `OneOf` list; the guard flattens `session.roles[].permissionIDs`
and requires **every** listed permission to be present. There is no object, row, tenant or
ownership dimension anywhere in that chain.

```
HTTP request
  │  Authorization: Bearer <session token>      (or <peer token> + peer User-Agent)
  ▼
APP_GUARD #1  OptionalAuthenticationGuard        libs/authentication/api/src/lib/optional-authentication.guard.ts
  │  passport 'session' strategy → AuthenticationService.getUserSession/getPeerSession
  │  → req.user = { type, id, user, roles: UserRole[] (permissions already expanded), … }
  │  never fails the request (except an invalid *peer* token)
  ▼
APP_GUARD #2  OneOfGuard                         libs/nest-modules/src/lib/one-of/one-of.guard.ts
  │  reads the `one_of` metadata list and passes if ANY listed guard passes
  │     PublicGuard          ← @Public()
  │     AuthenticatedGuard   ← @Authenticated()
  │     PermissionsGuard     ← @Permissions(...)
  │     SettingsGuard        ← @Settings(...)
  │     ScopedJwtGuard       ← @ScopedJwt('scope')
  ▼
method-level UseGuards (AND, runs after the globals)
  │     FeatureGuard         ← @Feature('key')
  ▼
resolver body — where any per-record check would have to live (there are almost none)
```

---

## 2. The permission catalogue

### 2.1 The type and the file

```ts
// libs/permissions/src/lib/permissions.ts:1-5
export type Permission = {
  id: string;
  description: string;
  deprecated: boolean;
};
```

The same three fields are mirrored as a GraphQL object type in
`libs/permissions/api/src/lib/permission.model.ts:3-14`:

```ts
@ObjectType()
export class Permission {
  @Field() id!: string;
  @Field() description!: string;
  @Field() deprecated!: boolean;
}
```

The file declares **188 permission constants** and three arrays:

| Array | Line | Entries | Unique | Purpose |
| --- | --- | --- | --- | --- |
| `AllPermissions` | `permissions.ts:1193` | 180 | 180 | The `admin` role's permission set; also the only list the editor's permission picker can offer |
| `EditorPermissions` | `permissions.ts:1376` | 68 | **65** (3 duplicates) | The `editor` role's permission set |
| `PeerPermissions` | `permissions.ts:1447` | 3 | 3 | The `peer` role's permission set |

All three are `… ] as const;` — readonly tuples, not `Permission[]`. (They were plain
`Permission[]` until commit `562b8439f`; a diff from before that, such as `cd280d598`,
shows the old annotation.)

**No permission in the repository has `deprecated: true`.** The flag exists, the guard
warns on it (`has-permission.ts:14-16`), and nothing uses it.

### 2.2 Full catalogue

Columns: **A** = in `AllPermissions`, **E** = in `EditorPermissions`, **P** = in
`PeerPermissions`. "Line" is the declaration line in `libs/permissions/src/lib/permissions.ts`.
Every one of the 188 is listed; none is sampled away. All have `deprecated: false`.

#### Crowdfunding

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 7 | `CanGetCrowdfunding` | `CAN_GET_CROWDFUNDING` | Allows to get crowdfunding | ✔ | ✔ | |
| 13 | `CanGetCrowdfundings` | `CAN_GET_CROWDFUNDINGS` | Allows to get crowdfundings | ✔ | ✔ | |
| 19 | `CanCreateCrowdfunding` | `CAN_CREATE_CROWDFUNDING` | Allows to create crowdfunding | ✔ | ✔ | |
| 25 | `CanUpdateCrowdfunding` | `CAN_UPDATE_CROWDFUNDING` | Allows to update crowdfunding | ✔ | ✔ | |
| 31 | `CanDeleteCrowdfunding` | `CAN_DELETE_CROWDFUNDING` | Allows to delete crowdfunding | ✔ | ✔ | |

#### Navigation

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 37 | `CanGetNavigation` | `CAN_GET_NAVIGATION` | Allows to get navigation | ✔ | | |
| 43 | `CanGetNavigations` | `CAN_GET_NAVIGATIONS` | Allows to get all navigations | ✔ | | |
| 49 | `CanCreateNavigation` | `CAN_CREATE_NAVIGATION` | Allows to create navigation | ✔ | | |
| 55 | `CanDeleteNavigation` | `CAN_DELETE_NAVIGATION` | Allows to delete navigations | ✔ | | |

#### Banner

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 61 | `CanGetBanner` | `CAN_GET_BANNER` | Allows to get banner | ✔ | ✔ | |
| 67 | `CanGetBanners` | `CAN_GET_BANNERS` | Allows to get all banners | ✔ | ✔ | |
| 73 | `CanCreateBanner` | `CAN_CREATE_BANNER` | Allows to create banner | ✔ | ✔ | |
| 79 | `CanUpdateBanner` | `CAN_UPDATE_BANNER` | Allows to update banner | ✔ | ✔ | |
| 85 | `CanDeleteBanner` | `CAN_DELETE_BANNER` | Allows to delete banners | ✔ | ✔ | |

#### Author

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 91 | `CanCreateAuthor` | `CAN_CREATE_AUTHOR` | Allows to create authors | ✔ | ✔ | |
| 97 | `CanGetAuthor` | `CAN_GET_AUTHOR` | Allows to get author | ✔ | ✔ | |
| 103 | `CanGetAuthors` | `CAN_GET_AUTHORS` | Allows to get all authors | ✔ | ✔ | |
| 109 | `CanDeleteAuthor` | `CAN_DELETE_AUTHOR` | Allows to delete a single author | ✔ | | |

#### Image

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 115 | `CanCreateImage` | `CAN_CREATE_IMAGE` | Allows to create images | ✔ | ✔ | |
| 121 | `CanGetImage` | `CAN_GET_IMAGE` | Allows to get image | ✔ | ✔ | |
| 127 | `CanGetImages` | `CAN_GET_IMAGES` | Allows to get all images | ✔ | ✔ | |
| 133 | `CanDeleteImage` | `CAN_DELETE_IMAGE` | Allows to delete images | ✔ | | |

#### Document

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 139 | `CanCreateDocument` | `CAN_CREATE_DOCUMENT` | Allows to create documents | ✔ | ✔ | |
| 145 | `CanGetDocument` | `CAN_GET_DOCUMENT` | Allows to get document | ✔ | ✔ | |
| 151 | `CanGetDocuments` | `CAN_GET_DOCUMENTS` | Allows to get all documents | ✔ | ✔ | |
| 157 | `CanDeleteDocument` | `CAN_DELETE_DOCUMENT` | Allows to delete documents | ✔ | ✔ | |

#### Article (including peered / shared articles)

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 163 | `CanCreateArticle` | `CAN_CREATE_ARTICLE` | Allows to create articles | ✔ | ✔ | |
| 169 | `CanGetArticle` | `CAN_GET_ARTICLE` | Allows to get article | ✔ | ✔ | |
| 175 | `CanGetSharedArticle` | `CAN_GET_SHARED_ARTICLE` | Allows to get shared article | | | ✔ |
| 181 | `CanGetArticles` | `CAN_GET_ARTICLES` | Allows to get all articles | ✔ | ✔ | |
| 187 | `CanGetSharedArticles` | `CAN_GET_SHARED_ARTICLES` | Allows to get shared articles | | | ✔ |
| 193 | `CanGetPeerArticle` | `CAN_GET_PEER_ARTICLE` | Allows to get peer article | ✔ | | |
| 199 | `CanGetPeerArticles` | `CAN_GET_PEER_ARTICLES` | Allows to get all peer articles | ✔ | | |
| 205 | `CanPublishArticle` | `CAN_PUBLISH_ARTICLE` | Allows to publish articles | ✔ | ✔ | |
| 211 | `CanDeleteArticle` | `CAN_DELETE_ARTICLE` | Allows to delete articles | ✔ | | |

#### Comment

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 217 | `CanCreateApprovedComment` | `CAN_CREATE_APPROVED_COMMENT` | Allows to leave comment without pending approval | ✔ | ✔ | |
| 223 | `CanTakeActionOnComment` | `CAN_TAKE_COMMENT_ACTION` | Allows to take an action on comment | ✔ | ✔ | |
| 229 | `CanGetComments` | `CAN_GET_COMMENTS` | Allows to get all comments | ✔ | ✔ | |
| 235 | `CanUpdateComments` | `CAN_UPDATE_COMMENTS` | Allows to update a comment | ✔ | ✔ | |
| 241 | `CanDeleteComments` | `CAN_DELETE_COMMENTS` | Allows to delete comments | ✔ | ✔ | |

#### Page

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 247 | `CanCreatePage` | `CAN_CREATE_PAGE` | Allows to create Pages | ✔ | ✔ | |
| 253 | `CanGetPage` | `CAN_GET_PAGE` | Allows to get Page | ✔ | ✔ | |
| 259 | `CanGetPages` | `CAN_GET_PAGES` | Allows to get all Pages | ✔ | ✔ | |
| 265 | `CanPublishPage` | `CAN_PUBLISH_PAGE` | Allows to publish Pages | ✔ | ✔ | |
| 271 | `CanDeletePage` | `CAN_DELETE_PAGE` | Allows to delete Pages | ✔ | | |

#### Peering

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 277 | `CanUpdatePeerProfile` | `CAN_UPDATE_PEER_PROFILE` | Allows to update peer profile | ✔ | | |
| 283 | `CanGetPeerProfile` | `CAN_GET_PEER_PROFILE` | Allows to get peer profile | ✔ | ✔ | ✔ |
| 289 | `CanCreatePeer` | `CAN_CREATE_PEER` | Allows to create peers | ✔ | | |
| 295 | `CanGetPeer` | `CAN_GET_PEER` | Allows to get peer | ✔ | ✔ | |
| 301 | `CanGetPeers` | `CAN_GET_PEERS` | Allows to get all peers | ✔ | ✔ | |
| 307 | `CanDeletePeer` | `CAN_DELETE_PEER` | Allows to delete peers | ✔ | | |

#### API tokens

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 313 | `CanCreateToken` | `CAN_CREATE_TOKEN` | Allows to create tokens | ✔ | | |
| 319 | `CanGetTokens` | `CAN_GET_TOKENS` | Allows to get all tokens | ✔ | | |
| 325 | `CanDeleteToken` | `CAN_DELETE_TOKEN` | Allows to delete tokens | ✔ | | |

#### User, role and permission administration

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 331 | `CanCreateUser` | `CAN_CREATE_USER` | Allows to create an user | ✔ | | |
| 337 | `CanResetUserPassword` | `CAN_RESET_USER_PASSWORD` | Allows to reset the password of an user | ✔ | | |
| 343 | `CanGetUser` | `CAN_GET_USER` | Allows to get an user | ✔ | | |
| 349 | `CanGetUsers` | `CAN_GET_USERS` | Allows to get all users | ✔ | | |
| 355 | `CanDeleteUser` | `CAN_DELETE_USER` | Allows to delete users | ✔ | | |
| 361 | `CanCreateUserRole` | `CAN_CREATE_USER_ROLE` | Allows to create an user role | ✔ | | |
| 367 | `CanGetUserRole` | `CAN_GET_USER_ROLE` | Allows to get an user role | ✔ | | |
| 373 | `CanGetUserRoles` | `CAN_GET_USER_ROLES` | Allows to get all user roles | ✔ | | |
| 379 | `CanDeleteUserRole` | `CAN_DELETE_USER_ROLE` | Allows to delete user role | ✔ | | |
| 385 | `CanGetPermission` | `CAN_GET_PERMISSION` | Allows to get a permission | ✔ | | |
| 391 | `CanGetPermissions` | `CAN_GET_PERMISSIONS` | Allows to get all permissions | ✔ | | |
| 1145 | `CanResetUserTotp` | `CAN_RESET_USER_TOTP` | Allows to reset the two-factor authentication of a user | ✔ | | |

#### Membership — plans, payment methods, invoices, payments

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 397 | `CanCreateMemberPlan` | `CAN_CREATE_MEMBER_PLAN` | Allows to create a member plan | ✔ | | |
| 403 | `CanGetMemberPlan` | `CAN_GET_MEMBER_PLAN` | Allows to get a member plan | ✔ | | |
| 409 | `CanGetMemberPlans` | `CAN_GET_MEMBER_PLANS` | Allows to get all member plans | ✔ | | |
| 415 | `CanDeleteMemberPlan` | `CAN_DELETE_MEMBER_PLAN` | Allows to delete member plan | ✔ | | |
| 421 | `CanCreatePaymentMethod` | `CAN_CREATE_PAYMENT_METHOD` | Allows to create a payment method | ✔ | | |
| 427 | `CanGetPaymentMethod` | `CAN_GET_PAYMENT_METHOD` | Allows to get a payment method | ✔ | | |
| 433 | `CanGetPaymentMethods` | `CAN_GET_PAYMENT_METHODS` | Allows to get all payment methods | ✔ | | |
| 439 | `CanDeletePaymentMethod` | `CAN_DELETE_PAYMENT_METHOD` | Allows to delete payment method | ✔ | | |
| 445 | `CanCreateInvoice` | `CAN_CREATE_INVOICE` | Allows to create an invoice | ✔ | | |
| 451 | `CanGetInvoice` | `CAN_GET_INVOICE` | Allows to get an invoice | ✔ | | |
| 457 | `CanGetInvoices` | `CAN_GET_INVOICES` | Allows to get all invoices | ✔ | | |
| 463 | `CanDeleteInvoice` | `CAN_DELETE_INVOICE` | Allows to delete invoice | ✔ | | |
| 469 | `CanCreatePayment` | `CAN_CREATE_PAYMENT` | Allows to create a payment | ✔ | | |
| 475 | `CanGetPayment` | `CAN_GET_PAYMENT` | Allows to get an payment | ✔ | | |
| 481 | `CanGetPayments` | `CAN_GET_PAYMENTS` | Allows to get all payments | ✔ | | |
| 487 | `CanGetPaymentProviders` | `CAN_GET_PAYMENT_PROVIDERS` | Allows to get all payment providers | ✔ | | |

#### Login

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 493 | `CanSendJWTLogin` | `CAN_SEND_JWT_LOGIN` | Allows to send a JWT Login | ✔ | | |
| 499 | `CanLoginEditor` | `CAN_LOGIN_EDITOR` | Allows to login editor | ✔ | ✔ | |

#### Subscriptions, goodies, discount codes

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 505 | `CanCreateSubscription` | `CAN_CREATE_SUBSCRIPTION` | Allows to create a subscription | ✔ | | |
| 511 | `CanGetSubscription` | `CAN_GET_SUBSCRIPTION` | Allows to get a subscription | ✔ | | |
| 517 | `CanGetSubscriptions` | `CAN_GET_SUBSCRIPTIONS` | Allows to get all subscriptions | ✔ | | |
| 523 | `CanDeleteSubscription` | `CAN_DELETE_SUBSCRIPTION` | Allows to delete a subscription | ✔ | | |
| 529 | `CanCancelSubscription` | `CAN_DELETE_SUBSCRIPTION` ⚠ | Allows to delete a subscription | | | |
| 535 | `CanGetGoodie` | `CAN_GET_GOODIE` | Allows to get a goodie | ✔ | | |
| 541 | `CanCreateGoodie` | `CAN_CREATE_GOODIE` | Allows to create a goodie | ✔ | | |
| 547 | `CanUpdateGoodie` | `CAN_UPDATE_GOODIE` | Allows to update a goodie | ✔ | | |
| 553 | `CanDeleteGoodie` | `CAN_DELETE_GOODIE` | Allows to delete a goodie | ✔ | | |
| 559 | `CanGetDiscountCode` | `CAN_GET_DISCOUNTCODE` | Allows to get a discountCode | ✔ | | |
| 565 | `CanCreateDiscountCode` | `CAN_CREATE_DISCOUNTCODE` | Allows to create a discountCode | ✔ | | |
| 571 | `CanUpdateDiscountCode` | `CAN_UPDATE_DISCOUNTCODE` | Allows to update a discountCode | ✔ | | |
| 577 | `CanDeleteDiscountCode` | `CAN_DELETE_DISCOUNTCODE` | Allows to delete a discountCode | ✔ | | |

#### Settings and audit log

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 583 | `CanGetSettings` | `CAN_GET_SETTINGS` | Allows to get all settings | ✔ | | |
| 589 | `CanGetAuditLogs` | `CAN_GET_AUDIT_LOGS` | Allows to read the audit log | ✔ | | |
| 595 | `CanUpdateSettings` | `CAN_UPDATE_SETTINGS` | Allows to update settings | ✔ | | |
| 1181 | `CanGetWebsiteSettings` | `CAN_GET_WEBSITE_SETTINGS` | Allows to get the full website settings | ✔ | ✔ | |
| 1187 | `CanUpdateWebsiteSettings` | `CAN_UPDATE_WEBSITE_SETTINGS` | Allows to update the website settings | ✔ | ✔ | |

#### Comment rating system

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 601 | `CanGetCommentRatingSystem` | `CAN_GET_COMMENT_RATING_SYSTEM` | Allows to get a comment rating system | ✔ | | |
| 607 | `CanCreateCommentRatingSystem` | `CAN_CREATE_COMMENT_RATING_SYSTEM` | Allows to create a comment rating system | ✔ | ✔ | |
| 613 | `CanUpdateCommentRatingSystem` | `CAN_UPDATE_COMMENT_RATING_SYSTEM` | Allows to update a comment rating system | ✔ | ✔ | |
| 619 | `CanDeleteCommentRatingSystem` | `CAN_DELETE_COMMENT_RATING_SYSTEM` | Allows to delete a comment rating system | ✔ | ✔ | |

#### Tags

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 625 | `CanCreateTag` | `CAN_CREATE_TAG` | Allows to create a tag | ✔ | ✔ | |
| 631 | `CanUpdateTag` | `CAN_UPDATE_TAG` | Allows to update a tag | ✔ | ✔ | |
| 637 | `CanGetTags` | `CAN_GET_TAGS` | Allows to get all tags | ✔ | ✔ | |
| 643 | `CanDeleteTag` | `CAN_DELETE_TAG` | Allows to delete a tag | ✔ | ✔ | |

Note: tags are one shared model for article / page / comment / **event** tags, selected by
`TagType`; the permission does not distinguish them.

#### Polls

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 649 | `CanGetPoll` | `CAN_GET_POLL` | Allows to get a poll | ✔ | ✔ | |
| 655 | `CanCreatePoll` | `CAN_CREATE_POLL` | Allows to create a poll | ✔ | ✔ | |
| 661 | `CanUpdatePoll` | `CAN_UPDATE_POLL` | Allows to update a poll | ✔ | ✔ | |
| 667 | `CanDeletePoll` | `CAN_DELETE_POLL` | Allows to delete a poll | ✔ | ✔ | |
| 673 | `CanGetPollVote` | `CAN_GET_POLL_VOTE` | Allows to get a poll vote | ✔ | | |
| 679 | `CanDeletePollVote` | `CAN_DELETE_POLL_VOTE` | Allows to delete a poll vote | ✔ | | |

#### Events — the complete set today

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 685 | `CanGetEvent` | `CAN_GET_EVENT` | Allows to get an event | ✔ | ✔ | |
| 691 | `CanCreateEvent` | `CAN_CREATE_EVENT` | Allows to create an event | ✔ | ✔ | |
| 697 | `CanUpdateEvent` | `CAN_UPDATE_EVENT` | Allows to update an event | ✔ | ✔ | |
| 703 | `CanDeleteEvent` | `CAN_DELETE_EVENT` | Allows to delete an event | ✔ | ✔ | |
| 709 | `CanGetImportedEvents` | `CAN_GET_IMPORTED_EVENTS` | Allows to get imported events | ✔ | | |

Four CRUD permissions plus the import one. There is **no** `CanPublishEvent`, no plural
`CanGetEvents`, and nothing cross-organisational — exactly the gap D4 fills. Note the
asymmetry with articles and pages, which *do* have a separate publish permission
(`CAN_PUBLISH_ARTICLE`, `CAN_PUBLISH_PAGE`), and the asymmetry with the singular/plural
pairs elsewhere (`CanGetArticle`/`CanGetArticles`): events have only the singular name
even though `CanGetEvent` is what the list view checks.

#### Consent

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 715 | `CanGetConsent` | `CAN_GET_CONSENT` | Allows to get a consent | | | |
| 721 | `CanCreateConsent` | `CAN_CREATE_CONSENT` | Allows to create a consent | ✔ | ✔ | |
| 727 | `CanUpdateConsent` | `CAN_UPDATE_CONSENT` | Allows to update a consent | ✔ | ✔ | |
| 733 | `CanDeleteConsent` | `CAN_DELETE_CONSENT` | Allows to delete a consent | ✔ | ✔ | |
| 739 | `CanGetUserConsent` | `CAN_GET_USER_CONSENT` | Allows to get a consent | | | |
| 745 | `CanCreateUserConsent` | `CAN_CREATE_USER_CONSENT` | Allows to create a consent | | | |
| 751 | `CanUpdateUserConsent` | `CAN_UPDATE_USER_CONSENT` | Allows to update a consent | | | |
| 757 | `CanDeleteUserConsent` | `CAN_DELETE_USER_CONSENT` | Allows to delete a consent | | | |

#### Subscription flows

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 766 | `CanGetSubscriptionFlows` | `CAN_GET_SUBSCRIPTION_FLOWS` | Allows to get subscription flows. | ✔ | ✔ | |
| 772 | `CanUpdateSubscriptionFlow` | `CAN_UPDATE_SUBSCRIPTION_FLOW` | Allows to update subscription flow. | ✔ | | |
| 778 | `CanCreateSubscriptionFlow` | `CAN_CREATE_SUBSCRIPTION_FLOW` | Allows to create a new subscription flow. | ✔ | | |
| 784 | `CanDeleteSubscriptionFlow` | `CAN_DELETE_SUBSCRIPTION_FLOW` | Allows to delete a subscription flow. | ✔ | | |

#### Preview

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 793 | `CanPreview` | `CAN_PREVIEW` | Allows to get a preview of articles, pages, comments etc. | ✔ | ✔ | |

#### Mail templates, mail logs, system mails

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 802 | `CanGetMailTemplates` | `CAN_GET_MAIL-TEMPLATES` ⚠ | Allows to get mail templates. | ✔ | ✔ | |
| 808 | `CanCreateMailTemplates` | `CAN_CREATE_MAIL-TEMPLATES` ⚠ | Allows to create mail templates. | ✔ | | |
| 814 | `CanUpdateMailTemplates` | `CAN_UPDATE_MAIL-TEMPLATES` ⚠ | Allows to update mail templates. | ✔ | | |
| 820 | `CanDeleteMailTemplates` | `CAN_DELETE_MAIL-TEMPLATES` ⚠ | Allows to delete mail templates. | ✔ | | |
| 826 | `CanSendTestMailTemplates` | `CAN_SEND_TEST_MAIL-TEMPLATES` ⚠ | Allows to send test mails from a mail template. | ✔ | | |
| 832 | `CanSendMailTemplates` | `CAN_SEND_MAIL-TEMPLATES` ⚠ | Allows to manually send a mail template to a user or an audience of subscribers. | ✔ | | |
| 839 | `CanGetMailLogs` | `CAN_GET_MAIL-LOGS` ⚠ | Allows to view sent mails and mail send jobs. | ✔ | ✔ | |
| 848 | `CanGetSystemMails` | `CAN_GET_SYSTEM_MAILS` | Allows to get system mail list. | ✔ | | |
| 854 | `CanUpdateSystemMails` | `CAN_UPDATE_SYSTEM_MAILS` | Allows user to edit and save a system mail. | ✔ | | |
| 860 | `CanTestSystemMails` | `CAN_TEST_SYSTEM_MAILS` | Allows user to test a system mail. | ✔ | | |

⚠ = these seven ids contain a **hyphen** (`MAIL-TEMPLATES`, `MAIL-LOGS`) where every other
id uses underscores. They are stored verbatim in `users.roles.permissionIDs`, so the typo
is load-bearing; it cannot be "cleaned up" without a data migration.

#### Periodic jobs

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 869 | `CanGetPeriodicJobLog` | `CAN_GET_PERIODIC_JOB_LOG` | Allows to get the periodic job log | ✔ | ✔ | |
| 875 | `CanRetryPeriodicJob` | `CAN_RETRY_PERIODIC_JOB` | Allows to retry a failed periodic job and catch up the runs up to today | ✔ | | |

#### Block styles, block templates, paywall

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 885 | `CanCreateBlockStyle` | `CAN_CREATE_BLOCK_STYLE` | Allows to create a block style | ✔ | | |
| 891 | `CanUpdateBlockStyle` | `CAN_UPDATE_BLOCK_STYLE` | Allows to update a block style | ✔ | | |
| 897 | `CanDeleteBlockStyle` | `CAN_DELETE_BLOCK_STYLE` | Allows to delete a block style | ✔ | | |
| 913 | `CanCreateBlockTemplate` | `CAN_CREATE_BLOCK_TEMPLATE` | Allows to create a block template | ✔ | ✔ | |
| 919 | `CanUpdateBlockTemplate` | `CAN_UPDATE_BLOCK_TEMPLATE` | Allows to update a block template | ✔ | ✔ | |
| 925 | `CanDeleteBlockTemplate` | `CAN_DELETE_BLOCK_TEMPLATE` | Allows to delete a block template | ✔ | ✔ | |
| 934 | `CanCreatePaywall` | `CAN_CREATE_PAYWALL` | Allows to create a paywall | ✔ | | |
| 940 | `CanUpdatePaywall` | `CAN_UPDATE_PAYWALL` | Allows to update a paywall | ✔ | | |
| 946 | `CanDeletePaywall` | `CAN_DELETE_PAYWALL` | Allows to delete a paywall | ✔ | | |

#### Audience statistics

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 903 | `CanGetAudienceStats` | `CAN_GET_AUDIENCE_STATS` | Allows reading statistics about the audience. | ✔ | | |

#### Integration settings (one quartet per provider family)

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 955 | `CanGetAISettings` | `CAN_GET_AI_SETTINGS` | Allows to get AI provider settings | ✔ | | |
| 961 | `CanCreateAISettings` | `CAN_CREATE_AI_SETTINGS` | Allows to create AI provider settings | ✔ | | |
| 967 | `CanUpdateAISettings` | `CAN_UPDATE_AI_SETTINGS` | Allows to update AI provider settings | ✔ | | |
| 973 | `CanDeleteAISettings` | `CAN_DELETE_AI_SETTINGS` | Allows to delete AI provider settings | ✔ | | |
| 982 | `CanCreateExternalApp` | `CAN_CREATE_EXTERNAL_APP` | Allows to create external app | ✔ | | |
| 988 | `CanUpdateExternalApp` | `CAN_UPDATE_EXTERNAL_APP` | Allows to update external app | ✔ | | |
| 994 | `CanDeleteExternalApp` | `CAN_DELETE_EXTERNAL_APP` | Allows to delete external app | ✔ | | |
| 1003 | `CanGetChallengeProviderSettings` | `CAN_GET_CHALLENGE_PROVIDER_SETTINGS` | Allows to get challenge provider settings | ✔ | | |
| 1009 | `CanCreateChallengeProviderSettings` | `CAN_CREATE_CHALLENGE_PROVIDER_SETTINGS` | Allows to create challenge provider settings | ✔ | | |
| 1015 | `CanUpdateChallengeProviderSettings` | `CAN_UPDATE_CHALLENGE_PROVIDER_SETTINGS` | Allows to update challenge provider settings | ✔ | | |
| 1021 | `CanDeleteChallengeProviderSettings` | `CAN_DELETE_CHALLENGE_PROVIDER_SETTINGS` | Allows to delete challenge provider settings | ✔ | | |
| 1030 | `CanGetPaymentProviderSettings` | `CAN_GET_PAYMENT_PROVIDER_SETTINGS` | Allows to get payment provider settings | ✔ | | |
| 1036 | `CanCreatePaymentProviderSettings` | `CAN_CREATE_PAYMENT_PROVIDER_SETTINGS` | Allows to create payment provider settings | ✔ | | |
| 1042 | `CanUpdatePaymentProviderSettings` | `CAN_UPDATE_PAYMENT_PROVIDER_SETTINGS` | Allows to update payment provider settings | ✔ | | |
| 1048 | `CanDeletePaymentProviderSettings` | `CAN_DELETE_PAYMENT_PROVIDER_SETTINGS` | Allows to delete payment provider settings | ✔ | | |
| 1054 | `CanReloadProviders` | `CAN_RELOAD_PROVIDERS` | Allows to apply integration changes to the running API without a restart | ✔ | | |
| 1064 | `CanGetTrackingPixelSettings` | `CAN_GET_TRACKING_PIXEL_SETTINGS` | Allows to get tracking pixel settings | ✔ | | |
| 1070 | `CanCreateTrackingPixelSettings` | `CAN_CREATE_TRACKING_PIXEL_SETTINGS` | Allows to create tracking pixel settings | ✔ | | |
| 1076 | `CanUpdateTrackingPixelSettings` | `CAN_UPDATE_TRACKING_PIXEL_SETTINGS` | Allows to update tracking pixel settings | ✔ | | |
| 1082 | `CanDeleteTrackingPixelSettings` | `CAN_DELETE_TRACKING_PIXEL_SETTINGS` | Allows to delete tracking pixel settings | ✔ | | |
| 1091 | `CanGetMailProviderSettings` | `CAN_GET_MAIL_PROVIDER_SETTINGS` | Allows to get mail provider settings | ✔ | | |
| 1097 | `CanCreateMailProviderSettings` | `CAN_CREATE_MAIL_PROVIDER_SETTINGS` | Allows to create mail provider settings | ✔ | | |
| 1103 | `CanUpdateMailProviderSettings` | `CAN_UPDATE_MAIL_PROVIDER_SETTINGS` | Allows to update mail provider settings | ✔ | | |
| 1109 | `CanDeleteMailProviderSettings` | `CAN_DELETE_MAIL_PROVIDER_SETTINGS` | Allows to delete mail provider settings | ✔ | | |
| 1118 | `CanGetAnalyticsProviderSettings` | `CAN_GET_ANALYTICS_PROVIDER_SETTINGS` | Allows to get analytics provider settings | ✔ | | |
| 1124 | `CanCreateAnalyticsProviderSettings` | `CAN_CREATE_ANALYTICS_PROVIDER_SETTINGS` | Allows to create analytics provider settings | ✔ | | |
| 1130 | `CanUpdateAnalyticsProviderSettings` | `CAN_UPDATE_ANALYTICS_PROVIDER_SETTINGS` | Allows to update analytics provider settings | ✔ | | |
| 1136 | `CanDeleteAnalyticsProviderSettings` | `CAN_DELETE_ANALYTICS_PROVIDER_SETTINGS` | Allows to delete analytics provider settings | ✔ | | |

#### Mailchimp sync

| Line | Constant | `id` | Description | A | E | P |
| --- | --- | --- | --- | --- | --- | --- |
| 1154 | `CanGetMailchimpSyncSettings` | `CAN_GET_MAILCHIMP_SYNC_SETTINGS` | Allows to get mailchimp sync settings | ✔ | | |
| 1160 | `CanUpdateMailchimpSyncSettings` | `CAN_UPDATE_MAILCHIMP_SYNC_SETTINGS` | Allows to update mailchimp sync settings | ✔ | | |
| 1166 | `CanDeleteMailchimpSyncSettings` | `CAN_DELETE_MAILCHIMP_SYNC_SETTINGS` | Allows to delete mailchimp sync settings | ✔ | | |
| 1172 | `CanRunMailchimpSync` | `CAN_RUN_MAILCHIMP_SYNC` | Allows to manually trigger a mailchimp sync | ✔ | | |

### 2.3 Known defects in the catalogue

These are facts about the current file, verified by parsing it, and they constrain how a
new permission should be added.

| # | Defect | Evidence | Consequence |
| --- | --- | --- | --- |
| 1 | **Duplicate id.** `CanCancelSubscription` (line 529) carries `id: 'CAN_DELETE_SUBSCRIPTION'`, identical to `CanDeleteSubscription` (line 523), with the same description. | `permissions.ts:523-533` | Two constants, one authority. Holding "delete subscription" also grants "cancel subscription". |
| 2 | **8 constants are in no array.** `CanCancelSubscription`, `CanGetConsent`, `CanGetUserConsent`, `CanCreateUserConsent`, `CanUpdateUserConsent`, `CanDeleteUserConsent`, `CanGetSharedArticle`, `CanGetSharedArticles`. | set difference between the 188 constants and `AllPermissions` | They never appear in the `permissions` GraphQL query, so the editor's role picker cannot offer them, and `UserRoleResolver.permissions` cannot resolve them for a custom role (it filters `AllPermissions`). |
| 3 | **`PeerPermissions` is not a subset of `AllPermissions`.** `CanGetSharedArticle` / `CanGetSharedArticles` are in `PeerPermissions` only. | `permissions.ts:1447-1451` vs `1193-1374` | The `peer` system role works (the resolver returns `PeerPermissions` verbatim for `id === 'peer'`), but those two ids are invisible everywhere else. |
| 4 | **3 duplicate entries inside `EditorPermissions`.** `CanGetComments`, `CanUpdateComments`, `CanCreateEvent` each appear twice. | `permissions.ts:1376-1445` | Harmless (68 entries, 65 unique) but it means a count of the array is not a count of the role's permissions. |
| 5 | **7 ids contain a hyphen** where everything else uses an underscore. | `CAN_GET_MAIL-TEMPLATES` etc. | Cosmetic, but permanent: the ids are stored in the database. |
| 6 | **`deprecated` is never `true`.** | 0 matches for `deprecated: true` | The deprecation path in `hasPermission` is untested in practice. |

---

## 3. Evaluation: `hasPermission` and the guard

### 3.1 `hasPermission`

`libs/permissions/api/src/lib/has-permission.ts` in full:

```ts
export function hasPermission<
  PermissionsUserRole extends Pick<UserRole, 'id' | 'permissionIDs'>,
>(
  neededPermissions: Permission | Permission[],
  userRoles: PermissionsUserRole[]
): boolean {
  const perms =
    Array.isArray(neededPermissions) ? neededPermissions : [neededPermissions];

  const hasPerms = perms.map(perm => {
    if (perm.deprecated) {
      console.warn('Permission is deprecated', perm);
    }

    const userPermissions = userRoles.flatMap(role => {
      return role.permissionIDs;
    });

    return userPermissions.some(permission => permission === perm.id);
  });

  return hasPerms.every(Boolean);
}
```

Three semantics worth stating explicitly:

1. **Multiple permissions AND.** `.every(Boolean)` — `hasPermission([A, B], roles)` requires
   both. That is what `@Permissions(CanGetUserRoles, CanGetUserRole)`
   (`libs/user/api/src/lib/user-role.resolver.ts:38`) means: *both*, not *either*.
2. **Multiple roles union.** The ids of all the user's roles are flattened, so a user with
   two roles has the union of their permissions. Pinned by
   `has-permission.spec.ts:42-79`.
3. **An empty needed list returns `true`.** `[].every(Boolean) === true`. The guard
   short-circuits that case before calling (see below), but direct callers do not.

### 3.2 `PermissionsGuard`

`libs/permissions/api/src/lib/permission.guard.ts`:

```ts
public canActivate(context: ExecutionContext): boolean {
  const ctx = GqlExecutionContext.create(context);

  const permissions = this.reflector.getAllAndMerge<Permission[]>(
    PERMISSIONS_METADATA_KEY,
    [context.getHandler(), context.getClass()]
  );

  if (!permissions.length) {
    return false;          // no metadata → deny (OneOf may still pass via another guard)
  }

  const request = ctx.getContext().req;
  const session = request.user;

  if (!session) {
    return false;          // anonymous → deny
  }

  return hasPermission(permissions, session.roles);
}
```

`getAllAndMerge` **merges handler-level and class-level metadata**, so a class-level
`@Permissions(A)` plus a method-level `@Permissions(B)` requires A *and* B. The guard
returns `false` rather than throwing, which matters because `OneOfGuard` only swallows
`UnauthorizedException`.

Pinned by `libs/permissions/api/src/lib/permission.guard.spec.ts` (4 cases: no metadata,
has permission, no session, wrong permission).

### 3.3 The `@Permissions` decorator

`libs/permissions/api/src/lib/permission.decorator.ts`:

```ts
export const PERMISSIONS_METADATA_KEY = 'permissions';

export const Permissions = (...permissions: Permission[]) =>
  applyDecorators(
    AddMetadata(PERMISSIONS_METADATA_KEY, permissions),
    OneOf(PermissionsGuard)
  );
```

`AddMetadata` (`libs/nest-modules/src/lib/add-metadata.decorator.ts`) *appends* with `uniq`
instead of overwriting, so stacking `@Permissions(A)` and `@Permissions(B)` on the same
method accumulates to `[A, B]`.

`OneOf` registers the guard in the `one_of` metadata list. **Every guard in that list is
ORed.** The complete list of `OneOf`-registered guards in the repo:

| Decorator | Guard | File |
| --- | --- | --- |
| `@Public()` | `PublicGuard` | `libs/authentication/api/src/lib/public.decorator.ts` |
| `@Authenticated()` | `AuthenticatedGuard` | `libs/authentication/api/src/lib/authenticated.decorator.ts` |
| `@Permissions(...)` | `PermissionsGuard` | `libs/permissions/api/src/lib/permission.decorator.ts` |
| `@Settings(...)` | `SettingsGuard` | `libs/settings/api/src/lib/settings.decorator.ts` |
| `@ScopedJwt(scope)` | `ScopedJwtGuard` | `libs/authentication/api/src/lib/scoped-jwt.decorator.ts` |

and the one deliberate exception, which ANDs:

| `@Feature('key')` | `FeatureGuard` via plain `UseGuards` | `libs/features/api/src/lib/feature.decorator.ts:13-17` |

The `@Feature` docblock spells out why:

> *"Unlike `@Permissions` or `@Authenticated` this does NOT use `OneOf`: the feature is
> required in addition to whatever else guards the call."*

Combining `@Public()` with `@Permissions(X)` on the same handler therefore makes the
handler **public** — `PublicGuard` returns `true` and the OR is satisfied. This is also
recorded in `.claude/docs/gotchas.md:596-615`.

### 3.4 Where the session and its roles come from

`libs/authentication/api/src/lib/authentication.service.ts:50-112`:

```ts
private async loadUserSession(token: string): Promise<AuthSession | null> {
  const session = await this.prisma.session.findFirst({ where: { token }, include: { user: … } });

  if (session && session.user) {
    return {
      type: AuthSessionType.User,
      id: session.id,
      …
      roles: (
        await this.prisma.userRole.findMany({
          where: { id: { in: session.user.roleIDs } },
        })
      ).map(addPredefinedPermissions),          // ← the expansion happens here
    };
  }
  return null;
}
```

`loadPeerSession` (lines 86-112) does the same for `Token.roleIDs`.

Sessions are **cached** in the KV TTL cache for 300 s
(`libs/authentication/api/src/lib/session-cache.ts:8-12`); `SessionCacheInvalidator.invalidate()`
resets the whole `auth:sessions` namespace and is called on `updateUserRole` and
`deleteUserRole` (`libs/user/api/src/lib/user-role.service.ts:81,102`) and on token
deletion. **It is not called on `createUserRole`** (`user-role.service.ts:86-94`) — creating
a role grants nobody anything, so there is nothing to invalidate.

The session type (`libs/authentication/api/src/lib/auth-session.ts`):

```ts
export type UserSession = {
  type: AuthSessionType.User;
  id: string;
  user: User;
  roles: UserRole[];      // Prisma UserRole, permissionIDs already expanded
  createdAt: Date;
  expiresAt: Date;
  token: string;
  impersonatedBy?: string | null;
};
```

Note that the session carries `roles: UserRole[]` — the whole role rows — but **not** any
record of what the user owns, belongs to, or may act on. There is no place in this type
to hang an organisation.

---

## 4. Roles

### 4.1 The Prisma model

`libs/api/prisma/schema.prisma:1234-1245`:

```prisma
model UserRole {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt DateTime @updatedAt @db.Timestamptz(3)

  description   String?
  name          String   @unique
  permissionIDs String[]
  systemRole    Boolean

  @@map("users.roles")
}
```

Created by the initial migration (`libs/api/prisma/migrations/20220812113731_init/migration.sql:492-502`,
unique index on `name` at line 658); the id default was switched to `gen_random_uuid()` in
`20260717103244_cuid_to_guid/migration.sql:113`.

Facts that matter:

- `id` is a free-form `String`. The default is a uuid, but the three system roles are
  inserted with the **literal ids** `'admin'`, `'editor'`, `'peer'`, and code switches on
  those strings.
- `name` is unique; `id` is the primary key. Two roles cannot share a name.
- There is **no relation** from `UserRole` to `User`. Membership lives in
  `User.roleIDs String[]` (`schema.prisma:1202`) and `Token.roleIDs String[]`
  (`schema.prisma:1035`) — plain string arrays with no foreign key, so deleting a role
  leaves dangling ids in every user that had it.
- `systemRole: Boolean` is not enforced anywhere in the API: `deleteUserRole`
  (`user-role.service.ts:96-105`) and `updateUserRole` (lines 72-84) will happily act on a
  system role. The protection is **editor-side only** — the delete button is `disabled`
  when `rowData.systemRole` (`apps/editor/src/app/routes/userRoles/userRoleList.tsx:181`)
  and the edit form sets `isDisabled` when `systemRole` is true
  (`libs/ui/editor/src/lib/panel/userRoleEditPanel.tsx:122`).
- `createUserRole` hard-codes `systemRole: false` (`user-role.service.ts:91`), so a system
  role can never be created through the API.

### 4.2 How the three default roles are created

**One place only: `libs/api/prisma/seed.ts:274-315`.** No migration inserts a role; no
boot-time hook does. Verified by grepping every `.sql` under
`libs/api/prisma/migrations` (the only hits for `users.roles` are the DDL in the init
migration and the uuid-default change) and by grepping the whole tree for
`userRole.upsert` / `userRole.create` (three hits in `seed.ts`, one in
`user-role.service.ts`).

```ts
const seedRoles = (prisma: PrismaClient) =>
  [
    prisma.userRole.upsert({
      where:  { id: 'admin' },
      update: {},
      create: {
        id: 'admin',
        systemRole: true,
        name: 'Admin',
        description: 'Administrator Role',
        permissionIDs: [],          // ← empty!
      },
    }),
    prisma.userRole.upsert({
      where:  { id: 'editor' },
      update: {},
      create: { id: 'editor', systemRole: true, name: 'Editor', description: 'Editor Role', permissionIDs: [] },
    }),
    prisma.userRole.upsert({
      where:  { id: 'peer' },
      update: {},
      create: { id: 'peer', systemRole: true, name: 'Peer', description: 'Peer Role', permissionIDs: [] },
    }),
  ] as const;

export async function seed(prisma: PrismaClient) {
  const result = await prisma.$transaction([
    ...seedRoles(prisma),
    ...seedSettings(prisma),
  ] as const);

  await seedProviders(prisma);

  return result;
}
```

Three things follow:

1. `update: {}` makes this a **pure insert-if-absent**. Re-running the seed never touches
   an existing role row — it will not repair a role whose permissions were edited.
2. The rows are stored with `permissionIDs: []`. **The database never holds the system
   roles' permissions.** They exist only in TypeScript.
3. `seed()` returns the transaction result array, and callers destructure it positionally:
   `const [adminUserRole, editorUserRole] = await rootSeed(prisma)`
   (`libs/api/prisma/run-seed.ts:34`, `apps/api-example/prisma/seed.ts:1928`). **The order of
   `seedRoles` is load-bearing** — inserting a new role before `admin` would silently give
   the bootstrapped admin user the wrong role.

### 4.3 How the permissions get attached: `addPredefinedPermissions`

`libs/permissions/api/src/lib/predefined-permissions.ts` in full:

```ts
export const addPredefinedPermissions = <
  PermissionsUserRole extends Pick<UserRole, 'id' | 'permissionIDs'>,
>(
  role: PermissionsUserRole
) => {
  let permissionIDs = role.permissionIDs;

  switch (role.id) {
    case 'admin':  permissionIDs = [...role.permissionIDs, ...AllPermissions.map(p => p.id)];    break;
    case 'editor': permissionIDs = [...role.permissionIDs, ...EditorPermissions.map(p => p.id)]; break;
    case 'peer':   permissionIDs = [...role.permissionIDs, ...PeerPermissions.map(p => p.id)];   break;
  }

  return { ...role, permissionIDs };
};
```

Called in exactly two places:

| Caller | File:line | Purpose |
| --- | --- | --- |
| `AuthenticationService.loadUserSession` / `loadPeerSession` | `libs/authentication/api/src/lib/authentication.service.ts:79,107` | Every authenticated request |
| `ExternalAppsUserinfoController.getUserinfo` | `libs/external-apps/api/src/lib/external-apps-userinfo.controller.ts:72` | The OIDC-ish `/external-apps/userinfo` endpoint (de-duplicates with `[...new Set(...)]`) |

Note it **appends** rather than replaces, so a system role that *did* have stored
permissionIDs would keep them and gain the predefined set on top.

### 4.4 The three predefined roles, exactly

| Role | `id` | `name` | `description` | `systemRole` | Stored `permissionIDs` | Effective permissions |
| --- | --- | --- | --- | --- | --- | --- |
| Admin | `admin` | `Admin` | `Administrator Role` | `true` | `[]` | all 180 of `AllPermissions` |
| Editor | `editor` | `Editor` | `Editor Role` | `true` | `[]` | the 65 unique of `EditorPermissions` |
| Peer | `peer` | `Peer` | `Peer Role` | `true` | `[]` | the 3 of `PeerPermissions` |

**`editor` — the 65 unique permissions, in declaration order of the array**
(`permissions.ts:1376-1445`):

`CanGetCrowdfunding`, `CanGetCrowdfundings`, `CanCreateCrowdfunding`,
`CanUpdateCrowdfunding`, `CanDeleteCrowdfunding`, `CanGetComments`, `CanUpdateComments`,
`CanTakeActionOnComment`, `CanCreateAuthor`, `CanGetAuthor`, `CanGetAuthors`,
`CanGetBanner`, `CanGetBanners`, `CanCreateBanner`, `CanUpdateBanner`, `CanDeleteBanner`,
`CanCreateImage`, `CanGetImage`, `CanGetImages`, `CanCreateDocument`, `CanGetDocument`,
`CanGetDocuments`, `CanDeleteDocument`, `CanCreateArticle`, `CanGetArticle`,
`CanGetArticles`, `CanPublishArticle`, `CanCreatePage`, `CanGetPage`, `CanGetPages`,
`CanPublishPage`, `CanGetPeer`, `CanGetPeers`, `CanGetPeerProfile`, **`CanLoginEditor`**,
`CanDeleteComments`, `CanCreateCommentRatingSystem`, `CanUpdateCommentRatingSystem`,
`CanDeleteCommentRatingSystem`, `CanCreateTag`, `CanUpdateTag`, `CanGetTags`,
`CanDeleteTag`, `CanGetPoll`, `CanUpdatePoll`, `CanDeletePoll`, `CanCreatePoll`,
**`CanGetEvent`**, **`CanUpdateEvent`**, **`CanDeleteEvent`**, **`CanCreateEvent`**,
`CanCreateConsent`, `CanUpdateConsent`, `CanDeleteConsent`, `CanGetSubscriptionFlows`,
`CanGetMailTemplates`, `CanGetMailLogs`, `CanGetPeriodicJobLog`, `CanCreateApprovedComment`,
`CanCreateBlockTemplate`, `CanUpdateBlockTemplate`, `CanDeleteBlockTemplate`,
**`CanPreview`**, `CanGetWebsiteSettings`, `CanUpdateWebsiteSettings`.

Notably **absent** from `editor`: every `Delete*` on content (`CanDeleteArticle`,
`CanDeletePage`, `CanDeleteImage`, `CanDeleteAuthor`), all user/role administration, all
membership and payment permissions, all integration settings, `CanGetSettings`,
`CanGetAuditLogs`, `CanGetImportedEvents`.

**`peer` — all 3** (`permissions.ts:1447-1451`): `CanGetPeerProfile`, `CanGetSharedArticle`,
`CanGetSharedArticles`.

**`admin` — all 180 of `AllPermissions`.** Since `AllPermissions` is the set the
`permissions` query returns, "admin" means "every assignable permission". A new permission
added to `AllPermissions` is granted to every admin on every installation **immediately on
deploy**, with no data change — that is the mechanism `.claude/docs/gotchas.md:602-605`
warns about when discussing `@Feature`.

### 4.5 Where role ids are hard-coded

| File:line | Code | Note |
| --- | --- | --- |
| `libs/permissions/api/src/lib/predefined-permissions.ts:16,23,30` | `case 'admin' / 'editor' / 'peer'` | the permission expansion |
| `libs/user/api/src/lib/user-role.resolver.ts:83,85,87` | same three cases | the GraphQL `UserRole.permissions` field |
| `libs/api/prisma/seed.ts:278,282,291,295,304,308` | `id: 'admin'` etc. | the seed |
| `libs/api/prisma/run-seed.ts:41,64` | `const id = 'admin'` | the bootstrapped **user** (not role) also has id `admin` |
| `libs/consent/api/src/lib/user-consent/user-consent.resolver.ts:68` | `!user.user.roleIDs.includes('admin')` | **a role-id check used as authorisation**, not a permission |
| `libs/consent/api/src/lib/user-consent/user-consent.service.ts:70,95` | same | ditto, twice more |
| `libs/ui/editor/src/lib/testUtils.ts:17-22` | the `sessionWithPermissions` fixture | test only |

The three `user-consent` sites are the only place in the API where a **role id** rather
than a permission decides access. They are also the closest existing thing to an
ownership check — see §7.

### 4.6 The role CRUD API

`libs/user/api/src/lib/user-role.resolver.ts`:

| Operation | Guard | Notes |
| --- | --- | --- |
| `userRoles(filter, …)` | `@Permissions(CanGetUserRoles, CanGetUserRole)` — **both** | paginated, name `contains` filter, `getMaxTake` cap |
| `userRole(id)` | `@Permissions(CanGetUserRoles, CanGetUserRole)` | 404s via `NotFoundException` |
| `createUserRole(name, description, permissionIDs)` | `@Permissions(CanCreateUserRole)` | forces `systemRole: false` |
| `updateUserRole(id, …)` | `@Permissions(CanCreateUserRole)` ⚠ *create*, not an update permission | invalidates the session cache |
| `deleteUserRole(id)` | `@Permissions(CanDeleteUserRole)` | invalidates the session cache |

And the field that makes the predefined roles visible:

```ts
// libs/user/api/src/lib/user-role.resolver.ts:80-94
@ResolveField(() => [Permission])
async permissions(@Parent() { id, permissionIDs }: PUserRole) {
  switch (id) {
    case 'admin':  return AllPermissions;
    case 'editor': return EditorPermissions;
    case 'peer':   return PeerPermissions;
    default:
      return AllPermissions.filter(permission => permissionIDs.includes(permission.id));
  }
}
```

For a custom role this **filters `AllPermissions`**, so a stored id that is not in
`AllPermissions` (see defect 2 in §2.3) silently vanishes from the GraphQL response even
though the guard would still honour it.

The permission catalogue itself is served by
`libs/permissions/api/src/lib/permission.resolver.ts`:

```ts
@Permissions(CanGetPermissions)
@Query(() => [Permission], { description: 'Returns a list of all permissions.' })
async permissions() {
  return AllPermissions;
}
```

Module wiring: `libs/permissions/api/src/lib/permission.module.ts` provides
`PermissionsGuard` and `PermissionResolver`, exports `PermissionsGuard`.

---

## 5. The editor side

### 5.1 The four helpers (these are the real names)

All in `libs/ui/editor/src/lib/atoms/permissionControl.tsx`:

| Helper | Line | Signature | Semantics |
| --- | --- | --- | --- |
| `useHasPermission` | 36 | `(qualifyingPermissions: string[]) => boolean` | **OR** — `.some()` over the permissions. **Returns `true` when `roles` is falsy.** |
| `PermissionControl` | 54 | `({children, qualifyingPermissions, showRejectionMessage})` | Renders `children` if authorised, otherwise `null` or a `RejectionMessage` alert |
| `createCheckedPermissionComponent` | 70 | `(permissions: string[], showRejectionMessage = true) => (Component) => WrappedComponent` | HOC used to gate a whole route view; defaults to **showing** the rejection alert |
| `useAuthorisation` | 84 | `(permissionID: string) => boolean \| undefined` | single permission; returns `undefined` when there is no session or no roles |

```tsx
export function useHasPermission(qualifyingPermissions: string[]): boolean {
  const roles = useContext(AuthContext)?.session?.sessionRoles;

  return useMemo(() => {
    if (!roles) {
      return true;              // ← fail-open while the session is loading
    }

    return qualifyingPermissions.some(qualifyingPermission =>
      roles.some(role =>
        role.permissions.some(userPermission => userPermission.id === qualifyingPermission)
      )
    );
  }, [qualifyingPermissions, roles]);
}
```

```tsx
export function useAuthorisation(permissionID: string) {
  return useContext(AuthContext)?.session?.sessionRoles?.some(role =>
    role.permissions.some(permission => permission.id === permissionID)
  );
}
```

Two traps, both load-bearing:

- **`useHasPermission` fails open** (`true` while roles are loading) — recorded in
  `.claude/docs/gotchas.md:607-609`. A `PermissionControl` therefore briefly shows its
  children to everyone on first paint.
- **`useAuthorisation` fails closed-ish but returns `undefined`**, so `!useAuthorisation(X)`
  is `true` while loading. Negating either hook inverts its failure mode. This matters
  directly for D5: a "Ready for review" button rendered on `!canPublish` will flash for
  users who *can* publish.

The editor's OR semantics are the mirror image of the API's AND semantics
(§3.1): `<PermissionControl qualifyingPermissions={[A, B]}>` shows the child if the user has
**either**; `@Permissions(A, B)` on the resolver requires **both**.

### 5.2 Where the roles come from in the browser

`libs/ui/editor/src/lib/authContext.tsx`:

```tsx
export interface AuthContextState {
  session?: {
    email: string;
    sessionToken: string;
    sessionRoles?: FullUserRoleFragment[];
  } | null;
}
```

`AuthProvider` (line 74) runs the `Me` query (`libs/editor/api/src/lib/schemas/user.graphql:128`
→ `FullUser` → `roles { ...FullUserRole }` → `permissions { ...FullPermission }`) and
dispatches a `Login` action with `sessionRoles: roles`. It re-runs on page visibility
change and logs out on failure. The permission objects therefore come from
`UserRoleResolver.permissions` (§4.6), which is why an admin's browser sees all 180 even
though the database row has none.

The fragments (`libs/editor/api/src/lib/schemas/userRole.graphql:1-9` and
`permissions.graphql:1-10`):

```graphql
fragment FullUserRole on UserRole {
  id
  name
  description
  systemRole
  permissions { ...FullPermission }
}

fragment FullPermission on Permission {
  id
  description
  deprecated
}
```

### 5.3 Typical usage

Route-level gating — every list/edit view ends with the HOC:

```tsx
// apps/editor/src/app/routes/events/eventListView.tsx:223-230
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetEvent.id,
  CanCreateEvent.id,
  CanUpdateEvent.id,
  CanDeleteEvent.id,
])(EventListView);

export { CheckedPermissionComponent as EventListView };
```

Routes themselves are **not** gated in `apps/editor/src/app/app.tsx` — `path="events"` just
renders `<Base><EventListView /></Base>` (`app.tsx:541-568`). The HOC inside the view is
the gate, and it renders the `RejectionMessage` alert rather than redirecting.

Navigation gating — `apps/editor/src/app/base.tsx` wraps menu groups and items:

```tsx
// apps/editor/src/app/base.tsx:808-867
<PermissionControl qualifyingPermissions={[CanGetEvent.id, CanGetCommentRatingSystem.id]}>
  <SidebarNavMenu title={t('navbar.events')} icon={<MdEvent />} …>
    <PermissionControl qualifyingPermissions={[CanGetEvent.id, CanUpdateEvent.id, CanDeleteEvent.id]}>
      <SidebarNavItem href="/events" icon={<MdEvent />}>{t('navbar.events')}</SidebarNavItem>
    </PermissionControl>
    …
    <PermissionControl qualifyingPermissions={[CanGetTags.id, CanCreateTag.id, CanUpdateTag.id, CanDeleteTag.id]}>
      <SidebarNavItem href="/events/tags" icon={<MdSell />}>{t('navbar.eventTags')}</SidebarNavItem>
    </PermissionControl>
  </SidebarNavMenu>
</PermissionControl>
```

Action gating — the publish button on an article:

```tsx
// apps/editor/src/app/routes/articles/articleEditor.tsx:925-928
<PermissionControl qualifyingPermissions={[CanPublishArticle.id]}>
  <Badge …>
    <EditorHeaderButton … label={t('articleEditor.overview.publish')} … />
```

Field gating — `useAuthorisation` feeding a `disabled` prop, e.g.
`libs/ui/editor/src/lib/panel/articleMetadataPanel.tsx:203` (`const isAuthorized =
useAuthorisation(CanCreateArticle.id)` then `disabled={!isAuthorized}` on ~10 fields).

### 5.4 The role-editing UI

Two files:

**`apps/editor/src/app/routes/userRoles/userRoleList.tsx`** — route `/userroles`,
`/userroles/create`, `/userroles/edit/:id`. A `DataTable` with name, description and a
delete icon. The whole view is wrapped in
`createCheckedPermissionComponent([CanGetUserRoles.id, CanGetUserRole.id, CanCreateUserRole.id, CanDeleteUserRole.id])`
(line 276). The "New User Role" button is inside
`<PermissionControl qualifyingPermissions={[CanCreateUserRole.id]}>` (line 108); the delete
icon inside `[CanDeleteUserRole.id]` (line 176) and `disabled={rowData.systemRole}`
(line 181). The list fetches `take: 200` (line 83).

**`libs/ui/editor/src/lib/panel/userRoleEditPanel.tsx`** — the drawer form. Fields: `name`
(required), `description`, and a MUI `Autocomplete multiple` over the permission list:

```tsx
// userRoleEditPanel.tsx:108-114
const { data: permissionData, … } = useQuery(PermissionListDocument, {});
const allPermissions = permissionData?.permissions ?? [];
…
// 248-271
<Autocomplete
  multiple
  disabled={isDisabled || systemRole}
  options={allPermissions}
  value={field.value}
  getOptionLabel={permission => permission.description}     // ← the raw English description
  isOptionEqualToValue={(option, selected) => option.id === selected.id}
  onChange={(_event, selected) => field.onChange(selected)}
  renderInput={params => <TextField {...params} label={t('userRoles.panels.permissions')} />}
/>
```

Three observations:

1. The picker's options are `permissions` → `AllPermissions`. **A permission not in
   `AllPermissions` is unassignable through the editor.**
2. The option label is `permission.description` — the raw English string from
   `permissions.ts`. Permission descriptions are **not translated**; the only
   permission-related i18n keys are `permissions.noAccess` and `permissions.contactAdmin`
   (`apps/editor/src/app/locales/en.json:1893-1896`) and the `userRoles.*` panel labels
   (lines 2367-2388). A new permission's description is therefore user-visible English in
   every locale.
3. When `systemRole` is true the whole form is disabled and a `t('userRoles.panels.systemRole')`
   note is shown (*"is a system role and cannot be edited"*). So the `admin`/`editor`/`peer`
   permission sets are **read-only in the UI** and only changeable by editing
   `permissions.ts`.

**Assigning a role to a user**: `apps/editor/src/app/routes/users/userEditView.tsx` —
queries `UserRoleListDocument` with `take: 200` (lines 178-184), renders a multi
`Autocomplete` over role ids (lines 949-972), and submits `roleIDs: roles.map(role => role.id)`
(lines 328, 400).

---

## 6. `CanLoginEditor` and `CanPreview`

### 6.1 "Login to the editor" — `CAN_LOGIN_EDITOR`

```ts
// libs/permissions/src/lib/permissions.ts:499-503
export const CanLoginEditor: Permission = {
  id: 'CAN_LOGIN_EDITOR',
  description: 'Allows to login editor',
  deprecated: false,
};
```

It is in `AllPermissions` and in `EditorPermissions`; **not** in `PeerPermissions`.

**It is enforced client-side.** `createSession` succeeds regardless; the editor then
inspects the returned roles and refuses to store the token:

```tsx
// apps/editor/src/app/login.tsx:131-156
const permissions = userRoles.reduce((permissions, userRole) => {
  return [...permissions, ...userRole.permissions.map(permission => permission.id)];
}, [] as string[]);

if (!permissions.includes(CanLoginEditor.id)) {
  enqueueSnackbar(t('login.unauthorized'), { variant: 'error', autoHideDuration: null });
  return;
}

localStorage.setItem(LocalStorageKey.SessionToken, sessionToken);
authDispatch({ type: AuthDispatchActionType.Login, payload: { email, sessionToken, sessionRoles: userRoles } });
```

The same check guards the impersonation entry point
(`apps/editor/src/app/loginImpersonate.tsx:52-59`).

Server-side it guards exactly **two** resolvers, both of which exist only to serve the
editor chrome:

| Resolver | File:line |
| --- | --- |
| `oneChannelStatus` | `libs/one/api/src/lib/one-channel-status.resolver.ts:21` |
| `versionInformation` | `libs/versionInformation/api/src/lib/versionInformation.resolver.ts:20` |

So `CanLoginEditor` is best read as "this role is an editor-UI role" rather than as a
security boundary: a user without it who holds, say, `CanUpdateEvent` can still call
`updateEvent` with their session token directly. The real boundary is the per-operation
permission.

Note `apps/editor/src/app/locales/en.json:1217` — `login.unauthorized: "User is not
authorized for login"`.

### 6.2 "See previews" — `CAN_PREVIEW`

```ts
// libs/permissions/src/lib/permissions.ts:793-797
export const CanPreview: Permission = {
  id: 'CAN_PREVIEW',
  description: 'Allows to get a preview of articles, pages, comments etc.',
  deprecated: false,
};
```

In `AllPermissions` and `EditorPermissions`.

Unlike every other permission, it is **not** consumed by `@Permissions`. It drives a
**param decorator** that turns a request header into a boolean:

```ts
// libs/permissions/api/src/lib/preview-mode.decorator.ts
export const PreviewMode = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;

    const canPreview = hasPermission(CanPreview, user?.roles ?? []);

    return canPreview && !!ctx.getContext().req.headers.preview;
  }
);
```

Two conditions: you hold `CanPreview` **and** the request carries a non-empty `preview`
header. The header is set by an Apollo link on the website
(`libs/website/admin/src/lib/preview-link.ts:5-19`):

```ts
export const previewLink = new ApolloLink((operation, forward) => {
  const isPreview =
    !!Number(sessionStorage.getItem(PREVIEW_MODE_KEY)) ||
    new URLSearchParams(window.location.search).has('preview');

  operation.setContext((context: DefaultContext) => ({
    ...context,
    headers: { ...context.headers, preview: isPreview ? `preview` : '' },
  }));

  return forward(operation);
});
```

Consumers of `@PreviewMode()` — four, all on `@Public()` queries or field resolvers:

| Consumer | File:line | Effect when `false` |
| --- | --- | --- |
| `Query.articles` | `libs/article/api/src/lib/article.resolver.ts:113-131` | forces `filter.draft = undefined, pending = undefined, published = true` |
| `Article.latest` | `libs/article/api/src/lib/article.resolver.ts:234` | returns `published` instead of `draft ?? pending ?? published` |
| `Query.pages` | `libs/page/api/src/lib/page.resolver.ts:95-110` | same filter forcing |
| `Page.latest` | `libs/page/api/src/lib/page.resolver.ts:192-203` | same revision choice |

```ts
// libs/page/api/src/lib/page.resolver.ts:192-203
@ResolveField(() => PageRevision)
async latest(@Parent() parent: PPage, @PreviewMode() isPreview: boolean) {
  const { id: pageId } = parent;
  const { draft, pending, published } = await this.pageRevisionsDataloader.load(pageId);

  if (!isPreview) {
    return published;
  }

  return draft ?? pending ?? published;
}
```

That is the whole mechanism: **preview = "the `latest` field resolves to the draft instead
of the published revision, and unpublished rows stay in the list"**. Events have no
equivalent today because they have no revisions.

Website-side UI:

| Place | File:line | What it does |
| --- | --- | --- |
| `AdminBar` | `libs/website/admin/src/lib/admin-bar.tsx:27-57` | shows the preview toggle only when `user?.permissions.includes(CanPreview.id)`; flips `sessionStorage[PREVIEW_MODE]` and refetches all queries |
| `RoutedAdminBar` | `libs/utils/website/src/lib/routed-admin-bar.tsx:9-48` | turns `?preview` in the URL into the stored flag, again only when `canPreview` |
| `usePreviewAuthState` | `libs/content/website/src/lib/preview-unavailable/use-preview-auth-state.ts:81-89` | `canPreview = !!user && user.permissions.includes(CanPreview.id)`; drives the "preview unavailable" banner |

`user.permissions` on the website is the `SensitiveDataUser.permissions` field resolver:

```ts
// libs/user/api/src/lib/sensitive-data-user.resolver.ts:49-59
@ResolveField(() => [String])
public async permissions(@CurrentUser() user: UserSession | undefined, @Parent() { id }: SensitiveDataUser) {
  if (user?.user.id === id) {
    return user.roles.flatMap(r => r.permissionIDs);
  }
  return [];
}
```

— the already-expanded session ids, and only for yourself. (Incidentally, this *is* an
ownership check, see §7.)

---

## 7. Object-scoped permissions — the answer for D4

### 7.1 The plain answer

**No. Permissions cannot be scoped to an object, a record, an owner, a tenant or an
organisation today. Not partially, not by convention. The mechanism has no place to put
the object.**

Reasons, each verifiable:

1. The `Permission` type is `{id, description, deprecated}` — no subject, no scope, no
   condition (`permissions.ts:1-5`).
2. `hasPermission(neededPermissions, userRoles)` takes only the needed permissions and the
   user's roles. There is no third argument and no closure over a record
   (`has-permission.ts:4-26`).
3. `PermissionsGuard.canActivate` reads route metadata and `req.user.roles`, and nothing
   else. It never touches `Args`, never queries the database, never loads the entity
   (`permission.guard.ts:12-32`).
4. `UserRole` has `permissionIDs String[]` and nothing else — no scope column, no join
   table, no JSON condition (`schema.prisma:1234-1245`).
5. `UserSession` carries `user: User` and `roles: UserRole[]` and nothing about
   membership or ownership (`auth-session.ts:16-25`).
6. **There is no organisation concept anywhere in We.Publish.** A case-insensitive grep for
   `organization|organisation` across `libs/api/prisma/schema.prisma` returns zero hits,
   and across `libs/**/*.ts` (excluding generated GraphQL artefacts) returns zero hits.
7. `User.roleIDs` is a bare `String[]` with no foreign key — there is not even a join row
   on which a scope could be hung (`schema.prisma:1202`).

### 7.2 The nearest existing patterns, ranked by closeness

There are five distinguishable patterns. None of them is "object-scoped permission"; all
of them are "coarse guard + hand-written check in the resolver or service".

#### Pattern A — ownership check in the service, after a coarse guard (the closest)

`libs/comments/api/src/lib/comment.service.ts:715-735`, reached from
`@Authenticated() updateUserComment` (`comment.resolver.ts:109-117`):

```ts
async updateUserComment(input: UpdateUserCommentInput, { user, roles }: UserSession) {
  const canSkipApproval = hasPermission(CanCreateApprovedComment, roles);

  const comment = await this.prisma.comment.findUnique({
    where: { id: input.id },
    include: { revisions: { orderBy: { createdAt: 'asc' } } },
  });

  if (!comment) {
    throw new NotFoundException('comment', input.id);
  }

  if (user.id !== comment?.userID) {
    throw new NotAuthorisedError();          // libs/api/src/lib/error.ts
  }
  …
}
```

The guard says "you are logged in". The service loads the record, compares
`user.id` to `comment.userID`, and throws. A **permission** (`CanCreateApprovedComment`) is
read in the same method, but as a *capability modifier* — it decides the resulting
`CommentState`, not whether the call is allowed.

This is the template a cross-organisation event check would follow. Note the error type:
`NotAuthorisedError` (`libs/api/src/lib/error.ts:1`), surfaced as the
`NOT_AUTHORISED` code (`libs/errors/src/lib/error-codes.ts:6`).

#### Pattern B — "admin OR affected user", checked inline (role-id based)

`libs/consent/api/src/lib/user-consent/user-consent.resolver.ts:62-75` and
`…/user-consent.service.ts:62-108`:

```ts
@Authenticated()
@Mutation(returns => UserConsent, { name: 'createUserConsent', … })
createUserConsent(@CurrentUser() user: UserSession, @Args() userConsent: UserConsentInput) {
  // only allow creating for admin or affected user
  if (!user.user.roleIDs.includes('admin') && user.user.id !== userConsent.userId) {
    throw new ForbiddenException();
  }

  return this.userConsents.createUserConsent(userConsent);
}
```

and, in the service, twice more:

```ts
async updateUserConsent(id: string, value: boolean, user: UserSession) {
  const toUpdate = await this.prisma.userConsent.findFirst({ where: { id }, include: { user: true } });

  // only allow updating for admin or affected user
  if (!user.user.roleIDs.includes('admin') && user.user.id !== toUpdate?.user.id) {
    throw new ForbiddenException();
  }
  …
}
```

This is structurally what D4 asks for — "my own, or everything if I am the escalated
role" — but it is keyed on the **role id string `'admin'`**, not on a permission, and the
check is copy-pasted into three places. It is the pattern to imitate in shape and to
avoid in implementation.

#### Pattern C — "permission OR ownership", on a field resolver

`libs/membership/api/src/lib/subscription/subscription.resolver.ts:254-275` — the only
place in the repo where a permission and an ownership test are genuinely ORed:

```ts
@ResolveField(() => String, { nullable: true })
async externalReward(@Parent() parent: PSubscription, @CurrentUser() user: UserSession | undefined) {
  const canManage = hasPermission([CanGetSubscription, CanGetSubscriptions], user?.roles ?? []);
  const isOwn = parent.userID === user?.user.id;

  const [memberPlan, isActive] = await Promise.all([
    this.memberPlanDataloader.load(parent.memberPlanID),
    this.isActive(parent),
  ]);

  if (canManage || (isOwn && isActive)) {
    return memberPlan?.externalReward;
  }

  return null;
}
```

It hides a field rather than rejecting a mutation, but the expression
`canManage || isOwn` is exactly the shape D4 needs, written by hand.

#### Pattern D — scope the query by the session user, never by an argument

`libs/user-subscription/api/src/lib/user-subscription.resolver.ts` — the resolver never
accepts a user id; it takes it from the session and passes it as a filter:

```ts
@Authenticated()
@Query(() => [PublicSubscription], { description: 'This query returns the subscriptions of the authenticated user.' })
async userSubscriptions(@CurrentUser() session: UserSession) {
  return this.userSubscriptionService.getUserSubscriptions(session.user.id);   // line 37
}

@Authenticated()
@Mutation(() => PublicSubscription, …)
async cancelUserSubscription(@Args('id') id: string, @CurrentUser() { user }: UserSession) {
  return this.userSubscriptionService.cancelUserSubscription(user.id, id);     // line 147-152
}
```

The service signature `(userId, subscriptionId)` makes the scope structural: there is no
way to address someone else's row. The "list my organisation's events" half of D4 is this
pattern with `organisationId` instead of `user.id`.

#### Pattern E — permission switches the whole query, not the row

`libs/comments/api/src/lib/comment.resolver.ts:84-96`:

```ts
@Public()
@Query(() => [Comment], { description: 'Returns a sorted and nested list of comments for an item.' })
async commentsForItem(@Args() input: CommentsForItemArgs, @CurrentUser() session: UserSession | null) {
  if (hasPermission(CanGetComments, session?.roles ?? [])) {
    return this.commentService.getCommentsForItem(input);              // everything
  }

  return this.commentService.getPublicCommentsForItem(input, session?.user?.id);  // approved ∪ mine
}
```

`getPublicCommentsForItem` (`comment.service.ts:326-...`) unions the cached approved
comments with `loadOwnComments(itemId, itemType, userId)`. This is the only **list**
endpoint in the repo whose result set depends on both a permission and the caller's
identity, and it is the closest precedent for an Agenda-Admin "validation queue".

Three more inline-permission sites that are *not* ownership checks but show the
"`hasPermission` inside the resolver body" idiom:
`libs/peering/api/src/lib/peer.resolver.ts:77-87` (blank out the peer token),
`libs/member-plan/api/src/lib/member-plan.resolver.ts:113-124` (hide `externalReward`),
`libs/settings/api/src/lib/website-settings/website-settings.resolver.ts:105-120`
(permission OR scoped JWT), and three "filter non-public properties"
resolvers (`base-user.resolver.ts:26-34`, `article-revision.resolver.ts:36-43`,
`page-revision.resolver.ts:22-29`).

### 7.3 What events do today

`libs/event/api/src/lib/event.resolver.ts` — the full authorisation surface:

```ts
@Public()   @Query(() => PaginatedEvents) events(@Args() filter: EventListArgs)
@Public()   @Query(() => Event)           event(@Args('id') id: string)
@Permissions(CanCreateEvent) @Mutation() createEvent(@Args() event: CreateEventInput)
@Permissions(CanUpdateEvent) @Mutation() updateEvent(@Args() event: UpdateEventInput)
@Permissions(CanDeleteEvent) @Mutation() deleteEvent(@Args('id') id: string)
```

No `@CurrentUser()`, no ownership, no publish permission, no preview mode. Both reads are
fully public. See [`wp-01-current-event-implementation.md`](wp-01-current-event-implementation.md)
for the rest of the model.

For comparison, articles and pages record *who* made a revision
(`ArticleRevision.userId`, `schema.prisma:40-41`; passed through from
`page.resolver.ts:112-122` as `this.pageService.createPage(input, user?.user?.id)`) — but
that field is **provenance only**. Nothing reads it back for an authorisation decision.

### 7.4 Where an object-scoped check would have to live

Given the architecture above, there are exactly three viable homes, and the guard is the
worst of them.

| Option | Mechanism | Verdict |
| --- | --- | --- |
| **1. Inside the resolver / service, after a coarse `@Permissions` guard** | Load the event, compare its organisation with the actor's, branch on `hasPermission(CanUpdateOtherOrganizationEvents, roles)`, throw `ForbiddenException` / `NotAuthorisedError` | **The only pattern the codebase already has** (Patterns A, B, C). The record is loaded anyway; the check is testable in a service spec; no guard plumbing changes. |
| **2. A second, ANDed guard via `UseGuards`** | An `@OwnEventOr(CanUpdateOtherOrganizationEvents)` decorator applying `UseGuards(EventOwnershipGuard)`, following `@Feature` exactly (`libs/features/api/src/lib/feature.decorator.ts:13-17`) | Possible and precedented, but the guard can only see `Args` — it must issue its **own** query for the event and its organisation, duplicating the fetch the service does milliseconds later. It also cannot express "filter a list". |
| **3. Inside `OneOf`** | `OneOf(OwnershipGuard)` | **Wrong, and dangerous.** `OneOf` is an OR: adding an ownership guard there would let it be *skipped* whenever `@Permissions` already passed. `.claude/docs/gotchas.md:596-606` records this exact mistake for `@Feature`. |

For **list** scoping ("the events I may see") there is no guard-shaped answer at all:
guards return a boolean. It must be a `where` clause built in the service from the
session, i.e. Pattern D or Pattern E.

The minimum additions the data model needs before any of this can be written:

| Needed | Exists today? |
| --- | --- |
| An organisation entity | no — zero hits in the schema |
| A user ↔ organisation membership | no |
| An owner on the event (`Event.userId`) | no |
| An organisation on the event or its venue | no |
| Anywhere on `UserSession` to carry the actor's organisations | no — `UserSession` is `{type, id, user, roles, createdAt, expiresAt, token, impersonatedBy}` |

The session is built once per request in `AuthenticationService.loadUserSession` and
cached for 300 s. If organisation membership is to be available to every ownership check
without an extra query, it belongs there — and it must then be covered by the same
`SessionCacheInvalidator.invalidate()` call that role edits already trigger
(`libs/user/api/src/lib/user-role.service.ts:81,102`), or a membership change will take up
to five minutes to take effect.

---

## 8. Recipe: adding a new permission

Verified against the smallest real example in the history, `cd280d598`
(*feat(core): Add audit logging*), whose entire permission diff is seven added lines plus
one array entry.

### 8.1 Declare it

`libs/permissions/src/lib/permissions.ts`, next to its domain siblings:

```ts
export const CanPublishEvent: Permission = {
  id: 'CAN_PUBLISH_EVENT',
  description: 'Allows to publish events without validation',
  deprecated: false,
};
```

Conventions, all observable in the file: `PascalCase` constant prefixed `Can`,
`SCREAMING_SNAKE_CASE` id prefixed `CAN_`, verb-first (`GET`/`CREATE`/`UPDATE`/`DELETE`/
`PUBLISH`/`SEND`/`RUN`/`RELOAD`/`RETRY`/`RESET`), singular id for a single-record
operation, plural for a list. The description is a sentence starting with "Allows to …"
and **appears verbatim in the editor's permission picker, untranslated**.

### 8.2 Register it in `AllPermissions`

```ts
export const AllPermissions = [
  …,
  CanGetAuditLogs,
  CanPublishEvent,        // ← append
] as const;
```

Skipping this step produces a permission that the guard honours but that nobody can
assign: it is absent from the `permissions` query, so the editor's picker never offers it,
and `UserRoleResolver.permissions` filters it out of custom roles (§2.3 defect 2).
Appending it also grants it to **every admin on every installation** at deploy time.

### 8.3 Register it in `EditorPermissions` if the stock editor role should have it

```ts
export const EditorPermissions = [
  …,
  CanPublishEvent,
] as const;
```

### 8.4 Use it on the resolver

```ts
import { CanPublishEvent } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';

@Permissions(CanPublishEvent)
@Mutation(() => Event, { description: 'Publishes an event at the given time.' })
public publishEvent(@Args('id') id: string, @Args('publishedAt') publishedAt: Date) {
  return this.eventService.publishEvent(id, publishedAt);
}
```

Two import paths, deliberately split: the **constants** come from `@wepublish/permissions`
(`libs/permissions/src/index.ts`, framework-free, usable in the browser); the
**decorator/guard/helpers** come from `@wepublish/permissions/api`
(`libs/permissions/api/src/index.ts`, NestJS). The editor imports only the former.

Remember `@Permissions(A, B)` means **A AND B** (§3.1), and that adding `@Public()` next to
it makes the whole thing public (§3.3).

### 8.5 Use it in the editor

```tsx
import { CanPublishEvent } from '@wepublish/permissions';
import { PermissionControl, useAuthorisation, createCheckedPermissionComponent } from '@wepublish/ui/editor';

// gate an action — OR semantics across the array
<PermissionControl qualifyingPermissions={[CanPublishEvent.id]}>
  <Button …>{t('eventEditor.publish')}</Button>
</PermissionControl>

// gate a field
const canPublish = useAuthorisation(CanPublishEvent.id);   // boolean | undefined

// gate a whole route view
const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetEvent.id, CanCreateEvent.id, CanUpdateEvent.id, CanDeleteEvent.id, CanPublishEvent.id,
])(EventListView);
```

…and, if the permission gates a navigation entry, add it to the relevant
`<PermissionControl>` in `apps/editor/src/app/base.tsx` (events live at lines 808-867).

### 8.6 Regenerate and test

- Nothing in the GraphQL schema changes for the permission itself (the `permissions`
  query returns `[Permission]` and is already generated) — but any **new resolver** does
  require `npm run generate-api`.
- `.claude/docs/testing.md:126-135`: test the **deny** path. And note the trap recorded
  there — in a resolver e2e spec `@Permissions` is metadata-only unless the global guards
  are registered, so operations run **unguarded** and a deny assertion proves nothing.
  Unit-test the guard or the service branch instead.

### 8.7 What you do **not** need to do

- No database migration. Permission ids live in code; `users.roles.permissionIDs` holds
  copies only for custom roles, which an operator edits in the UI.
- No seed change, unless you are also adding a role (§9).
- No i18n entry — descriptions are not translated.

---

## 9. Recipe: adding a new default role (and getting it onto existing installations)

### 9.1 How the seed reaches a deployed installation

This is the mechanism that answers "how does `Agenda-Admin` appear on an existing BKa
install".

| Environment | Entry point | Chain |
| --- | --- | --- |
| Kubernetes (production) | `helm/charts/wepublish/templates/migration.yaml` — a `batch/v1` Job named `<release>-migration-<revision>`, created on **every Helm revision**, image `ghcr.io/wepublish/migration` | → `docker/migrate_start.js` → `prisma migrate deploy`, then `node dist/api/prisma/run-seed.js`, then the changelog sync |
| Local / CI | `npm run migrate` (`package.json:9`) | `prisma migrate deploy && prisma db seed && npm run changelog:sync`; `prisma.seed` is `nx seed api-example --prod` (`package.json:36`) → `apps/api-example/prisma/seed.ts` → `runExampleSeed` → `rootSeed` |

```js
// docker/migrate_start.js
execFileSync('node', ['node_modules/.bin/prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
execFileSync('node', ['dist/api/prisma/run-seed.js'], { stdio: 'inherit' });
execFileSync('node', ['dist/changelog/run-sync-changelogs.js'], { stdio: 'inherit' });
```

```ts
// libs/api/prisma/run-seed.ts:24-38
export async function runSeed() {
  …
  const [adminUserRole, editorUserRole] = await rootSeed(prisma);

  if (!adminUserRole || !editorUserRole) {
    throw new Error('@wepublish/api seeding has not been done');
  }
  …
}
```

**The seed runs on every deploy, and `upsert … update: {}` is idempotent.** Adding a
fourth `prisma.userRole.upsert` to `seedRoles` therefore creates the role on fresh and
existing installations alike, on the next release, with no SQL migration at all. That is
how the three current roles got everywhere, and it is the path of least resistance for a
fourth.

### 9.2 The two viable strategies

#### Strategy 1 — seed + `addPredefinedPermissions` (what `admin`/`editor`/`peer` do)

1. Append to `seedRoles` in `libs/api/prisma/seed.ts` — **append, never insert before
   `admin`/`editor`**, because callers destructure the transaction result positionally
   (`run-seed.ts:34`, `apps/api-example/prisma/seed.ts:1928`):

   ```ts
   prisma.userRole.upsert({
     where:  { id: 'agenda-admin' },
     update: {},
     create: {
       id: 'agenda-admin',
       systemRole: true,
       name: 'Agenda-Admin',
       description: 'Agenda Administrator Role',
       permissionIDs: [],
     },
   }),
   ```

2. Add a fourth `case 'agenda-admin':` to `addPredefinedPermissions`
   (`libs/permissions/api/src/lib/predefined-permissions.ts:15-37`) returning a new
   exported array, say `AgendaAdminPermissions`.

3. Add the matching `case 'agenda-admin': return AgendaAdminPermissions;` to
   `UserRoleResolver.permissions` (`libs/user/api/src/lib/user-role.resolver.ts:82-93`), or
   the editor shows the role as having none.

4. Export `AgendaAdminPermissions` from `libs/permissions/src/lib/permissions.ts` as a
   fourth `… as const` array.

Trade-offs: the role's permission set is version-controlled and identical everywhere;
`systemRole: true` makes it read-only in the editor; operators cannot tune it per medium
without a code change.

**Constraint you must know before writing step 1.** The migration image compiles the seed
with an explicit, path-mapping-free tsconfig:

```json
// docker/tsconfig.yaml_seed
{
  "files": [
    "api/prisma/run-seed.ts",
    "settings/api/src/lib/setting.ts",
    "api/prisma/seed.ts",
    "changelog/run-sync-changelogs.ts",
    "changelog/sync-changelogs.ts",
    "changelog/parse-changelog-markdown.ts"
  ],
  "compilerOptions": { …, "baseUrl": "." }
}
```

and the Dockerfile copies the sources into a flattened tree (`Dockerfile:207-216`):

```
COPY libs/settings/api/src/lib/setting.ts   settings/api/src/lib/setting.ts
COPY libs/api/prisma/seed.ts                api/prisma/seed.ts
```

`seed.ts`'s single cross-library import is the relative
`'../../settings/api/src/lib/setting'`, which resolves identically in the repo
(`libs/api/prisma/…` → `libs/settings/…`) and in the image (`api/prisma/…` →
`settings/…`). There are **no `paths` mappings**, so `seed.ts` **cannot import
`@wepublish/permissions`**. That is precisely why the seeded roles carry
`permissionIDs: []` and get their permissions at runtime. If a role's permissions must be
written into the row at seed time, the Dockerfile and `docker/tsconfig.yaml_seed` must
both be extended (`COPY libs/permissions/src/lib/permissions.ts permissions/src/lib/permissions.ts`
plus a `files` entry, imported as `'../../permissions/src/lib/permissions'`) — doable, but
it is a build-system change, not a code change.

#### Strategy 2 — a SQL migration that inserts the row with its permissions

There is precedent for data-inserting migrations: 17 of the 179 migrations under
`libs/api/prisma/migrations` contain an `INSERT INTO`, including one that inserts a row
with a literal id and one that uses `ON CONFLICT`:

```sql
-- libs/api/prisma/migrations/20260519220140_add_website_settings/migration.sql (tail)
INSERT INTO "settings.website" ("id", "modifiedAt") VALUES ('default', CURRENT_TIMESTAMP);
```

```sql
-- libs/api/prisma/migrations/20240711144540_add_default_block_styles/migration.sql
INSERT INTO "block-content.styles" ("id","createdAt","modifiedAt","name","blocks")
VALUES (gen_random_uuid(), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Banner', ARRAY['linkPageBreak']::"BlockType"[]),
       …
ON CONFLICT ("name") DO UPDATE SET "blocks" = excluded."blocks";
```

So a migration could do:

```sql
INSERT INTO "users.roles" ("id","createdAt","modifiedAt","name","description","permissionIDs","systemRole")
VALUES ('agenda-admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Agenda-Admin',
        'Agenda Administrator Role',
        ARRAY['CAN_LOGIN_EDITOR','CAN_PREVIEW','CAN_GET_EVENT', …]::TEXT[],
        false)
ON CONFLICT ("id") DO NOTHING;
```

Trade-offs: the permission list becomes a database value an operator can edit in the role
UI (`systemRole: false`), which is the point — but it also drifts, and a later addition to
the role's intended set will **not** reach installations that already ran the migration.
Note the two unique constraints to respect: `id` (primary key) and `name`.

### 9.3 A note on the ordering trap

```ts
const [adminUserRole, editorUserRole] = await rootSeed(prisma);

if (!adminUserRole || !editorUserRole) {
  throw new Error('@wepublish/api seeding has not been done');
}
```

`rootSeed` returns `$transaction([...seedRoles, ...seedSettings])`, so index 0 is `admin`
and index 1 is `editor`. Both `libs/api/prisma/run-seed.ts:34` and
`apps/api-example/prisma/seed.ts:1928` rely on this, and both use `adminUserRole.id` /
`editorUserRole.id` to create the bootstrap users. **Append new roles at the end of
`seedRoles`.**

---

## 10. Quick reference — every file in scope

| File | What it holds |
| --- | --- |
| `libs/permissions/src/index.ts` | `export * from './lib/permissions'` |
| `libs/permissions/src/lib/permissions.ts` | the `Permission` type, 188 constants, `AllPermissions` (180), `EditorPermissions` (68/65), `PeerPermissions` (3) |
| `libs/permissions/api/src/index.ts` | re-exports `has-permission`, `predefined-permissions`, `permission.module`, `permission.decorator`, `permission.guard`, `preview-mode.decorator`, `permission.model` |
| `libs/permissions/api/src/lib/has-permission.ts` | `hasPermission(needed, roles)` — AND over permissions, union over roles |
| `libs/permissions/api/src/lib/has-permission.spec.ts` | 5 cases |
| `libs/permissions/api/src/lib/permission.decorator.ts` | `@Permissions(...)`, `PERMISSIONS_METADATA_KEY` |
| `libs/permissions/api/src/lib/permission.guard.ts` | `PermissionsGuard` |
| `libs/permissions/api/src/lib/permission.guard.spec.ts` | 4 cases |
| `libs/permissions/api/src/lib/permission.model.ts` | the GraphQL `Permission` object type |
| `libs/permissions/api/src/lib/permission.module.ts` | provides the guard + resolver |
| `libs/permissions/api/src/lib/permission.resolver.ts` | `Query.permissions` → `AllPermissions`, guarded by `CanGetPermissions` |
| `libs/permissions/api/src/lib/predefined-permissions.ts` | `addPredefinedPermissions` — the `admin`/`editor`/`peer` switch |
| `libs/permissions/api/src/lib/preview-mode.decorator.ts` | `@PreviewMode()` |
| `libs/api/prisma/schema.prisma:1234-1245` | `model UserRole` |
| `libs/api/prisma/schema.prisma:1202`, `:1035` | `User.roleIDs`, `Token.roleIDs` |
| `libs/api/prisma/migrations/20220812113731_init/migration.sql:492-502,658` | `users.roles` DDL + unique name index |
| `libs/api/prisma/seed.ts:274-315` | the only role-creating code |
| `libs/api/prisma/run-seed.ts` | production seed entry; bootstraps the `admin` user |
| `apps/api-example/prisma/seed.ts:1927-1933,1982-2005` | dev seed; `dev@wepublish.ch` (admin) and `editor@wepublish.ch` (editor), both password `123` |
| `docker/migrate_start.js` | `migrate deploy` → `run-seed` → changelog sync |
| `docker/tsconfig.yaml_seed`, `Dockerfile:199-240` | the seed's isolated compilation unit |
| `helm/charts/wepublish/templates/migration.yaml` | the per-release migration Job |
| `libs/authentication/api/src/lib/authentication.service.ts:50-112` | session load + `addPredefinedPermissions` |
| `libs/authentication/api/src/lib/auth-session.ts` | `UserSession` / `TokenSession` |
| `libs/authentication/api/src/lib/authentication.module.ts:24-31` | the two `APP_GUARD`s |
| `libs/authentication/api/src/lib/session-cache.ts` | 300 s TTL + `SessionCacheInvalidator` |
| `libs/nest-modules/src/lib/one-of/one-of.guard.ts`, `one-of.decorator.ts` | the OR mechanism |
| `libs/nest-modules/src/lib/add-metadata.decorator.ts` | appending metadata |
| `libs/features/api/src/lib/feature.decorator.ts` | the one ANDing guard, with the rationale in its docblock |
| `libs/user/api/src/lib/user-role.model.ts` | the GraphQL `UserRole` type and its inputs |
| `libs/user/api/src/lib/user-role.resolver.ts` | role CRUD + the `permissions` field |
| `libs/user/api/src/lib/user-role.service.ts` | Prisma access + session-cache invalidation |
| `libs/user/api/src/lib/user-role.dataloader.ts` | plain `findMany`, **no** permission expansion |
| `libs/user/api/src/lib/sensitive-data-user.resolver.ts:49-66` | `User.permissions` (self only) and `User.roles` |
| `libs/editor/api/src/lib/schemas/permissions.graphql` | `FullPermission`, `PermissionList` |
| `libs/editor/api/src/lib/schemas/userRole.graphql` | `FullUserRole` + 5 operations |
| `libs/ui/editor/src/lib/atoms/permissionControl.tsx` | `useHasPermission`, `PermissionControl`, `createCheckedPermissionComponent`, `useAuthorisation`, `RejectionMessage` |
| `libs/ui/editor/src/lib/authContext.tsx` | `AuthContext`, `AuthProvider`, `sessionRoles` |
| `libs/ui/editor/src/lib/panel/userRoleEditPanel.tsx` | the role drawer form |
| `apps/editor/src/app/routes/userRoles/userRoleList.tsx` | the role list |
| `apps/editor/src/app/routes/users/userEditView.tsx:178-184,328,400,949-972` | assigning roles to a user |
| `apps/editor/src/app/login.tsx:125-166` | the `CanLoginEditor` check |
| `apps/editor/src/app/loginImpersonate.tsx:37-75` | the same check for impersonation |
| `apps/editor/src/app/base.tsx` | permission-gated navigation |
| `libs/website/admin/src/lib/preview-link.ts` | sets the `preview` header |
| `libs/website/admin/src/lib/admin-bar.tsx` | the preview toggle |
| `libs/utils/website/src/lib/routed-admin-bar.tsx` | `?preview` → stored flag |
| `libs/content/website/src/lib/preview-unavailable/use-preview-auth-state.ts` | the preview banner's state |
| `libs/event/api/src/lib/event.resolver.ts` | events today: 2 public queries, 3 permission-guarded mutations |

---

## 11. Porting notes

*Implications, clearly separated from the description above.*

1. **D4's eight permissions are mechanically trivial and semantically the whole job.**
   Declaring `CanGetEvents`, `CanPublishEvent`, `CanGetOtherOrganizationEvents`,
   `CanUpdateOtherOrganizationEvents` and `CanDeleteOtherOrganizationEvents` is a
   ~40-line diff in `permissions.ts` plus array entries. Nothing in the permission system
   resists it. **Everything hard is on the other side of the guard**: the organisation
   model, the event's owner and organisation, the membership on the session, and the
   `where` clause that makes "other organisation's events" a queryable set. Budget
   accordingly.

2. **The verbs D4 proposes are all in use.** `Get`/`Create`/`Update`/`Delete` are the
   repo's four, `Publish` exists for articles and pages, and `CanPublishEvent` would sit
   naturally at `permissions.ts:703` after `CanDeleteEvent`. The only naming wrinkle is
   that events currently have no plural `CanGetEvents`, so adding one makes events
   consistent with articles/pages but changes what the editor should check — all current
   event UI checks `CanGetEvent.id`.

3. **Agenda-Admin should be a seeded role, not a migration-inserted one — but it cannot
   carry its permissions in the row without a Dockerfile change.** The seed path reaches
   every installation on every deploy and is idempotent (§9.1), which is exactly the
   property a new default role needs. The cost is the `docker/tsconfig.yaml_seed`
   constraint: either accept `permissionIDs: []` plus a fourth
   `addPredefinedPermissions` case (consistent with the existing three, read-only in the
   UI), or extend the migration image's compilation unit. A SQL migration avoids both but
   makes the set un-updatable on installations that already ran it.

4. **If Agenda-Admin is `systemRole: true`, operators cannot tune it.** The editor disables
   the whole form for system roles (`userRoleEditPanel.tsx:122,254`). If a medium should
   be able to add or remove a permission from its Agenda-Admins, the role must be seeded
   with `systemRole: false` and a real `permissionIDs` array — which pushes you to
   Strategy 2, or to extending the seed's build.

5. **D5's "Ready for review" button will flash.** The intended condition is "on a draft,
   when the user cannot publish". Both editor hooks fail open in the direction that makes
   `!canPublish` true during load: `useHasPermission` returns `true` with no roles, and
   `useAuthorisation` returns `undefined`. Either gate the button on
   `canPublish === false` (explicitly, not `!canPublish`) or wait for the session — the
   existing code has no helper for "show only when the user lacks X".

6. **`CanPublishEvent` cannot be enforced by the guard alone, because publishing is a
   mutation on a record the guard cannot see.** The decision "this user may publish, but
   only their own organisation's events" is Pattern A: `@Permissions(CanPublishEvent)` on
   the mutation, then a service-level comparison of the event's organisation with the
   actor's, with `hasPermission(CanUpdateOtherOrganizationEvents, roles)` as the escape
   hatch. Write it once in the service, not three times as `user-consent` does.

7. **The "validation queue" is Pattern E, not a permission.** "Draft events I can see but
   do not own, with `reviewRequestedAt` set" is a `where` clause built from the session,
   exactly like `commentsForItem` branching on `CanGetComments`. The permission decides
   *which query runs*; it cannot decide *which rows come back*.

8. **Put organisation membership on the session, and invalidate the cache when it
   changes.** Every ownership check will need it, the session is already assembled once
   per request and cached for 300 s, and `SessionCacheInvalidator` already exists and is
   already called from the role service. A membership change that does not call it will
   appear to take five minutes.

9. **`CanLoginEditor` is a UI flag, not a gate.** Agenda-Admins need it or the editor will
   refuse their login — but do not rely on it to keep anyone out of the API. The eight
   event permissions are the actual boundary.

10. **`CanPreview` as it exists only means "`latest` resolves to the draft".** Giving
    Agenda-Admin `CanPreview` costs nothing and matches the brief, but events will gain
    nothing from it until they have revisions and a `@PreviewMode()`-aware `latest` field
    — i.e. until the work in
    [`wp-05-revision-publication-system.md`](wp-05-revision-publication-system.md) lands.
    When it does, the event resolver should follow `page.resolver.ts:192-203` verbatim.

11. **Do not reproduce the catalogue's defects.** Check the new ids against the existing
    188 before committing (there is already one duplicate id), use underscores (there are
    already seven hyphenated ids), and put every new constant in `AllPermissions` (eight
    existing constants are orphaned and therefore unassignable).

12. **BKa's `EventVoter` has no counterpart here and will not get one cheaply.** Its three
    attributes (`view`/`edit`/`publish`, each a three-way OR over owner, event
    organisation and venue organisation — see
    [`bka-06-security-auth-roles.md`](bka-06-security-auth-roles.md) §4.1) plus the five
    Doctrine query extensions that mirror them as SQL are a full object-scoped
    authorisation layer. We.Publish has none of that machinery. Every one of those rules
    has to be re-expressed as hand-written code in the event service: the voters become
    one `canEditEvent(event, session)` helper, and the extensions become one
    `eventVisibilityWhere(session)` filter. Writing them *once each*, in the service, and
    testing both the allow and the deny path, is the whole of the port's authorisation
    work.
