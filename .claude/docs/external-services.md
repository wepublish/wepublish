# External services

## Payment Provider

- Stripe
- Mollie
- Payrexx
- Bexio

- Simulated (`simulated` type) — no external service: `createIntent` sends the
  customer to a checkout page served by the API at
  `/payment-webhooks/<providerId>`, where Pay / Decline / Cancel post back
  through the normal webhook path. With `offSessionPayments`, renewals are
  charged straight away — or declined when "Decline renewals"
  (`simulated_declineRenewals`) is ticked, to test failed recurring payments.
  Guarded by `isSimulatedPaymentAllowed()` (`@wepublish/utils/api`): only when
  `APP_ENVIRONMENT` is set and not `production` (unset counts as production —
  `NODE_ENV` is `production` on review too). Otherwise the API refuses to
  create it and skips existing rows when loading providers; the editor hides it.

### Changing a subscription's payment method

`changeSubscriptionPaymentMethod` (`PaymentMethodChangeService`,
`libs/membership/api/src/lib/payment-method-change/`) records a
`SubscriptionPaymentMethodChange`. The subscription keeps its `paymentMethodID`
until the change completes, which happens in one of three ways:

- **`invoicePayment`**, when the subscription has an open invoice. The invoice is
  paid with the new method through a normal `Payment`. The change completes
  in the `InvoicePaidNotifier` listener, but only if that payment is the one
  that paid the invoice.
- **`authorization`**, for an off-session provider. A provider that cannot
  authorize is rejected. Each provider authorizes without charging:
  - Stripe uses a SetupIntent. Its webhook must also send
    `setup_intent.succeeded` and `setup_intent.setup_failed`.
  - Mollie places a CHF 0.01 `sequenceType: first` hold with
    `captureMode: manual`, then calls `release-authorization` on it.
  - Payrexx tokenizes 0.01 with `chargeOnAuthorization: false`. The
    `referenceId` is `pmc_<changeID>`. Nothing is released, because the
    authorized transaction is the token.
- **`immediate`**, for any other payment method.

The subscription's current method is accepted too, when its provider charges
renewals automatically: the reader then authorizes it anew (a new card or TWINT
account) and the new token replaces the old one. `PublicSubscription.canRenewPaymentMethod`
tells the website when to offer that.

Authorization outcomes arrive through `WebhookResponse.authorizationStates` and
`PaymentAuthorizationNotifier`. The website also calls
`checkSubscriptionPaymentMethodChange` when the reader returns.

While a change is pending:

- `findUnpaidDueInvoices` skips its subscription's invoices.
- `canExtend` is false.

The periodic job expires pending changes after
`PAYMENT_METHOD_CHANGE_EXPIRY_DAYS`.

## Email Provider

- Mailgun
- SMTP — Mailpit locally (`localhost:1025`); on review an Ethereal account
  (`smtp.ethereal.email`), which keeps every relayed mail and delivers none.
  The E2E suite reads that account over IMAP (`e2e/README.md`, Review instances)
- Mailchimp — the newsletter editor (`libs/newsletter`, behind the
  `newsletter-editor` feature, `WEP_FEATURES=newsletter-editor` locally) pushes
  drafts, never sends, through the Marketing API key and list of the sync-provider integration

Mail, challenge (captcha) and Mailchimp sync run with exactly one provider
each: the runtime uses the first non-deleted row. Their `create*Setting`
mutations only succeed while none exists (the editor then shows «Einrichten»),
and there is no delete mutation, so a medium never ends up without one. Change
type or credentials on the existing row instead.

## PDF Renderer

Everything letter-related ships dark behind the `paper-letters` feature
(`libs/features`): the letter provider and pdf renderer integrations, letter
layouts, `letterChannelAvailable` / letter previews, and the letter channel of
the communication tool (`MailSendJobService.assertChannelAllowed`). The editor
asks `letterChannelAvailable` only through `useLetterChannel()`
(`libs/membership/editor/.../use-letter-channel.ts`), which skips the query while
the feature is off — the api refuses it then. Locally: `WEP_FEATURES=paper-letters`.

Renders letters to pdf. One `settings.pdfrenderer` row; editors switch by its
`type` (which clears the other type's credentials).

### Letters instead of mails per user (`paper-letter-flow`)

Automated subscription mails can reach a user as a printed letter. The pieces:

- `UserDeliveryPreference` (`user_delivery_preferences`): per user `channel`
  mail|letter, `origin` manual|suggestion, reason, who/when. No row = mail.
  Service `libs/membership/api/src/lib/delivery-mode/`, permission
  `CanManageUserDeliveryMode`, resolver gated by both letter features.
- `SubscriptionInterval.sendAsLetter`: only events switched on in the flow
  editor («Auch per Brief») print; user-flow mails (login, password, email
  change) never do. The three senders (periodic job, legacy `member-context`,
  renewal success) pass it as `asLetter` into `MailController`.
- `MailController.sendMail` (`libs/mail/api`) branches before mailing when
  `asLetter`, the user prefers letters and the `LETTER_SENDER` is configured;
  it reloads the user with address and falls back to mail without a usable
  one. The letter is logged under the same `mailIdentifier`/`type` as a mail
  would be, so retried runs skip it. A failed print throws
  `LetterDeliveryError`; the periodic job steps over it.
- `LETTER_SENDER` is a `GatedLetterSender` from `LettersModule`
  (`libs/letter/api`): `isConfigured()` = `paper-letters` && `paper-letter-flow`
  && letter integration configured. The feature keys live only there and in
  the resolvers/editor gates.
- Print options for unattended sends come from `SettingLetterProvider.default*`
  (editor → Integrations → Briefversand), over `DEFAULT_PRINT`
  (`letter-print-defaults.ts`).
- Nothing switches on its own: the nightly `DeliverySuggestionService`
  (after email quality) rebuilds `user_delivery_suggestions` — dead or
  placeholder address with a usable postal address → `toLetter`;
  suggestion-made letter users that became `active` → `toMail`; manual
  decisions are never suggested again, in either direction. A suggestion is
  answered with `confirmDeliverySuggestion` (re-validated; a stale one is
  dropped and refused) or `keepDeliverySuggestion`, which stores the user's
  current channel as a manual decision with reason `kept` — that is what makes
  «Beibehalten» survive the nightly recompute without a column of its own.
- Editor: one area, «Zustellkanal», at `/deliverychannel/:view`
  (`libs/membership/editor/src/lib/delivery-mode/delivery-channel-page.tsx`,
  `/deliverysuggestions` redirects). Views: `overview` (default; counts per
  channel from `deliveryChannelCounts`, the people of one channel from
  `usersByDeliveryChannel`, open suggestions, how many flow events print),
  `suggestions` (a card per move, Übernehmen / Beibehalten), `assign` (a
  three-step wizard over the send tool's `AudienceFilter`; the send page hands
  its audience over through `location.state`), `history`. The user page card
  switches one person and answers their `userDeliverySuggestion`. Reads need
  `CanGetUsers` (`CanGetUser` per user), writes `CanManageUserDeliveryMode`.
  Everything the editor knows about a channel (label, icon, default, needs a
  postal address, which move a suggestion kind is) sits in `channels.ts`; the
  api still speaks `toLetter|toMail`.
- Every audience switch is recorded in `DeliveryModeBulkChange`
  (`user_delivery_bulk_changes`: channel, the `MailAudienceInput` as JSON,
  counts, who, when; query `deliveryModeBulkChanges(channel?)`), because the
  preference rows only keep their last change. The history view lists them
  with the filter read back as phrases (`describeAudience`, names through
  `useAudienceLookups`, shared with the wizard's review step).
- `MailAudienceInput.mailHistory` filters any base by the mail log:
  `{ match: all|any, conditions: [{ mailTemplateId, negate, states?, channel?, from?, to? }] }`.
  Built in `mail-send-recipient.service.ts` as `mailSent: { some | none }`
  on the user (`none` for «not sent», never `NOT`, so people without any mail
  stay in), ANDed with the email segments through `buildUserLevelWhere`.

- Gotenberg (self-hosted, the default; `gotenberg` service in docker-compose)
- Cloudflare Browser Rendering

A template's `letterAppendixId` (an uploaded pdf `Document`, e.g. a static
QR-bill) is appended after rendering by `appendPdf` (pdf-lib, renderer-agnostic)
— CH recipients only, padded to an odd page for duplex (Pingen's QR paper rules).

### Template attachments (Word → pdf)

`MailTemplateAttachment` rows (ordered by `position`) attach `.docx` documents
to a template. Every send of it — `/mailsend`, test mails and the subscription
flows — fills each one in with the template's `{{placeholders}}`
(`renderDocxTemplate`, `libs/template/api`: joins the runs Word splits a
placeholder into, per paragraph, xml-escapes values, turns their newlines into
`<w:br/>`, fills link addresses in the `.rels` parts, and drops every other
`TargetMode="External"` relationship so LibreOffice fetches nothing; field
codes and custom-xml content controls are not filled), converts it through
Gotenberg's LibreOffice route (`PdfRenderer.convertDocument`; Cloudflare
refuses, `canConvertDocuments()` says so) and attaches the pdf. A letter prints
them after its pages and before the QR appendix (A4 only, each on its own sheet
in duplex). The work is `DocumentAttachmentRenderer` (`libs/letter/api`),
handed to `MailContext` through the `MAIL_ATTACHMENT_RENDERER` token the way
`LETTER_SENDER` is; while `paper-letters` is off it attaches nothing. An
attachment that cannot be rendered fails its mail with a `MailAttachmentError`
(logged `rejected`); the nightly job skips that recipient like a
`LetterDeliveryError` instead of stopping the run, and a `/mailsend` job stops
after three in a row (the rest stays pending). After three failed conversions
in a row the renderer pauses conversions for a minute, failing at once instead
of waiting for Gotenberg's 60 s timeout. Saving attachments needs
`isAvailable()` (the flag and a converting renderer), at most 5 documents and
15 MB (`MAX_TEMPLATE_ATTACHMENTS`, `MAX_ATTACHMENT_BYTES`, also checked on the
rendered pdfs), and a template that is no system mail. `UserFlow`/`SystemMail`
sends (login link, password reset, …) never render attachments, and
`updateSystemMail` refuses a template with any. A document still attached
cannot be deleted. Rendered files are cached by content hash (20 files and
50 MB per cache and API instance), so a document without per-recipient
placeholders is converted once per send job, not once per recipient; one with
them (`{{purl}}`, a name) costs a LibreOffice conversion per recipient (a send
job converts one after the other, ~1–3 s each), so a large send keeps
LibreOffice busy for hours; Chromium (html letters) has its own queue
(`--chromium-max-queue-size` vs. `--libreoffice-max-queue-size`). Run
Gotenberg with `--libreoffice-deny-private-ips` so nothing a document points
at (e.g. an `INCLUDEPICTURE` field) reaches internal networks; the `.rels`
stripping is only defence in depth.

### Letter layouts (Briefpapier)

`LetterLayout` rows (`letter_layouts`, CRUD in `libs/letter/api/src/lib/letter-layout/`,
editor under `/letterlayouts`) hold header and footer HTML plus their band
heights. A letter prints on the template's `letterLayoutId`, else on the row
with `isDefault`, else bare (`LetterContext.resolveLayout`). The bands are
`position: fixed` so Chromium repeats them on every page, and the body sits in
a table whose repeated `thead`/`tfoot` spacers keep the text out of them; see
`composeLetter` in `libs/letter/api/src/lib/letter-renderer.ts`. Bands are
capped at 40mm so a header cannot reach Pingen's franking zone, and the page 1
address window stays at 60mm whatever the header height. Header and footer
HTML take the same `{{placeholders}}` as the body. Images must be absolute
URLs the renderer can fetch (Gotenberg in docker cannot resolve `localhost`),
with a fixed `height` so the logo stays inside its band. Mails never see a
layout: only the letter path consults it.

## Analytics Provider

- Google Analytics
- Google Tag Manager
- Plausible
- Piwik PRO

## We.Publish One

The One dashboard (`WEP_ONE_URL`) and the API authenticate each other with EdDSA
JWTs verified against the other side's JWKS — no shared secret, no stored
credentials. `libs/one/api` holds the client, the heartbeat and the guards;
`@OneScopedJwt(scope)` is the only way into a One-facing resolver, and the
global guard denies anything without it.

Impersonation (One signs in as a user of this medium) is off unless
`WEP_ONE_IMPERSONATION=true`. A grant is a 60-second single-use JWT that the
editor redeems at `/login/impersonate/:jwt` — a route that accepts nothing but
an impersonation grant, since it skips TOTP and any other JWT pointed at it
would be a way around two-factor.

**Feature toggles** come from One too: per medium, staff-only (One's
`ClientFeatures`).
- Every heartbeat sends the registry (`FEATURES` in `libs/features`). One
  answers `200 {features: {key: bool}}`, the complete state, which
  `FeaturesService.apply` stores in `medium_features`; a key One leaves out is
  switched off.
- One also pushes a change at once via `applyMediumFeatures` (scope
  `write:features`).
- A `204`, an older One or One being down changes nothing: the last known
  state stays. `WEP_FEATURES=a,b` switches flags on locally or in review
  builds without One.
