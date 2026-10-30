# External services

## Payment Provider

- Stripe
- Mollie
- Payrexx
- Bexio — no charge, an invoice. `createRemoteInvoice` (nightly job, the
  `INVOICE_CREATION` day) creates the `kb_invoice` and has Bexio email it with
  the pdf, or — for a reader in letter mode with a Swiss address
  (`channel: letter`) — issues it (`bexio_markInvoiceAsOpen`) and hands the pdf
  back to print after the invoice-creation letter. The Bexio invoice id is kept
  as a `Payment` (`intentID`) so `checkStateOfOpenInvoices` polls it and
  `cancelRemoteSubscription` can cancel it; `renderRemoteInvoice` fetches the
  pdf again by that payment. Once Bexio created the invoice, a failed issue /
  pdf / send is returned as `deliveryError`, never thrown — a retry would
  create a second invoice. Keep `offSessionPayments` **off** for Bexio: with it
  on, the due date runs `createIntent` → a second Bexio invoice plus a
  RENEWAL_FAILED mail.
  **Contact sync (opt-in):** `SettingPaymentProvider.bexio_contactSync` has
  `BexioContactSyncService` (`libs/payment/api/.../bexio/`, a `runNight`
  step before the Mailchimp sync) push reader data to bexio every night:
  readers with a stored contact (`PaymentProviderCustomer.customerID`) whose
  `User`/`UserAddress.modifiedAt` is newer than `PaymentProviderCustomer.syncedAt`,
  and readers on a bexio payment method without a contact (found by email or
  created). `bexioContactFields` is the one mapping (name/company, email,
  street, number, address line 2, postcode, city, country) used by the sync
  and by the invoice-time `createOrUpdateContact`; it is sent with bexio's
  partial edit, so groups, phone and the rest of the contact are untouched.
  `country_id` comes from `BexioCountries` (`GET /2.0/country`, cached a day,
  `normalizeCountry` from `@wepublish/utils/api`), the configured one as
  fallback. A stored id bexio answers 404 for is skipped, never recreated;
  a 429 ends the night's run. The run's time and first error land in
  `bexio_contactSyncAt` / `bexio_contactSyncError`, shown in the editor's
  bexio form.

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
- Brevo (`brevo-mail-provider.ts`, plain `fetch` against api.brevo.com; mail
  log id in the `X-Mailin-custom` header; the webhook URL in Brevo carries
  `?key=<webhookEndpointSecret>` since Brevo signs nothing; blocked contacts
  are its suppression list, the events endpoint its poll)

Mail, challenge (captcha) and Mailchimp sync run with exactly one provider
each: the runtime uses the first non-deleted row. Their `create*Setting`
mutations only succeed while none exists (the editor then shows «Einrichten»),
and there is no delete mutation, so a medium never ends up without one. Change
type or credentials on the existing row instead.

### Email quality evidence (what providers tell us about addresses)

Everything lands in `email_quality_events` through `EMAIL_QUALITY_RECORDER`
(`EmailQualityService`, `libs/membership/api/.../email-quality/`), deduped on
`providerEventId`; the level in `user_email_quality` is recomputed on record
and nightly. Sources today:

- Transactional mail provider (one per installation): send-time refusal
  (Mandrill only), webhook (Mandrill, Mailgun, Brevo; `mail.webhook.ts`),
  nightly poll of open mail logs (`MailLogSyncService`; Mandrill
  `messages/info`, Mailgun events API by the Message-Id kept from the send
  answer, Brevo `smtp/statistics/events`). SMTP, Slack and Log report nothing.
- Provider suppression lists, nightly after the mail log poll and on the
  refresh button (`SuppressionSyncService` → `provider.listSuppressions()`):
  Mandrill's rejects denylist (expired entries included), Mailgun's bounces,
  complaints and unsubscribes of the sending domain, Brevo's blocked
  contacts (every reason code blocks transactional mail). Account-wide, so they
  cover mails sent outside We.Publish. A Mailgun unsubscribe from a tag is
  `optedOut`; domain-wide (`*`) it is `unsubscribed`. Entries already stored
  (by `providerEventId`) are skipped so nobody is re-evaluated for nothing.
- Mailchimp audience, inside the nightly Mailchimp sync (never on a dry run):
  `cleaned` members → `hardBounce`, `unsubscribed` → `optedOut`
  (`mailchimp-audience-evidence.ts`), and the clickers of the last 7 days of
  campaigns → `clicked`, dated by the campaign's send time
  (`mailchimp-campaign-clicks.ts`). These reach every user with that address.
- Mailchimp audience webhook, `POST /audience-webhooks/mailchimp/:configId?key=…`
  (`mailchimp-audience-webhook.ts`, membership lib): `cleaned` → hardBounce
  (reason `abuse` → spamComplaint), `unsubscribe` → optedOut (`abuse` →
  spamComplaint), `upemail` only logged. Mailchimp signs nothing, so the URL
  carries a secret stored encrypted on the sync provider row
  (`mailchimp_webhookSecret`); the api registers the webhook itself
  (`registerMailchimpAudienceWebhook`, needs `HOST_URL`, button in the sync
  integration), keeps `mailchimp_webhookId` and adopts one Mailchimp already
  has. Mailchimp documents no retry, so the nightly audience pull stays the
  fallback and the controller answers 200 to anything but a bad key.
- `optedOut` is not in the evaluator's `DEAD_TYPES`: leaving a newsletter does
  not make an inbox dead. `unsubscribed` stays dead, because Mandrill and
  Mailgun refuse every further mail to such an address.

Observability: `SettingMailProvider.lastWebhookAt` (every verified webhook
call), `lastPollAt` / `lastPollError` (every poll), shown on the mail
integration; query `emailEvidence` (`CanGetMailLogs`) sums events per source and
the editor warns on the communication tool and the delivery channel page when
no provider evidence arrived for `emailQualityEvidenceWarnAfterDays` (14).

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
- `MailController.sendMail` (`libs/mail/api`) branches before mailing through
  `resolveLetterRecipient()`: `asLetter`, the user prefers letters, the
  `LETTER_SENDER` is configured, the reloaded address is usable — and Swiss
  when the letter carries a payment slip (`withPaymentSlip`); anything missing
  means mail. A caller that had to decide earlier hands the result in as
  `letterRecipient` (`null` = mail) and a pdf to print after the template as
  `letterAttachment`. The letter is logged under the same
  `mailIdentifier`/`type` as a mail would be, so retried runs skip it. A failed
  print throws `LetterDeliveryError`; the periodic job steps over it.
- Invoice letters: the periodic job resolves the channel *before* it asks the
  payment provider (`createRemoteInvoice({ channel })`), keeps the provider's
  invoice as a `Payment`, and prints the returned pdf after the
  `INVOICE_CREATION` letter. A provider that could not create its invoice makes
  the job hard-delete the we.publish invoice with its period, items and payment
  so the next run tries again (cancelling would not, see gotchas). A reader in
  letter mode whose pdf the provider could not render gets no cover letter
  that night. The sweep `postMissingInvoiceLetters` (after invoice creation,
  also run by `createAndChargeInvoices`) posts the invoice letter for every
  open invoice of a reader in letter mode that has no non-rejected letter log
  for the template since the invoice was created — refused letters, a missing
  pdf, or a reader moved to letters after the invoice was emailed — with the
  pdf fetched again through `renderRemoteInvoice`; at most 3 attempts, nothing
  when there was never a letter and there is no pdf to print, and another
  night when the provider cannot render it. All of this lives in
  `InvoiceDeliveryService` (`libs/membership/api/src/lib/periodic-job/`),
  which the nightly job and the editor share.
- Editor renew and reactivate (`renewSubscription`, `reactivateSubscription`)
  create the we.publish invoice only, as before — unless the feature
  `editor-renewal-provider-invoice` is on for the medium: then
  `InvoiceDeliveryService.deliverRenewal` does what the nightly job does
  (provider invoice, payment, invoice-creation mail or letter), and a provider
  that could not create its invoice fails the editor action with nothing left
  behind, so the editor can retry.
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
A document the sender hands in (`attachment`, e.g. the Bexio invoice with its
per-invoice QR-bill) is appended the same way and takes the static appendix's
place.

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
