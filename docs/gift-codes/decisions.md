# Gift codes: decision log

Every decision taken while designing the gift code purchase and the sellable
contract under it. D1 to D17 come from the design review, where three
competing designs were scored and the risk-first one was built with two parts
taken from the others. D18 to D26 are defaults chosen for open questions. They
are built that way now and are marked "default, confirm with Karl" until he
answers; [open-questions.md](open-questions.md) lists them as questions. D19
and D27 to D37 are Karl's changes after the design. D11 was dropped by D32.

## D1: Standalone sellable invoices with a guarded early return

Context. The payment path assumes every invoice belongs to a subscription.
`BasePaymentProvider.updatePaymentWithIntentState` writes the payment state,
then throws for an invoice without `subscriptionID`
(`payment-provider.ts`). So a gift invoice would end up with a paid
`Payment` row, an unpaid `Invoice`, and a webhook that returns 500 forever.
Three designs were compared. One moved the whole subscription branch into a
helper used everywhere. One wrote the standalone invoice unconditionally and
had no retry net. The third left the subscription branch alone.

Decision. A gift purchase is a standalone invoice: `subscriptionID` null, a
buyer in `Invoice.userID`, and `Invoice.sellableKind` set
([D31](#d31-one-sellable-kind-per-invoice)). `updatePaymentWithIntentState`
gets one early return that runs only when `subscriptionID` is null and
`sellableKind` is set. It settles with
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
sellable settle path never calls `saveCustomer` (`updatePaymentProvider`
before master renamed it).

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

Decision. `InvoiceItem` gets `fulfilledAt` and `revokedAt`; the kind is on
the invoice ([D31](#d31-one-sellable-kind-per-invoice)).
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
- A CHECK constraint keeps an invoice from being both a subscription invoice
  and a sellable invoice.
- Concurrent runs can both call the handler. Correctness depends on the
  handler's own conditional writes, not on the marker.

## D4: InvoicePaidNotifier becomes a register() fan-out

Context. `InvoicePaidNotifier` injected exactly one `@Optional`
`INVOICE_PAID_LISTENER` and swallowed its errors. Only `RenewalMailModule`
bound the token. While this branch was open, master added a `register()` next
to the token for `PaymentMethodChangeService`.

Decision. The token goes away. The notifier keeps a list, `register(listener)`
ignores duplicates, and `notify` calls each listener in registration order in
its own try/catch. `RenewalSuccessMailService`, `PaymentMethodChangeService`
and `SellableFulfilmentService` register themselves in `onModuleInit`.

Why. Every listener registers the same way. `PaymentsModule` is a static
singleton, so every module sees the same notifier.

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

Context. A block will have to resolve gift offers, so `block-content` will
depend on the gift code lib. Another design put gift codes in a folder
inside `libs/membership/api`.

Decision. New lib `libs/gift-code/api`, project `gift-code-api`, alias
`@wepublish/gift-code/api`.

Why. The dependency edges stay explicit, and gift codes stay free of
membership until redemption needs it.

Consequences. `gift-code/api` must never import `block-content`, and
imports `image/api` narrowly because of the image/peering cycle. From
`membership` it imports only the GraphQL `Invoice` type, since paying an
invoice with a code ([D36](#d36-gift-codes-pay-open-subscription-invoices))
returns one; no membership module or service. Once a gift block in `block-content` imports `gift-code/api`, the loop
gift-code → member-plan → page → block-content → gift-code is back, and
`MemberPlanModule` and `MemberPlanDataloader` have to come in through
`forwardRef` again.

## D11: Offers are picked per subscribe block

Dropped by Karl ([D32](#d32-website-and-gift-block-come-later)). The
subscribe block no longer has `giftCodeOfferIds`, and offer writes no longer
flush the cache. The original decision stays here for the record.

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
`myGiftCodes` and retry payment with `payGiftCode`; the website list for them
comes with the website step (D32).

Consequences. Widening `userInvoices` is a later step, once the invoice list
handles a null subscription.

## D17: Ship dark behind the gift-codes feature

Context. Redemption does not exist yet.

Decision. `@Feature('gift-codes')` on both resolvers and every editor entry
point. `myGiftCodes` returns `[]` instead of failing while the flag is off,
because a profile page will query it on every tenant.
`GiftCodeSellableHandler.isAvailable` reads the flag, so open orders cannot be
paid while it is off.

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
  `createStandaloneInvoicePayment` checks for every line of the invoice; see
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
  (the invoice's `paidAt` is set) lets the editor show "unpaid", and later
  the website offer to pay.
- The buyer sees the code before paying. Until the 14-day timeout cancels it,
  an unpaid code is valid. Once redemption exists, it can be redeemed in that
  window. The editor's checkbox says so.

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

## D29: One gift offer per member plan

Decided by Karl.

Context. Nothing stopped an editor from creating several offers for the same
member plan, for example one per periodicity. A page would then show offers
that differ only in their name.

Decision. `GiftCodeOffer.memberPlanId` is unique. `createGiftCodeOffer` and
`updateGiftCodeOffer` check for another offer on the plan first and reject
with BadRequest "This member plan already has a gift offer." A P2002 from a
concurrent write is mapped to the same message.

Why. With one offer per plan, a page never shows two gifts that differ only
in their name, and a plan's gift offer can be looked up by plan.

Consequences.
- Gifting a second periodicity of the same plan needs a second member plan.
- Moving an offer to another plan fails when that plan already has one.

## D30: Discount codes on gift purchases, opt-in per offer

Decided by Karl.

Context. Media hand out discount codes per member plan. A buyer gifting that
plan should be able to use the same code, but not every medium wants
discounted gifts.

Decision. `GiftCodeOffer.allowDiscountCodes` (default false). When it is set,
`purchaseGiftCode` takes a `discountCode` and checks it with the subscription
rules: same member plan, stored lower-case, inside `validFrom` and `validTo`.
The discount is `Math.round(price * discountPercent / 100)`, the gift's
`InvoiceItem.amount` is the price minus that, and the item's `discountCodeId`
points at the code. `SellableLineDraft` got an optional `discountCodeId` that
checkout writes onto the item, so the next product can reuse it. A code on an
offer without the switch is rejected. A website can check the code with the
existing `createSubscriptionInfo` query before submit.

Why. Codes are already scoped to a member plan, and a gift offer has exactly
one plan, so no new code type or scope was needed. The per-offer switch keeps
discounted gifts off unless a medium asks for them.

Consequences.
- A 100 % code makes the gift free. Such an order is paid at once without a
  provider (D33).
- The lookup is a copy of `DiscountCodeService.getValidDiscountCode` inside
  `GiftCodeService`, because `gift-code/api` does not import `membership`
  (D10). Once the gift block makes `block-content` import `gift-code/api`,
  that import would also close a loop through `member-plan` and `page`. When
  the rules for discount codes change, both places need the change.
- Discount code usage counts in the editor come from invoice items, so a
  gift purchase counts as a use of the code.

## D31: One sellable kind per invoice

Decided by Karl.

Context. The kind was first stored on each `InvoiceItem`, so every reader had
to query the items to learn whether an invoice sells something, and an invoice
could in theory mix kinds.

Decision. An invoice sells one kind of thing, possibly several items of that
kind, never mixed kinds. `sellableKind` moved from `InvoiceItem` to `Invoice`
(nullable, indexed). `isSellableInvoice` is a pure check
(`!subscriptionID && sellableKind != null`). `SellableCheckoutService.checkout`
takes one `kind` and writes it on the invoice. Fulfilment, revocation, the
availability and payment method checks and the redirect URL look up one
handler through `invoice.sellableKind`. The reconciler filters on
`Invoice.sellableKind` instead of `items.some`. The `fulfilledAt` and
`revokedAt` markers stay on the items.

Why. One handler per invoice matches how products are sold, removes the item
count queries, and lets the database keep subscription and sellable invoices
apart.

Consequences.
- CHECK `invoices_subscription_or_sellable_check`:
  `"subscriptionID" IS NULL OR "sellableKind" IS NULL`. The old item-level
  `invoices.items_claim_requires_kind_check` is gone, since a CHECK cannot
  look at the invoice.
- GraphQL exposes `Invoice.sellableKind`; `InvoiceItem.sellableKind` is gone.
- A future basket with several kinds would need one invoice per kind.

## D32: Website and gift block come later

Decided by Karl.

Context. The first version also had a website side: an "Abonnieren /
Verschenken" toggle and a purchase form in the subscribe block, "Meine
Gutscheine" in the profile, builder slots, mocks and translations. The
subscribe block chose its offers through `giftCodeOfferIds` (D11).

Decision. All website work and the subscribe block integration are removed
for now. Karl builds the website side with us later, and offers go into a
separate gift block instead of the subscribe block. The API keeps what the
website will call: `purchaseGiftCode`, `payGiftCode`, `myGiftCodes` and the
offer fields.

Why. Karl wants gift offers in a block of their own, and wants to build the
website side together with us.

Consequences.
- `SubscribeBlock` has no `giftCodeOfferIds` or `giftCodeOffers`, and the
  editor's subscribe block has no offer select.
- Nothing imports `gift-code/api` except `app.module.ts`, so its modules need
  no `forwardRef` and offer writes invalidate no cache. The gift block brings
  both back (D10, [04-api.md](04-api.md#offers-gift-code-offerresolverts)).
- Until then a reader cannot buy a gift; only the API and the editor exist.

## D33: CHF 0 invoices are paid without a provider

Decided by Karl.

Context. A 100 % discount code made a gift free, and the purchase was
rejected. Karl called that a bug. The same gap existed before gift codes: a
new subscription whose first invoice a 100 % code brings to 0, and an upgrade
whose leftover credit and discount cover the whole invoice, went to the
provider with an amount of 0, which Stripe, Payrexx and Mollie reject or
mishandle.

Decision. `PaymentsService.startIntent`, which both
`createPaymentWithProvider` (subscriptions, upgrades) and
`createStandaloneInvoicePayment` (sellables) go through, has one zero-total
branch. When the items add up to 0 or less, it creates the `Payment` in state
`paid` with no intent, runs the provider's `updatePaymentWithIntentState`
with `{paymentID, state: paid}` and calls `InvoicePaidNotifier.notify`, then
returns the paid payment. `provider.createIntent` is never called. The guards
"This discount code makes the gift free, which is not supported." and "Zero
totals are not supported by checkout" are gone.

Why. One branch in the shared place fixes gifts, new subscriptions and
upgrades alike, and the paid pipeline that follows is the one every paid
intent already runs: `paidAt` and `paidUntil` for a subscription,
`settleSellableInvoice` and fulfilment for a sellable. The website's
`handlePayment` already treats a `paid` payment as done and redirects to the
success page.

Consequences.
- The payment method is still validated (offer methods, availability, a
  running payment, paid or canceled invoice) before the zero branch.
- The paid payment has an empty `intentSecret`, because GraphQL's
  `Payment.intentSecret` is non-null. Without it the mutation failed with
  "Cannot return null for non-nullable field" although the invoice was
  already paid.
- No `PaymentProviderCustomer` is looked up or saved for a 0 invoice. A
  subscription that started at 0 therefore has no stored card; its first
  non-zero renewal is charged like any renewal without a customer.
- The subscription side effects of `createPaymentWithProvider` still happen:
  `confirmed=true` and the gradual payment method migration.
- `PayrexxSubscriptionPaymentProvider.updatePaymentWithIntentState` falls
  back to the base logic when the intent state carries no Payrexx
  subscription data. Its webhook only ever reports transactions with a
  subscription, so this branch is only reached by the zero-total path, and a
  0 first invoice is settled locally without creating a remote subscription.
- Off-session renewals in the periodic job call `createIntent` directly and
  are not covered by this branch.
- Discount codes have no usage limit. A 100 % code on an offer with
  `allowDiscountCodes` lets anyone with the code create free gift codes, and a
  100 % code on a plan gives free subscriptions the same way. See
  [open-questions.md](open-questions.md#not-decided-yet).
- A payment method change whose open invoice is 0 behaves like one whose
  payment is paid right away: `start` returns it still pending (the
  notification fires before the change is linked to the payment), and the
  reader's next `check` completes it and switches the subscription. No token
  of the new method is stored, so its renewals are not charged off session
  until the reader authorizes it.

## D34: Admins can create codes without a purchase

Decided by Karl.

Context. Editors want to hand out gift codes at events and in partnerships,
without anyone buying them.

Decision. `createGiftCodes(offerId, count, recipientName)` with
`CanUpdateGiftCodes` creates 1 to 500 codes for an offer, inactive offers
included. They are issued at once (`issuedAt` now, `expiresAt` from the
offer's window), take the offer's snapshot fields like a purchase, and record
the admin in `createdByUserId`. There is no invoice, no invoice item and no
payment. `GiftCode.invoiceItemId` and `recipientName` became nullable, and a
CHECK makes sure a code without an invoice item is issued. The derived
`source` field (`purchase` or `admin`) and the `source` filter tell the two
apart.

Why. The code, status and redemption logic stay the same for both kinds, and
an empty `invoiceItemId` keeps admin codes out of the sellable reconciler and
fulfilment without a special case.

Consequences.
- `amount`, `currency`, `invoiceId` and `paid` are null for admin codes, and
  the `paid` filter matches neither value for them.
- Cancelling an admin code only cancels the code; there is no invoice to
  close and nothing is notified.
- An empty or blank recipient name is stored as null, never as `""`. A
  purchase still requires a name.
- Offer deletion counts admin codes too ("This offer has gift codes.").
- Admin codes bring no revenue and do not appear in invoice-based statistics.

## D35: Gift offers decide how the redeemed subscription renews

Decided by Karl.

Context. A subscription started with a gift code needs to know whether it
renews when the gift period ends, and with which payment method.

Decision. `GiftCodeOffer.autoRenew` (default false) and
`GiftCodeOffer.renewalPaymentMethodId` (FK, SetNull). Both are copied onto
every `GiftCode` at purchase and when an admin creates codes, so a later
offer edit does not change codes already out there. The redemption into a new
subscription will use the code's values. Offer create/update validate the
pair like `createSubscription` does for a normal subscription: renewal needs
an extendable plan and a method from the plan's `availablePaymentMethods` for
the offer's periodicity, active and not retired.

Consequences.
- A row with `forceAutoRenewal` needs no own rule here: a renewal method is
  only accepted together with `autoRenew` true, and without renewal there is
  no method that could force it.
- The renewal method does not need standalone invoice support.
- Deleting the payment method nulls it on offers and codes; an offer saved
  afterwards must pick a new method or turn renewal off.

## D36: Gift codes pay open subscription invoices

Decided by Karl.

Context. A reader who already has a subscription and receives a gift code for
the same plan should be able to use it for the next invoice, instead of only
for a new subscription.

Decision. `payInvoiceWithGiftCode(invoiceId, code): Invoice`, `@Authenticated`
and `@Feature('gift-codes')`. The invoice must belong to a subscription of the
session user, be unpaid and not canceled, and not be a sellable invoice. A
code matches when its snapshot `memberPlanId` equals the subscription's
`memberPlanID` and its `periodicity` equals the subscription's
`paymentPeriodicity`. The amount does not matter: the entitlement was fixed
at purchase, and a code pays exactly one invoice whatever it costs today. The
code is claimed with one `updateMany` (issued, not canceled, not redeemed, not
expired, matching plan and periodicity) that sets `redeemedAt`,
`redeemedByUserId`, `redeemedSubscriptionId` and the new `redeemedInvoiceId`.
Only when that claim hits exactly one row is the invoice paid, through
`PaymentsService.settleSubscriptionInvoiceWithoutCharge`, which reuses the
CHF 0 branch of [D33](#d33-chf-0-invoices-are-paid-without-a-provider): a
`Payment` for the subscription's payment method in state `paid`, the
provider's `updatePaymentWithIntentState({paymentID, state: paid})` (so
`paidAt`, `paidUntil` and the removal of an `invoiceNotPaid` deactivation
happen exactly as for a real payment), then `InvoicePaidNotifier.notify`.

Why. One claim plus the existing paid pipeline keeps a code from paying twice
and keeps the subscription side identical to any other paid invoice, renewal
mail included.

Consequences.
- Unknown, expired, redeemed, canceled and mismatched codes all get the same
  error, "This gift code cannot pay this invoice.", so the mutation tells a
  guesser nothing. Input that is no code at all gets it too.
- `GiftCodeAttemptLimiter` allows 10 attempts per user per hour, counted
  before anything is checked and reset after a success. It uses the Dragonfly
  `DistributedCounters` that TOTP uses, plus a per-replica count as a
  fallback when Dragonfly is off or down. The 11th attempt gets Forbidden
  ("Too many gift code attempts. Please try again in an hour.").
- `GiftCode.redeemedInvoiceId` is `@unique`, so two codes racing for the same
  invoice cannot both win; the loser gets "This invoice cannot be paid with a
  gift code." `redeemedSubscriptionId` lost its `@unique`, because one
  subscription can be paid by several codes over the years.
- Before the claim, `PaymentsService.assertSubscriptionInvoiceSettleable`
  runs every check the settling does (open subscription invoice, no running
  payment, configured provider, not remotely managed). So an error that only
  a valid code could reach does not exist, and the mutation is no oracle.
- If settling fails anyway, the claim is released with a compare-and-set on
  `redeemedInvoiceId` and `redeemedAt`, unless the invoice is already paid by
  then; in that case the claim stays, the error is logged and the reader gets
  the paid invoice.
- A payment that is still running for the invoice (created in the last
  minute) blocks the gift code like it blocks a second provider payment.
- A subscription whose provider charges it on its own
  (`remoteManagedSubscription`, Payrexx subscriptions) is refused, because
  the provider would still charge the reader for the period the code paid.
- A chargeback of the gift purchase after the code paid an invoice cancels
  the code as before (`cancelForInvoiceItem` logs a warning for a redeemed
  code). The subscription invoice it paid stays paid.
- The subscription's payment method does not need to be active, but its
  provider must still be configured, because its
  `updatePaymentWithIntentState` runs. Otherwise the invoice is refused
  before the code is claimed.
- The subscription's payment method stays as it is: no migration to the
  plan's `migrateToTargetPaymentMethodID`, no customer lookup or storage. The
  `Payment` row records the current method for bookkeeping only.
- A code issued before payment can pay an invoice while its own purchase is
  still unpaid, like any early-issued code
  ([D27](#d27-codes-can-be-issued-before-payment-per-offer)).
- The code's `autoRenew` and `renewalPaymentMethodId` are ignored here; the
  subscription keeps its own renewal settings.
- Only the API and the editor list exist. The website does not offer the
  field yet.

## D37: Gift durations are what the plan sells

Decided by Karl.

Context. The offer form listed the durations that had their own row in
`periodicityPricing`. A plan with only a monthly row (the base the other
prices derive from) that sells only yearly showed "Monthly", a duration
nobody can subscribe to, and not "Yearly".

Decision. An offer's periodicity must be one the plan sells: some
`availablePaymentMethods` row lists it, the same source the website's
subscribe form uses. Its price is the derived period price
(`getPeriodPriceRange`), which must be above 0. The API checks both on
create and update; the editor form offers only those durations and computes
them from the plan it already loads, with the price helper it shares with the
subscribe block.

Consequences.
- No extra API query: the editor helper and the API helper derive prices the
  same way (base row = the monthly row, else the cheapest priced row per
  month).
- Changing a plan's payment config so it stops selling an offer's
  periodicity does not touch the offer, but its next save is rejected until
  the duration is changed.
