# Gift codes

A reader buys a gift code (Geschenkgutschein) for one member plan and one
periodicity, for example "Jahresabo Digital, 1 Jahr", and pays for it like a
subscription. The code is issued, and shown to the buyer, once the payment is
confirmed. The buyer hands it to
someone else, who redeems it for a subscription period paid by the code. Admins
can also create codes without a purchase, for example to hand out at an
event. The product spec is the German pitch "Geschenkgutscheine für We.Publish" from
20 October 2026.

Gift codes are the first product sold through a new, reusable "sellable"
contract in `libs/payment/api`. Most of the work in this change sits in that
contract and in the payment path; the gift code lib on top of it is small.

## Scope

This change covers the API and the editor for buying a gift code, and the
website blocks to buy and redeem one:

- offers in the editor (plan, periodicity, price, name, description, image,
  active, optional redemption window in months, the payment methods buyers
  can use, whether buyers may enter a
  discount code, and whether the subscription a code starts renews
  automatically and with which of the plan's payment methods). Each member
  plan has at most one offer
  ([D35](decisions.md#d35-gift-offers-decide-how-the-redeemed-subscription-renews)).
- the GraphQL operations a website needs to sell codes: `purchaseGiftCode`,
  `payGiftCode` and `myGiftCodes`
- a standalone invoice per purchase, paid through the existing payment
  providers
- issuing the code when the invoice is paid, by any path: webhook, polling,
  the buyer re-checking, an admin marking it paid.
- cancelling the code on chargeback, on an unpaid timeout, or by hand in the
  editor
- a gift code list in the editor, with status, payment (paid or unpaid) and
  source filters, the buyer and the redeemer side by side, and a dialog that
  creates up to 500 issued codes without a purchase
  ([D34](decisions.md#d34-admins-can-create-codes-without-a-purchase))
- redeeming a code with one mutation, `redeemGiftCode`
  ([D38](decisions.md#d38-one-redeem-endpoint)). When the reader has an
  extendable, uncanceled subscription with the same plan and periodicity,
  the code pays its open invoice or its next period; a lifetime
  subscription refuses the code. Otherwise it starts a new subscription with
  the code's renewal settings.
- CHF 0 invoices. A 100 % discount code makes a gift free, and the order is
  paid at once without a provider. The same branch fixes new subscriptions and
  upgrades that come to CHF 0, which used to go to the provider with an
  amount of 0 ([D33](decisions.md#d33-chf-0-invoices-are-paid-without-a-provider)).
- three block changes, in the API, the editor and the website: the subscribe
  block can link to a page for redeeming a code
  ([D43](decisions.md#d43-the-subscribe-block-links-to-a-redemption-page)),
  a block redeems a code, logging in or registering the reader first
  ([D44](decisions.md#d44-a-block-to-redeem-a-code)), and a block sells the
  chosen offers through the subscribe flow's payment handling
  ([D45](decisions.md#d45-a-block-to-sell-gift-codes))
- two mails per offer, both optional: one to the buyer once the code is
  issued, one to the reader who redeemed it. The editor picks a mail
  template for each on the offer, and documents attached to the template are
  filled in with the same placeholders
  ([D46](decisions.md#d46-offers-choose-the-gift-code-mails))

Left for later:

- the buyer's list of codes on the website profile (`myGiftCodes`) and
  redeeming from the profile. The website has the two gift code blocks and
  the subscribe block link
  ([D42](decisions.md#d42-website-gift-code-blocks)), but after paying the
  buyer lands on `/profile`, which does not show codes yet.
- "PDF herunterladen" and "E-Mail erneut senden". A voucher PDF already
  goes out as a `.docx` attached to the purchase mail's template, filled
  with the code; only downloading it again and resending are missing.
- Stripe dispute handling, Bexio support, and widening `userInvoices` to show
  gift invoices. See [03-payments.md](03-payments.md#known-limits).

## The flow

```
Buyer (website)              API                                   Provider
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
code and marks `InvoiceItem.revokedAt`. The lifecycle is described in
[01-selling-things.md](01-selling-things.md).

## Feature flag

Everything ships dark behind the `gift-codes` feature (`stage: 'alpha'` in
`libs/features/src/lib/features.ts`). The flag covers both gift code
resolvers, the editor pages, sidebar entries, command palette entries and
the gift code blocks (resolved data and the editor's block menu).
`myGiftCodes` is the one exception: it has no `@Feature` and returns `[]`
while the flag is off, so a profile page can query it on every tenant
without a failing request. The gift code handler's
`isAvailable` also reads the flag, so switching it off stops payments of open
orders too. The flag stays off until
readers can redeem on the website, because a medium must not sell codes
nobody can redeem
([D17](decisions.md#d17-ship-dark-behind-the-gift-codes-feature)).

The sellable contract and the payment changes are not behind the flag. The
sellable parts do nothing until something creates an invoice with
`sellableKind` set. The CHF 0 branch is live for subscriptions and upgrades on
every medium as soon as this ships.

## Files

- [decisions.md](decisions.md): decision log, D1 to D45, including the
  defaults picked for open questions and Karl's later changes.
- [01-selling-things.md](01-selling-things.md): the sellable contract in
  `libs/payment/api` and how to sell a new kind of thing.
- [02-data-model.md](02-data-model.md): Prisma changes, delete rules, status
  derivation, code format.
- [03-payments.md](03-payments.md): what changed in the payment path,
  idempotency, chargebacks by provider, known limits.
- [04-api.md](04-api.md): GraphQL queries and mutations, guards, security
  rules.
- [05-editor-and-website.md](05-editor-and-website.md): editor pages and
  the website blocks.
- [open-questions.md](open-questions.md): questions for Karl and the default
  that is built until he answers.

The lib READMEs (`libs/payment/api/README.md`, `libs/gift-code/api/README.md`)
carry the short version of the same rules for people working inside those
libs.
