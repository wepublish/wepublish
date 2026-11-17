# API

The GraphQL surface of `libs/gift-code/api` and the few additions in other
libs. Every operation carries `@Feature('gift-codes')` except `myGiftCodes`,
which returns `[]` while the feature is off. A profile page will query it on
every tenant, and failing there would mean one failing request per profile
view.

The website uses `purchaseGiftCode` and `redeemGiftCode` through the gift
code blocks ([05-editor-and-website.md](05-editor-and-website.md#website)).
`payGiftCode` and `myGiftCodes` have no website caller yet.

## Permissions

Added to `libs/permissions/src/lib/permissions.ts` next to the goodie ones,
and to `AllPermissions` only (not `EditorPermissions`, see
[D24](decisions.md#d24-permissions-are-admin-and-custom-roles-only)):

| Permission | id | Allows |
| --- | --- | --- |
| `CanGetGiftCodes` | `CAN_GET_GIFT_CODES` | Read offers and codes, see the full code and the buyer |
| `CanUpdateGiftCodes` | `CAN_UPDATE_GIFT_CODES` | Create and edit offers, create and cancel codes |
| `CanDeleteGiftCodes` | `CAN_DELETE_GIFT_CODES` | Delete offers |

Marking a gift invoice paid uses the existing `markInvoiceAsPaid` mutation
and its existing invoice permission.

## Offers (`gift-code-offer.resolver.ts`)

| Operation | Guard | Notes |
| --- | --- | --- |
| `giftCodeOffers(filter, sort, order, cursorId, take, skip): PaginatedGiftCodeOffers` | `@Permissions(CanGetGiftCodes, CanUpdateGiftCodes, CanDeleteGiftCodes)` (any of them) | Filter `{memberPlanId, active, name}`, sort `CreatedAt`, `ModifiedAt` (default), `Name` |
| `giftCodeOffer(id): GiftCodeOffer` | `@Permissions(CanGetGiftCodes, CanUpdateGiftCodes, CanDeleteGiftCodes)` | NotFound when missing |
| `createGiftCodeOffer(...)` | `@Permissions(CanUpdateGiftCodes)` | Flat args, goodie style. `price` (cents) is required here; `allowDiscountCodes` is optional and defaults to false. |
| `updateGiftCodeOffer(id, ...)` | `@Permissions(CanUpdateGiftCodes)` | |
| `deleteGiftCodeOffer(id)` | `@Permissions(CanDeleteGiftCodes)` | BadRequest "This offer has gift codes. Deactivate it instead." |

`GiftCodeOffer` implements `HasImage` and `HasMemberPlanLc`. Fields: `id`,
`createdAt`, `modifiedAt`, `name`, `description` (rich text), `active`,
`memberPlanId`, `periodicity`, `redemptionWindowMonths`, `price` (`Int`, cents
of the plan's currency, [D40](decisions.md#d40-offers-store-their-own-price)),
`allowDiscountCodes`, `autoRenew`, `renewalPaymentMethodId`, `imageID`, plus
three field resolvers: `paymentMethods: [PaymentMethod]` (the offer's methods filtered
through `getStandalonePaymentMethods`), `paymentMethodIds: [String]` (as
configured, for the editor form) and `renewalPaymentMethod: PaymentMethod`
(through `PaymentMethodDataloader`, null without renewal). The offer reads accept any of the three
gift code permissions, because the editor's offer list and edit view are
reachable with any of them. Every field is safe to show the public,
because a separate gift block will show offers on the website later.

Create and update take `paymentMethodIds: [String!]!` (set semantics on
update) and reject (BadRequest): a `price` of 0 or less ("The price must be
greater than 0"; a price below or above the plan's price is fine), a plan
that already has another offer, a plan that does not exist, a periodicity
without a price above 0 on the plan, a periodicity the plan does not sell
("The member plan is not sold with this periodicity": none of its
`availablePaymentMethods` rows lists it, see
[D37](decisions.md#d37-gift-durations-are-what-the-plan-sells)), a window of 0
or less, an empty
`paymentMethodIds`, and any method that is missing, inactive, retired or run
by a provider without standalone support ("Payment method <name> cannot be
used for gift codes"). They also check the renewal rules from
[02-data-model](02-data-model.md#giftcodeoffer-gift-codesoffers):
"Choose a payment method for the automatic renewal", "Only offers that renew
automatically can have a renewal payment method", "This member plan cannot be
renewed automatically", "The member plan does not offer this renewal payment
method for this periodicity" and "Payment method <name> cannot be used for
renewals". `autoRenew` and `renewalPaymentMethodId` are optional on create
(default false / null). On update, an omitted value keeps the stored one,
`autoRenew: false` without a method clears the method, and the merged offer is
validated again, so changing the plan or periodicity re-checks the stored
renewal method. Create, update and delete invalidate the cached `pages` and
`articles` through `PublicContentCacheInvalidator`, because the gift code
offers block puts offers into public page and article answers. A rejected
write invalidates nothing. The invoice always uses the offer's price at
submit time.

## Codes (`gift-code.resolver.ts`)

| Operation | Guard | Notes |
| --- | --- | --- |
| `giftCodes(filter, sort, order, take, skip): PaginatedGiftCodes` | `@Permissions(CanGetGiftCodes)` | Filter `{status, paid, source, offerId, memberPlanId, buyerId, search, createdFrom, createdTo}`, sort `CreatedAt`, `IssuedAt` |
| `giftCode(id): GiftCode` | `@Permissions(CanGetGiftCodes)` | |
| `myGiftCodes: [GiftCode]` | `@Authenticated`, no `@Feature` | `buyerId = session.user.id`, newest first; `[]` while the feature is off |
| `purchaseGiftCode(...): Payment` | `@Authenticated` | See below |
| `payGiftCode(...): Payment` | `@Authenticated` | Pay an open order (an `ordered` code) |
| `cancelGiftCode(id): GiftCode` | `@Permissions(CanUpdateGiftCodes)` | BadRequest "Gift code cannot be canceled" when already canceled or redeemed |
| `createGiftCodes(offerId, count, recipientName): [GiftCode]` | `@Permissions(CanUpdateGiftCodes)` | See below |
| `redeemGiftCode(code): GiftCodeRedemption` | `@Authenticated` | In `gift-code-redemption.resolver.ts`. See below |

`myGiftCodes`, `purchaseGiftCode`, `payGiftCode`, `cancelGiftCode`,
`createGiftCodes` and `redeemGiftCode` need a user session. An API token or other session without a user gets Forbidden
("Only users can do this.").

`paid: true` lists codes whose purchase invoice has `paidAt`, `paid: false`
the ones without it (ordered codes, and canceled codes whose invoice was
never paid). It is AND-composed with the other filters. Codes an admin created have no
invoice and match neither `paid: true` nor `paid: false`.

`source: purchase` lists codes with an `invoiceItemId`, `source: admin` the
ones an admin created (`invoiceItemId` null).

`search` matches the normalized code exactly, or `recipientName` or the
buyer's email (`buyer: {email: {contains, mode: insensitive}}`)
case-insensitively.

`GiftCode` implements `HasMemberPlanLc`. Plain fields: `id`, `createdAt`,
`offerId`, `memberPlanId`, `periodicity`, `redemptionWindowMonths`,
`recipientName` (nullable), `buyerId`, `issuedAt`, `expiresAt`,
`redeemedAt`, `canceledAt`, `cancellationReason`. Field resolvers: `code`,
`status`, `source` (`purchase` or `admin`, from `invoiceItemId`), `paid` (the
invoice's `paidAt` is set), `amount`, `currency`, `invoiceId`, `offer`,
`buyer`, `redeemedBy`, `createdBy`, `redeemedInvoice`. `amount`, `currency`, `invoiceId` and
`paid` are null for a code an admin created. `buyer`, `redeemedBy` and
`createdBy` are `SensitiveDataUser` and resolve only for callers with
`CanGetGiftCodes` (inline `hasPermission` check), null for everyone else.
`redeemedInvoice` is the subscription `Invoice` the code paid, loaded by
`GiftCodeInvoiceDataloader`, with the same inline check. There is no
`buyerMail`; the address is `buyer.email`. There is no personal message
either; Karl removed it.

### purchaseGiftCode

Args: `offerId!`, `recipientName` (optional, trimmed, at most 200
characters; empty or blank is stored as null, because the gift code offers
block can skip the question, see [D45](decisions.md#d45-a-block-to-sell-gift-codes)),
`discountCode` (trimmed; empty means none), exactly one of
`paymentMethodId` or `paymentMethodSlug`, `successURL`, `failureURL`.

`GiftCodeService.purchase`:

1. Rejects a missing or doubled method selector, with the same message as
   `createPaymentFromInvoice`, and a recipient name that is too long.
2. Loads the offer with its plan. BadRequest "Gift code offer is
   not available" unless both offer and plan are active. A discount code on
   an offer without `allowDiscountCodes` is rejected with "Discount codes
   cannot be used for this gift."
3. Looks the method up among the active ones by id or slug. It must be one of
   the offer's methods after the `getStandalonePaymentMethods` filter,
   otherwise "Payment method cannot be used for this purchase".
4. Takes the offer's own `price` and the plan's currency. The plan's price
   plays no part in the purchase ([D40](decisions.md#d40-offers-store-their-own-price)).
5. With a discount code, looks it up like the subscription checkout does:
   lower-cased, for the offer's member plan
   (`@@unique([code, memberPlanId])`), between `validFrom` and `validTo`.
   Otherwise BadRequest "DiscountCode is invalid." or "DiscountCode has
   expired.", the same messages as `createSubscription`. The discount is
   `Math.round(price * discountPercent / 100)`, the formula in
   `user-subscription.service.ts`. A 100 % code brings the amount to 0; the
   gift is then free and paid at once (step 7).
6. Calls `SellableCheckoutService.checkout` with `kind: giftCode` and one
   line (`quantity: 1`, `amount` = price minus discount, `discountCodeId` when a
   code was used, description "plan name (periodicity)").
   Its `attach` creates the `GiftCode` with a generated code, the snapshot
   fields, `buyerId` and the recipient name. The code is created unissued;
   only the paid invoice issues it ([D39](decisions.md#d39-codes-are-issued-and-shown-only-once-paid)).
7. Returns the `Payment`. A website hands it to the shared payment handling
   (redirect, Stripe Elements, or paid at once), as it does for a
   subscription. A free gift comes back as a `paid` payment with an empty
   `intentSecret`: the chosen method is still checked against the offer, no
   provider is contacted, and the code is issued before the mutation returns
   ([D33](decisions.md#d33-chf-0-invoices-are-paid-without-a-provider)).

The lookup lives in `GiftCodeService` and does not call
`DiscountCodeService.getValidDiscountCode`, because `gift-code/api` imports
nothing from `membership` but the GraphQL `Invoice` type
([D10](decisions.md#d10-a-new-lib-libsgift-codeapi)). A
website can check a code before submit with the existing public
`createSubscriptionInfo(memberPlanId, discountCode)` query, which uses the
same rules.

### payGiftCode

Args: `id!`, one method selector, `successURL`, `failureURL`. Loads the code
`where {id, buyerId: userId}` (NotFound otherwise) and requires a code that is
neither canceled nor redeemed and an invoice that is neither paid nor
canceled. Otherwise
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
([D25](decisions.md#d25-cancelling-a-paid-code-does-not-refund)). A code an
admin created has no invoice, so only the code is canceled and nothing is
notified.

### createGiftCodes

Args: `offerId!`, `count!` (an integer from 1 to 500), `recipientName`
(optional, trimmed, at most 200 characters; empty or blank is stored as null).
`GiftCodeService.createByAdmin`
([D34](decisions.md#d34-admins-can-create-codes-without-a-purchase)):

1. Rejects a count outside 1 to 500 ("You can create 1 to 500 gift codes at
   once") and a recipient name that is too long.
2. Loads the offer, NotFound when missing. Inactive offers work too.
3. Creates `count` codes in one `createManyAndReturn`, with the offer's
   snapshot fields (`memberPlanId`, `periodicity`, `redemptionWindowMonths`),
   `issuedAt` now, `expiresAt` from the window, `createdByUserId` = the
   session user, and no invoice item, buyer or payment. The codes come from
   `generateGiftCode` and are distinct within the batch; a P2002 collision
   retries the whole batch with new codes, up to five attempts.
4. Returns the created codes. The sellable reconciler and fulfilment never
   see them, because they have no invoice.

### redeemGiftCode

Args: `code!`. Needs a user session (Forbidden "Only users can do this."
otherwise). Returns `GiftCodeRedemption { action, subscription, invoice }`:
`action` is `paidInvoice`, `extendedSubscription` or `createdSubscription`,
`subscription` is a `PublicSubscription` and `invoice` the `Invoice` the code
paid. It never returns the `GiftCode`. This is the only mutation that takes a
code from a reader; it replaced `payInvoiceWithGiftCode`
([D38](decisions.md#d38-one-redeem-endpoint)).
`GiftCodeRedemptionService.redeem`:

1. Counts the attempt in `GiftCodeAttemptLimiter` (10 per user per hour);
   the 11th gets Forbidden.
2. Normalizes the input with `normalizeGiftCode` and looks the code up where
   it is issued, not canceled, not redeemed and `expiresAt` is null or in the
   future. Input that is no code and every code that fails this lookup get
   BadRequest "This gift code cannot be redeemed.".
3. Looks for a fitting subscription: one of the session user's
   subscriptions with the code's `memberPlanId` and `periodicity`,
   `extendable` true and no `SubscriptionDeactivation` row at all. A
   deactivation that only takes effect later (the reader canceled but still
   has paid time) rules the subscription out too. When several fit, one with
   an open invoice (unpaid and not canceled) wins, otherwise the one with the
   latest `paidUntil`, then the oldest.
4. With a fitting subscription whose `paymentPeriodicity` is `lifetime`, it
   refuses right away with the generic error, before anything is created or
   paid, and the code stays unused. A lifetime subscription with a
   deactivation does not fit (step 3), so such a reader gets a new
   subscription. With any other fitting subscription:
   1. `PaymentsService.assertPaymentMethodSettleableWithoutCharge` checks the
      subscription's payment method: its provider must be configured and must
      not manage the subscription remotely (Payrexx subscriptions).
   2. `MemberContext.renewSubscriptionForUser` returns the invoice to pay. It
      returns the open invoice of the latest unpaid period, or creates the
      next period and its invoice, starting the day after `paidUntil`.
   3. An invoice the subscription already had means `paidInvoice`, and
      `assertSubscriptionInvoiceSettleable` refuses it when it is not open
      or another payment of it was started in the last minute. An older
      charge that is still `processing` (an off-session SEPA debit, for
      example) does not block the code; see step 7. A new invoice means
      `extendedSubscription`.
   4. For a new invoice it loads the new period and refuses when another
      period of the subscription, with an invoice that is not canceled,
      overlaps it. That happens when a second code or the renewal job
      created the same period at the same moment; the new invoice is removed
      again, and the reader can simply retry. A new invoice without a period
      is refused and removed the same way.
5. Without one, it starts a new subscription (`createdSubscription`). It
   loads the plan with its prices and `availablePaymentMethods` and refuses
   when the plan is gone or inactive, when the code renews automatically but
   the plan is no longer extendable, when the user already has `maxCount`
   subscriptions of the plan, or when the plan's price for the periodicity
   (`amountTarget ?? amountMin`) is 0. The offer's price is not used: a code
   bought below or above the plan's price still starts a subscription at the
   plan's price, whose full-price first invoice the code pays
   ([D40](decisions.md#d40-offers-store-their-own-price)). The payment method:
   - `autoRenew` true: the code's `renewalPaymentMethodId`, which the plan
     must still offer for the periodicity.
   - `autoRenew` false: the first method in `availablePaymentMethods` order
     whose row offers the periodicity and does not force auto renewal.

   Either way the method must be active, not retired, and pass
   `assertPaymentMethodSettleableWithoutCharge`; otherwise the next one is
   tried, or the code is refused when none is left. The method is recorded
   only; it is what a manual extension would use later. Then
   `MemberContext.createSubscription` creates the subscription with
   `monthlyAmount` = `monthlyAmountFromPeriodAmount(price, periodicity)`,
   the code's `autoRenew`, the plan's `extendable`, no properties and
   `skipMail: true`. Its first invoice is the one to pay.
6. Claims the code with one `updateMany` on its id and the same conditions
   as the lookup, setting `redeemedAt`, `redeemedByUserId`,
   `redeemedSubscriptionId` and `redeemedInvoiceId`. A claim that hits no
   row (the code was used or canceled in the meantime), or that fails on a
   unique or foreign key constraint (another code took the invoice), gets the
   generic error.
7. Pays the invoice with
   `PaymentsService.settleSubscriptionInvoiceWithoutCharge`
   ([03-payments.md](03-payments.md#chf-0-invoices)). The subscription's
   payment method never changes. If a payment of the invoice is still
   `processing`, the invoice is paid anyway, and a warning with the invoice
   id and the ids of those payments (never the code) lets an admin find and
   refund a charge that goes through later. On an error it releases the
   claim and rethrows, unless the invoice is already paid; then it logs the
   error and carries on.
8. Resets the attempt count and returns the action, the subscription and the
   paid invoice with its items. For a new subscription it then sends the
   `SUBSCRIBE` mail, which `createSubscription` skipped; a failing mail is
   logged and does not fail the redemption.

Every check that can refuse a valid code runs before the claim and answers
with the same generic error, so the mutation tells a guesser nothing, and a
refused code stays unused. When the claim is lost or settling fails after
step 4 or 5 created something, the service removes the new invoice, its
period, items and payments, and for `createdSubscription` the subscription.
It skips that removal when the invoice is paid or another code has claimed
the invoice or the new subscription in the meantime. An open invoice the
subscription had before is never removed.

## Blocks (`libs/block-content/api/src/lib/gift-code/`, `subscribe/`)

Decided in [D41](decisions.md#d41-gift-code-blocks) and [D43](decisions.md#d43-the-subscribe-block-links-to-a-redemption-page) to [D45](decisions.md#d45-a-block-to-sell-gift-codes). Blocks are stored as JSON
in the revision, so only the `BlockType` enums changed: GraphQL
`BlockType.redeemGiftCode` and `giftCodeOffers`, and the Prisma `BlockType`
enum (`EditorBlockType` in GraphQL, used by block styles) through migration
`20261116120000_add_gift_code_blocks`.

| Block | Stored fields | Resolved fields |
| --- | --- | --- |
| `SubscribeBlock` (added) | `showGiftCodeRedemption` (default false), `giftCodeRedemptionPageId`, `giftCodeRedemptionLinkText` (nullable; the website uses its default text when empty) | `showGiftCodeRedemption` is false while `gift-codes` is off; `giftCodeRedemptionPage: Page` through `PageDataloaderService`, null when the feature or the option is off or no page is set |
| `RedeemGiftCodeBlock` | `fields: [SubscribeBlockField]` (default first name, password, password repeated) | none; the website calls `redeemGiftCode` |
| `GiftCodeOffersBlock` | `fields: [SubscribeBlockField]` (subscribe default), `giftCodeOfferIds` (display order), `defaultGiftCodeOfferId` (preselected offer, nullable), `showDiscountCodes` (default false), `askRecipientName` (default true) | `giftCodeOffers: [GiftCodeOffer]`: the active offers of active member plans among the ids, in the stored order, `[]` while `gift-codes` is off; `giftCodeOfferIds` drops ids of deleted offers |

`fields` reuses the subscribe block's enum: which registration fields a
logged-out reader is asked for. The website shows the discount code input
only when `showDiscountCodes` is on and the chosen offer has
`allowDiscountCodes`.

`block-content` imports the offer model and `GiftCodeOfferDataloader` by
relative path and provides the dataloader itself instead of importing
`GiftCodeModule`. Importing the `@wepublish/gift-code/api` barrel closes the
loop `block-content` → `gift-code` → `membership` → `member-plan` → `page`
→ `block-content`, and `DiscountCode extends HasMemberPlanLc` then crashes
with "Class extends value undefined" ([D10](decisions.md#d10-a-new-lib-libsgift-codeapi)).
`SubscribeBlockField` moved to `subscribe/subscribe-block-field.model.ts` for
the same reason: the new block models use it in decorator defaults, which run
while `subscribe-block.model.ts` may still be loading. Root `eslint` flags the
relative imports (`@nx/enforce-module-boundaries`); `block-content/api` is in
`.nxignore`, so `nx lint` never runs on it.

## Other additions

- `Invoice.sellableKind: SellableKind` and `Invoice.userID: String`, both
  nullable, in `libs/membership/api/src/lib/invoice/invoice.model.ts`.

## Security rules

Guards do not run on `@ResolveField` in this API. The GraphQL module sets no
`fieldResolverEnhancers`, so `@Permissions`, `@Authenticated` and `@Public`
on a field resolver are ignored, and anyone who can reach the parent object
gets the field. Sensitive fields check inline, as `MemberPlan.externalReward`
does:

- `GiftCode.code` returns `formatGiftCode(code)` when the caller has
  `CanGetGiftCodes` (through `permissionsOf`, so an API token with that
  permission counts), or is the buyer, the code is issued and not canceled,
  and the purchase invoice itself has `paidAt` (read through
  `GiftCodePurchaseDataloader`, not inferred from `issuedAt`). Everyone else
  gets null, including the buyer of an `ordered` or unpaid code
  ([D39](decisions.md#d39-codes-are-issued-and-shown-only-once-paid)).
- `GiftCode.buyer`, `GiftCode.redeemedBy` and `GiftCode.createdBy` are typed
  `SensitiveDataUser`, so they carry `email`, and return the user only for
  callers with `CanGetGiftCodes`.

Rules for anyone extending this:

- Never add a field that exposes `GiftCode` from another type, such as
  `InvoiceItem.giftCode`, `Invoice.giftCodes` or `User.giftCodes`. Through
  `userInvoices` or a future `HasInvoice` implementer that would reach the
  code without passing a guarded root. `GiftCode` is reachable today only from
  `giftCodes`, `giftCode`, `myGiftCodes`, `cancelGiftCode` and
  `createGiftCodes`. `redeemGiftCode` returns `GiftCodeRedemption` (action,
  subscription, invoice), never the code. If a new path
  is unavoidable, it must keep the inline checks above.
- Never log a code, in services, errors or debug output. They are stored in
  plain text, so the database is sensitive too.
- `redeemGiftCode` is the only endpoint that accepts a code. It normalizes
  the input with `normalizeGiftCode`, returns one generic error for every
  refusal a valid code could reach, and counts attempts per user in
  `GiftCodeAttemptLimiter`. A new check belongs before the claim and must
  throw that same error. The spec asks for a separate message per case
  (invalid, expired, redeemed, canceled), which conflicts with the generic
  error; see [open-questions.md](open-questions.md#for-the-redemption-step).
- `redeemGiftCode` only ever pays or extends subscriptions of the session
  user. The code itself is bound to no one: whoever enters it first gets it.
