# Editor and website

The editor UI for managing gift codes, and what the website will build on.
Everything in the editor is hidden while the `gift-codes` feature is off.
There is no website UI yet
([D32](decisions.md#d32-website-and-gift-block-come-later)).

## GraphQL documents and codegen

`libs/editor/api/src/lib/schemas/gift-code.graphql` holds the offer fragment,
list, get, create, update and delete, and the code list fragment, list, get,
create (`CreateGiftCodes`) and cancel. The payment method multi-select reuses the existing
`PaymentMethodList` query. `invoice.graphql` adds `userID` and `sellableKind`
to the `Invoice` fragment. The website has no gift code documents yet.

Boot the API so `schema-v2.graphql` is refreshed, then run
`pnpm run generate-api`. A stale SDL gives wrong generated types. Never edit
the generated files by hand. Codegen writes one `TypedDocumentNode` per
operation to `gql/graphql.ts` and the schema types to `schema-types.ts`; the
UI passes the `*Document` constants to Apollo's `useQuery` and `useMutation`
(see `.claude/docs/graphql-prisma.md`).

## Editor

The pages copy `routes/goodie/` and `routes/discountCode/`: MUI,
react-hook-form with zod, `FormProvider`, async `defaultValues`, Controllers
with `helperText`, `useWatch` instead of `watch()`, no `useSeededState`. The
routes are gated in `app.tsx` with `createCheckedFeatureComponent('gift-codes')`,
the same way as the newsletter routes.

### Routes (`apps/editor/src/app/routes/giftCode/`)

| Route | File | Permission |
| --- | --- | --- |
| `/gift-codes` | `giftCodeList.tsx` | `CanGetGiftCodes` |
| `/gift-codes/offers` | `giftCodeOfferList.tsx` | any of `CanGetGiftCodes`, `CanUpdateGiftCodes`, `CanDeleteGiftCodes` |
| `/gift-codes/offers/create` | `giftCodeOfferCreateView.tsx` | `CanUpdateGiftCodes` |
| `/gift-codes/offers/edit/:id` | `giftCodeOfferEditView.tsx` | `CanUpdateGiftCodes` |

Registered in `app.tsx` next to the goodie routes, with page titles in
`pageTitle/pageTitles.ts`. Gifts have their own sidebar
menu in `base.tsx` ("Gifts", `MdRedeem`, menu key `gifts`), wrapped in
`FeatureControl feature="gift-codes"` and shown to anyone holding one of the
three gift-code permissions. It holds two entries: gift codes
(`MdConfirmationNumber`) and offers (`MdCardGiftcard`). The command palette
gets `giftCodeOffers` and `giftCodes` in `navigationCommands.tsx` under the
`navbar.gifts` section and `createGiftCodeOffer` in `createCommands.tsx`, all
with `feature: 'gift-codes'`. `commands.spec.ts` compares the command registry
against `app.tsx`, so a route without a command fails the spec, and
`pageTitles.spec.ts` does the same for page titles.

### Offer form (`giftCodeOfferForm.tsx`)

`createGiftCodeOfferSchema(t)` is a translated zod schema. Fields:

- name (required), description (rich text, for the buyer once the website
  shows offers) and image, with the `ChooseEditImage` / `ImageSelectPanel` /
  `ImageEditPanel` drawers from the goodie form
- active, a checkbox above every other sales setting
- member plan (`SelectMemberPlan`, single). The atom gained optional
  `label`, `helperText` and `error` props so the combobox has an accessible
  name; existing callers are unchanged.
- periodicity: a select of the periodicities the chosen plan sells (the
  periodicities in its `availablePaymentMethods`, in enum order) whose price
  is above 0. The price comes from `getPeriodPriceRange` in
  `libs/ui/editor/src/lib/memberPlan/periodicity-pricing.ts`, the helper the
  subscribe block uses too. It derives a periodicity without its own row from
  the base row the same way the API does, so a plan with only a monthly row
  of 10.00 that sells yearly shows "Yearly" at 120.00. The form loads the
  plan with `MemberPlanDocument` and follows `memberPlanId` through
  `useWatch`. An offer whose stored periodicity is no longer sold still shows
  it, without a price.
- payment methods: an inline `Autocomplete` multi-select over every payment
  method, at least one required. The API rejects methods whose provider
  cannot take standalone payments; the error shows as a snackbar.
- redemption window in months: a number, minimum 1; empty means unlimited
- issue before payment: a checkbox whose helper text says the buyer gets the
  code before the money arrives, and that the code is canceled if the payment
  never comes.
- allow discount codes: a checkbox below it, off by default. Its helper text
  says the buyer can enter a discount code of this member plan. A 100 % code
  makes the gift free; such an order is paid at once without a provider
  ([D33](decisions.md#d33-chf-0-invoices-are-paid-without-a-provider)).
- renew automatically: a checkbox below it, off by default, disabled with an
  explanation when the plan is not extendable. Ticked, it shows a select of
  the plan's active payment methods for the chosen duration (from the plan's
  `availablePaymentMethods`, loaded with `MemberPlanDocument`); the method is
  required. Unticking it, or changing the plan, clears the method; changing
  the duration clears it only when the new duration does not offer it.

Below the periodicity a read-only line shows the current price
(`amountTarget ?? amountMin` of that range, like `GiftCodeOfferService.getPrice`).
Changing the plan clears the periodicity. The create view navigates to the
edit view after saving; the edit view loads with
`client.query(GiftCodeOfferDocument)` as async defaults and resets the form
with the saved data.

### Offer list

Columns: active, name, member plan, duration, price, redemption window
("Unlimited" when null), code before payment, discount codes, payment
methods, last modified. Delete is shown only with `CanDeleteGiftCodes`.
The API refuses to delete an offer that has codes; the error goes to
`enqueueSnackbar(humanizeError(...))`.

### Code list

Filters: search (code, recipient or buyer email), status, payment (all, paid,
unpaid; sends `paid: true/false`, nothing for all; admin codes match
neither), source (all, purchase, created by an admin; sends `source`), offer,
member plan, created date range. They are persisted per viewer by
`useListViewState` like every other list filter. Columns: code (monospace,
when present), status chip (with an "Unpaid" chip for an issued code whose `paid` is
false, never for an admin code), paid (a
dash for admin codes), source, buyer and redeemer next to each other (names
linked to `/users/edit/:id` when the user still exists, from the admin-only
`buyer` and `redeemedBy` fields; for an admin code the buyer cell shows the
admin from `createdBy` with the caption "Creator"), the paid invoice right
after the redeemer (for a code that paid a subscription invoice: "Invoice of
<date>" from `redeemedInvoice.createdAt`, linked to
`/subscriptions/edit/:id`; a dash otherwise; exported as the date), recipient name (a dash
when empty), offer and plan with duration, amount and currency (a dash for
admin codes), created, issued, expires, redeemed, canceled with reason.
There is no buyer email column and no personal message; the search still
matches the buyer's email. Export through `useTableExportQuery`. The export's
buyer column is empty for admin codes; only the source column marks them.

Row actions:

Both actions open a confirm dialog first. The dialog keeps its own open state,
so its content does not switch while it fades out.

- Cancel: for `ordered` and `issued` codes, with `CanUpdateGiftCodes`. Calls
  `CancelGiftCode`.
- Mark as paid: for open (`ordered` or `issued`) codes that are not paid
  yet and have an `invoiceId`, with `CanCreateInvoice`. The dialog says the
  code is issued now if it was not issued yet. Calls the
  existing `MarkInvoiceAsPaid` with `{id: invoiceId, sendMail: false}` and
  refetches. The code is issued even with `sendMail: false`
  ([D6](decisions.md#d6-the-subscription-sendmail-contract-stays)).
  `InvoiceListPanel` is not reused because it needs a subscription id.

Creating codes: with `CanUpdateGiftCodes` the header shows "Create codes",
which opens `giftCodeCreateDialog.tsx`. The dialog is a react-hook-form with a
zod schema: offer (every offer, inactive ones marked), number of codes (1 to
500) and an optional recipient name. It sends `recipientName: null` when the
field is empty or blank. On success it lists the created codes with a "Copy
codes" button (one code per line to the clipboard) and the list refetches.
Server errors go to a snackbar.

There is no standalone invoice list; gift invoices are reached from the code
list. The spec's "PDF herunterladen" and "E-Mail erneut senden" actions come
with the email and PDF step.

### Member plans

`memberPlanList.tsx` shows the delete error in a snackbar, so the new "still
used by subscriptions or gift codes" message is visible.

The subscribe block's editor is unchanged. Offers get their own block later.

### Locales

`giftCodeOffer.*`, `giftCode.*`, page title and command palette keys in `en`,
`de` and `fr` of `apps/editor/src/app/locales/`. German is Swiss German (no ß, «»
quotes, lowercase du); French uses vous. `locales.spec.ts` checks parity.

## Website and the gift block

Karl builds the website side and a separate gift block later
([D32](decisions.md#d32-website-and-gift-block-come-later)), so none of it
exists yet. The subscribe block, the profile page, the builder and the
website translations are as on master. What is already in place for that
step:

- `purchaseGiftCode` and `payGiftCode` return a `Payment`. Hooks built like
  `useSubscribe` in `libs/payment/website/src/lib/handle-payment.tsx` can pass
  it to the file's internal `handlePayment`, which already covers Stripe
  Elements, Payrexx and Mollie redirects, and payments that are paid at once,
  including a gift that a 100 % discount code makes free.
- Success and failure URLs come back with `invoiceId`, `amount`, `currency`
  and `sellableKind=giftCode` added
  ([03-payments.md](03-payments.md#paymentsservice-paymentsservicets)).
- `myGiftCodes` returns the buyer's codes newest first, with `code` only once
  a code is issued, and `[]` while the feature is off. A list that calls
  `checkInvoiceStatus(invoiceId)` for unpaid codes (`ordered`, or `issued`
  with `paid` false) picks up a payment whose webhook has not arrived yet.
- `GiftCodeOffer.price` and `paymentMethods` (already filtered to usable
  methods) are what an offer card and a payment method picker need. A
  discount code can be checked before submit with `createSubscriptionInfo`,
  which rounds like `purchaseGiftCode`.
- The offer queries need a gift code permission today, so a public gift block
  will need its own resolver for active offers, and offer writes then have to
  invalidate the cached `pages` and `articles` again
  ([04-api.md](04-api.md#offers-gift-code-offerresolverts)). Importing
  `gift-code/api` from `block-content` closes a module loop, see
  [D10](decisions.md#d10-a-new-lib-libsgift-codeapi).
- Website specs render with `renderWithProviders` from
  `@wepublish/mocks/website` (see `.claude/docs/testing.md`); gift code mocks
  go into `libs/mocks/website` with them.
