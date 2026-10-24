# payment-api

Payment methods, payment providers, webhooks and `PaymentsService`: everything
that takes money for an invoice. Subscriptions pay through it, and so does
anything sold without a subscription.

`src/lib/sellable/` holds the sellable contract for products bought on their
own, such as gift codes. A product implements `SellableHandler`, registers it
with `SellableRegistry` (provided by `PaymentsModule`), and sells through
`SellableCheckoutService`. Settlement, fulfilment, revocation and the nightly
retry then work without touching payment code. How it works and how to add a
product: [docs/gift-codes/01-selling-things.md](../../../docs/gift-codes/01-selling-things.md).
What changed in the payment path for it:
[docs/gift-codes/03-payments.md](../../../docs/gift-codes/03-payments.md).

Rules that hold here:

- This lib never imports `membership`, `member-plan` or a product lib.
  Products depend on it.
- `InvoicePaidNotifier.notify(invoiceId)` means "settlement may have changed".
  Listeners register with `register()` and read the invoice's current state.
- A standalone invoice payment never uses or stores a saved customer.

Tests: `pnpm nx test payment-api`.
