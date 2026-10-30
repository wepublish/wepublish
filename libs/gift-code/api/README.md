# gift-code-api

Gift codes: offers that editors set up, and codes that readers buy for a
member plan and periodicity and give away. The lib is the first product on
the sellable contract in `libs/payment/api`. `GiftCodeSellableHandler` issues
a code once its invoice is paid, cancels it on chargeback or unpaid timeout,
and limits payment to the offer's methods. Admins can also create issued
codes without a purchase (`createGiftCodes`); those have no invoice item, so
the sellable contract never sees them. A reader can pay an open invoice of
their own subscription with a matching code (`payInvoiceWithGiftCode`,
`GiftCodeInvoiceService`), limited to 10 attempts per hour by
`GiftCodeAttemptLimiter`. Everything is behind the `gift-codes` feature.
Redemption into a new subscription, the website side and the gift block are
not built yet; the purchase and list operations wait for the website.

Details live in [docs/gift-codes/](../../../docs/gift-codes/README.md): the
data model, the GraphQL API and its security rules, and the decision log.

Rules that hold here:

- This lib never imports `block-content`. From `membership` it imports only
  the GraphQL `Invoice` type, for `payInvoiceWithGiftCode` and
  `GiftCode.redeemedInvoice`; it uses no membership module or service.
  Nothing imports
  this lib except `app.module.ts`, so `MemberPlanModule` and
  `MemberPlanDataloader` come in without `forwardRef`. The planned gift block
  in `block-content` will close the loop member-plan → page → block-content →
  gift-code; both then need `forwardRef` again, and offer writes need to
  invalidate the cached `pages` and `articles` (decision D10 in the docs).
- Nothing in `GiftCodeService`'s dependency chain may be request-scoped.
  Otherwise the handler becomes request-scoped too, its `onModuleInit` never
  runs, and no code is ever issued.
- `GiftCode.code`, `buyer`, `redeemedBy`, `createdBy` and `redeemedInvoice`
  check access inside
  their resolvers, because guards do not run on `@ResolveField`. Never expose
  `GiftCode` from another type, and never log a code.

Tests: `pnpm nx test gift-code-api`.
