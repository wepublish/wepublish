# Gift codes

A reader buys a gift code (Geschenkgutschein) for one member plan and one
periodicity, for example "Jahresabo Digital, 1 Jahr", and pays for it like a
subscription. The code is issued once the payment is confirmed, or right at
the order when the offer is set to issue before payment. The buyer hands it to
someone else, who will later redeem it for a CHF 0.00 subscription. The
product spec is the German pitch "Geschenkgutscheine für We.Publish" from
20 October 2026.

Gift codes are the first product sold through a new, reusable "sellable"
contract in `libs/payment/api`. Most of the work in this change sits in that
contract and in the payment path; the gift code lib on top of it is small.

## Scope

This change covers buying a gift code:

- offers in the editor (plan, periodicity, name, description, image, active,
  optional redemption window in months, the payment methods buyers can use,
  whether the code is issued before payment, and whether buyers may enter a
  discount code). Each member plan has at most one offer.
- an "Abonnieren / Verschenken" toggle on the subscribe block and a purchase
  form in gift mode
- a standalone invoice per purchase, paid through the existing payment
  providers
- issuing the code when the invoice is paid, by any path: webhook, polling,
  the buyer re-checking, an admin marking it paid. An offer with
  `issueBeforePayment` issues it at the order instead.
- cancelling the code on chargeback, on an unpaid timeout, or by hand in the
  editor
- a gift code list in the editor and "Meine Gutscheine" in the website profile

Left for later:

- redemption (entering a code and getting a CHF 0.00 subscription). The data
  model already has the columns for it; see
  [02-data-model.md](02-data-model.md#what-redemption-will-use).
- every email and the PDF voucher. The spec's PDF template, the mail template,
  "PDF herunterladen" and "E-Mail erneut senden" are all out of scope. Today
  the buyer sees the code in "Meine Gutscheine" and an admin sees it in the
  editor list.
- Stripe dispute handling, Bexio support, and widening `userInvoices` to show
  gift invoices. See [03-payments.md](03-payments.md#known-limits).

## The flow

```
Buyer (website)              API                                   Provider
---------------              ---                                   --------
picks offer, recipient  ──>  purchaseGiftCode
name, message, method        └ SellableCheckoutService.checkout
                               ├ tx: Invoice (subscriptionID null, userID = buyer)
                               │     InvoiceItem (sellableKind giftCode)
                               │     GiftCode (status ordered, code generated)
                               └ createStandaloneInvoicePayment ───>  intent
                                 (customerID undefined,              (redirect,
                                  saveCustomer false)                 Stripe Elements)
pays at the provider  ───────────────────────────────────────────>
                             webhook / polling / checkInvoiceStatus
                             / admin markInvoiceAsPaid / nightly poll
                             └ settleSellableInvoice: paidAt set once
                             └ InvoicePaidNotifier.notify(invoiceId)
                               └ SellableFulfilmentService.reconcileInvoice
                                 ├ GiftCodeSellableHandler.fulfil
                                 │ └ issueForInvoiceItem: issuedAt, expiresAt
                                 └ mark InvoiceItem.fulfilledAt
sees the code in
"Meine Gutscheine"     <──   myGiftCodes (GiftCode.code shown once issued)
```

A chargeback, an admin cancel or the 14-day unpaid timeout sets `canceledAt` on
the invoice instead. The same `notify` call then lets the handler cancel the
code and marks `InvoiceItem.revokedAt`. That also cancels a code issued before
payment. The lifecycle is described in
[01-selling-things.md](01-selling-things.md).

## Feature flag

Everything ships dark behind the `gift-codes` feature (`stage: 'alpha'` in
`libs/features/src/lib/features.ts`). The flag covers both gift code
resolvers, the `SubscribeBlock.giftCodeOffers` resolver (it returns `[]` while
the flag is off), the editor pages, sidebar entries and command palette
entries, and the subscribe block's offer select. `myGiftCodes` is the one
exception: it has no `@Feature` and returns `[]` while the flag is off,
because every tenant's profile page queries it. The gift code handler's
`isAvailable` also reads the flag, so switching it off stops payments of open
orders too. The flag stays off until
redemption exists, because a medium must not sell codes nobody can redeem
([D17](decisions.md#d17-ship-dark-behind-the-gift-codes-feature)).

The sellable contract and the payment changes are not behind the flag. They
are inert until something creates an invoice with a sellable item.

## Files

- [decisions.md](decisions.md): decision log, D1 to D30, including the
  defaults picked for open questions and Karl's later changes.
- [01-selling-things.md](01-selling-things.md): the sellable contract in
  `libs/payment/api` and how to sell a new kind of thing.
- [02-data-model.md](02-data-model.md): Prisma changes, delete rules, status
  derivation, code format.
- [03-payments.md](03-payments.md): what changed in the payment path,
  idempotency, chargebacks by provider, known limits.
- [04-api.md](04-api.md): GraphQL queries and mutations, guards, security
  rules.
- [05-editor-and-website.md](05-editor-and-website.md): editor pages, the
  subscribe block toggle, "Meine Gutscheine", builder slots.
- [open-questions.md](open-questions.md): questions for Karl and the default
  that is built until he answers.

The lib READMEs (`libs/payment/api/README.md`, `libs/gift-code/api/README.md`)
carry the short version of the same rules for people working inside those
libs.
