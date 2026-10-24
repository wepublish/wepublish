# Selling things: the sellable contract

Until now We.Publish could sell exactly one thing, a subscription for the
person at the checkout. Goodies and discount codes hang off that subscription
invoice. A gift code has no subscription behind it, yet something still has
to happen once the money arrives.

Everything generic about that lives in `libs/payment/api/src/lib/sellable/`
and is exported from `libs/payment/api/src/index.ts`. `payment/api` is the
lowest lib that payment code dispatches from, and it must not import
`membership`, `member-plan` or any product lib. Products implement the
contract in higher libs. Gift codes (`libs/gift-code/api`) are the first one.

The payment-side changes that make this work are in
[03-payments.md](03-payments.md). This file is about the contract a product
sees.

## The pieces

| File | What it holds |
| --- | --- |
| `sellable.model.ts` | `registerEnumType(SellableKind)`. GraphQL `InvoiceItem.sellableKind` and `Invoice.userID` are added in `libs/membership/api/src/lib/invoice/invoice.model.ts`. |
| `sellable-handler.ts` | `SellableInvoice`, `SellableRevokeReason`, `SellableHandler`, `SellableLineDraft` |
| `sellable-registry.service.ts` | `SellableRegistry`: `register(handler)` (throws on a duplicate kind), `get(kind)`, `kinds()`. Provided and exported by `PaymentsModule`, not `SellableModule`, because `PaymentsService` consults it and `SellableModule` already imports `PaymentsModule`. |
| `sellable-invoice.ts` | Plain functions, no DI: `isSellableInvoice`, `settleSellableInvoice`, `sellableTotal` |
| `sellable-fulfilment.service.ts` | `SellableFulfilmentService`, the notifier listener that fulfils or revokes |
| `sellable-checkout.service.ts` | `SellableCheckoutService.checkout` |
| `sellable-reconciliation.service.ts` | `SellableReconciliationService.reconcile`, run nightly |
| `sellable.module.ts` | `SellableModule`, registered in `apps/api-example/src/nestapp/app.module.ts` next to `PaymentsModule` |

The handler contract:

```ts
export type SellableInvoice = Invoice & { items: InvoiceItem[] };
export enum SellableRevokeReason { chargeback = 'chargeback', invoiceCanceled = 'invoiceCanceled' }
export interface SellableHandler {
  readonly kind: SellableKind;
  fulfil(item: InvoiceItem, invoice: SellableInvoice): Promise<void>;
  revoke(item: InvoiceItem, invoice: SellableInvoice, reason: SellableRevokeReason): Promise<void>;
  isAvailable?(): Promise<boolean>;
  allowedPaymentMethodIds?(item: InvoiceItem, invoice: SellableInvoice): Promise<string[] | undefined>;
}
export type SellableLineDraft = {
  kind: SellableKind;
  name: string;
  description?: string;
  amount: number;
  quantity: number;
  attach(tx: Prisma.TransactionClient, item: InvoiceItem): Promise<void>;
};
```

Three rules come with it:

- `fulfil` and `revoke` are idempotent and do not throw for rows that were
  already handled. They can run more than once for the same line, because
  the marker is written after they return.
- Each does its writes in one statement or one transaction, so a failure or
  a crash halfway never leaves half-done state.
- `attach` can run more than once, because checkout retries the whole
  transaction on P2002.

`allowedPaymentMethodIds` is optional. When a handler implements it and
returns a list, `createStandaloneInvoicePayment` refuses any payment method
that is not in the list of every sellable line ("Payment method cannot be used
for this purchase"). Leaving it out or returning `undefined` means no
restriction beyond the standalone-capable check. This is what stops a buyer
from paying a gift order through the generic `createPaymentFromInvoice` with a
method the offer does not list.

`isAvailable` is optional too. When it resolves false,
`createStandaloneInvoicePayment` refuses to start a payment with
`ForbiddenException` ("This purchase is currently not available"). The gift
code handler returns whether the `gift-codes` feature is on, so switching the
feature off also stops a buyer from paying an open order through
`createPaymentFromInvoice`. Settlement, fulfilment and revocation do not check
it on purpose: money that a provider already took for an open order still
issues the code, and a chargeback still cancels it.

## What a sellable invoice is

An invoice is sellable when `subscriptionID` is null and at least one of its
items has `sellableKind` set. `isSellableInvoice(prisma, invoice)` checks
exactly that, and skips the count query when `subscriptionID` is set. The
buyer is `Invoice.userID`. Only sellable invoices set it in V1.

The invoice is the order. There is no separate order table: amount is
`sellableTotal(items)`, currency is `Invoice.currency`, and the state is
`paidAt` and `canceledAt`.

## Lifecycle

1. Checkout. `SellableCheckoutService.checkout` validates the lines, checks
   the payment method with `payments.assertStandalonePaymentMethod`, then
   creates the invoice, its items and the product rows in one transaction. It
   commits, then starts the payment with
   `payments.createStandaloneInvoicePayment`. If starting the payment fails,
   the order stays open; the buyer can retry, and the reconciler cancels it
   once the unpaid window has passed.
2. Settle. Whatever path learns about the payment (webhook, immediate-paid
   checkout, the buyer's `checkInvoiceStatus`, an admin's `markInvoiceAsPaid`,
   the nightly poll) calls `settleSellableInvoice`. Paid sets `paidAt` only
   where `paidAt` and `canceledAt` are both null. Chargeback sets `paidAt`
   null and `canceledAt` only where `canceledAt` is null. Then it calls
   `InvoicePaidNotifier.notify(invoiceId)`.
3. Fulfil. If the invoice is paid and not canceled, each sellable item with
   neither marker set is passed to `handler.fulfil` and then marked
   (`fulfilledAt`). A product may already hand out its entitlement in
   `attach`, as a gift code offer with `issueBeforePayment` does. Its `fulfil`
   then finds nothing to do, and the line is still marked.
4. Revoke. If the invoice is canceled and unpaid, each item without
   `revokedAt` is passed to `handler.revoke` and then marked (`revokedAt`). That
   happens whether or not the item was fulfilled before. The reason is
   `chargeback` when the invoice has a payment in state `chargeback`,
   otherwise `invoiceCanceled`.

Since fulfilment requires `revokedAt` null and settling paid requires
`canceledAt` null, a payment that arrives after a cancel never fulfils
anything. It is logged ("payment received for canceled invoice") and needs a
manual refund.

A CHF 0 product, such as the later gift redemption, is not a checkout on
purpose. `checkout` rejects a zero total ("Zero totals are not supported by
checkout").

## notify means "settlement may have changed"

`InvoicePaidNotifier` keeps its name, but `notify(invoiceId)` no longer means
"this invoice was paid". It is also called after a chargeback, an unpaid
timeout and a resync. Every listener must read the invoice's current state and
decide for itself. Because each listener acts on the state it finds when it
runs, duplicate, lost and reordered events all end in the same state.

Listeners register themselves in `onModuleInit` with
`notifier.register(this)`. There is no DI token any more
(`INVOICE_PAID_LISTENER` was removed). `notify` calls the listeners one after
another in registration order, each in its own try/catch, logs failures with
`describeError`, and never rethrows. A listener that throws is retried by the
nightly reconciler, not by the caller.

The existing renewal success mail listener is unaffected: it returns when
`paidAt` is null, and its claim filters on `suppressRenewalSuccessMail=false`.

## Completion markers

`InvoiceItem.fulfilledAt` and `InvoiceItem.revokedAt` record that a line was
handled. `SellableFulfilmentService.reconcileInvoice` skips lines that already
carry the marker, runs the handler, and only then writes the marker:

```ts
await handler.fulfil(item, invoice);
await prisma.invoiceItem.updateMany({
  where: {id, fulfilledAt: null, revokedAt: null},
  data: {fulfilledAt: new Date()},
});
```

The order matters. If the process dies between the handler and the marker
(deploy, OOM), the marker is still null, so the next `notify` or the nightly
resync runs the handler again, and its idempotent write is a no-op. Writing
the marker first would leave a paid code `ordered`, or an early-issued code
valid after a chargeback, with nothing left to retry it. The price is
at-least-once instead of at-most-once: two concurrent runs can both call the
handler, which is why the handler contract requires idempotent writes.

When the handler or the marker write throws, the error is collected, the
remaining items still run, and at the end the service throws a
`SellableFulfilmentError`. The notifier logs it, and the nightly sweep tries
again. An item whose kind has no registered handler is logged and left
unmarked.

A CHECK constraint (`invoices.items_claim_requires_kind_check`) makes sure no
marker is ever set on a line without a `sellableKind`.

## Provider capability

A provider can take a standalone payment only if `supportsStandaloneInvoices`
is true. It defaults to false on `BasePaymentProvider` and is overridden to
true for Stripe, StripeCheckout, Payrexx, Mollie and Simulated.
`assertStandalonePaymentMethod` and `getStandalonePaymentMethods` filter on it,
together with "active" and "not retired".

A standalone payment never uses a saved customer: `startIntent` is called
with `customerID: undefined` and `saveCustomer: false`, and the settle path
never writes `PaymentProviderCustomer`. Mollie and Payrexx also do not
tokenize such a payment in off-session mode: they only create a Mollie
customer with `sequenceType: first`, or send Payrexx `preAuthorization`, when
`saveCustomer` is true or a stored `customerID` was passed (the renewal
fallback). A gift purchase is a Mollie `oneoff` payment and a plain Payrexx
gateway. With a stored customer, Stripe, Mollie
and Payrexx charge the saved card or mandate off-session without the buyer
choosing a method, and Mollie would hand back a fresh customer that replaces
the subscriber's renewal customer. Background in
[D2](decisions.md#d2-standalone-payments-never-use-a-saved-customer).

## The nightly reconciler

`SellableReconciliationService.reconcile(now)` runs as its own try/catch step
in `PeriodicJobExecutor.runNight`, after Mailchimp. It never throws, runs each
invoice in its own try/catch, caps each query at `take: 500`, and returns
`{polled, canceled, resynced, failed}`.

| Step | Finds | Does |
| --- | --- | --- |
| A, poll | Open sellable invoices created between 30 days and 10 minutes ago | For each payment with an `intentID` in state created, submitted, processing or requiresUserAction: `checkIntentStatus`, `updatePaymentWithIntentState`, then `notify` |
| B, unpaid timeout | Open sellable invoices with `scheduledDeactivationAt <= now` | `updateMany where paidAt null and canceledAt null` sets `canceledAt`, then `notify` |
| C, resync | Invoices from the last 90 days that are paid with an unfulfilled, unrevoked sellable item, or canceled and unpaid with an unrevoked sellable item | `notify` |

Step A repairs lost webhooks, step C repairs swallowed listener errors and a
crash between settle and notify. Lost webhooks older than 30 days are not
polled. If the nightly job is turned off, a paid code stays `ordered` until
the buyer opens "Meine Gutscheine" or an admin marks the invoice paid.

## How to sell a new kind of thing

1. Add a value to the `SellableKind` enum in `schema.prisma` and run a
   migration.
2. If the product needs its own data, add a table with
   `invoiceItemId String @unique` and `onDelete: Restrict` pointing at
   `InvoiceItem`. Do not add a column to `InvoiceItem`.
3. Write `XSellableHandler implements SellableHandler, OnModuleInit`. Set
   `kind`, call `registry.register(this)` in `onModuleInit`, and make `fulfil`
   and `revoke` idempotent single writes (a conditional `updateMany` is the
   usual shape). Keep the handler and everything it injects singletons: one
   request-scoped dependency (a dataloader, say) makes the handler
   request-scoped, Nest never calls its `onModuleInit`, and it never
   registers.
4. Write an `@Authenticated` mutation that validates its input, builds
   `SellableLineDraft[]` with an `attach` that creates the product row, and
   calls `SellableCheckoutService.checkout`. Import `SellableModule` and
   `PaymentsModule` (which provides `SellableRegistry`) in the product's
   module. Implement `allowedPaymentMethodIds` if the product restricts its
   payment methods. An admin path that cancels the product's open invoice
   calls `InvoicePaidNotifier.notify(invoiceId)` right after, so the line is
   revoked immediately instead of by the nightly resync.
5. Write specs for the handler (registers on init, fulfil and revoke
   delegate) and the mutation's validation. The settlement, notify, marker and
   reconciliation behaviour is already covered in `payment-api`.

Without touching any payment, webhook, invoice, editor or nightly code, the
new product gets settlement from every path, retried fulfilment and
revocation, chargeback and unpaid-timeout revocation, the nightly retry, buyer
ownership through `Invoice.userID`, and the provider capability filter.

Several lines in one `checkout` call make a cart. Gift codes use one line per
purchase.
