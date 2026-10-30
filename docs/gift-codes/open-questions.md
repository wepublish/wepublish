# Open questions

Questions for Karl. Each one has a default that is built now, so nothing waits
on the answer, but changing a default later means the change listed under it.

## Built with a default

| # | Question | Built now | Changing it means |
| --- | --- | --- | --- |
| 1 | Does the buyer pay the plan's `amountTarget` for the periodicity, or always `amountMin`? | `amountTarget ?? amountMin` ([D18](decisions.md#d18-price-is-amounttarget-falling-back-to-amountmin)) | One line in `GiftCodeOfferService.getPrice` and its spec |
| 2 | Should unpaid orders be canceled automatically, and after how long? | After 14 days; the code becomes `canceled` with reason `invoiceCanceled` ([D20](decisions.md#d20-unpaid-orders-auto-cancel-after-14-days)) | The `unpaidCancelAfterDays` checkout argument, or dropping reconciler step B |
| 3 | Does the redemption window start at payment confirmation or at order time? | Payment confirmation; a code issued before payment counts from the order ([D21](decisions.md#d21-the-redemption-window-counts-from-payment-confirmation)) | `issueForInvoiceItem` uses the invoice's `createdAt` instead of `paidAt` |
| 4 | May a member plan be deleted when only canceled or expired codes exist? The spec says only unredeemed codes block it. | Any sold code blocks it, via FK `Restrict` ([D22](decisions.md#d22-any-sold-code-blocks-member-plan-deletion)) | An app-level check plus a different delete rule on `GiftCode.memberPlanId`, which needs a migration and a decision on what happens to the codes' plan reference |
| 5 | Should gift purchases count as revenue in the dashboard and medium stats? | Counted as-is, without a plan ([D23](decisions.md#d23-gift-revenue-counts-as-is-in-dashboards)) | Filtering or a per-kind breakdown in `DashboardInvoiceService` and `MediumStatsService` |
| 6 | Admin and custom roles only, or also the built-in editor role? | Admin and custom roles only ([D24](decisions.md#d24-permissions-are-admin-and-custom-roles-only)) | Add the three ids to `EditorPermissions` and update `permissions.spec.ts` |
| 7 | Ship dark behind the `gift-codes` flag until redemption exists? | Yes ([D17](decisions.md#d17-ship-dark-behind-the-gift-codes-feature)) | Flip the feature per medium |
| 8 | When an editor cancels a paid code, is it fine that only the code is canceled and the refund happens outside We.Publish? | Yes ([D25](decisions.md#d25-cancelling-a-paid-code-does-not-refund)) | Provider refund calls, which no provider in We.Publish implements today |
| 9 | Should editors see the full code in the admin list, or a masked code with a reveal action? | Full code ([D26](decisions.md#d26-admins-see-the-full-code)) | A reveal mutation or a second permission, and the `GiftCode.code` field check |

## Decided by Karl

Issuing the code before payment is a per-offer switch
([D27](decisions.md#d27-codes-can-be-issued-before-payment-per-offer)), and
the payment methods are configured per offer
([D19](decisions.md#d19-payment-methods-are-configured-per-offer-filtered-by-capability)).
A member plan has at most one gift offer
([D29](decisions.md#d29-one-gift-offer-per-member-plan)), and each offer
decides whether buyers may use a discount code
([D30](decisions.md#d30-discount-codes-on-gift-purchases-opt-in-per-offer)).
Only providers that support standalone invoices are accepted, so there is no
Bexio invoice payment in V1
([D7](decisions.md#d7-supportsstandaloneinvoices-is-opt-in)). Enabling Bexio
means subscription-less invoice support in its provider, then flipping
`supportsStandaloneInvoices`.
An invoice sells one kind of thing
([D31](decisions.md#d31-one-sellable-kind-per-invoice)). The website and a
separate gift block come later, built together with Karl
([D32](decisions.md#d32-website-and-gift-block-come-later)).
A 100 % discount code may make a gift free; CHF 0 invoices of gifts, new
subscriptions and upgrades are paid without contacting a provider
([D33](decisions.md#d33-chf-0-invoices-are-paid-without-a-provider)).

Admins can create issued codes without a purchase, e.g. for events
([D34](decisions.md#d34-admins-can-create-codes-without-a-purchase)).

Each offer says whether the subscription a code starts renews automatically,
and with which of the plan's payment methods; every code keeps the values it
was sold or created with
([D35](decisions.md#d35-gift-offers-decide-how-the-redeemed-subscription-renews)).
A code also pays the open invoice of a subscription with the same plan and
periodicity, whatever the code cost
([D36](decisions.md#d36-gift-codes-pay-open-subscription-invoices)).

## Not decided yet

- `createGiftCodes` creates at most 500 codes per call. Is that enough for the
  largest event, or should bigger batches run as a job?
- Codes an admin created carry no revenue: no invoice, no amount, and they
  are not counted in the dashboards. Should they show up anywhere in the
  revenue or subscription statistics once they are redeemed?
- Discount codes have no usage limit. Now that a 100 % code makes a gift free
  ([D33](decisions.md#d33-chf-0-invoices-are-paid-without-a-provider)), anyone
  who knows such a code for an offer with `allowDiscountCodes` can create as
  many free gift codes as they like, each worth a subscription. Is that
  intended, or does a 100 % code need a usage limit first?
- The zero-total branch pays any invoice whose items add up to 0 or less. A
  negative total should never happen, since upgrade credit is clamped at 0.
  Should a negative total throw instead of being treated as paid?
- An invoice whose kind has no registered handler is not restricted by
  `allowedPaymentMethodIds`, so it can be paid with any capable method. It
  could never be fulfilled anyway. Should `createStandaloneInvoicePayment`
  refuse it instead?

## For the website step

- Where does the buyer land after paying an open code? The first website
  version showed the same "Danke für deinen Kauf" alert as for a new
  purchase.
- Which pages carry the gift block, and does it show every active offer or a
  chosen set, as the subscribe block's `giftCodeOfferIds` did (D11)?

## For the redemption step

- The spec asks for a distinct message for invalid, expired, already redeemed
  and canceled codes. The security rule in [04-api.md](04-api.md#security-rules)
  asks for one generic error to make guessing harder. Both cannot hold for an
  anonymous caller; that needs a decision before redemption is built.
  `payInvoiceWithGiftCode` already returns the generic error
  ([D36](decisions.md#d36-gift-codes-pay-open-subscription-invoices)).
- Is 10 attempts per user per hour the right limit for codes? It only
  counts logged-in users; many accounts can still guess in parallel.
- Where does the website offer "pay with a gift code" for an open invoice:
  in the profile's invoice list, on the payment page, or both?
- The spec merges the discount code field into "Gutschein- oder Rabattcode".
  The design has not looked at how that field and the redemption mutation fit
  together.
- A redeemed subscription needs a payment method. The `no-charge` provider is
  seeded, but `apps/api-example/prisma/seed.ts` has no payment method for it.
- Deleting an offer's renewal payment method sets it to null but leaves
  `autoRenew` true, and codes sold or created after that copy `autoRenew`
  true with no method. Should redemption fall back to no renewal, or should
  `purchaseGiftCode` and `createGiftCodes` refuse such an offer?
- A code keeps the renewal settings it was given, even if the plan later
  stops being extendable or drops that payment method. Redemption has to
  check them again. Does such a code then start a subscription without
  renewal, or is it refused?
- Every offer save checks the stored renewal settings again, even a save
  that only deactivates the offer. Once the renewal method is inactive,
  retired or no longer on the plan, an admin has to fix renewal before any
  other change saves. Is that fine, or should deactivating skip the check?
