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
Only providers that support standalone invoices are accepted, so there is no
Bexio invoice payment in V1
([D7](decisions.md#d7-supportsstandaloneinvoices-is-opt-in)). Enabling Bexio
means subscription-less invoice support in its provider, then flipping
`supportsStandaloneInvoices`.

## Not decided yet

- A sellable line whose kind has no registered handler is not restricted by
  `allowedPaymentMethodIds`, so it can be paid with any capable method. Such a
  line could never be fulfilled anyway. Should `createStandaloneInvoicePayment`
  refuse it instead?
- Switching the `gift-codes` feature does not flush the cached `pages` and
  `articles` responses (`FeaturesService.apply` passes `pages: false`).
  Subscribe blocks can keep showing or hiding offers until the cache expires.
  This holds for every feature, not only this one.
- Paying an open code from "Meine Gutscheine" lands on the same "Danke für
  deinen Kauf" alert as a new purchase.

## For the redemption step

- The spec asks for a distinct message for invalid, expired, already redeemed
  and canceled codes. The security rule in [04-api.md](04-api.md#security-rules)
  asks for one generic error to make guessing harder. Both cannot hold for an
  anonymous caller; that needs a decision before redemption is built.
- The spec merges the discount code field into "Gutschein- oder Rabattcode".
  The design has not looked at how that field and the redemption mutation fit
  together.
- A redeemed subscription needs a payment method. The `no-charge` provider is
  seeded, but `apps/api-example/prisma/seed.ts` has no payment method for it.
