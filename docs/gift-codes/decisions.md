# Gift codes: decision log

Every decision taken while designing the gift code purchase and the sellable
contract under it. D1 to D17 come from the design review, where three
competing designs were scored and the risk-first one was built with two parts
taken from the others. D18 to D26 are defaults chosen for open questions. They
are built that way now and are marked "default, confirm with Karl" until he
answers; [open-questions.md](open-questions.md) lists them as questions. D19,
D27 and D28 are Karl's changes after the design.

## D1: Standalone sellable invoices with a guarded early return

Context. The payment path assumes every invoice belongs to a subscription.
`BasePaymentProvider.updatePaymentWithIntentState` writes the payment state,
then throws for an invoice without `subscriptionID`
(`payment-provider.ts:278`). So a gift invoice would end up with a paid
`Payment` row, an unpaid `Invoice`, and a webhook that returns 500 forever.
Three designs were compared. One moved the whole subscription branch into a
helper used everywhere. One wrote the standalone invoice unconditionally and
had no retry net. The third left the subscription branch alone.

Decision. A gift purchase is a standalone invoice: `subscriptionID` null, a
buyer in `Invoice.userID`, and at least one `InvoiceItem` with `sellableKind`
set. `updatePaymentWithIntentState` gets one early return that runs only when
`subscriptionID` is null and the invoice has sellable items. It settles with
conditional `updateMany` writes.

Why. This is the only design that leaves the subscription path byte-identical,
with zero extra queries for subscription invoices, and that avoids both
customer hazards described in D2.

Consequences.
- Subscription invoices take the same code path as before.
- An orphaned legacy invoice (subscription deleted, so `subscriptionID` became
  null through `SetNull`) still throws, as today.
- Details in [03-payments.md](03-payments.md).

## D2: Standalone payments never use a saved customer

Context. `createPaymentWithProvider` looks up the user's stored
`PaymentProviderCustomer` by `userId` and passes its `customerID` to
`createIntent`. Stripe then charges the saved card off-session with
`confirm: true`, Mollie makes a recurring offsite payment, and Payrexx uses the
stored preauthorization. A subscriber buying a gift would be charged silently
on the subscription mandate, without choosing a method and without SCA. On top
of that, Mollie in off-session mode creates a new customer on every gateway
payment and returns it in the webhook. Storing it would replace the
subscriber's renewal customer.

Decision. Gift payments go through
`PaymentsService.createStandaloneInvoicePayment`, which calls the extracted
`startIntent` with `customerID: undefined` and `saveCustomer: false`. The
sellable settle path never calls `updatePaymentProvider`.

Why. Both other designs reused `createPaymentWithProvider` with a `userId`,
and the judges rated that fatal once they had read the provider code.

Consequences.
- A buyer with a saved card goes through the provider's checkout like a new
  customer.
- Mollie and Payrexx now honour `saveCustomer=false` in off-session mode: they
  only set up a mandate (Mollie `sequenceType: first`) or a Payrexx
  preauthorization when `saveCustomer` is true or a stored `customerID` was
  passed. A gift purchase is a plain one-off payment at both.

## D3: Generic completion markers on InvoiceItem

Context. Fulfilment must end in the same state per sold line even when
webhooks are retried, run concurrently, or arrive out of order. One design had each product
implement its own `findOutOfSyncInvoiceIds`; another hung a goodie-style FK
per product off `InvoiceItem`.

Decision. `InvoiceItem` gets `sellableKind`, `fulfilledAt` and `revokedAt`.
The markers are written with `updateMany where marker IS NULL` after the
handler returned. They were first claimed before the handler ran, which lost
the line for good when the process died in between (the resync only looks at
unmarked lines), so the order was flipped and handlers must be idempotent. Product tables point at their line
(`invoiceItemId @unique`); `InvoiceItem` gets no per-product FK.

Why. Every future product gets retried, idempotent fulfilment and
revocation, and the reconciler can find out-of-sync invoices with one generic
query. Handlers
stay small.

Consequences.
- A CHECK constraint forbids markers on lines without a `sellableKind`.
- Concurrent runs can both call the handler. Correctness depends on the
  handler's own conditional writes, not on the marker.

## D4: InvoicePaidNotifier becomes a register() fan-out

Context. `InvoicePaidNotifier` injected exactly one `@Optional`
`INVOICE_PAID_LISTENER` and swallowed its errors. Only `RenewalMailModule`
bound the token.

Decision. The token goes away. The notifier keeps a list, `register(listener)`
ignores duplicates, and `notify` calls each listener in registration order in
its own try/catch. `RenewalSuccessMailService` registers itself in
`onModuleInit`, as does `SellableFulfilmentService`.

Why. One registration style. `PaymentsModule` is a static singleton, so every
module sees the same notifier.

Consequences.
- Breaking internal API: a branch that adds a listener through the token stops
  firing silently after the merge.
- `RenewalMailModule` now imports `PaymentsModule`.

## D5: notify is level-triggered

Context. Chargebacks had no hook at all: the webhook notified only on `paid`,
and the listener interface only knew `onInvoicePaid`. Adding
`notifyChargedBack` and `notifyCanceled` events would mean threading new
calls through subscription call sites.

Decision. `notify(invoiceId)` now means "settlement may have changed". The
webhook also notifies on chargeback. `SellableFulfilmentService` reads the
invoice's current state each time and decides whether to fulfil or revoke.

Why. Duplicate, lost and out-of-order events converge on the same result, and
no subscription call site changes.

Consequences.
- Listeners must check state themselves. The renewal mail listener already
  does (it returns when `paidAt` is null), so it no-ops on chargeback.

## D6: The subscription sendMail contract stays

Context. `markInvoiceAsPaid` only notifies when `sendMail` is true. For gift
codes that would mean an admin who marks a gift invoice paid without a mail
never issues the code.

Decision. Only the new sellable branch of `markInvoiceAsPaid` notifies
unconditionally. The subscription branch, including `if (sendMail) notify`, is
untouched.

Why. A smaller change to a tested contract, and issuance is still guaranteed
on the admin path.

Consequences. Never hang product fulfilment on `sendMail`.

## D7: supportsStandaloneInvoices is opt-in

Context. Not every provider can take a payment for an invoice that has no
subscription. Bexio builds its invoice from subscription data, and
PayrexxSubscription and NeverCharge make no sense for one-off purchases.

Decision. `PaymentProvider` gets `supportsStandaloneInvoices`, `false` on
`BasePaymentProvider`. Stripe, StripeCheckout, Payrexx, Mollie and Simulated
override it with `true`.

Why. A new provider stays excluded until someone has checked it. All eight
providers extend `BasePaymentProvider` directly, so nothing inherits `true` by
accident.

Consequences. Media that only offer invoice payment ("Rechnung") through Bexio
cannot sell gift codes yet, although the spec lists Rechnung as a payment
option.

## D8: A nightly reconciler as an isolated step

Context. The notifier swallows listener errors and the nightly job never
looks at invoices without a subscription. Without a retry net, one failed
issuance or a lost webhook leaves a paid code in `ordered` until someone acts.

Decision. `SellableReconciliationService.reconcile()` runs in
`PeriodicJobExecutor.runNight` in its own try/catch, after the Mailchimp step.
It polls pending payments, auto-cancels unpaid orders after
`scheduledDeactivationAt`, and re-notifies invoices whose claim markers are
out of sync.

Why. It can never fail the subscription job (same isolation as Mailchimp).
The unpaid timeout came from one of the other designs.

Consequences. Steps and bounds are in
[01-selling-things.md](01-selling-things.md#the-nightly-reconciler).

## D9: Checkout with attach and a whole-transaction retry

Context. The gift code row has to exist atomically with its invoice line, and
code generation can collide on `GiftCode.code @unique`. A P2002 inside a
Postgres transaction aborts the transaction, so retrying just the insert does
not work.

Decision. `SellableCheckoutService.checkout` takes `SellableLineDraft[]`. Each
draft has an `attach(tx, item)` callback that creates the product row inside
the same transaction. The whole transaction is retried on P2002, up to 5
attempts.

Why. The product row and its line are created together, and a cart (several
lines in one checkout) comes for free.

Consequences. `attach` must be safe to run again, because a retry repeats the
whole transaction.

## D10: A new lib, libs/gift-code/api

Context. The subscribe block has to resolve gift offers, so `block-content`
must depend on the gift code lib. Another design put gift codes in a folder
inside `libs/membership/api`.

Decision. New lib `libs/gift-code/api`, project `gift-code-api`, alias
`@wepublish/gift-code/api`.

Why. The dependency edges stay explicit, and gift codes stay free of
membership until redemption needs it.

Consequences. `gift-code/api` must never import `block-content` or
`membership`, and imports `image/api` narrowly because of the image/peering
cycle.

## D11: Offers are picked per subscribe block

Context. The spec says the toggle appears "sobald ein Angebot ausgewählt ist".
One design used a `showGiftCodes` boolean; another would have added
`MemberPlan.giftCodeOffers`.

Decision. `SubscribeBlock.giftCodeOfferIds`, resolved to active offers only,
in the given order. There is no field on `MemberPlan`.

Why. It matches the spec, and keeping offers off `MemberPlan` avoids the
`memberPlans` response cache.

Consequences. Offer writes flush the cached `pages` and `articles` responses,
because offers are rendered inside subscribe blocks.

## D12: No money on GiftCode; the entitlement is snapshotted

Context. The price lives on the purchase line already. What the recipient will
get must not change when an editor edits the offer later.

Decision. `GiftCode` has no amount or currency. They are read from
`InvoiceItem.amount × quantity` and `Invoice.currency` through
`GiftCodePurchaseDataloader`. `memberPlanId`, `periodicity` and
`redemptionWindowMonths` are copied onto the code at purchase.

Why. Money data exists once, and the entitlement is fixed at purchase, as the
spec requires ("Das Recht der beschenkten Person bleibt fix").

Consequences. See [02-data-model.md](02-data-model.md).

## D13: Canonical code storage and an inline-guarded code field

Context. Guards do not run on `@ResolveField` in this API (no
`fieldResolverEnhancers`). A `@Permissions` decorator on a field resolver does
nothing.

Decision. The code is stored canonical: 12 characters, CHECK-enforced, no
dashes. It is formatted as `XXXX-XXXX-XXXX` only for display. It is exposed
only through `GiftCode.code`, whose resolver checks inline: an admin
(`CanGetGiftCodes`), or the buyer once the code is issued and not canceled.

Why. Canonical storage makes the later redemption lookup an exact match. The
inline check keeps the code safe even if `GiftCode` becomes reachable from
another type.

Consequences. Rules in [04-api.md](04-api.md#security-rules).

## D14: "canceled", one l

Decision. `GiftCode.canceledAt`, status `canceled`.

Why. Matches `Invoice.canceledAt` and the existing GraphQL spelling.

## D15: Delete rules around offers and plans

Context. Deleting an offer or a plan must not orphan sold codes. `member-plan`
cannot import `gift-code` to count codes itself.

Decision. `GiftCode.offerId` and `GiftCode.memberPlanId` are `Restrict`.
`GiftCodeOffer.memberPlanId` is `Cascade`. `deleteMemberPlan` maps any P2003
to a generic `BadRequestException`.

Why. A plan with sold codes cannot be deleted, without a cross-lib import.
Unsold offers never block plan deletion.

Consequences.
- An offer with sold codes can only be deactivated.
- Any sold code blocks plan deletion, including canceled and expired ones.
  That is stricter than the spec ("noch uneingelöste Gutscheine"); see D22.

## D16: userInvoices stays subscription-only

Context. Buyers need to see and retry their purchases. Widening
`getUserInvoices` would crash the website invoice list container, which does
`invoice.subscription!`, and would make the `hasOpenInvoices` check in
`subscribe.tsx` block subscribing.

Decision. `getUserInvoices` is unchanged. Buyers see purchases through
`myGiftCodes` in "Meine Gutscheine" and retry payment with `payGiftCode`.

Consequences. Widening `userInvoices` is a later step, once the invoice list
handles a null subscription.

## D17: Ship dark behind the gift-codes feature

Context. Redemption does not exist yet.

Decision. `@Feature('gift-codes')` on both resolvers, the subscribe block
resolver field, and every editor entry point. `myGiftCodes` returns `[]`
instead of failing while the flag is off, because the profile page of every
tenant queries it. `GiftCodeSellableHandler.isAvailable` reads the flag, so
open orders cannot be paid while it is off.

Why. Media must not sell codes that cannot be redeemed.

Consequences. Remove the flag once redemption ships.

This one is also a default, confirm with Karl: the brief lists it among the
open questions.

## D18: Price is amountTarget, falling back to amountMin

Default, confirm with Karl.

Context. A plan's periodicity price row has `amountMin`, `amountTarget` and
`amountMax`. The spec says the buyer pays "den aktuellen Preis des Abos für
diese Laufzeit" without saying which.

Decision. `GiftCodeOfferService.getPrice` returns
`amountTarget ?? amountMin` of `getPeriodPriceRange(plan, offer.periodicity)`.

Why. `amountTarget` is the price the plan suggests to subscribers.

Consequences. No amount slider in the gift form. An offer whose price comes
out as 0 is rejected on save.

## D19: Payment methods are configured per offer, filtered by capability

Decided by Karl, replacing the first default (the plan's
`availablePaymentMethods` for the periodicity).

Decision. Each offer has its own `paymentMethods` (implicit many-to-many).
Create and update require at least one, and every one must be active, not
retired and run by a provider with `supportsStandaloneInvoices`. The
`paymentMethods` field resolver filters the same way at read time, so a
method that is later deactivated disappears from the website.

Why. Editors want to offer gifts with a different set of methods than the
subscription itself.

Consequences.
- No Bexio invoice payment in V1 (D7).
- The offer's methods must also hold when the buyer pays an open order
  through the generic `createPaymentFromInvoice`. The handler contract got an
  optional `allowedPaymentMethodIds` for this, which
  `createStandaloneInvoicePayment` checks for every sellable line; see
  [01-selling-things.md](01-selling-things.md#the-pieces).
- The plan only needs a price above 0 for the periodicity. The old rule that
  some `availablePaymentMethods` row offers the periodicity is gone.

## D20: Unpaid orders auto-cancel after 14 days

Default, confirm with Karl.

Decision. Checkout sets `scheduledDeactivationAt = now + 14 days`. The nightly
reconciler cancels the invoice once that has passed, and the code becomes
`canceled` with reason `invoiceCanceled`.

Why. Payment by invoice can take days, so the window must not be short. An
order left open forever would stay payable at an outdated price.

## D21: The redemption window counts from payment confirmation

Default, confirm with Karl.

Decision. `expiresAt = addMonths(paidAt, redemptionWindowMonths)`, set when
the code is issued. `null` window means it never expires. A code issued before
payment (D27) counts from the order instead, because there is no `paidAt` yet.

Why. A buyer who pays by invoice two weeks after ordering should not lose two
weeks of validity.

## D22: Any sold code blocks member plan deletion

Default, confirm with Karl.

Decision. FK `Restrict` on `GiftCode.memberPlanId` plus the friendly
`BadRequest` from D15.

Why. The FK needs no import from `member-plan` into `gift-code`. Allowing
deletion when only canceled or expired codes exist would need an app-level
check instead.

## D23: Gift revenue counts as-is in dashboards

Default, confirm with Karl.

Decision. `DashboardInvoiceService` revenue and expectedRevenue and
`MediumStatsService` money are not changed. Gift purchases count, with no
member plan attributed.

Consequences. Failed gift payments may show up in at-risk stats. A per-kind
breakdown is a later step.

## D24: Permissions are admin and custom roles only

Default, confirm with Karl.

Decision. `CanGetGiftCodes`, `CanUpdateGiftCodes` and `CanDeleteGiftCodes` go
into `AllPermissions`, not `EditorPermissions`.

Why. Same as goodies and discount codes.

## D25: Cancelling a paid code does not refund

Default, confirm with Karl.

Decision. The editor's Cancel only cancels the code. If the invoice is still
open it is canceled too, so it stops being payable, and `notify` runs right
away so the line is marked revoked without waiting for the nightly resync.
Money already paid is refunded outside We.Publish.

Why. No provider refund API is wired up in We.Publish today.

## D26: Admins see the full code

Default, confirm with Karl.

Decision. Callers with `CanGetGiftCodes` get the full formatted code in the
editor list and through the API.

Why. Support needs it when a buyer has lost the code, and there is no email
to resend in V1.

## D27: Codes can be issued before payment, per offer

Decided by Karl.

Context. A buyer who pays by invoice gets the code only once the payment is
confirmed, which can take days.

Decision. `GiftCodeOffer.issueBeforePayment` (default false). When it is set,
the checkout's `attach` creates the code already issued: `issuedAt` now,
`expiresAt` from the window. `issueForInvoiceItem` still only writes
`where issuedAt null`, so the later payment changes nothing on the code.

Why. Revocation and status derivation stay as they are. An unpaid timeout or
a chargeback cancels an early-issued code like any other.

Consequences.
- Such a code is `issued` while its invoice is still open. `GiftCode.paid`
  (the invoice's `paidAt` is set) lets the editor show "unpaid" and the
  website offer "Bezahlen".
- The buyer sees the code before paying. Until the 14-day timeout cancels it,
  an unpaid code is valid. Once redemption exists, it can be redeemed in that
  window. The editor's switch says so.

## D28: No buyer email on GiftCode

Decided by Karl.

Decision. `GiftCode` has no `buyerMail` column. The address is the buyer's
`User.email`, read through the admin-only `GiftCode.buyer` field
(`SensitiveDataUser`). The editor's search matches
`buyer: {email: {contains, mode: insensitive}}`.

Why. The address is kept in one place. A copy on the code would go stale when
the user changes it.

Consequences. When the buyer's account is deleted (`SetNull`), the code no
longer has an address.
