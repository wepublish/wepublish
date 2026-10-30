# Payments

What changed in the payment path to take money for an invoice without a
subscription, and what was left alone on purpose. The contract a product
sees is in [01-selling-things.md](01-selling-things.md); this file is for
whoever touches the payment code next.

## Left byte-identical for subscriptions

The rule was that a subscription invoice must run the same code and the same
queries as before. The one deliberate exception is an invoice of CHF 0, which
no longer goes to the provider (see [CHF 0 invoices](#chf-0-invoices)).
Characterization specs were written against the unchanged
code first and stay green:

- `payment-provider.update-intent-state.spec.ts`: paid, chargeback, customer
  storage and session cache reset, the subscription-less throw, the
  missing-period throw.
- `payments.service.spec.ts`: call order and arguments of
  `createPaymentWithProvider` (migration, `confirmed=true`, customer lookup,
  decorated URLs, `createIntent` props, the immediate-paid path, the
  `errorCode` throw).

What stays untouched for subscriptions:

- The whole subscription branch of `updatePaymentWithIntentState`: the
  subscription lookup, the paid and chargeback branches, `saveCustomer`.
- `PayrexxSubscriptionPaymentProvider`'s own override of
  `updatePaymentWithIntentState` for webhook data. It can never be chosen for
  a sellable invoice. Only an intent state without Payrexx subscription data,
  which its webhook never sends, now falls back to the base logic (see
  [CHF 0 invoices](#chf-0-invoices)).
- `createPaymentFromSubscription`.
- The `sendMail` contract of `markInvoiceAsPaid`.
- `getUserInvoices`.
- The periodic job's `findAllOpenInvoices`, `findUnpaidDueInvoices`,
  `findUnpaidScheduledForDeactivationInvoices` and their "has no subscription
  assigned" throws. Sellable invoices never enter `processRun`.

## What changed

### `InvoicePaidNotifier` (`invoice-paid.listener.ts`)

Master already had `register()` next to the `INVOICE_PAID_LISTENER` token,
for `PaymentMethodChangeService`. This change removes the token from the code
and from `libs/payment/api/src/index.ts`, so `register()` is the only way in,
and it ignores a listener that is already registered. Three listeners
register in `onModuleInit`: `RenewalSuccessMailService` (its
`RenewalMailModule` now imports `PaymentsModule`), `PaymentMethodChangeService`
and `SellableFulfilmentService`.
Semantics in [01-selling-things.md](01-selling-things.md#notify-means-settlement-may-have-changed).

### `BasePaymentProvider` (`payment-provider.ts`)

`supportsStandaloneInvoices` is added to the `PaymentProvider` interface and
defaults to `false` on `BasePaymentProvider`. Five providers override it with
`true`.

`updatePaymentWithIntentState` keeps the payment `findUnique` and `update` and
the invoice `findUnique` exactly as they were. One block goes in before
`if (!invoice || !invoice.subscriptionID) throw`:

```ts
if (invoice && isSellableInvoice(invoice)) {
  await settleSellableInvoice(this.prisma, invoice.id, intentState.state);
  return updatedPayment;
}
```

`isSellableInvoice` only reads `subscriptionID` and `sellableKind` from the
row already loaded, so subscription invoices run no extra query. A
subscription-less invoice without `sellableKind` still throws. The sellable
branch never stores `intentState.customerID`.

### Mollie and Payrexx (`mollie-payment-provider.ts`, `payrexx-payment-provider.ts`)

In off-session mode both used to tokenize every gateway payment. They now set
up a mandate (Mollie customer and `sequenceType: first`) or a Payrexx
preauthorization only when `saveCustomer` is true or a stored `customerID` was
passed. Subscription payments pass one of the two, so they behave as before.
A gift purchase passes neither and becomes a Mollie `oneoff` payment or a
plain Payrexx gateway.

### Webhook (`payment.webhook.ts`)

Notifies on `paid` and on `chargeback` (it used to be `paid` only). For a
subscription invoice the renewal listener sees `paidAt` null after a
chargeback and returns. `PaymentMethodChangeService` only acts on a pending
change whose payment belongs to the invoice; in the rare case that payment is
charged back while the change is still pending, the change ends as failed.
The loop, its rethrow and master's hand-over of `authorizationStates` to
`PaymentAuthorizationNotifier` are unchanged.

### `PaymentsService` (`payments.service.ts`)

- The constructor takes `SellableRegistry` as its last argument, after
  master's `NamespaceResets`.
- `startIntent` is extracted from `createPaymentWithProvider`: payment
  create, `createIntent`, payment update, the immediate-paid path
  (`checkIntentStatus`, `updatePaymentWithIntentState`, `notify`) and the
  `errorCode` throw. `createPaymentWithProvider` keeps its signature and all
  subscription side effects, then delegates.
- `assertNoRunningPayment(invoiceID)` is moved out of
  `createPaymentFromInvoice`; the existing caller still uses it.
- `assertStandalonePaymentMethod(paymentMethodId)` requires an active method,
  a configured provider, not retired (`isPaymentMethodRetired`), and
  `supportsStandaloneInvoices`. Otherwise it throws "Payment method cannot be
  used for this purchase".
- `getStandalonePaymentMethods(ids)` returns the usable methods in id order.
- `createStandaloneInvoicePayment({invoice, paymentMethodID, successURL, failureURL})`
  requires no subscription, a `userID`, a sellable invoice, neither paid nor
  canceled, a usable method, the handler of the invoice's
  kind reporting itself available, a method that handler allows for every
  line (`SellableHandler.allowedPaymentMethodIds`, see
  [01-selling-things.md](01-selling-things.md)) and no running payment. It calls
  `startIntent` with `saveCustomer: false` and `customerID: undefined` and
  never reads `PaymentProviderCustomer`.
- `decorateUrlWithInvoiceInformation` adds `invoiceId`, `amount` (total / 100),
  `currency` and the invoice's `sellableKind` to the success and failure
  URLs. Invalid URLs pass through unchanged, like
  `decorateUrlWithSubscriptionInformation`.
- `createPaymentFromInvoice` gets a buyer branch: when the invoice has no
  subscription, it requires `invoice.userID === userId` and a sellable
  invoice (otherwise "Invoice not found") and hands over to
  `createStandaloneInvoicePayment`. The subscription branch is unchanged
  apart from `!invoice || !invoice.subscriptionID` becoming `!invoice`, since
  the second half can no longer be reached.

### CHF 0 invoices

`startIntent` checks the total first (items' `amount * quantity`, the sum
every provider charges). At 0 or below it never calls `createIntent`: it
creates the `Payment` in state `paid` without an intent and with an empty
`intentSecret` (GraphQL `Payment.intentSecret` is non-null, as for
`NeverChargePaymentProvider`), calls the provider's
`updatePaymentWithIntentState({intentState: {paymentID, state: paid}})`, then
`InvoicePaidNotifier.notify`, and returns the paid payment. For a
subscription invoice that sets `paidAt` and `paidUntil` from the invoice's
period; for a sellable invoice it runs `settleSellableInvoice`, and the
notify fulfils the order. `createPaymentWithProvider` skips the customer
lookup for a 0 invoice but keeps the migration and `confirmed=true`.
`PayrexxSubscriptionPaymentProvider` falls back to the base logic for an
intent state without Payrexx subscription data, so a 0 first invoice is paid
locally and no remote subscription is created. Specs:
`payments.service.zero-total.spec.ts` (real Mollie and Payrexx Subscription
providers), the "a zero total" blocks in `payments.service.spec.ts`, and
`payrexx-subscription-payment-provider.spec.ts`. The decision is
[D33](decisions.md#d33-chf-0-invoices-are-paid-without-a-provider).

For subscriptions this fixes a bug that is older than gift codes: a new
subscription whose first invoice a 100 % discount code brought to 0, or an
upgrade whose credit and discount covered the whole invoice, used to reach
the provider with an amount of 0. Off-session renewals in the periodic job
and `member-context.chargeInvoice` still call `createIntent` directly; a 0
renewal only happens with a plan amount of 0 and behaves as before.

`settleSubscriptionInvoiceWithoutCharge(invoiceId)` is the public entry to
the same branch, used by `payInvoiceWithGiftCode`
([D36](decisions.md#d36-gift-codes-pay-open-subscription-invoices)). It
accepts only an open subscription invoice (BadRequest for a missing, sellable,
paid or canceled one), refuses while another payment of the invoice is
running, takes the subscription's payment method (active or not) and its
configured provider (BadRequest "paymentProvider not found" otherwise),
refuses a provider with `remoteManagedSubscription`, and pays the invoice
whatever its total. It never changes the subscription's payment method and
never reads or stores a provider customer.
`assertSubscriptionInvoiceSettleable(invoiceId)` runs the same checks without
paying, so a caller can refuse before it changes anything. Specs: the
`settleSubscriptionInvoiceWithoutCharge` and
`assertSubscriptionInvoiceSettleable` blocks in
`payments.service.zero-total.spec.ts`.

### `InvoiceService` (`libs/membership/api/src/lib/invoice/invoice.service.ts`)

- `markInvoiceAsPaid`: for an invoice without a subscription, throws
  NotFound unless it is sellable, otherwise calls
  `settleSellableInvoice(..., PaymentState.paid, {manuallySetAsPaidByUserId})`
  and always notifies, whatever `sendMail` says.
- `checkInvoiceStatus`: the owner is `subscription.userID` or, without a
  subscription, `invoice.userID`. The loop now works for sellable invoices
  because the provider no longer throws, and it already ends with `notify`.
- `createUserFilter` (admin filter only) matches
  `{OR: [{subscription: {userID}}, {userID}]}`.
- `deleteInvoice` refuses invoices with `sellableKind` set: "Invoices that
  sell products cannot be deleted. Cancel them instead." It reads only that
  column. `updateInvoice` refuses item changes on them the same way.

### Periodic job (`periodic-job.executor.ts`)

`runNight` resolves `SellableReconciliationService` and runs `reconcile()` in
a third isolated try/catch after Mailchimp. A failure is logged as "Sellable
reconciliation failed during periodic job" and does not affect the other
steps. What it does is in
[01-selling-things.md](01-selling-things.md#the-nightly-reconciler).

### Member plans (`member-plan.service.ts`)

`deleteMemberPlan` catches Prisma P2003 and throws "This member plan is still
used by subscriptions or gift codes and cannot be deleted." It does not reset
the plan caches on failure.

## Idempotency

| Event | Guard | Result when it happens twice or races |
| --- | --- | --- |
| Paid via webhook, buyer `checkInvoiceStatus`, nightly poll, admin `markInvoiceAsPaid` | `invoice.updateMany where paidAt null and canceledAt null` | Exactly one write sets `paidAt`; the others match 0 rows. `paidAt` never moves. |
| Fulfilment after any of those | Lines with `fulfilledAt` set are skipped; the marker is written after `fulfil` with `where fulfilledAt null and revokedAt null` | Concurrent runs can both call `fulfil`; a crash before the marker means the next run calls it again. |
| Code issue | `giftCode.updateMany where issuedAt null and canceledAt null` | A second issue is a no-op, which is what makes the repeated `fulfil` safe. |
| Chargeback | `invoice.updateMany where canceledAt null` | Set once. |
| Admin cancel of the code | `giftCode.updateMany where canceledAt null and redeemedAt null`, then the open invoice `where paidAt null and canceledAt null`, then `notify(invoiceId)` so the line is revoked and marked at once | A second cancel gets "Gift code cannot be canceled". |
| Unpaid timeout | `invoice.updateMany where paidAt null and canceledAt null` | Set once, and never on a paid invoice. |
| Revocation after chargeback, cancel or timeout | Lines with `revokedAt` set are skipped; the marker is written after `revoke` with `where revokedAt null` | `revoke` can run more than once; `cancelForInvoiceItem` only writes `where canceledAt null`. Runs whether or not the line was fulfilled. |
| Paid after cancel | `paidAt` write requires `canceledAt` null | Invoice stays canceled, no code is issued, a warning is logged. Needs a manual refund. |
| Lost webhook | Reconciler step A | Polled for 30 days. |
| Crash between settle and notify, or a listener error | Reconciler step C | Re-notified for 90 days. |
| Checkout code collision | `GiftCode.code @unique` | Whole transaction retried, up to 5 attempts. |
| Gift code pays a subscription invoice | `giftCode.updateMany where issuedAt not null, canceledAt null, redeemedAt null, not expired`, plus `GiftCode.redeemedInvoiceId @unique` | The same code cannot be used twice, and two codes cannot pay the same invoice. A failed settle releases the claim. |

Invoice and gift code state cannot regress. The `Payment` row can: the
unconditional `payment.update` at the top of `updatePaymentWithIntentState`
may downgrade it when webhooks arrive out of order. That limit existed before
this change.

## Chargebacks by provider

| Provider | Gift purchases | Reports chargeback | What happens to the code |
| --- | --- | --- | --- |
| Mollie | Yes | Yes, webhook and polling (`amountChargedBack > 0`) | Canceled automatically, reason `chargeback` |
| Payrexx (one-off) | Yes | Yes, webhook `chargeback` event. Gateway polling cannot see it. | Canceled automatically, reason `chargeback` |
| Stripe | Yes | No, `charge.dispute.*` events are dropped | Cancel by hand in the editor |
| Stripe Checkout | Yes | No | Cancel by hand in the editor |
| Simulated | Yes | No | Not applicable |
| Bexio | No | No | Not applicable |
| Payrexx subscription | No | No | Not applicable |
| NeverCharge | No | No | Not applicable |

The automatic path: webhook → `settleSellableInvoice(chargeback)` sets
`paidAt` null and `canceledAt` → `notify` → `reconcileInvoice` →
`GiftCodeSellableHandler.revoke` → the code is canceled with reason
`chargeback` → `revokedAt` is marked.

The reason is inferred from the presence of a payment row in state
`chargeback`. An out-of-order webhook could overwrite that payment state
before the revoke reads it, and the code would then say `invoiceCanceled`.
Only the label can be wrong; the code is revoked either way.

## Known limits

- Stripe and Stripe Checkout disputes do not cancel codes.
- Lost webhooks are polled for 30 days only. Simulated has no real polling.
- A payment that arrives after the order was canceled is captured but issues
  no code. It shows up in the editor (code canceled, payment paid) and must be
  refunded by hand.
- Without Bexio, media that sell "Rechnung" only through Bexio cannot sell
  gift codes.
- Dashboard revenue, expected revenue and `MediumStatsService` money include
  gift purchases with no member plan. Failed gift payments may appear in
  at-risk stats.
- The `Payment` row can still be downgraded by out-of-order webhooks (see
  above).
