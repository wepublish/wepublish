# API

The GraphQL surface of `libs/gift-code/api` and the few additions in other
libs. Every operation carries `@Feature('gift-codes')` except `myGiftCodes`,
which returns `[]` while the feature is off. A profile page will query it on
every tenant, and failing there would mean one failing request per profile
view.

No website uses these operations yet. `purchaseGiftCode`, `payGiftCode` and
`myGiftCodes` stay in the schema for the website step, and the offer fields
for the separate gift block
([D32](decisions.md#d32-website-and-gift-block-come-later)).

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
| `createGiftCodeOffer(...)` | `@Permissions(CanUpdateGiftCodes)` | Flat args, goodie style. `issueBeforePayment` is a required argument here; `allowDiscountCodes` is optional and defaults to false. |
| `updateGiftCodeOffer(id, ...)` | `@Permissions(CanUpdateGiftCodes)` | |
| `deleteGiftCodeOffer(id)` | `@Permissions(CanDeleteGiftCodes)` | BadRequest "This offer has gift codes. Deactivate it instead." |

`GiftCodeOffer` implements `HasImage` and `HasMemberPlanLc`. Fields: `id`,
`createdAt`, `modifiedAt`, `name`, `description` (rich text), `active`,
`memberPlanId`, `periodicity`, `redemptionWindowMonths`, `issueBeforePayment`,
`allowDiscountCodes`, `autoRenew`, `renewalPaymentMethodId`, `imageID`, plus
four field resolvers: `price: GiftCodePrice {amount,
currency}`, `paymentMethods: [PaymentMethod]` (the offer's methods filtered
through `getStandalonePaymentMethods`), `paymentMethodIds: [String]` (as
configured, for the editor form) and `renewalPaymentMethod: PaymentMethod`
(through `PaymentMethodDataloader`, null without renewal). The offer reads accept any of the three
gift code permissions, because the editor's offer list and edit view are
reachable with any of them. Every field is safe to show the public,
because a separate gift block will show offers on the website later.

Create and update take `paymentMethodIds: [String!]!` (set semantics on
update) and reject (BadRequest): a plan that already has another offer, a
plan that does not exist, a periodicity
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
renewal method. Writes do not invalidate the public content cache:
no cached public response contains an offer, because the offer queries need
a permission and `myGiftCodes` needs a login. The gift block that shows
offers on the website will have to add that invalidation. The invoice always
uses the price at submit time.

## Codes (`gift-code.resolver.ts`)

| Operation | Guard | Notes |
| --- | --- | --- |
| `giftCodes(filter, sort, order, take, skip): PaginatedGiftCodes` | `@Permissions(CanGetGiftCodes)` | Filter `{status, paid, source, offerId, memberPlanId, buyerId, search, createdFrom, createdTo}`, sort `CreatedAt`, `IssuedAt` |
| `giftCode(id): GiftCode` | `@Permissions(CanGetGiftCodes)` | |
| `myGiftCodes: [GiftCode]` | `@Authenticated`, no `@Feature` | `buyerId = session.user.id`, newest first; `[]` while the feature is off |
| `purchaseGiftCode(...): Payment` | `@Authenticated` | See below |
| `payGiftCode(...): Payment` | `@Authenticated` | Pay an open order: an `ordered` code, or one issued before payment |
| `cancelGiftCode(id): GiftCode` | `@Permissions(CanUpdateGiftCodes)` | BadRequest "Gift code cannot be canceled" when already canceled or redeemed |
| `createGiftCodes(offerId, count, recipientName): [GiftCode]` | `@Permissions(CanUpdateGiftCodes)` | See below |
| `payInvoiceWithGiftCode(invoiceId, code): Invoice` | `@Authenticated` | In `gift-code-invoice.resolver.ts`. See below |

`myGiftCodes`, `purchaseGiftCode`, `payGiftCode`, `cancelGiftCode` and
`createGiftCodes` need a user session. An API token or other session without a user gets Forbidden
("Only users can do this.").

`paid: true` lists codes whose purchase invoice has `paidAt`, `paid: false`
the ones without it (ordered codes and codes issued before payment). It is
AND-composed with the other filters, so `{status: issued, paid: false}` lists
the early-issued codes that are still unpaid. Codes an admin created have no
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
either; Karl removed it. `paid` is what lets the editor tell an early-issued code
(`issued`, unpaid) from a paid one.

### purchaseGiftCode

Args: `offerId!`, `recipientName!` (trimmed, 1 to 200 characters),
`discountCode` (trimmed; empty means none), exactly one of
`paymentMethodId` or `paymentMethodSlug`, `successURL`, `failureURL`.

`GiftCodeService.purchase`:

1. Rejects a missing or doubled method selector, with the same message as
   `createPaymentFromInvoice`, and a recipient name out of bounds.
2. Loads the offer with the plan's pricing. BadRequest "Gift code offer is
   not available" unless both offer and plan are active. A discount code on
   an offer without `allowDiscountCodes` is rejected with "Discount codes
   cannot be used for this gift."
3. Looks the method up among the active ones by id or slug. It must be one of
   the offer's methods after the `getStandalonePaymentMethods` filter,
   otherwise "Payment method cannot be used for this purchase".
4. Takes the price from `GiftCodeOfferService.getPrice`; it must be above 0,
   otherwise "Gift code offer has no price".
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
   fields, `buyerId` and the recipient name. When the offer has
   `issueBeforePayment`, the code is created issued (`issuedAt` now,
   `expiresAt` from the window).
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

### payInvoiceWithGiftCode

Args: `invoiceId!`, `code!`. Needs a user session (Forbidden "Only users can
do this." otherwise). `GiftCodeInvoiceService.payInvoice`
([D36](decisions.md#d36-gift-codes-pay-open-subscription-invoices)):

1. Counts the attempt in `GiftCodeAttemptLimiter` (10 per user per hour);
   the 11th gets Forbidden.
2. Loads the invoice with its subscription. BadRequest "This invoice cannot
   be paid with a gift code." when it is missing, has no subscription,
   belongs to another user's subscription, is a sellable invoice, or is paid
   or canceled.
3. Calls `PaymentsService.assertSubscriptionInvoiceSettleable`, so a
   running payment, a missing provider or a remotely managed subscription is
   refused before the code is touched.
4. Normalizes the code with `normalizeGiftCode` and claims it with one
   `updateMany` where the code is issued, not canceled, not redeemed, not
   expired, and has the subscription's `memberPlanID` and
   `paymentPeriodicity`. Anything else, including input that is no code,
   gets BadRequest "This gift code cannot pay this invoice.". A P2002 on
   `redeemedInvoiceId` (another code won the race) gets the invoice error.
5. Pays the invoice with
   `PaymentsService.settleSubscriptionInvoiceWithoutCharge`
   ([03-payments.md](03-payments.md#chf-0-invoices)). On an error it releases
   the claim and rethrows, unless the invoice is already paid; then it logs
   the error and carries on.
6. Resets the attempt count and returns the paid invoice with its items.

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
  permission counts), or is the buyer and the code is issued and not
  canceled. Everyone else gets null, including the buyer of an `ordered`
  code. A code issued before payment is visible to its buyer while unpaid.
- `GiftCode.buyer`, `GiftCode.redeemedBy` and `GiftCode.createdBy` are typed
  `SensitiveDataUser`, so they carry `email`, and return the user only for
  callers with `CanGetGiftCodes`.

Rules for anyone extending this:

- Never add a field that exposes `GiftCode` from another type, such as
  `InvoiceItem.giftCode`, `Invoice.giftCodes` or `User.giftCodes`. Through
  `userInvoices` or a future `HasInvoice` implementer that would reach the
  code without passing a guarded root. `GiftCode` is reachable today only from
  `giftCodes`, `giftCode`, `myGiftCodes`, `cancelGiftCode` and
  `createGiftCodes`. `payInvoiceWithGiftCode` returns the `Invoice`, never
  the code. If a new path
  is unavoidable, it must keep the inline checks above.
- Never log a code, in services, errors or debug output. They are stored in
  plain text, so the database is sensitive too.
- `payInvoiceWithGiftCode` is the only endpoint that accepts a code. It
  normalizes the input with `normalizeGiftCode`, returns one generic error
  and counts attempts per user in `GiftCodeAttemptLimiter`. The redemption
  mutation must do the same, reusing that limiter. The spec asks for a
  separate message per case (invalid, expired, redeemed, canceled), which
  conflicts with the generic error; see
  [open-questions.md](open-questions.md#for-the-redemption-step). It must
  return its own `GiftCodeRedemptionInfo` type, never `GiftCode`.
