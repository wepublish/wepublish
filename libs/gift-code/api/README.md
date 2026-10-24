# gift-code-api

Gift codes: offers that editors set up, and codes that readers buy for a
member plan and periodicity and give away. The lib is the first product on
the sellable contract in `libs/payment/api`. `GiftCodeSellableHandler` issues
a code once its invoice is paid, cancels it on chargeback or unpaid timeout,
and limits payment to the offer's methods. Everything is behind the
`gift-codes` feature. Redemption is not built yet.

Details live in [docs/gift-codes/](../../../docs/gift-codes/README.md): the
data model, the GraphQL API and its security rules, and the decision log.

Rules that hold here:

- This lib never imports `block-content` or `membership`. `MemberPlanModule`
  and `MemberPlanDataloader` come in through `forwardRef`, because
  member-plan → page → block-content → gift-code closes a loop (see
  `.claude/docs/gotchas.md`).
- Nothing in `GiftCodeService`'s dependency chain may be request-scoped.
  Otherwise the handler becomes request-scoped too, its `onModuleInit` never
  runs, and no code is ever issued.
- `GiftCode.code` and `GiftCode.buyer` check access inside their resolvers,
  because guards do not run on `@ResolveField`. Never expose `GiftCode` from
  another type, and never log a code.

Tests: `pnpm nx test gift-code-api`.
