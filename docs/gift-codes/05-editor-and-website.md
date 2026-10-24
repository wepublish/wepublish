# Editor and website

The UI for buying and managing gift codes. Everything here is hidden while the
`gift-codes` feature is off.

## GraphQL documents and codegen

- Editor: `libs/editor/api/src/lib/schemas/gift-code.graphql` (offer fragment,
  list, get, create, update, delete; code list fragment, list, get, cancel).
  The payment method multi-select reuses the existing `PaymentMethodList`
  query.
  `block.graphql` adds `giftCodeOfferIds` to the subscribe block fragment,
  `invoice.graphql` adds `userID` and `items { sellableKind }`.
- Website: `libs/website/api/src/lib/schemas/gift-code.graphql`
  (`FullGiftCodeOffer` with `issueBeforePayment`, `FullGiftCode` with `paid`,
  `PurchaseGiftCode`, `PayGiftCode`, `MyGiftCodes`). `block-content.graphql` adds
  `giftCodeOfferIds giftCodeOffers { ...FullGiftCodeOffer }` to
  `FullSubscribeBlock`.

Boot the API so `schema-v2.graphql` is refreshed, then run
`pnpm run generate-api`. A stale SDL gives wrong generated types. Never edit
the generated files by hand. Codegen emits no `use*` hooks for these
operations; the UI imports the `*Document` constants.

## Editor

The pages copy `routes/goodie/` and `routes/discountCode/`: MUI,
react-hook-form with zod, `FormProvider`, async `defaultValues`, Controllers
with `helperText`, `useWatch` instead of `watch()`, no `useSeededState`. The
routes are gated in `app.tsx` with `createCheckedFeatureComponent('gift-codes')`,
the same way as the newsletter routes.

### Routes (`apps/editor/src/app/routes/giftCode/`)

| Route | File | Permission |
| --- | --- | --- |
| `/giftCodeOffers` | `giftCodeOfferList.tsx` | any of `CanGetGiftCodes`, `CanUpdateGiftCodes`, `CanDeleteGiftCodes` |
| `/giftCodeOffers/create` | `giftCodeOfferCreateView.tsx` | `CanUpdateGiftCodes` |
| `/giftCodeOffers/edit/:id` | `giftCodeOfferEditView.tsx` | `CanUpdateGiftCodes` |
| `/giftCodes` | `giftCodeList.tsx` | `CanGetGiftCodes` |

Registered in `app.tsx` next to the goodie routes. `base.tsx` adds two
sidebar entries under the subscription plans menu (`MdRedeem` for offers,
`MdConfirmationNumber` for codes) and adds the three permissions to the
menu's `qualifyingPermissions`. The command palette gets `giftCodeOffers` and
`giftCodes` in `navigationCommands.tsx` and `createGiftCodeOffer` in
`createCommands.tsx`, all with `feature: 'gift-codes'`. `commands.spec.ts`
compares the command registry against `app.tsx`, so a route without a command
fails the spec.

### Offer form (`giftCodeOfferForm.tsx`)

`createGiftCodeOfferSchema(t)` is a translated zod schema. Fields:

- name (required), description (rich text, shown to buyers on the offer
  card), active (switch), issue before payment (switch)
- member plan (`SelectMemberPlan`, single). The atom gained optional
  `label`, `helperText` and `error` props so the combobox has an accessible
  name; existing callers are unchanged.
- periodicity: a select limited to the periodicities the chosen plan has a
  price above 0 for in `periodicityPricing`. It loads the plan with
  `MemberPlanDocument` and follows `memberPlanId` through `useWatch`.
- payment methods: an inline `Autocomplete` multi-select over every payment
  method, at least one required. The API rejects methods whose provider
  cannot take standalone payments; the error shows as a snackbar.
- issue before payment: the switch's helper text warns that an unpaid code
  can be redeemed before the timeout cancels it.
- redemption window in months: a number, minimum 1; empty means unlimited
- image, with the `ChooseEditImage` / `ImageSelectPanel` / `ImageEditPanel`
  drawers from the goodie form

Below the fields a read-only line shows the current price from the plan.
Changing the plan clears the periodicity. The create view navigates to the edit view after saving; the edit view loads with
`client.query(GiftCodeOfferDocument)` as async defaults and resets the form
with the saved data.

### Offer list

Columns: active, name, member plan, duration, price, redemption window
("Unlimited" when null), code before payment, payment methods, last
modified. Delete is shown only with `CanDeleteGiftCodes`.
The API refuses to delete an offer with sold codes; the error goes to
`enqueueSnackbar(humanizeError(...))`.

### Code list

Filters: status, offer, member plan, search (code, recipient or buyer email),
created date range. Columns: code (monospace, when present), status chip
(with an "Unpaid" chip for an issued code whose invoice is open), paid, buyer
name (linked to `/users/edit/:buyerId` when the user still exists), buyer
email (`buyer { email }`), recipient, offer and plan with duration, amount and
currency, created, issued, expires, redeemed, canceled with reason. Export through
`useTableExportQuery`.

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

There is no standalone invoice list; gift invoices are reached from the code
list. The spec's "PDF herunterladen" and "E-Mail erneut senden" actions come
with the email and PDF step.

### Subscribe block and member plans

- `libs/ui/editor/src/lib/blocks/subscribeBlock.tsx` gets a "Gift offers"
  multi-select next to the `showDiscountCodes` and `showGoodies` switches,
  bound to `giftCodeOfferIds`. It is hidden while the feature is off and for
  users without `CanGetGiftCodes`, because the offer query needs it (the
  built-in editor role does not have it). A hidden section keeps the block's
  `giftCodeOfferIds`. The select is a new atom, `libs/ui/editor/src/lib/atoms/giftCodeOffer/selectGiftCodeOffers.tsx`,
  which lists active offers.
- `memberPlanList.tsx` shows the delete error in a snackbar, so the new
  "still used by subscriptions or gift codes" message is visible.

### Locales

`giftCodeOffer.*`, `giftCode.*` and command palette keys in `en`, `de` and
`fr` of `apps/editor/src/app/locales/`. German is Swiss German (no ß, «»
quotes, lowercase du); French uses vous. `locales.spec.ts` checks parity.

## Website

### Buying from the subscribe block

`libs/block-content/website/src/lib/subscribe/`:

- `subscribe-block.tsx` shows a `SubscribeModeToggle` (MUI
  `ToggleButtonGroup`, "Abonnieren / Verschenken") when `giftCodeOffers` is
  not empty and no upgrade is running. The mode is the `mode=gift` router
  query parameter. The toggle writes it through a new optional
  `replaceQuery` on `BuilderRouterContext`, which `withBuilderRouter`
  implements with a shallow `router.replace`. Gift mode renders
  `<GiftCodePurchase>` and `GiftCodePurchaseFailure`; subscribe mode and
  `subscribe.tsx` are unchanged.
- `subscribe-block.provider.tsx` wires `usePurchaseGiftCode` and `useRegister`
  and merges the gift `stripeClientSecret` and `redirectPages` into the
  existing merge, so `PaymentForm` mounts Stripe Elements for gift purchases
  too.
- `subscribe-block.context.tsx` adds `purchaseGiftCode`.

Tenants that wrap `styled(SubscribeBlock)` (reflekt, hauptstadt,
onlinereports) inherit the toggle. None needed a change: the toggle sits
outside the form that gets the tenant class, and in gift mode Reflekt's
`grid-template-areas` do not apply, so the gift form stacks in one column.

Gift buying exists only in the block in V1. `SubscribePage` (bajour,
mannschaft), `userInvoices`, `InvoiceList` and `hasOpenInvoices` are not
touched.

### The purchase form

`libs/membership/website/src/lib/gift-code/gift-code-purchase.tsx`. Schema:

```ts
giftCodePurchaseSchema = z.object({
  offerId: z.string().min(1),
  recipientName: z.string().trim().min(1).max(200),
  message: z.string().max(1000).nullish(),
  paymentMethodId: z.string().min(1),
})
```

For a logged-out buyer it is merged with the registration schema the way
`subscribe.tsx` does it, and `onPurchaseWithRegister` registers first, then
purchases. A buyer whose email already exists must log in first, because
`registerMember` rejects "Email already in use"; subscribing has the same
friction.

The form shows offer cards (image, name, the editor's description, plan with
periodicity, redemption window, price), recipient name and message, a
`PaymentMethodPicker` over the selected offer's `paymentMethods`, the user
form and challenge when logged out, and a submit button "Gutschein für CHF x
kaufen". The offer radio group has an `aria-label`, because its heading is
hidden when there is only one offer. Above the button a note says when the
code arrives: once the payment is confirmed, which can take days for invoice
payments, or right away under «Meine Gutscheine» when the offer has
`issueBeforePayment`. An offer without a payment method shows a warning and
disables the button. There is no amount slider, auto renew, goodie or
discount code. Fields are read with `useWatch`.

### Payment hooks

`libs/payment/website/src/lib/handle-payment.tsx` adds `usePurchaseGiftCode`
and `usePayGiftCode`, modelled on `useSubscribe`. Success goes to
`/profile?giftCodePurchase=success`, failure back to the current path with
`?giftCodePurchase=failure`. Completion goes through the shared
`handlePayment`, so Stripe Elements, Payrexx and Mollie redirects and
immediate payment behave as for a subscription. On error, and when the
mutation returns no payment, they redirect to the failure URL with an `error`
query parameter added through `withQueryParam` (the gift failure URL already
has a query, so appending `?error=` would break it).

`GiftCodePurchaseFailure` (`libs/membership/website/src/lib/gift-code/`) shows
an error alert when the router query has `giftCodePurchase=failure`. The
subscribe block renders it in gift mode and `GiftCodeListContainer` renders it
on the profile, so an aborted or declined payment is never silent. It shows a
translated message only and never the `error` parameter, because that text
comes from the URL and anyone can craft a link with it.

Both hooks return `[mutate, redirectPages, stripeClientSecret]`, the same
tuple as `useSubscribe`, `useUpgrade` and `usePayInvoice`, so the provider
merge and the container read them the same way. Gift purchases do not use
`memberPlan.successPage`, which thanks the reader for subscribing. The profile
page shows a success alert when `giftCodePurchase=success` is in the URL.

### Meine Gutscheine

`gift-code-list.tsx` and `gift-code-list-container.tsx`, mounted in
`libs/utils/website/src/lib/pages/profile/profile-page.tsx` below the
subscriptions.

The container runs `MyGiftCodes`. For each unpaid code (`ordered`, or
`issued` with `paid` false) it calls `CheckInvoiceStatus(invoiceId)` once and
then refetches, like the invoice list container. That covers the buyer coming
back from the provider before the webhook has arrived. While the feature is
off, `myGiftCodes` returns `[]`, so the section stays empty without a failing
request.

The list renders its own «Meine Gutscheine» heading and shows status,
recipient, plan and duration, amount, purchase date and expiry. An issued code
is shown formatted with a copy button, which only says "Kopiert" when
`navigator.clipboard` exists and the write succeeded. The code carries
`data-sentry-mask`, so it never shows up in Sentry replays. A redeemed code is
shown without its value. A code that is not
paid yet (`ordered`, or `issued` early and unpaid) has a "Bezahlen" action
that calls `PayGiftCode` with a picker over the offer's payment methods. When
the offer has no usable method left, a warning
(`giftCode.purchase.noPaymentMethods`) replaces the action. The section renders nothing when the buyer has no codes.

### Builder slots for tenants

`libs/website/builder/src/lib/membership.interface.ts`:

- `BuilderGiftCodePurchaseProps`: `offers`, `challenge`, `defaults.offerId`,
  `onPurchase(vars)`, `onPurchaseWithRegister({register, purchase})`,
  `schema`, `fields`, `termsOfServiceUrl`, `className`. `onPurchase` takes
  `BuilderGiftCodePurchaseVariables` (`PurchaseGiftCodeMutationVariables`
  without the URLs, which the hook builds). There are no `loading` and
  `error` props.
- `BuilderGiftCodeListProps`: `data`, `loading`, `error`, `className`,
  `onPay(giftCodeId, paymentMethodId)`.

`website-builder.context.tsx` adds the slots `GiftCodePurchase` and
`GiftCodeList` with `NoComponent` defaults; `libs/website/src/lib/website.provider.tsx`
registers the lib components. The slots are optional, so existing tenant
`Subscribe` and `SubscribeBlock` overrides keep compiling. A tenant that wants
its own gift form or list overrides the slot in its website provider like any
other builder component.

### Translations

`giftCode.purchase.*`, `giftCode.list.*`, `giftCode.status.*` and
`subscribe.mode.{subscribe,gift}` in `libs/website/translations/src/lib/de.json`
and `fr.json` (there is no `en.json`).

### Tests

Website specs on this branch are Storybook `composeStories` specs that run
every play:

- `gift-code-purchase`: LoggedOut, LoggedIn, LoggedInFilled, Invalid,
  SingleOffer, IssueBeforePayment, NoPaymentMethods, plus spec cases for
  registering a logged-out buyer (stubs `window.turnstile`), switching to a
  payment method of a newly chosen offer, and showing the offer description.
- `gift-code-list`: Ordered, Issued, IssuedUnpaid, UnpaidWithoutPaymentMethods,
  Redeemed, Canceled, Expired, Empty, plus copy and missing-clipboard cases.
- `gift-code-list-container`: Default and Empty, plus the invoice check and
  the payment failure alert.
- `subscribe-block`: Default, WithGiftCodeOffers, GiftMode.
- `handle-payment.spec.tsx` and `with-builder-router.spec.tsx` cover the
  hooks and `replaceQuery`.

Mocks `mockGiftCodeOffer` and `mockGiftCode` live in
`libs/storybook/mocks/src/lib/membership.ts`. The spec and storybook
tsconfigs do not type-check (storybook types do not resolve), so stories and
specs are checked by nothing but the test run.
