# API

The GraphQL surface of `libs/gift-code/api` and the few additions in other
libs. Every operation carries `@Feature('gift-codes')` except `myGiftCodes`,
which returns `[]` while the feature is off. Every tenant's profile page
queries it, so failing there would send one failing request per profile view.

## Permissions

Added to `libs/permissions/src/lib/permissions.ts` next to the goodie ones,
and to `AllPermissions` only (not `EditorPermissions`, see
[D24](decisions.md#d24-permissions-are-admin-and-custom-roles-only)):

| Permission | id | Allows |
| --- | --- | --- |
| `CanGetGiftCodes` | `CAN_GET_GIFT_CODES` | Read offers and codes, see the full code and the buyer |
| `CanUpdateGiftCodes` | `CAN_UPDATE_GIFT_CODES` | Create and edit offers, cancel codes |
| `CanDeleteGiftCodes` | `CAN_DELETE_GIFT_CODES` | Delete offers |

Marking a gift invoice paid uses the existing `markInvoiceAsPaid` mutation
and its existing invoice permission.

## Offers (`gift-code-offer.resolver.ts`)

| Operation | Guard | Notes |
| --- | --- | --- |
| `giftCodeOffers(filter, sort, order, cursorId, take, skip): PaginatedGiftCodeOffers` | `@Permissions(CanGetGiftCodes, CanUpdateGiftCodes, CanDeleteGiftCodes)` (any of them) | Filter `{memberPlanId, active, name}`, sort `CreatedAt`, `ModifiedAt` (default), `Name` |
| `giftCodeOffer(id): GiftCodeOffer` | `@Permissions(CanGetGiftCodes, CanUpdateGiftCodes, CanDeleteGiftCodes)` | NotFound when missing |
| `createGiftCodeOffer(...)` | `@Permissions(CanUpdateGiftCodes)` | Flat args, goodie style. `issueBeforePayment` is a required argument here; `allowDiscountCodes` is optional and defaults to false. |
| `updateGiftCodeOffer(id, ...)` | `@Permissions(CanUpdateGiftCodes)` | |
| `deleteGiftCodeOffer(id)` | `@Permissions(CanDeleteGiftCodes)` | BadRequest "This offer has sold gift codes. Deactivate it instead." |

`GiftCodeOffer` implements `HasImage` and `HasMemberPlanLc`. Fields: `id`,
`createdAt`, `modifiedAt`, `name`, `description` (rich text), `active`,
`memberPlanId`, `periodicity`, `redemptionWindowMonths`, `issueBeforePayment`,
`allowDiscountCodes`, `imageID`, plus three field resolvers: `price: GiftCodePrice {amount,
currency}`, `paymentMethods: [PaymentMethod]` (the offer's methods filtered
through `getStandalonePaymentMethods`) and `paymentMethodIds: [String]` (as
configured, for the editor form). The offer reads accept any of the three
gift code permissions, because the editor's offer list and edit view are
reachable with any of them. Every field is safe to show the public,
because offers reach the website through the subscribe block.

Create and update take `paymentMethodIds: [String!]!` (set semantics on
update) and reject (BadRequest): a plan that already has another offer, a
plan that does not exist, a periodicity
without a price above 0 on the plan, a window of 0 or less, an empty
`paymentMethodIds`, and any method that is missing, inactive, retired or run
by a provider without standalone support ("Payment method <name> cannot be
used for gift codes"). Every write ends with
`publicContentCache.invalidate('pages', 'articles')`, because offers are
rendered inside subscribe blocks in cached page and article responses. A
price shown on a page can still be up to one cache TTL old when the plan
price changes; the invoice always uses the price at submit time.

## Codes (`gift-code.resolver.ts`)

| Operation | Guard | Notes |
| --- | --- | --- |
| `giftCodes(filter, sort, order, take, skip): PaginatedGiftCodes` | `@Permissions(CanGetGiftCodes)` | Filter `{status, offerId, memberPlanId, buyerId, search, createdFrom, createdTo}`, sort `CreatedAt`, `IssuedAt` |
| `giftCode(id): GiftCode` | `@Permissions(CanGetGiftCodes)` | |
| `myGiftCodes: [GiftCode]` | `@Authenticated`, no `@Feature` | `buyerId = session.user.id`, newest first; `[]` while the feature is off |
| `purchaseGiftCode(...): Payment` | `@Authenticated` | See below |
| `payGiftCode(...): Payment` | `@Authenticated` | Pay an open order: an `ordered` code, or one issued before payment |
| `cancelGiftCode(id): GiftCode` | `@Permissions(CanUpdateGiftCodes)` | BadRequest "Gift code cannot be canceled" when already canceled or redeemed |

`myGiftCodes`, `purchaseGiftCode`, `payGiftCode` and `cancelGiftCode` need a
user session. An API token or other session without a user gets Forbidden
("Only users can do this.").

`search` matches the normalized code exactly, or `recipientName` or the
buyer's email (`buyer: {email: {contains, mode: insensitive}}`)
case-insensitively.

`GiftCode` implements `HasMemberPlanLc`. Plain fields: `id`, `createdAt`,
`offerId`, `memberPlanId`, `periodicity`, `redemptionWindowMonths`,
`recipientName`, `message`, `buyerId`, `issuedAt`, `expiresAt`,
`redeemedAt`, `canceledAt`, `cancellationReason`. Field resolvers: `code`,
`status`, `paid` (the invoice's `paidAt` is set), `amount`, `currency`,
`invoiceId`, `offer`, `buyer`. There is no `buyerMail`; the address is
`buyer.email`. `paid` is what lets the editor and the website tell an
early-issued code (`issued`, unpaid) from a paid one.

### purchaseGiftCode

Args: `offerId!`, `recipientName!` (trimmed, 1 to 200 characters), `message`
(up to 1000), `discountCode` (trimmed; empty means none), exactly one of
`paymentMethodId` or `paymentMethodSlug`, `successURL`, `failureURL`.

`GiftCodeService.purchase`:

1. Rejects a missing or doubled method selector, with the same message as
   `createPaymentFromInvoice`, and a recipient name or message out of bounds.
   An empty message is stored as null.
2. Loads the offer with the plan's pricing. BadRequest "Gift code offer is
   not available" unless both offer and plan are active. A discount code on
   an offer without `allowDiscountCodes` is rejected with "Discount codes
   cannot be used for this gift."
3. Looks the method up among the active ones by id or slug. It must be one of
   the offer's methods after the `getStandalonePaymentMethods` filter,
   otherwise "Payment method cannot be used for this purchase".
4. Takes the price from `GiftCodeOfferService.getPrice`; it must be above 0.
5. With a discount code, looks it up like the subscription checkout does:
   lower-cased, for the offer's member plan
   (`@@unique([code, memberPlanId])`), between `validFrom` and `validTo`.
   Otherwise BadRequest "DiscountCode is invalid." or "DiscountCode has
   expired.", the same messages as `createSubscription`. The discount is
   `Math.round(price * discountPercent / 100)`, the formula in
   `user-subscription.service.ts`. A code that brings the amount to 0 is
   rejected with "This discount code makes the gift free, which is not
   supported.", because checkout refuses zero totals. Free gifts through a
   100 % code are not supported yet.
6. Calls `SellableCheckoutService.checkout` with one line (`kind: giftCode`,
   `quantity: 1`, `amount` = price minus discount, `discountCodeId` when a
   code was used, description "plan name (periodicity)").
   Its `attach` creates the `GiftCode` with a generated code, the snapshot
   fields, `buyerId` and the recipient fields. When the offer has
   `issueBeforePayment`, the code is created issued (`issuedAt` now,
   `expiresAt` from the window).
7. Returns the `Payment`, which the website hands to the shared payment
   handling (redirect, Stripe Elements, or paid at once).

The lookup lives in `GiftCodeService` and does not call
`DiscountCodeService.getValidDiscountCode`. Importing `DiscountCodeModule`
from `@wepublish/membership/api` closes the loop gift-code → membership →
member-plan → page → block-content → gift-code, and `DiscountCodeService`
then resolves to `undefined` when Nest builds the module. The website checks
a code before submit with the existing public
`createSubscriptionInfo(memberPlanId, discountCode)` query, which uses the
same rules.

### payGiftCode

Args: `id!`, one method selector, `successURL`, `failureURL`. Loads the code
`where {id, buyerId: userId}` (NotFound otherwise) and requires a code that is
neither canceled nor redeemed and an invoice that is neither paid nor
canceled, so an early-issued unpaid code can be paid too. Otherwise
BadRequest "Gift code cannot be paid". It checks the method against the
offer's methods like `purchaseGiftCode`, then calls
`PaymentsService.createStandaloneInvoicePayment` directly
([03-payments.md](03-payments.md#paymentsservice-paymentsservicets)). A buyer
who pays the same invoice through `createPaymentFromInvoice` is held to the
offer's methods by the handler's `allowedPaymentMethodIds`.

### cancelGiftCode

Sets `canceledAt`, reason `manual` and `canceledByUserId`. If the invoice is
still open it is canceled as well, so it can no longer be paid. Then it calls
`InvoicePaidNotifier.notify(invoiceId)`, so the line gets `revokedAt` at once
instead of at the nightly resync. That runs even when the invoice was already
settled; the revoke claim makes it harmless. Money already received is
refunded outside We.Publish
([D25](decisions.md#d25-cancelling-a-paid-code-does-not-refund)).

## Other additions

- `InvoiceItem.sellableKind: SellableKind` and `Invoice.userID: String`, both
  nullable, in `libs/membership/api/src/lib/invoice/invoice.model.ts`.
- `SubscribeBlock.giftCodeOfferIds: [String]` (default `[]`) and
  `SubscribeBlock.giftCodeOffers: [GiftCodeOffer]`. The resolver returns `[]`
  when the feature is off or the list is empty, otherwise
  `getActiveOffersByIds`, which drops inactive offers and offers whose plan is
  inactive and keeps the editor's order. `SubscribeBlockInput` omits
  `giftCodeOffers`.

## Security rules

Guards do not run on `@ResolveField` in this API. The GraphQL module sets no
`fieldResolverEnhancers`, so `@Permissions`, `@Authenticated` and `@Public`
on a field resolver are ignored, and anyone who can reach the parent object
gets the field. Sensitive fields check inline, as `MemberPlan.externalReward`
does:

- `GiftCode.code` returns `formatGiftCode(code)` when the caller has
  `CanGetGiftCodes` (through `permissionsOf`, so an API token with that
  permission counts), or is the buyer and the code is issued and not
  canceled. Everyone else gets null, including the buyer of an `ordered`
  code. A code issued before payment is visible to its buyer while unpaid.
- `GiftCode.buyer` is typed `SensitiveDataUser`, so it carries `email`, and
  returns the user only for callers with `CanGetGiftCodes`.

Rules for anyone extending this:

- Never add a field that exposes `GiftCode` from another type, such as
  `InvoiceItem.giftCode`, `Invoice.giftCodes` or `User.giftCodes`. Through
  `userInvoices` or a future `HasInvoice` implementer that would reach the
  code without passing a guarded root. `GiftCode` is reachable today only from
  `giftCodes`, `giftCode`, `myGiftCodes` and `cancelGiftCode`. If a new path
  is unavoidable, it must keep the inline checks above.
- Never log a code, in services, errors or debug output. They are stored in
  plain text, so the database is sensitive too.
- No V1 endpoint accepts a code. The redemption mutation must normalize the
  input with `normalizeGiftCode`, return one generic error, and add a
  per-user attempt limit. The spec asks for a separate message per case
  (invalid, expired, redeemed, canceled), which conflicts with the generic
  error; see [open-questions.md](open-questions.md#for-the-redemption-step). The repo has no rate limiter to reuse; a
  kv-based counter is the plan. It must return its own
  `GiftCodeRedemptionInfo` type, never `GiftCode`.
