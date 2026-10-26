# Payments

What changed in the payment path to take money for an invoice without a
subscription, and what was left alone on purpose. The contract a product
sees is in [01-selling-things.md](01-selling-things.md); this file is for
whoever touches the payment code next.

## Left byte-identical for subscriptions

The rule was that a subscription invoice must run the same code and the same
queries as before. Characterization specs were written against the unchanged
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
  subscription lookup, the paid and chargeback branches,
  `updatePaymentProvider`.
- `PayrexxSubscriptionPaymentProvider`'s own override of
  `updatePaymentWithIntentState`. It can never be chosen for a sellable
  invoice.
- `createPaymentFromSubscription`.
- The `sendMail` contract of `markInvoiceAsPaid`.
- `getUserInvoices`.
- The periodic job's `findAllOpenInvoices`, `findUnpaidDueInvoices`,
  `findUnpaidScheduledForDeactivationInvoices` and their "has no subscription
  assigned" throws. Sellable invoices never enter `processRun`.

## What changed

### `InvoicePaidNotifier` (`invoice-paid.listener.ts`)

The notifier now calls every listener registered with `register()`. The
`INVOICE_PAID_LISTENER` token is gone from the code and from
`libs/payment/api/src/index.ts`. `RenewalSuccessMailService` registers itself
in `onModuleInit`, and `RenewalMailModule` imports `PaymentsModule`.
Semantics in [01-selling-things.md](01-selling-things.md#notify-means-settlement-may-have-changed).

### `BasePaymentProvider` (`payment-provider.ts`)

`supportsStandaloneInvoices` is added to the `PaymentProvider` interface and
defaults to `false` on `BasePaymentProvider`. Five providers override it with
`true`.

`updatePaymentWithIntentState` keeps the payment `findUnique` and `update` and
the invoice `findUnique` exactly as they were. One block goes in before
`if (!invoice || !invoice.subscriptionID) throw`:

```ts
if (invoice && !invoice.subscriptionID && (await isSellableInvoice(this.prisma, invoice))) {
  await settleSellableInvoice(this.prisma, invoice.id, intentState.state);
  return updatedPayment;
}
```

Subscription invoices fail the first condition and run no extra query. A
subscription-less invoice without sellable items still throws. The sellable
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
chargeback and returns. The loop and its rethrow are unchanged.

### `PaymentsService` (`payments.service.ts`)

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
  canceled, a total above 0, a usable method, a method every sellable line's
  handler allows (`SellableHandler.allowedPaymentMethodIds`, see
  [01-selling-things.md](01-selling-things.md)) and no running payment. It calls
  `startIntent` with `saveCustomer: false` and `customerID: undefined` and
  never reads `PaymentProviderCustomer`.
- `decorateUrlWithInvoiceInformation` adds `invoiceId`, `amount` (total / 100),
  `currency` and `sellableKind` (first item's kind) to the success and failure
  URLs. Invalid URLs pass through unchanged, like
  `decorateUrlWithSubscriptionInformation`.
- `createPaymentFromInvoice` gets a buyer branch: when the invoice has no
  subscription, it requires `invoice.userID === userId` and a sellable
  invoice (otherwise "Invoice not found") and hands over to
  `createStandaloneInvoicePayment`. The subscription branch is unchanged
  apart from `!invoice || !invoice.subscriptionID` becoming `!invoice`, since
  the second half can no longer be reached.

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
- `deleteInvoice` refuses invoices with sellable items: "Invoices that sell
  products cannot be deleted. Cancel them instead." `updateInvoice` refuses
  item changes on them the same way.

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
