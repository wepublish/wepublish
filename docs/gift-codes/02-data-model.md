# Data model

All changes are in `libs/api/prisma/schema.prisma`, in one migration
`add_sellables_and_gift_codes`, with CHECK constraints appended by hand to its
`migration.sql` (the same approach as `20260526154307_add_vouchers`). The
migration only adds tables and nullable columns. It needs no backfill and
rewrites no large table.

## Enums

```prisma
enum SellableKind {
  giftCode @map("gift-code")
}

enum GiftCodeCancellationReason {
  manual          @map("manual")
  chargeback      @map("chargeback")
  invoiceCanceled @map("invoice-canceled")
}
```

The existing `ProductType` enum (`Subscription | Donation` on `MemberPlan`) is
left alone. Despite its name it is a member plan flag and has nothing to do
with sellables.

`invoiceCanceled` covers the unpaid auto-cancel and an admin canceling the
invoice. `manual` is the editor's Cancel on the code itself.

## Changes to existing models

`InvoiceItem` gets:

```prisma
sellableKind SellableKind?
fulfilledAt  DateTime? @db.Timestamptz(3)
revokedAt    DateTime? @db.Timestamptz(3)
giftCode     GiftCode?
@@index([sellableKind])
```

Existing lines (membership, goodie, discount) keep `sellableKind` null. The
two markers are generic completion markers, written with
`updateMany where marker IS NULL` after the handler ran; how they are used is
in [01-selling-things.md](01-selling-things.md#completion-markers).

`Invoice` gets a buyer:

```prisma
userID String?
user   User?   @relation("InvoiceBuyer", fields: [userID], references: [id], onDelete: SetNull)
@@index([userID])
```

Only sellable invoices set it in V1, so nothing is backfilled.
`scheduledDeactivationAt` stays NOT NULL. On a sellable invoice it means
"cancel if still unpaid at this time" and is set to now + 14 days. Every
subscription query in the periodic job already filters
`subscriptionID: {not: null}`, so they never see these rows.

Back-relations: `User.invoices` ("InvoiceBuyer"), `User.boughtGiftCodes`
("GiftCodeBuyer"), `User.redeemedGiftCodes` ("GiftCodeRedeemer"),
`MemberPlan.giftCodeOffers`, `MemberPlan.giftCodes`, `Image.giftCodeOffers`,
`Subscription.redeemedGiftCode`.

`Payment.invoiceID` still has no FK. That is out of scope.

## GiftCodeOffer (`gift-codes.offers`)

What an editor sets up: one plan, one periodicity, and how it is presented.

```prisma
model GiftCodeOffer {
  id                     String             @id @default(dbgenerated("uuidv7()"))
  createdAt              DateTime           @default(now()) @db.Timestamptz(3)
  modifiedAt             DateTime           @updatedAt @db.Timestamptz(3)
  name                   String
  description            Json?
  active                 Boolean            @default(true)
  imageID                String?
  image                  Image?             @relation(fields: [imageID], references: [id], onDelete: SetNull)
  memberPlanId           String             @unique
  memberPlan             MemberPlan         @relation(fields: [memberPlanId], references: [id], onDelete: Cascade)
  periodicity            PaymentPeriodicity
  redemptionWindowMonths Int?
  issueBeforePayment     Boolean            @default(false)
  allowDiscountCodes     Boolean            @default(false)
  paymentMethods         PaymentMethod[]
  giftCodes              GiftCode[]
  @@map("gift-codes.offers")
}
```

There is no price column. The price is the plan's current price for that
periodicity (`amountTarget ?? amountMin`, see
[D18](decisions.md#d18-price-is-amounttarget-falling-back-to-amountmin)), so
editors maintain it in one place. `redemptionWindowMonths` null means the code
never expires.

`memberPlanId` is unique: a member plan has at most one gift offer
([D29](decisions.md#d29-one-gift-offer-per-member-plan)). Create and update
check it first and also map a P2002 from a concurrent write to the same
BadRequest ("This member plan already has a gift offer.").

`paymentMethods` is an implicit many-to-many (back-relation
`PaymentMethod.giftCodeOffers`): the editor picks the methods per offer. Only
methods that are active, not retired and run by a provider with
`supportsStandaloneInvoices` are accepted on create and update, and the
`paymentMethods` field resolver filters the same way at read time.

`issueBeforePayment` true means the purchase creates the code already issued
(`issuedAt` now, `expiresAt` from the window), so the buyer can hand it over
before the invoice is paid. The later payment is a no-op for the code, and an
unpaid timeout or a chargeback still cancels it.

`allowDiscountCodes` true lets the buyer enter a discount code of the offer's
member plan at purchase
([D30](decisions.md#d30-discount-codes-on-gift-purchases-opt-in-per-offer)).
The discount lowers the gift's `InvoiceItem.amount`, and the item's existing
`discountCodeId` points at the code, as on a discounted subscription invoice.
Nothing about the discount is stored on `GiftCode`.

## GiftCode (`gift-codes`)

One row per sold line. It holds the order, the entitlement and the code.

```prisma
model GiftCode {
  id                     String                      @id @default(dbgenerated("uuidv7()"))
  createdAt              DateTime                    @default(now()) @db.Timestamptz(3)
  modifiedAt             DateTime                    @updatedAt @db.Timestamptz(3)
  code                   String                      @unique
  offerId                String
  offer                  GiftCodeOffer               @relation(fields: [offerId], references: [id], onDelete: Restrict)
  memberPlanId           String
  memberPlan             MemberPlan                  @relation(fields: [memberPlanId], references: [id], onDelete: Restrict)
  periodicity            PaymentPeriodicity
  redemptionWindowMonths Int?
  invoiceItemId          String                      @unique
  invoiceItem            InvoiceItem                 @relation(fields: [invoiceItemId], references: [id], onDelete: Restrict)
  buyerId                String?
  buyer                  User?                       @relation("GiftCodeBuyer", fields: [buyerId], references: [id], onDelete: SetNull)
  recipientName          String
  message                String?
  issuedAt               DateTime?                   @db.Timestamptz(3)
  expiresAt              DateTime?                   @db.Timestamptz(3)
  canceledAt             DateTime?                   @db.Timestamptz(3)
  cancellationReason     GiftCodeCancellationReason?
  canceledByUserId       String?
  redeemedAt             DateTime?                   @db.Timestamptz(3)
  redeemedByUserId       String?
  redeemedBy             User?                       @relation("GiftCodeRedeemer", fields: [redeemedByUserId], references: [id], onDelete: SetNull)
  redeemedSubscriptionId String?                     @unique
  redeemedSubscription   Subscription?               @relation(fields: [redeemedSubscriptionId], references: [id], onDelete: SetNull)
  @@index([buyerId])
  @@index([offerId])
  @@index([memberPlanId])
  @@index([issuedAt])
  @@map("gift-codes")
}
```

`memberPlanId`, `periodicity` and `redemptionWindowMonths` are copied from
the offer at purchase. Editing the offer later never changes a sold code.
Amount and currency are not stored; the API reads them from the purchase line
(`InvoiceItem.amount × quantity`) and `Invoice.currency` through
`GiftCodePurchaseDataloader`.

`canceledByUserId` is a plain string with no FK, like
`Invoice.manuallySetAsPaidByUserId`.

## Why each delete rule and unique

| Column | Rule | Reason |
| --- | --- | --- |
| `GiftCode.code` | `@unique` | Codes are looked up by value at redemption. A collision during generation raises P2002 and checkout retries the whole transaction. |
| `GiftCode.invoiceItemId` | `@unique`, `Restrict` | One code per sold line, so a retried webhook cannot create a second code. The line cannot be deleted while a code points at it. `InvoiceItem.invoiceId` is `SetNull`, so `deleteInvoice` and `updateInvoice` refuse invoices with sellable items in application code; otherwise the Restrict would surface as a raw P2003. |
| `GiftCode.offerId` | `Restrict` | An offer with sold codes cannot be deleted. `deleteOffer` turns this into "This offer has sold gift codes. Deactivate it instead." |
| `GiftCode.memberPlanId` | `Restrict` | Any sold code blocks deleting its plan, including canceled and expired codes. `deleteMemberPlan` maps the P2003 to a generic BadRequest so `member-plan` does not import `gift-code`. Stricter than the spec, see [D22](decisions.md#d22-any-sold-code-blocks-member-plan-deletion). |
| `GiftCodeOffer.memberPlanId` | `Cascade` | Offers that never sold anything do not block plan deletion. |
| `GiftCodeOffer.imageID` | `SetNull` | Deleting an image only removes it from the offer. |
| `GiftCode.buyerId` | `SetNull` | Deleting the buyer neither blocks nor destroys a paid code. The code keeps no copy of the address; the email comes from `buyer.email` while the user exists. |
| `Invoice.userID` | `SetNull` | Same reasoning for the order. The buyer's ownership checks then fail, which is correct for a deleted user. |
| `GiftCode.redeemedByUserId` | `SetNull` | Prepared for redemption. |
| `GiftCode.redeemedSubscriptionId` | `@unique`, `SetNull` | One subscription per redeemed code. Prepared for redemption. |

## CHECK constraints

Appended by hand to the migration:

```sql
ALTER TABLE "gift-codes.offers" ADD CONSTRAINT "gift-codes.offers_redemptionWindowMonths_check" CHECK ("redemptionWindowMonths" IS NULL OR "redemptionWindowMonths" > 0);
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_redemptionWindowMonths_check" CHECK ("redemptionWindowMonths" IS NULL OR "redemptionWindowMonths" > 0);
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_code_format_check" CHECK ("code" ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$');
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_redeemed_requires_issued_check" CHECK ("redeemedAt" IS NULL OR "issuedAt" IS NOT NULL);
ALTER TABLE "gift-codes" ADD CONSTRAINT "gift-codes_cancel_reason_check" CHECK (("canceledAt" IS NULL) = ("cancellationReason" IS NULL));
ALTER TABLE "invoices.items" ADD CONSTRAINT "invoices.items_claim_requires_kind_check" CHECK (("fulfilledAt" IS NULL AND "revokedAt" IS NULL) OR "sellableKind" IS NOT NULL);
```

## Status is derived

`GiftCodeStatus` is never stored, so nothing has to run when a code expires.
`deriveGiftCodeStatus` in `gift-code-status.ts` checks in this order, first
match wins:

| Status | Condition |
| --- | --- |
| `canceled` | `canceledAt` set |
| `redeemed` | `redeemedAt` set |
| `ordered` | `issuedAt` null |
| `expired` | `expiresAt <= now` |
| `issued` | everything else |

`giftCodeStatusWhere(status, now)` builds the matching Prisma filter for list
queries:

| Status | `where` |
| --- | --- |
| `ordered` | `{issuedAt: null, canceledAt: null}` |
| `issued` | `{issuedAt: {not: null}, canceledAt: null, redeemedAt: null, OR: [{expiresAt: null}, {expiresAt: {gt: now}}]}` |
| `redeemed` | `{redeemedAt: {not: null}, canceledAt: null}` |
| `canceled` | `{canceledAt: {not: null}}` |
| `expired` | `{issuedAt: {not: null}, canceledAt: null, redeemedAt: null, expiresAt: {lte: now}}` |

The spec's German labels map as bestellt = `ordered`, ausgestellt = `issued`,
eingelöst = `redeemed`, storniert = `canceled`, abgelaufen = `expired`.

## How the timestamps are written

- `issuedAt`, `expiresAt`: `GiftCodeService.issueForInvoiceItem` sets them in
  one transaction, `where {invoiceItemId, issuedAt: null, canceledAt: null}`.
  `issuedAt` is the invoice's `paidAt`. `expiresAt` is `paidAt` plus the
  window, or null. For an offer with `issueBeforePayment`, the checkout's
  `attach` writes both when it creates the row (now, and now plus the
  window), so `issueForInvoiceItem` later matches nothing.
- `canceledAt`, `cancellationReason`: `cancelForInvoiceItem` (chargeback,
  invoice canceled) `where {invoiceItemId, canceledAt: null}`, or `cancel`
  (manual) `where {id, canceledAt: null, redeemedAt: null}`, which also
  records `canceledByUserId`.

All of these are conditional, so running them twice changes nothing.

## The code

`gift-code-generator.ts`:

- `GIFT_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'`, 31 characters. It
  leaves out `0`, `O`, `1`, `I` and `L`, which people confuse when reading a
  printed code aloud or typing it.
- `generateGiftCode(random = crypto.randomInt)` returns 12 characters, about
  59 bits. The random source is injectable for tests.
- `formatGiftCode(c)` returns `XXXX-XXXX-XXXX`, for example `A7KD-2M9P-XQ4R`.
- `normalizeGiftCode(input)` uppercases, strips whitespace and `-`, and
  returns null unless the result is exactly 12 alphabet characters.

The database stores only the canonical 12 characters, enforced by
`gift-codes_code_format_check`. Display formatting happens in the
`GiftCode.code` resolver. Search in the editor list normalizes the input and
matches the code exactly.

Codes are stored in plain text, so database dumps and logs that include this
table are sensitive.

## What redemption will use

Redemption is a later step, and needs no migration:

- It claims the code with
  `giftCode.updateMany({where: {code, issuedAt: {not: null}, canceledAt: null, redeemedAt: null, OR: [{expiresAt: null}, {expiresAt: {gt: now}}]}, data: {redeemedAt, redeemedByUserId}})`.
- It creates the subscription from the snapshotted `memberPlanId` and
  `periodicity`, with `autoRenew` false and a CHF 0 subscription invoice
  marked paid without a provider, then sets `redeemedSubscriptionId`.
- `gift-codes_redeemed_requires_issued_check` already makes redeeming an
  unpaid code impossible at the database level.
- A chargeback after redemption will also deactivate `redeemedSubscriptionId`
  with `SubscriptionDeactivationReason.chargeback`. Today
  `cancelForInvoiceItem` only logs a warning when the code is already
  redeemed.

## Seed

`apps/api-example/prisma/seed.ts` upserts one demo `GiftCodeOffer` with a
fixed id on the `test-abo-chf` plan, yearly, with a 12-month window, after
`seedMemberPlans`.
