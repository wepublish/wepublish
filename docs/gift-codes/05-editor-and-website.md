# Editor and website

The editor UI for managing gift codes, and the website blocks.
Everything in the editor is hidden while the `gift-codes` feature is off; on
the website the API hides the data instead (no offers, no redemption link).

## GraphQL documents and codegen

`libs/editor/api/src/lib/schemas/gift-code.graphql` holds the offer fragment,
list, get, create, update and delete, and the code list fragment, list, get,
create (`CreateGiftCodes`) and cancel. The payment method multi-select reuses the existing
`PaymentMethodList` query. `invoice.graphql` adds `userID` and `sellableKind`
to the `Invoice` fragment. The website's
`libs/website/api/src/lib/schemas/gift-code.graphql` holds
`FullGiftCodeOffer`, `FullGiftCodeRedemption`, `PurchaseGiftCode` and
`RedeemGiftCode`; `block-content.graphql` holds `FullRedeemGiftCodeBlock`,
`FullGiftCodeOffersBlock` and the two new `FullSubscribeBlock` fields.

Boot the API so `schema-v2.graphql` is refreshed, then run
`pnpm run generate-api`. A stale SDL gives wrong generated types. Never edit
the generated files by hand. Codegen writes one `TypedDocumentNode` per
operation to `gql/graphql.ts` and the schema types to `schema-types.ts`; the
UI passes the `*Document` constants to Apollo's `useQuery` and `useMutation`
(see `.claude/docs/graphql-prisma.md`).

## Editor

The offer form and the create-codes dialog use the form library
`@wepublish/form/editor` (`libs/form/README.md`): a zod/v4 schema with i18n
keys in `.meta()`, a form view, `useCreateForm` / `useEditForm` and
`FormPage`. The routes are gated in `app.tsx` with `createCheckedFeatureComponent('gift-codes')`,
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

### Offer form (`@wepublish/form/editor`)

The offer form is a form view of the form library (`libs/form/README.md`):
`giftCodeOffer.schema.ts` (zod/v4 schema, `fromGiftCodeOffer`,
`toGiftCodeOfferVariables`), `giftCodeOffer.view.ts` (sections and paths) and
`useCreateForm` / `useEditForm` + `FormPage` in the two route views. The
"Offer" section holds name, description and image; the "Sale" aside holds
active and then `giftCodeOfferSaleFields.tsx`, a section component that loads
the plan and the payment methods and renders the remaining fields with
runtime options, `onValueChange` cascades and dynamic `disabled` / `hidden`.
An "Emails" section below them is `giftCodeOfferMailFields.tsx`: two selects
over `MailTemplateDocument` (each template named with its mail type, the
way subscription flows name them), the mail when bought and the mail when
redeemed; empty means no mail. With `paper-letters` on, each select is
followed by the membership editor's `TemplateAttachmentsNote`, naming the
documents the chosen template attaches.
Fields:

- name (required), description (`formFields.richText()`, for the buyer once
  the website shows offers) and image (`formFields.image()`)
- active, a checkbox above every other sales setting
- member plan (`formFields.memberPlan()`, the library's `SelectMemberPlan`
  wrapper)
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
- payment methods: `MultiSelectField` over every payment method, at least
  one required. The API rejects methods whose provider cannot take
  standalone payments; the error shows as a toast plus the form's inline
  server-error alert.
- redemption window in months: a number, minimum 1; empty means unlimited
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

Below the periodicity sits the price, a `CurrencyField` in the plan's
currency (amount with two decimals, stored as cents). Choosing a duration
fills in the plan's price for it (`amountTarget ?? amountMin` of that range)
while the field is empty or still holds the previous duration's plan price;
a price the editor typed stays. Its helper text compares it with the plan
price without blocking the save: "Same price as subscribing", "Cheaper than
subscribing (plan price X)" or "More expensive than subscribing (plan price
X)". The plan price is derived in the browser from the plan the form already
loads; the API has no field for it ([D40](decisions.md#d40-offers-store-their-own-price)). A price of 0 is refused.
Changing the plan clears the periodicity, and the price too while it still
was the plan price. The renewal rule ("renew
automatically" needs a method) is a `crossField` on the schema. Save goes to
the edit view, Save & close to `/gift-codes/offers`; the edit view loads with
`useQueryLoader(GiftCodeOfferDocument)`, keyed by the offer id. Server errors
(such as a second offer for the same plan) show as a toast and an inline
alert, and the form stays dirty.

### Offer list

Columns: active, name, member plan, duration, price, redemption window
("Unlimited" when null), discount codes, payment
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
after the redeemer (for a redeemed code: "Invoice of <date>" from
`redeemedInvoice.createdAt`, linked to `/subscriptions/edit/:id`; a dash
otherwise; exported as the date). Every redemption sets the invoice, whether
the code paid an open invoice, the next period or the first invoice of a new
subscription. Then come recipient name (a dash
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
which opens `giftCodeCreateDialog.tsx`. The dialog's form uses
`editorForm` from `@wepublish/form/editor` directly (a dialog is neither a
page nor a drawer form view), with `giftCodeCreate.schema.ts`: offer (every
offer, inactive ones marked), number of codes (1 to 500) and an optional
recipient name (at most 200 characters). It sends `recipientName: null` when
the field is empty or blank. On success it lists the created codes with a
"Copy codes" button (one code per line to the clipboard) and the list
refetches. Server errors show as a toast and an inline alert; the form stays
open.

There is no standalone invoice list; gift invoices are reached from the code
list. The spec's "PDF herunterladen" and "E-Mail erneut senden" actions are
not built; the mails go out once, when the code is issued and redeemed.

### Mail templates

The template editor has two more mail types, "Gift code bought" and "Gift
code redeemed" (`giftCodePurchase`, `giftCodeRedemption` in
`libs/membership/editor/src/lib/mail-template/mail-placeholders.ts`), with
the `optional_giftCode_*` placeholders. The preview fills them from
`SAMPLE_GIFT_CODE` in the API's `mail-template-data.ts`, also next to a chosen
subscription; the letter preview and the test mail fill the template's
attachments with it too. A manual send of such a template has no gift code,
so those placeholders stay empty, in the mail and in its attachments, and the
send page warns about them. The mail log filters by the type `giftCode`.

### Member plans

`memberPlanList.tsx` shows the delete error in a snackbar, so the new "still
used by subscriptions or gift codes" message is visible.

### Blocks (`libs/ui/editor/src/lib/blocks/`)

- `BlockCaseProps.feature` (in `atoms/blockList.tsx`) hides a block from the
  add-block menu unless `useFeatures()` has the key, and while features are
  still loading. `RedeemGiftCode` and `GiftCodeOffers` set
  `feature: 'gift-codes'`. Existing blocks of those types still render when
  the flag is off.
- `subscribeBlock.tsx`: a "Gift codes" section, shown only with
  `useFeature('gift-codes')`, with the checkbox `showGiftCodeRedemption` and,
  when it is ticked, a `SelectPage` for `giftCodeRedemptionPageId` and a text
  field for `giftCodeRedemptionLinkText`. Unticking clears both. The user field picker is now the exported
  `SubscribeBlockFieldsSection`, which the two new blocks reuse.
- `redeemGiftCodeBlock.tsx`: only the user fields.
- `giftCodeOffersBlock.tsx`: a multi-select of active offers
  (`GiftCodeOfferList`, `filter: {active: true}`, 200), below it the chosen
  offers in their own "order" section, as the subscribe block's sortable list
  (`PlanList`, `SortablePlanRow`, dnd-kit) with name, price · periodicity and
  a "Standard" radio per row (`defaultGiftCodeOfferId`; the first offer counts
  as default while it is unset, and it is cleared when that offer is
  removed), the checkboxes "ask for the recipient's name" and "show discount
  code input" one per line, and the user fields. The list parts are exported
  from `subscribeBlock.tsx` for this.
- `types.ts` maps both blocks and the two subscribe fields between
  `FullBlock` and `BlockContentInput`; `block.graphql` selects them.

### Locales

`giftCodeOffer.*`, `giftCode.*`, page title and command palette keys in `en`,
`de` and `fr` of `apps/editor/src/app/locales/`. German is Swiss German (no ß, «»
quotes, lowercase du); French uses vous. `locales.spec.ts` checks parity.

## Website

The website has no feature check of its own: with `gift-codes` off the API
returns no offers and no redemption page, so the blocks render nothing and
the link stays hidden. Translations live in
`libs/website/translations` (`giftCode.*`, `subscribe.giftCodeRedemption.link`).

### Builder slots (`libs/website/builder`)

| Slot | Props | Default component |
| --- | --- | --- |
| `GiftCodeRedeem` | `BuilderGiftCodeRedeemProps` | `GiftCodeRedeem` |
| `GiftCodePurchase` | `BuilderGiftCodePurchaseProps` | `GiftCodePurchase` |
| `blocks.RedeemGiftCode` | `BuilderRedeemGiftCodeBlockProps` | `RedeemGiftCodeBlock` |
| `blocks.GiftCodeOffers` | `BuilderGiftCodeOffersBlockProps` | `GiftCodeOffersBlock` |

All four default to `NoComponent` in the builder context and are registered
in `libs/website/src/lib/website.provider.tsx`. `BuilderSubscribeProps` gets
the optional `giftCodeRedemptionUrl` and `giftCodeRedemptionText`.

### Components (`libs/membership/website/src/lib/gift-code/`)

- `GiftCodeRedeem` is presentational: a code field, and for logged-out
  readers a login link (`/login?intended=<path>`), the `UserForm` with the
  block's fields and the challenge, like the subscribe form. After success it
  replaces the form with one sentence per `action`
  (`giftCode.redeem.success.*`). Errors show the API message, which is the
  same generic text for every refused code.
- `GiftCodeRedeemContainer` runs `RedeemGiftCode` (and `Register` first when
  logged out) and renders the `GiftCodeRedeem` slot. It takes no block data,
  so the profile page can mount it later as is.
- `GiftCodePurchase`: offer radios (name, duration, price), the recipient
  name (required, at most 200 characters, only with `askRecipientName`), the
  discount code (only when the block's `showDiscountCodes` and the offer's
  `allowDiscountCodes` are both on), `UserForm` and challenge when logged
  out, and `PaymentMethodPicker` over the selected offer's `paymentMethods`.
  It sends `recipientName: null` and `discountCode: null` when they are not
  shown or empty.
- `GiftCodePurchaseContainer` uses `usePurchaseGiftCode` from
  `libs/payment/website/src/lib/handle-payment.tsx` and mounts `PaymentForm`,
  so Stripe, Payrexx, Mollie and immediately paid (CHF 0) purchases redirect
  like subscribing. Success and failure both go to `/profile` (failure with
  `?error=`); offers have no success page of their own.
- The register-then-act schema handling is shared by both forms in
  `gift-code-register-schema.ts`.

### Blocks (`libs/block-content/website/src/lib/gift-code/`)

- `RedeemGiftCodeBlock`: only `GiftCodeRedeemContainer` with the block's
  fields. Headings and intro text come from the usual title and rich text
  blocks around it.
- `GiftCodeOffersBlock`: `GiftCodePurchaseContainer` with the block's offers,
  options and `defaultGiftCodeOfferId` as `defaultOfferId` (the first offer
  when it is unset or no longer listed); nothing when the list is empty.
- Both forms reuse the subscribe form's layout parts (`SubscribeWrapper`,
  `SubscribeSection`, `SubscribeButton`, ...), and the offers render as the
  builder's `MemberPlanItem` inside `MemberPlanPickerRadios`, so tenant
  overrides of the plan cards apply to the offer cards too.
- `SubscribeBlock` passes `giftCodeRedemptionPage.url` as
  `giftCodeRedemptionUrl` when `showGiftCodeRedemption` is on, and
  `giftCodeRedemptionLinkText` as `giftCodeRedemptionText`. `Subscribe`
  then renders a link with that text, or «Willst du ein Geschenkabo einlösen?
  Hier klicken.» when the block has none,
  beside the "Abo wählen" heading in the `memberPlans` area (the heading
  still shows only with more than one plan). Without a URL the markup is
  unchanged. Tenant subscribe blocks that wrap the lib's `SubscribeBlock`
  (zwoelf, factuel, reflekt, hauptstadt, onlinereports) get the link without
  changes.

Mocks: `mockGiftCodeOffer`, `mockGiftCodeRedemption`,
`mockRedeemGiftCodeBlock` and `mockGiftCodeOffersBlock` in
`libs/mocks/website`.

### Not built yet: the profile

The buyer's codes and a redeem field on `/profile` come later. What that
step can use:

- `GiftCodeRedeemContainer` mounts without block data; pass the
  registration fields the profile wants, or none for a logged-in reader.
- `myGiftCodes` returns the buyer's codes newest first, with `code` only
  once a code is issued, and `[]` while the feature is off. Calling
  `checkInvoiceStatus(invoiceId)` for unpaid codes (`ordered`, or `issued`
  with `paid` false) picks up a payment whose webhook has not arrived yet.
- Purchases come back to `/profile` with `invoiceId`, `amount`, `currency`
  and `sellableKind=giftCode` added
  ([03-payments.md](03-payments.md#paymentsservice-paymentsservicets)), so
  the profile can show a thank-you note for a gift.
