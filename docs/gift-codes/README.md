# Gift codes

A reader buys a gift code (Geschenkgutschein) for one member plan and one
periodicity, for example "Jahresabo Digital, 1 Jahr", and pays for it like a
subscription. The code is issued once the payment is confirmed, or right at
the order when the offer is set to issue before payment. The buyer hands it to
someone else, who will later redeem it for a CHF 0.00 subscription. Admins
can also create codes without a purchase, for example to hand out at an
event. The product spec is the German pitch "Geschenkgutscheine für We.Publish" from
20 October 2026.

Gift codes are the first product sold through a new, reusable "sellable"
contract in `libs/payment/api`. Most of the work in this change sits in that
contract and in the payment path; the gift code lib on top of it is small.

## Scope

This change covers the API and the editor for buying a gift code:

- offers in the editor (plan, periodicity, name, description, image, active,
  optional redemption window in months, the payment methods buyers can use,
  whether the code is issued before payment, whether buyers may enter a
  discount code, and whether the subscription a code starts renews
  automatically and with which of the plan's payment methods). Each member
  plan has at most one offer
  ([D35](decisions.md#d35-gift-offers-decide-how-the-redeemed-subscription-renews)).
- the GraphQL operations a website needs to sell codes: `purchaseGiftCode`,
  `payGiftCode` and `myGiftCodes`
- a standalone invoice per purchase, paid through the existing payment
  providers
- issuing the code when the invoice is paid, by any path: webhook, polling,
  the buyer re-checking, an admin marking it paid. An offer with
  `issueBeforePayment` issues it at the order instead.
- cancelling the code on chargeback, on an unpaid timeout, or by hand in the
  editor
- a gift code list in the editor, with status, payment (paid or unpaid) and
  source filters, the buyer and the redeemer side by side, and a dialog that
  creates up to 500 issued codes without a purchase
  ([D34](decisions.md#d34-admins-can-create-codes-without-a-purchase))
- paying an open subscription invoice with a gift code for the same plan and
  periodicity (`payInvoiceWithGiftCode`, API and editor list only;
  [D36](decisions.md#d36-gift-codes-pay-open-subscription-invoices))
- CHF 0 invoices. A 100 % discount code makes a gift free, and the order is
  paid at once without a provider. The same branch fixes new subscriptions and
  upgrades that come to CHF 0, which used to go to the provider with an
  amount of 0 ([D33](decisions.md#d33-chf-0-invoices-are-paid-without-a-provider)).

Left for later:

- the website side: the purchase form, the buyer's list of codes in the
  profile, and a separate gift block that shows offers on a page. Karl builds
  these later; the subscribe block stays as it is
  ([D32](decisions.md#d32-website-and-gift-block-come-later)).
- redemption (entering a code and getting a CHF 0.00 subscription). The data
  model already has the columns for it; see
  [02-data-model.md](02-data-model.md#what-redemption-will-use).
- every email and the PDF voucher. The spec's PDF template, the mail template,
  "PDF herunterladen" and "E-Mail erneut senden" are all out of scope. Today
  an admin sees the code in the editor list, and the buyer can read it through
  `myGiftCodes`.
- Stripe dispute handling, Bexio support, and widening `userInvoices` to show
  gift invoices. See [03-payments.md](03-payments.md#known-limits).

## The flow

```
Buyer (website, later)       API                                   Provider
---------------              ---                                   --------
picks offer, recipient  ──>  purchaseGiftCode
name, method                 └ SellableCheckoutService.checkout
                               ├ tx: Invoice (subscriptionID null, userID = buyer,
                               │              sellableKind giftCode)
                               │     InvoiceItem
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
reads the code        <──   myGiftCodes (GiftCode.code shown once issued)
```

A chargeback, an admin cancel or the 14-day unpaid timeout sets `canceledAt` on
the invoice instead. The same `notify` call then lets the handler cancel the
code and marks `InvoiceItem.revokedAt`. That also cancels a code issued before
payment. The lifecycle is described in
[01-selling-things.md](01-selling-things.md).

## Feature flag

Everything ships dark behind the `gift-codes` feature (`stage: 'alpha'` in
`libs/features/src/lib/features.ts`). The flag covers both gift code
resolvers, the editor pages, sidebar entries and command palette entries.
`myGiftCodes` is the one exception: it has no `@Feature` and returns `[]`
while the flag is off, so a profile page can query it on every tenant
without a failing request. The gift code handler's
`isAvailable` also reads the flag, so switching it off stops payments of open
orders too. The flag stays off until
redemption exists, because a medium must not sell codes nobody can redeem
([D17](decisions.md#d17-ship-dark-behind-the-gift-codes-feature)).

The sellable contract and the payment changes are not behind the flag. The
sellable parts do nothing until something creates an invoice with
`sellableKind` set. The CHF 0 branch is live for subscriptions and upgrades on
every medium as soon as this ships.

## Files

- [decisions.md](decisions.md): decision log, D1 to D37, including the
  defaults picked for open questions and Karl's later changes.
- [01-selling-things.md](01-selling-things.md): the sellable contract in
  `libs/payment/api` and how to sell a new kind of thing.
- [02-data-model.md](02-data-model.md): Prisma changes, delete rules, status
  derivation, code format.
- [03-payments.md](03-payments.md): what changed in the payment path,
  idempotency, chargebacks by provider, known limits.
- [04-api.md](04-api.md): GraphQL queries and mutations, guards, security
  rules.
- [05-editor-and-website.md](05-editor-and-website.md): editor pages, and
  what the website and the gift block will build on later.
- [open-questions.md](open-questions.md): questions for Karl and the default
  that is built until he answers.

The lib READMEs (`libs/payment/api/README.md`, `libs/gift-code/api/README.md`)
carry the short version of the same rules for people working inside those
libs.
