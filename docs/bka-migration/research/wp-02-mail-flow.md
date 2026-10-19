# WP-02 — We.Publish mail flow: architecture, events, and how to add an editable transactional mail

**Scope.** This document describes *how We.Publish sends email today* and *exactly what a developer has to touch to add a new transactional mail whose template a publisher can edit in the admin editor*. It covers `libs/mail/api/**` in full, every Prisma model and enum involved (`MailTemplate`, `MailLog`, `MailSendJob`, `MailSendJobRecipient`, `UserFlowMail`, `SubscriptionFlow`, `SubscriptionInterval`, `SettingMailProvider`), every mail-sending call site anywhere in `libs/`, the editor UI for mail templates / system mails / manual sends, `docs/emailtemplates.md` (which is **stale** — see §7), queueing & retry, local-dev behaviour (Mailpit), and — critically for the BKA port — everything that makes a mail to a **non-user recipient** (an arbitrary address such as an external event submitter) hard or impossible with the current machinery. All claims are grounded in file paths with line numbers from `/Users/itrulia/Documents/wepublish` at commit `360b36ccb` (branch `master`), or in SQL actually run against the restored BKA production database. The We.Publish database was stopped during this research, so no We.Publish row counts are claimed. A short, clearly separated "Porting notes" section is at the end; everything before it is description of what *is*.

---

## 1. Architecture at a glance

```
                        ┌──────────────────────────────────────────────┐
  caller (service /     │  MailContext            libs/mail/api        │
  resolver / cron)  ───▶│   .sendMail(opts)   ← needs a full User row  │
                        │   .sendComposedMail(...)    (template + addr)│
                        │   .sendComposedContent(...) (ad-hoc + addr)  │
                        │   .getUserTemplateId(UserEvent)              │
                        └───────┬──────────────────────────────────────┘
                                │ (sendMail only)
                        ┌───────▼──────────────────────────────────────┐
                        │  MailController (per-send, `new`ed)          │
                        │   • dedup via mailIdentifier (retries only)  │
                        │   • buildData(): {user, optional, jwt, date} │
                        │   • writes MailLog row (FK → users.id!)      │
                        └───────┬──────────────────────────────────────┘
                                │
                        ┌───────▼──────────────────────────────────────┐
                        │  composeMail()  libs/mail/api/mail-renderer  │
                        │   flatten → derive dates/money → {{key}}     │
                        │   subst. Produces subject/html/text LOCALLY  │
                        └───────┬──────────────────────────────────────┘
                                │ SendMailProps {recipient, subject, …}
                        ┌───────▼──────────────────────────────────────┐
                        │  BaseMailProvider  (exactly ONE active)      │
                        │   Mailgun │ Mailchimp(Mandrill) │ SMTP │     │
                        │   Slack │ Log │ Fake(tests)                  │
                        └───────┬──────────────────────────────────────┘
                                │ webhook / polling
                        ┌───────▼──────────────────────────────────────┐
                        │  MailWebhookController  POST /mail-webhooks/:id
                        │  MailLogSyncService (manual pull fallback)   │
                        │   → updates MailLog.state                    │
                        └──────────────────────────────────────────────┘
```

Two orthogonal "flows" decide *which* template a given event uses:

| Flow | Table | Keyed by | Configured in editor at |
| --- | --- | --- | --- |
| **User flow** (account/login/system mails) | `user_communication_flows` (`UserFlowMail`) | `UserEvent` (unique) | *Automatic emails* → "Account & login" section |
| **Subscription flow** | `subscription_communication_flows` + `subscriptions.intervals` | (memberPlan, paymentMethods, periodicities, autoRenewal) × `SubscriptionEvent` × `daysAwayFromEnding` | `/communicationflows/edit/:id` |
| **Manual send** (no flow) | `mail.send_jobs` + `mail.send_job_recipients` | an audience filter, chosen ad hoc | `/mailsend` |

---

## 2. File inventory — `libs/mail/api`

| File | Lines | Role |
| --- | ---: | --- |
| `src/index.ts` | 18 | Barrel. Exports every provider, `mail.webhook`, `mail.controller`, `mail-context`, `mail-renderer`, `mails.module`, mailchimp-contact service/module/error. |
| `src/lib/mail-context.ts` | 289 | `MailContext` (the injectable facade) + private `MailContextConfig` (KV-cached, decrypted `SettingMailProvider`). |
| `src/lib/mail.controller.ts` | 198 | `MailController` — one instance per send. Dedup, data binding, `MailLog` write. Also defines the `mailLogType` enum. |
| `src/lib/mail-renderer.ts` | 416 | Local template engine: `flattenMailData`, `renderTemplate`, `deriveDateFormats`, `deriveComputedFields`, `composeMail`, `extractPlaceholders`, `resolvableKeys`, `convertMandrillPlaceholders`. |
| `src/lib/mails.module.ts` | 65 | `MailsModule.registerAsync({mailProvider, jwtGenerator})`; registers `MailWebhookController` + middleware; provides `MailContext`. |
| `src/lib/mails-module-options.ts` | 11 | `MAILS_MODULE_OPTIONS` token; `MailsModuleOptions { mailProvider, jwtGenerator }`. |
| `src/lib/mail.webhook.ts` | 115 | `MailWebhookController` (`@Controller('mail-webhooks')`, `@All(':providerId')`, `@Public()`) + `MailWebhookMiddleware` (applies the provider's body parser). |
| `src/lib/mail-provider/mail-provider.interface.ts` | 104 | `MailProvider` interface, `SendMailProps`, `SendMailResult`, `MailLogStatus`, `MailProviderMessageState`, `MailProviderTemplate(Content)`, `MailTemplateStatus`, `MailProviderError`, `MailProviderRecipientError`. |
| `src/lib/mail-provider/base-mail-provider.ts` | 165 | `BaseMailProvider` abstract class + private `MailProviderConfig` (same KV cache/decrypt as in mail-context). |
| `src/lib/mail-provider/create-mail-provider.ts` | 60 | `createMailProvider(id, type, deps)` switch + `loadMailProvider(deps)` (reads the first non-deleted `SettingMailProvider`). |
| `src/lib/mail-provider/mailgun-mail-provider.ts` | 214 | Mailgun: form-POST `/v3/{domain}/messages`, HMAC-SHA256 webhook verify, remote template list/get. |
| `src/lib/mail-provider/mailchimp-mail-provider.ts` | 348 | Mandrill (Mailchimp Transactional): `messages/send`, `messages/info` polling, HMAC-SHA1 webhook verify, `templates/list`/`templates/info`. |
| `src/lib/mail-provider/smtp-mail-provider.ts` | 81 | nodemailer; defaults to Mailpit (`localhost:1025`). No webhook, no remote templates, no message id. |
| `src/lib/mail-provider/slack-mail-provider.ts` | 58 | Posts the mail as a Slack `mrkdwn` block to `slack_webhookURL`. |
| `src/lib/mail-provider/log-mail-provider.ts` | 96 | Logs the mail (redacting JWTs/tokens, extracting up to 20 links, truncating the body to 2000 chars). |
| `src/lib/mail-provider/fake-mail-provider.ts` | 29 | Test double; `initDatabaseConfiguration` is a no-op. |
| `src/lib/mailchimp-contact/*` | 654 | **Not transactional mail.** Mailchimp *marketing* contact sync (updating a contact's email address in a list). |
| `src/lib/*.spec.ts`, `mail-provider/*.spec.ts` | 1 109 | Vitest specs (see §16). |
| `__tests__/prisma/seed.ts` | — | Seeds 10 `sample-mail-template-N` rows + subscription flows for integration tests. |
| `vitest.config.ts` | 9 | `createVitestConfig({name:'mail-api', environment:'node', nest:true})`. |

Nothing else in the repo opens an SMTP connection or talks to a mail API: a repo-wide grep for `nodemailer|createTransport|sendgrid|postmark` outside `libs/mail/api` returns nothing.

---

## 3. Prisma data model

### 3.1 `MailTemplate` — `mail_templates`

`libs/api/prisma/schema.prisma:1535-1565`

```prisma
model MailTemplate {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt DateTime @updatedAt @db.Timestamptz(3)

  name        String
  description String?
  subject     String  @default("")
  htmlContent String  @default("")
  textContent String?

  // Mail type this template is written for. Nullable for templates created
  // before the field existed; the editor enforces a value on the next save.
  context MailTemplateContext?

  // Kept (nullable) so content can be imported from the remote provider for
  // installs migrating from the remote-template model. Not used for sending.
  externalMailTemplateId String? @unique

  subscriptionIntervals SubscriptionInterval[]
  userFlowMails         UserFlowMail[]
  mailLog               MailLog[]
  mailSendJobs          MailSendJob[]

  @@map("mail_templates")
}
```

`MailTemplateContext` (`schema.prisma:1524-1533`) is the **"mail type"** the editor makes the author choose:

| Value | Meaning (from the schema comments and `mail-template-data.ts`) |
| --- | --- |
| `account` | Registration / login link / password reset — recipient fields only |
| `emailChange` | Adds `optional.newEmail` |
| `subscription` | Adds `optional.subscription` |
| `renewal` | Adds `optional.{subscription, invoice, items, errorCode}` |
| `invoiceCreation` | Adds `optional.{subscriptionToCreateInvoice, invoice}` — note the different prefix |
| `custom` | Free mail to a subscriber: `optional.{subscription, invoices[]}` |
| `customNoSubscription` | Free mail to someone without a subscription: recipient fields only |

Migrations: `20260630120000_local_mail_templates` (added `subject`/`htmlContent`/`textContent`, made `externalMailTemplateId` nullable, dropped `remoteMissing`), `20260701120000_mail_template_context` (created the enum + column), `20260804200000_add_mail_template_context_no_subscription` (added `customNoSubscription`).

### 3.2 `UserFlowMail` — `user_communication_flows`

`schema.prisma:1457-1476`

```prisma
enum UserEvent {
  ACCOUNT_CREATION
  PASSWORD_RESET
  LOGIN_LINK
  TEST_MAIL
  EMAIL_CHANGE
}

model UserFlowMail {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt DateTime @updatedAt @db.Timestamptz(3)

  event UserEvent @unique

  mailTemplate   MailTemplate? @relation(fields: [mailTemplateId], references: [id])
  mailTemplateId String?

  @@map("user_communication_flows")
}
```

One row per `UserEvent` (the `@unique` enforces it). `mailTemplateId` nullable → "this event sends no mail". Rows are **seeded by migration**, not by the TS seed (see §12.2).

### 3.3 `SubscriptionFlow` / `SubscriptionInterval`

`schema.prisma:1478-1522`

```prisma
enum SubscriptionEvent {
  SUBSCRIBE
  CONFIRM_SUBSCRIPTION
  INVOICE_CREATION
  RENEWAL_SUCCESS
  RENEWAL_FAILED
  DEACTIVATION_UNPAID
  DEACTIVATION_BY_USER
  CUSTOM
}

model SubscriptionFlow {
  id        String  @id @default(dbgenerated("gen_random_uuid()"))
  default   Boolean @default(false)
  memberPlan     MemberPlan? @relation(fields: [memberPlanId], references: [id])
  memberPlanId   String?
  paymentMethods PaymentMethod[]
  periodicities  PaymentPeriodicity[]
  autoRenewal    Boolean[]
  intervals      SubscriptionInterval[]
  @@map("subscription_communication_flows")
}

model SubscriptionInterval {
  id                 String            @id @default(dbgenerated("gen_random_uuid()"))
  event              SubscriptionEvent
  daysAwayFromEnding Int?              @db.SmallInt
  mailTemplate       MailTemplate?     @relation(fields: [mailTemplateId], references: [id])
  mailTemplateId     String?
  subscriptionFlow   SubscriptionFlow  @relation(fields: [subscriptionFlowId], references: [id], onDelete: Cascade)
  subscriptionFlowId String
  @@map("subscriptions.intervals")
}
```

Resolution lives in `SubscriptionEventDictionary` (`libs/membership/api/src/lib/subscription-event-dictionary/subscription-event-dictionary.ts`): it loads **all** flows (`:137-178`), filters by `memberPlanId && paymentMethods.includes && periodicities.includes && autoRenewal.includes` (`:110-116`), and falls back to the single `default: true` flow when nothing matches (`:118-124`). Exactly one default flow must exist, and every non-default flow must have a `memberPlanId`, or `initialize()` throws (`:160-177`).

### 3.4 `MailLog` — `mail.log`

`schema.prisma:531-585`

```prisma
enum MailLogState { submitted accepted delivered deferred bounced rejected }
enum MailLogType  { subscriptionFlow userFlow systemMail manual }

model MailLog {
  id         String   @id @default(dbgenerated("gen_random_uuid()"))
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt DateTime @updatedAt @db.Timestamptz(3)

  recipientID    String                                            // ← NOT NULL
  recipient      User         @relation(fields: [recipientID], references: [id], onDelete: Cascade)
  state          MailLogState
  sentDate       DateTime     @db.Timestamptz(3)
  mailProviderID String
  mailIdentifier String
  mailTemplate   MailTemplate @relation(fields: [mailTemplateId], references: [id])
  mailTemplateId String                                            // ← NOT NULL
  mailData       String?
  subject        String?
  error          String?
  mailProviderMessageID String?
  type           MailLogType?
  mailSendJob    MailSendJob? @relation(fields: [mailSendJobId], references: [id], onDelete: SetNull)
  mailSendJobId  String?

  @@index([mailIdentifier])
  @@index([recipientID, sentDate(sort: Desc)])
  @@index([mailSendJobId])
  @@index([mailProviderMessageID])
  @@map("mail.log")
}
```

**The single most important constraint in this document:** `recipientID` is a required foreign key to `users(id)`:

```sql
-- libs/api/prisma/migrations/20230510133452_create_subscription_flows_and_mail_templates/migration.sql:27
"recipientID" TEXT NOT NULL,
-- :132
ALTER TABLE "mail.log" ADD CONSTRAINT "mail.log_recipientID_fkey"
  FOREIGN KEY ("recipientID") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

It was not always so: the original `20220812113731_init/migration.sql:198-209` had a plain `"recipient" TEXT NOT NULL` column holding the **address**. The 2023 subscription-flow migration replaced the address with a user FK. See §17.

`mailIdentifier` is *not* unique any more — `20230724140235_remove_unique_constraint_from_mail_identifier/migration.sql` is a single `DROP INDEX "mail.log_mailIdentifier_key";`. Deduplication is therefore a `count()` check in application code, not a DB guarantee.

### 3.5 `MailSendJob` / `MailSendJobRecipient` — manual bulk sends

`schema.prisma:587-684`. States: `MailSendJobState { queued running done failed cancelled }`, audiences `MailSendAudience { singleUser filteredSubscriptions allUsers }`, per-recipient `MailSendJobRecipientState { pending sending sent failed }`.

Notable columns: `recipientFilter Json?` (frozen audit snapshot of the audience), `totalCount/sentCount/failedCount/sendingCount`, `recipientsResolvedAt` (queue fully materialised), `heartbeatAt` (stall detection), `resumeCount` (bounded auto-resume). Queue rows carry `position` (`@@unique([jobId, position])`), `attempts`, `error`, `sentAt`, and a plain `mailLogId` string (deliberately not a relation: "mail logs outlive the queue and may be pruned independently").

Both `MailSendJob.createdByUserId` and `MailSendJobRecipient.userId` are required FKs to `users`.

### 3.6 `SettingMailProvider` — `settings.mailprovider`

`schema.prisma:1781-1812`

```prisma
enum MailProviderType { MAILGUN @map("mailgun")  MAILCHIMP @map("mailchimp")
                        SLACK @map("slack")      SMTP @map("smtp")  LOG @map("log") }

model SettingMailProvider {
  id           String   @id
  createdAt    DateTime @default(now()) @db.Timestamptz(3)
  modifiedAt   DateTime @updatedAt @db.Timestamptz(3)
  lastLoadedAt DateTime @default(now()) @db.Timestamptz(3)

  type                  MailProviderType
  deletedAt             DateTime?
  name                  String?
  fromAddress           String?
  replyToAddress        String?
  webhookEndpointSecret String?   // encrypted at rest
  apiKey                String?   // encrypted at rest; SMTP reuses it as the password
  mailgun_mailDomain    String?
  mailgun_baseDomain    String?
  mailchimp_baseURL     String?
  slack_webhookURL      String?
  smtp_host             String?
  smtp_port             Int?
  smtp_secure           Boolean?
  smtp_user             String?

  @@map("settings.mailprovider")
}
```

**Exactly one active provider is allowed.** `MailProviderSettingsService.createMailProviderSetting` (`libs/settings/api/src/lib/integrations/mail-provider-settings.service.ts:77-98`) throws `BadRequestException("A mail provider is already set up. Change its type or settings instead of adding another one.")` when a non-deleted row exists. `apiKey` and `webhookEndpointSecret` are encrypted with `SecretCrypto` on write (`:29-46`) and decrypted on read in `MailContextConfig.load()` / `MailProviderConfig.load()`.

---

## 4. Mail providers

| Type | Class | Sends via | Delivery feedback | Remote templates | `providerMessageID`? |
| --- | --- | --- | --- | --- | --- |
| `MAILGUN` | `MailgunMailProvider` | `form.submit` POST `https://{mailgun_baseDomain}/v3/{mailgun_mailDomain}/messages` with `v:mail_log_id` | **Webhook** (HMAC-SHA256 over `timestamp+token`) | yes — paginated `domains.domainTemplates.list/get`, **no subject** | no (returns `{}`) |
| `MAILCHIMP` | `MailchimpMailProvider` | `@mailchimp/mailchimp_transactional` `messages.send` with `metadata.mail_log_id` | **Webhook** (HMAC-SHA1 over url+sorted params, header `x-mandrill-signature`) **and** polling `messages.info` | yes — `templates/list` carries code + subject in one call | yes (`response[0]._id`) |
| `SMTP` | `SmtpMailProvider` | nodemailer `createTransport({host, port, secure, auth})` | none | none | no |
| `SLACK` | `SlackMailProvider` | `fetch(slack_webhookURL)` with a `mrkdwn` block, 5 s timeout | none | none | no |
| `LOG` | `LogMailProvider` | pino logger `logger('mail-provider')` | none | none | no |
| *(tests only)* | `FakeMailProvider` | nothing | none | none | no |

### 4.1 Provider selection

```ts
// libs/mail/api/src/lib/mail-provider/create-mail-provider.ts:16-60
export const createMailProvider = (id, type, {prisma, kv}): BaseMailProvider => {
  switch (type) {
    case MailProviderType.MAILGUN:   return new MailgunMailProvider({id, incomingRequestHandler: bodyParser.json(), prisma, kv});
    case MailProviderType.MAILCHIMP: return new MailchimpMailProvider({id, incomingRequestHandler: bodyParser.urlencoded({extended:true}), prisma, kv});
    case MailProviderType.SLACK:     return new SlackMailProvider({id, prisma, kv});
    case MailProviderType.SMTP:      return new SmtpMailProvider({id, prisma, kv});
    case MailProviderType.LOG:       return new LogMailProvider({id, prisma, kv});
    default: throw new Error(`Unknown mail provider type defined: ${type}`);
  }
};

export const loadMailProvider = async (deps): Promise<BaseMailProvider | null> => {
  const row = await deps.prisma.settingMailProvider.findFirst({
    where: { deletedAt: null },
    orderBy: { id: 'asc' },
  });
  if (!row) return null;
  return createMailProvider(row.id, row.type, deps);
};
```

The type is therefore **data, not config**: switching Mailgun→SMTP is an editor edit on the `settings.mailprovider` row.

`ProviderRegistryService` (`libs/provider-registry/api/src/lib/provider-registry.service.ts`) owns the live instance:

* `loadProviders()` (`:139-186`) calls `loadMailProvider` and wraps the result in `withProviderErrorContext('Mail provider', provider)`.
* `readonly mailProvider = createSwappableProvider<BaseMailProvider>('mail provider', () => this.currentMailProvider)` (`:44-47`) — a `Proxy` so the singleton handed to `MailsModule` keeps working across reloads. With no provider configured, any real property access throws `No mail provider is configured.`, while lifecycle probes (`then`, `toJSON`, `onModuleInit`, …) return undefined so Nest can still boot (`swappable-provider.ts:1-19`).
* `@Interval(5000) reloadWhenChanged()` (`:84-105`) compares `kv.getNamespaceVersions(['settings:paymentprovider','settings:tracking-pixel','settings:mailprovider','settings:challenge'])` and rebuilds the provider when another replica changed the settings.

### 4.2 Provider configuration caching

Both `MailContextConfig` (`mail-context.ts:30-99`) and `MailProviderConfig` (`base-mail-provider.ts:98-165`) are byte-identical: they `update(lastLoadedAt)`, re-`findUnique`, decrypt `apiKey`/`webhookEndpointSecret` (throwing `Failed to decrypt apikey for Mail provider setting <id>` on failure) and cache the result in `kv.getOrLoadNs('settings:mailprovider', <id>, loader, 21600)` — **6 hours TTL**.

### 4.3 Seeding the provider row

* `libs/api/prisma/seed.ts:338-385` — `seedProviders()` creates `{id:'smtp', name:'SMTP', type: SMTP}` **only when every provider table is empty**.
* `apps/api-example/prisma/seed.ts:1720-1730` — the dev seed creates the same row with `fromAddress: 'dev@wepublish.ch'`.
* `BaseMailProvider.initDatabaseConfiguration(type, defaults?)` (`base-mail-provider.ts:72-95`) upserts with `update: {}` so an existing row is never overwritten. It is *not* called for mail at app boot in `api-example` (only `GoogleAnalyticsDbConfig.initDatabaseConfiguration()` is, `apps/api-example/src/nestapp/app.module.ts:316`).
* `reconcileProviderRegistry` (`apps/api-example/src/nestapp/reconcile-provider-registry.ts:117-122`) runs once (guarded by a `providerRegistryReconciled` `Setting`) and soft-deletes every mail-provider row except `configFile.mailProvider?.id`.

---

## 5. `MailContext` — the facade

`libs/mail/api/src/lib/mail-context.ts`

```ts
@Injectable()
export class MailContext implements MailContextInterface {
  mailProvider: BaseMailProvider;
  prisma: PrismaClient;
  kv: KvTtlCacheService;
  jwtGenerator: (userId: string) => Promise<string>;
  …
}
```

Constructed in `MailsModule.createAsyncProviders` (`mails.module.ts:48-62`) from `MAILS_MODULE_OPTIONS`, `PrismaClient` and `KvTtlCacheService`. Registered **globally** in `apps/api-example/src/nestapp/app.module.ts:143-179`, where `jwtGenerator` is a closure over `JWT_PRIVATE_KEY`, `HOST_URL` (issuer), `WEBSITE_URL` (audience) and the `SEND_LOGIN_JWT_EXPIRES_MIN` setting (default 360 min).

### 5.1 `sendMail(opts)` — the only logging path

```ts
// mail-context.ts:126-138
async sendMail(
  opts: Omit<MailControllerConfig, 'mailTemplateId'> & { mailTemplateId: string | null }
) {
  if (opts.mailTemplateId) {
    await new MailController(this.prisma as PrismaClient, this, opts as MailControllerConfig).sendMail();
  }
}
```

A `null` template id is a **silent no-op** — this is how "no template assigned to this event" is expressed.

### 5.2 `sendComposedMail(...)` — template + arbitrary address, no log

```ts
// mail-context.ts:145-187
async sendComposedMail({ mailTemplateId, recipient, data, mailLogID }: SendComposedMailProps)
  : Promise<{ subject: string; providerMessageID?: string }> {
  if (!this.mailProvider) throw new Error('MailProvider is not set!');
  const template = await this.prisma.mailTemplate.findUnique({ where: { id: mailTemplateId } });
  if (!template) throw new Error(`MailTemplate <${mailTemplateId}> not found!`);
  const config = await new MailContextConfig(this.prisma, this.kv, this.mailProvider.id).getConfig();
  const composed = composeMail(template, data);
  const result = await this.mailProvider.sendMail({
    mailLogID, recipient,
    replyToAddress: config?.replyToAddress ?? config?.fromAddress ?? '',
    subject: composed.subject, message: composed.message, messageHtml: composed.messageHtml,
  });
  return { subject: composed.subject, providerMessageID: result?.providerMessageID };
}
```

`recipient` here is a **plain string**. The only caller is `MailController.sendMail` (`mail.controller.ts:121-128`), which always passes `this.config.recipient.email`.

### 5.3 `sendComposedContent(...)` — ad-hoc content + arbitrary address, no log

`mail-context.ts:193-221`. Same shape but takes a `MailTemplateContent` instead of a template id. One caller: `MailTemplateService.sendTest` (`libs/membership/api/src/lib/mail-template/mail-template.service.ts:205-229`), whose resolver hard-codes `recipient: user.user.email` (the logged-in editor) with the comment *"Test mails always go to the current editor only — never an arbitrary address"* (`mail-template.resolver.ts:174-184`).

### 5.4 `getUserTemplateId(event, throwOnMissing?)`

`mail-context.ts:223-258`. Overloaded: with `throwOnMissing: true` (the default) it throws `No UserFlowMail defined for event ${event}` or `No email template defined for event ${event}`; with `false` it returns `null`, which `sendMail` then treats as "don't send".

### 5.5 `getUsedTemplateIdentifiers()`

`mail-context.ts:268-288`. Returns the ids referenced by any `SubscriptionInterval` or `UserFlowMail`, selecting only `mailTemplateId` (a deliberate optimisation — joining pulled every `htmlContent`). Backs `MailTemplateModel.status` via `UsedMailTemplateDataloader`.

---

## 6. `MailController` — per-send orchestration

`libs/mail/api/src/lib/mail.controller.ts`

```ts
export enum mailLogType { SubscriptionFlow, UserFlow, SystemMail, Manual }   // numeric!

const MAIL_LOG_TYPE_MAP: Record<mailLogType, MailLogType> = {
  [mailLogType.SubscriptionFlow]: MailLogType.subscriptionFlow,
  [mailLogType.UserFlow]:         MailLogType.userFlow,
  [mailLogType.SystemMail]:       MailLogType.systemMail,
  [mailLogType.Manual]:           MailLogType.manual,
};

export type MailControllerConfig = {
  daysAwayFromEnding?: number | null;
  mailTemplateId: string;
  recipient: User;                 // ← a full Prisma User row, not an address
  isRetry?: boolean;
  periodicJobRunDate?: Date | null;
  optionalData: Record<string, any>;
  mailType: mailLogType;
  jwtOverride?: string;
  mailSendJobId?: string | null;
  mailLogId?: string;
};
```

### 6.1 Idempotency

```ts
// :53-74
private generateMailIdentifier() {
  return `${this.config.mailType}-${
    this.config.periodicJobRunDate ? this.config.periodicJobRunDate.toISOString() : 'null'
  }-${this.config.daysAwayFromEnding}-${this.config.mailTemplateId}-${this.config.recipient.id}`;
}
private async checkIfMailIsSent(): Promise<number> {
  return this.prismaService.mailLog.count({ where: { mailIdentifier: this.generateMailIdentifier() } });
}
```

Because `mailType` is a **numeric** enum member, identifiers literally look like `0-2026-10-17T00:00:00.000Z-14-<templateId>-<userId>`. The dedup check runs **only when `isRetry` is true** (`:108-114`), i.e. only for a retried periodic-job run.

### 6.2 Template data

```ts
// :80-99
private async buildData() {
  const recipient = JSON.parse(JSON.stringify(this.config.recipient));   // deep clone
  delete recipient.password;
  delete recipient.roleIDs;
  delete recipient.totpSecret;
  delete recipient.totpEnabled;
  delete recipient.totpExempt;

  return {
    user: recipient,
    optional: this.config.optionalData,
    jwt: this.config.jwtOverride ?? (await this.mailContext.jwtGenerator(recipient.id)),
    currentDate: new Date(),
  };
}
```

So **every** mail gets `user.*`, `optional.*`, `jwt` and `currentDate`. `jwtGenerator(recipient.id)` means a login token is minted for the recipient on *every* send unless `jwtOverride` is supplied (password reset does supply one, scoped to audience `password-reset`, 60 min).

### 6.3 Send + log

```ts
// :107-149
public async sendMail(): Promise<void> {
  if (this.config.isRetry && (await this.checkIfMailIsSent())) { …return; }

  const mailLogId = this.config.mailLogId ?? randomUUID();
  let subject: string | null = null;
  let providerMessageID: string | undefined;
  try {
    ({ subject, providerMessageID } = await this.mailContext.sendComposedMail({
      mailLogID: mailLogId,
      mailTemplateId: this.config.mailTemplateId,
      recipient: this.config.recipient.email,       // ← ALWAYS User.email
      data: await this.buildData(),
    }));
  } catch (error) {
    await this.writeLog(mailLogId, MailLogState.rejected, subject, (error as Error).message);
    throw error;
  }
  await this.writeLog(mailLogId, MailLogState.submitted, subject, null, providerMessageID);
}
```

`writeLog` (`:151-197`) does `recipient: { connect: { id: this.config.recipient.id } }` and `mailTemplate: { connect: { id: this.config.mailTemplateId } }`. A failure to write the log is logged and **re-thrown unless the state was `rejected`** — so bookkeeping never masks the delivery outcome.

---

## 7. "Remote templates": what the term means today

`docs/emailtemplates.md` (last touched `99796cbd5a`, Nov 2023) still says:

> We.Publish sends emails using remote templates. The templates can be configured on the platform of the mail provider. […] Use the `mailContext#sendMail()` or `mailContext#sendRemoteTemplateDirect()` methods […]

**This document is stale.** `sendRemoteTemplateDirect` does not exist anywhere in the repo (grep finds only a log string `RemoteTemplate <%s> for subscription <%s> not found!` at `member-context.ts:1122` and a dead mock property `sendRemoteTemplateMail` at `periodic-job.service.spec.ts:178`). Since `cee461f4e3 feat(core): introduce integrated transactional mail editor and templates (#2836)`:

* Templates live in `mail_templates` and are edited in We.Publish.
* Rendering is **local** — see the module header of `mail-renderer.ts:1-9`: *"Templates are stored and edited inside wepublish and the variable substitution happens here, locally… The mail providers' own template engines are no longer used."*
* The provider is handed a fully-composed `{subject, message, messageHtml}`.

What remains of "remote templates" is a **one-way import** for installs migrating off the old model:

```ts
// libs/membership/api/src/lib/mail-template/mail-template.service.ts:86-115
async importFromProvider(): Promise<number> {
  const remoteTemplates = await this.mailContext.mailProvider.listTemplates();
  let imported = 0;
  for (const remote of remoteTemplates) {
    const htmlContent = convertMandrillPlaceholders(remote.html);
    const subject = remote.subject ? convertMandrillPlaceholders(remote.subject) : undefined;
    await this.prisma.mailTemplate.upsert({
      where:  { externalMailTemplateId: remote.externalId },
      create: { name: remote.name, externalMailTemplateId: remote.externalId, htmlContent, subject: subject ?? '' },
      update: { htmlContent, ...(subject ? { subject } : {}) },   // Mailgun has no subject
    });
    imported++;
  }
  return imported;
}
```

Exposed as `mutation importMailTemplatesFromProvider` (`mail-template.resolver.ts:157-163`, permission `CanUpdateMailTemplates`) and driven by a button in `mail-template-list.tsx:85,109`. `convertMandrillPlaceholders` rewrites `*|NAME|*` → `{{NAME}}` (`mail-renderer.ts:115-135`); resolution is case-insensitive so `{{USER_FIRSTNAME}}` still hits `user_firstName`.

`MailTemplate.externalMailTemplateId` is kept nullable purely for this import and is **not used for sending** (schema comment at `schema.prisma:1552-1554`).

---

## 8. The local template engine (`mail-renderer.ts`)

### 8.1 Pipeline

```ts
// :400-408
function enrichMailData(data: Record<string, any>): Record<string, any> {
  const flattened = flattenMailData(data);
  return { ...flattened, ...deriveDateFormats(flattened), ...deriveComputedFields(data) };
}

// :377-391
export function composeMail(template: MailTemplateContent, data: Record<string, any>): ComposedMail {
  const enriched = enrichMailData(data);
  return {
    subject:     renderTemplate(template.subject, enriched),
    messageHtml: renderTemplate(template.htmlContent, enriched),
    message:     template.textContent ? renderTemplate(template.textContent, enriched) : undefined,
  };
}
```

### 8.2 Flattening

`flattenMailData` (`:43-86`) turns `{user:{firstName:'Jane'}}` into `{user_firstName:'Jane'}`, arrays into `items_0_name`, and `Date` into `toISOString()`. It drops a hard-coded `SENSITIVE_KEYS` set **at every nesting depth**:

```ts
const SENSITIVE_KEYS = new Set(['password','totpSecret','totpEnabled','totpExempt','roleIDs']);
```

### 8.3 Substitution

```ts
const PLACEHOLDER_REGEX = /{{\s*([\w.]+)\s*}}/g;
```

`renderTemplate` (`:143-165`) builds a lower-cased lookup and replaces unknown/`null`/`undefined` placeholders with the **empty string** — a typo in a template silently renders nothing.

### 8.4 Derived values

`deriveDateFormats` (`:241-285`) adds, for every value matching `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$`:

| Suffix | Example output |
| --- | --- |
| `_date` | `30.06.2026` |
| `_isoDate` | `2026-06-30` (`en-CA`) |
| `_dateLong` | `30. Juni 2026` |
| `_weekday` | `Dienstag` |
| `_time` | `08:22` |
| `_dateTime` | `30.06.2026, 08:22` |
| `_year` | `2026` |

Locale is hard-coded `de-CH` (`:171`); timezone comes from `process.env.TZ`, falling back to `Europe/Zurich`, with an invalid TZ silently falling back too (`:178-192`).

`deriveComputedFields` (`:327-370`) adds money and totals:

* `optional_subscription_monthlyAmount_chf` / `_display`, `_periodMonths`, `_periodAmount`, `_periodAmount_chf`, `_periodAmount_display`, `_paymentPeriodicity_display` — and the same for the `optional_subscriptionToCreateInvoice` prefix.
* `user_fullName` = `firstName + ' ' + name`.
* `optional_invoice_total` / `_chf` / `_display` summed over `optional.invoice.items ?? optional.items`.

Period lengths and German periodicity labels are tables at `:198-215` (`monthly:1 … lifetime:1200`; `monatlich`, `vierteljährlich`, `halbjährlich`, `jährlich`, `alle zwei Jahre`, `einmalig`).

### 8.5 Placeholder introspection

* `extractPlaceholders(content)` (`:95-108`) — the distinct `{{key}}` names in a string.
* `resolvableKeys(data)` (`:414-416`) — `Object.keys(enrichMailData(data))`. Deliberately shares `enrichMailData` with `composeMail` so a "missing placeholder" warning can never disagree with what renders.

---

## 9. Complete inventory of mail events and their triggers

### 9.1 `UserEvent` (user flow)

| `UserEvent` | Triggered from | `mailLogType` | `optionalData` | Recipient address | Notes |
| --- | --- | --- | --- | --- | --- |
| `ACCOUNT_CREATION` | `UserService.createUser` → `libs/user/api/src/lib/user.service.ts:203-212` | `SystemMail` | `{}` | newly created `user.email` | skipped when `skipMail`; template looked up with `throwOnMissing=false` |
| `LOGIN_LINK` | `SessionService.sendLoginLink` → `libs/session/api/src/lib/session.service.ts:369-378`; `SessionService.sendJWTLogin` → `:462-470` | `UserFlow` | `{}` | `user.email` | rate-limited to once per minute (`:178-186`); `throwOnMissing` default (throws) |
| `PASSWORD_RESET` | `SessionService.sendPasswordResetEmail` → `libs/session/api/src/lib/session.service.ts:390-417` | `UserFlow` | `{}` | `user.email` | looked up with `throwOnMissing=false`; throws `BadRequestException('Password reset is not configured…')` if unassigned; **silently succeeds for unknown emails** (anti-enumeration); `jwtOverride` = 60-min `password-reset` JWT |
| `EMAIL_CHANGE` | `UserService.requestEmailChange` → `libs/user/api/src/lib/user.service.ts:372-382` | `UserFlow` | `{ newEmail }` | `user.email` — the **current/old** address (see §17.2) | |
| `TEST_MAIL` | Only via `testSystemMail` (see below); no automatic trigger | `SystemMail` | `{}` | current editor | i18n: *"Never sent to readers automatically"* |
| *(any)* | `SystemMailResolver.testSystemMail` → `libs/membership/api/src/lib/system-mail/system-mail.resolver.ts:59-77` | `SystemMail` | `{}` | `user.user.email` (the logged-in editor) | permission `CanTestSystemMails` |

### 9.2 `SubscriptionEvent` (subscription flow)

| `SubscriptionEvent` | Triggered from | `mailLogType` | `optionalData` |
| --- | --- | --- | --- |
| `SUBSCRIBE` | `MemberContext.createSubscription` → `libs/membership/api/src/lib/legacy/member-context.ts:1084-1098`; also `:870-878` when no confirmation is needed | `UserFlow` | `{ subscription }` |
| `CONFIRM_SUBSCRIPTION` | same call site, when `needsConfirmation` (`member-context.ts:871-874`) | `UserFlow` | `{ subscription }` |
| `RENEWAL_FAILED` | `MemberContext` payment `requiresUserAction` → `member-context.ts:498-519`; also the nightly charge path `periodic-job.service.ts:599-621` | `UserFlow` / `SubscriptionFlow` | `{ invoice, paymentProviderID, errorCode }` / `{ errorCode, invoice, subscriptionPeriods, items, subscription }` |
| `RENEWAL_SUCCESS` | `RenewalSuccessMailService.onInvoicePaid` (an `InvoicePaidListener`) → `libs/membership/api/src/lib/renewal-mail/renewal-success-mail.service.ts:49-104` | `SubscriptionFlow` | `{ errorCode:'', invoice, subscriptionPeriods, items, subscription }` |
| `INVOICE_CREATION` | `PeriodicJobService.createInvoice` → `libs/membership/api/src/lib/periodic-job/periodic-job.service.ts:546-552` | `SubscriptionFlow` | `{ subscriptionToCreateInvoice, invoice }` |
| `DEACTIVATION_UNPAID` | `PeriodicJobService.deactivateSubscriptionByInvoice` → `periodic-job.service.ts:695-700`; also `MemberContext.sendSubscriptionDeactivationMail` | `SubscriptionFlow` / `UserFlow` | `{ subscription, invoice }` / `{ subscription }` |
| `DEACTIVATION_BY_USER` | `MemberContext.sendSubscriptionDeactivationMail` → `member-context.ts:903-912` | `UserFlow` | `{ subscription }` |
| `CUSTOM` | `PeriodicJobService.sendCustomMails` → `periodic-job.service.ts:456-466`, for every interval whose `daysAwayFromEnding` matches today | `SubscriptionFlow` | `{ subscription, invoices }` (latest two) |

`RENEWAL_SUCCESS` has extra guards (`renewal-success-mail.service.ts:125-170`): no mail for the first period of a subscription (`firstPeriod`), none if `invoice.suppressRenewalSuccessMail` or `invoice.renewalSuccessMailSentAt` is set (`alreadyHandled`), and the claim is taken atomically via `updateMany({where:{renewalSuccessMailSentAt:null, suppressRenewalSuccessMail:false}})` before sending, released again on failure.

### 9.3 Manual sends (no event)

| Entry point | Service | `mailLogType` |
| --- | --- | --- |
| `mutation sendMailTemplateToUser(templateId, userId)` | `MailSendJobService.sendToUser` → `mail-send-job.service.ts:77-115` | `Manual` |
| `mutation createMailSendJob(input)` | `MailSendJobService.createJob` → `:122-147` | `Manual` |
| `mutation sendTestMailTemplate(input)` | `MailTemplateService.sendTest` → `mail-template.service.ts:205-229` | — (no `MailLog` row) |

### 9.4 "Will this action send a mail?" lookups

`ActionMailService` (`libs/membership/api/src/lib/action-mail/action-mail.service.ts`) answers, *before* an admin action runs, which template would be used and to which address:

| Query | Method | Event |
| --- | --- | --- |
| `subscriptionCreationMail` | `forSubscriptionCreation` `:56-70` | `SUBSCRIBE` |
| `subscriptionCancellationMail` | `forSubscriptionCancellation` `:73-101` | `DEACTIVATION_UNPAID` or `DEACTIVATION_BY_USER` |
| `accountCreationMail` | `forAccountCreation` `:107-115` | `ACCOUNT_CREATION` (no `recipientEmail` — the user does not exist yet) |
| `invoicePaymentMail` | `forInvoicePayment` `:118-141` | `RENEWAL_SUCCESS` |

Reasons for *not* sending are a dedicated enum, `ActionMailNoMailReason { noTemplate, firstPeriod, alreadyHandled, notApplicable }` (`action-mail-reason.ts`). The editor renders them in a confirmation dialog via `useActionMailQuestion` (`libs/ui/editor/src/lib/hooks/useActionMailQuestion.tsx`), whose default answer is always **skip the mail**.

---

## 10. Editor UI

### 10.1 Routes (`apps/editor/src/app/app.tsx`)

| Path | Component | Lines |
| --- | --- | --- |
| `/mailtemplates` | `MailTemplateList` | `1004-1011` |
| `/mailtemplates/create` | `MailTemplateEdit` | `1012-1019` |
| `/mailtemplates/edit/:id` | `MailTemplateEdit` | `1020-1027` |
| `/systemmails` | `<Navigate to="/communicationflows/edit/default" replace />` | `1028-1036` |
| `/communicationflows/edit/:id` | `SubscriptionFlowList` (hosts `SystemMailSection`) | `996-1003` |
| `/mailsend` | mail-send page | `1037+` |
| `/maillog` | mail log list | nav at `base.tsx:1141` |

Nav entries: `/mailsend`, `/mailtemplates`, `/maillog` (`apps/editor/src/app/base.tsx:1101,1130,1141`).

### 10.2 Mail-template editor — `libs/membership/editor/src/lib/mail-template/mail-template-edit.tsx` (776 lines)

* Three body modes: **visual** (`HtmlVisualEditor`, 1 325 lines, an iframe WYSIWYG), **html** (CodeMirror `HtmlSourceEditor`), **text** (read-only, regenerated from the HTML by `deriveTextFromHtml`, `:66-82`).
* The canonical HTML is held in a `useRef` so typing never re-renders and resets the caret (`:112-117`).
* `buildInput()` (`:241-250`) always regenerates `textContent` from the HTML on save.
* **Mail type is mandatory on save**: `save()` refuses with `mailTemplates.edit.selectMailType` when `contextId` is null (`:258-270`).
* Preview (`mailTemplatePreview`) and test send (`sendTestMailTemplate`) fall back to `MailTemplateContext.Custom` when no type is chosen (`:295-299`).
* `PlaceholderPicker` inserts `{{key}}` tokens; `{{jwt}}` is special-cased so it is appended as `?jwt={{jwt}}` / `&jwt={{jwt}}` after a URL, or attached to the link under the caret (`:84-90`, `:206-239`).
* Context dropdown is built from `MAIL_PLACEHOLDER_CONTEXTS` (`:342-346`).

### 10.3 The curated placeholder catalogue — `mail-placeholders.ts` (424 lines)

A hand-written, i18n-labelled list, **client-side only**, grouped per `MailTemplateContext` id. `ALWAYS_PLACEHOLDERS` (`:46-125`) covers `user_fullName`, `user_firstName`, `user_name`, `user_email`, `user_flair`, `user_birthday` (date), `user_id`, `user_active`, `user_lastLogin` (date), `user_createdAt` (date), `jwt`, `currentDate` (date). Then `SUBSCRIPTION_SCALARS` (10 keys) and `INVOICE_SCALARS` (7 keys) are reused across contexts.

The **authoritative** list lives on the API: `MailTemplateService.getPlaceholderKeysByContext()` (`mail-template.service.ts:236-257`) derives every resolvable key per context from the *real* flatten/derive pipeline over sample data. Its docblock calls it *"the single source of truth the editor's curated list is checked against"* — but note: **no automated test actually diffs the two lists**; the only spec is `mail-template.service.spec.ts:188-200`, which asserts a handful of keys are present, and `getPlaceholderKeysByContext` is not wired to any GraphQL field.

### 10.4 System-mail section — `libs/membership/editor/src/lib/system-mail/system-mail-section.tsx`

One row per `UserFlowMail`, ordered by a hard-coded list and with unknown events appended so a new one still shows up:

```ts
const ACCOUNT_EVENT_ORDER: UserEvent[] = [
  UserEvent.AccountCreation, UserEvent.LoginLink, UserEvent.PasswordReset,
  UserEvent.EmailChange,     UserEvent.TestMail,
];
```

Each row renders a template `<TextField select>` (empty option = "no mail sent") plus a *Send test to me* button. Labels come from i18n keys `systemMails.events.<event.toLowerCase()>`, `systemMails.eventInfo.<event>.{short,description,example}` (`:149-154`).

### 10.5 Manual send — `mail-send-page.tsx` (50 KB), `mail-send-job-list.tsx`, `send-mail-to-user.tsx`

Audience builder (`MailAudienceInput`: `base` ∈ `{allUsers, hasSubscription, noActiveSubscription, endedSubscription}` plus member plans, subscription state, autoRenew, payment method, periodicity, start/end date windows, `isPaid`), live recipient count/preview, a *missing placeholders* warning from `mailTemplateMissingPlaceholders`, and job progress polling. `send-mail-to-user.tsx` is the per-user panel on the user edit page.

### 10.6 Mail log — `mail-log-table.tsx`, `mail-log-list.tsx`, `user-mail-log.tsx`

`query MailLogs($filter, $skip, $take)` with `MailLogFilter { mailTemplateId, recipientId, state, type, mailSendJobId }`. `mutation syncMailLogStates($limit)` pulls fresh states from the provider (editor-triggered only — there is **no cron** for it; grep for `@Cron|@Interval` finds no scheduler on `MailLogSyncService`).

### 10.7 Permissions (`libs/permissions/src/lib/permissions.ts:798-862`)

| Constant | id |
| --- | --- |
| `CanGetMailTemplates` | `CAN_GET_MAIL-TEMPLATES` |
| `CanCreateMailTemplates` | `CAN_CREATE_MAIL-TEMPLATES` |
| `CanUpdateMailTemplates` | `CAN_UPDATE_MAIL-TEMPLATES` |
| `CanDeleteMailTemplates` | `CAN_DELETE_MAIL-TEMPLATES` |
| `CanSendTestMailTemplates` | `CAN_SEND_TEST_MAIL-TEMPLATES` |
| `CanSendMailTemplates` | `CAN_SEND_MAIL-TEMPLATES` |
| `CanGetMailLogs` | `CAN_GET_MAIL-LOGS` |
| `CanGetSystemMails` | `CAN_GET_SYSTEM_MAILS` |
| `CanUpdateSystemMails` | `CAN_UPDATE_SYSTEM_MAILS` |
| `CanTestSystemMails` | `CAN_TEST_SYSTEM_MAILS` |

`CanGetMailTemplates` and `CanGetMailLogs` also appear in a second list at `:1435-1436` (the editor-role default set).

---

## 11. GraphQL surface

### 11.1 API (code-first, `libs/membership/api`)

| Operation | Resolver | Permission |
| --- | --- | --- |
| `query mailTemplates` | `MailTemplatesResolver.mailTemplates` | `CanGetMailTemplates` |
| `query mailTemplate(id)` | `.mailTemplate` | `CanGetMailTemplates` |
| `query provider` | `.provider` → `{ name: provider.getName() }` | `CanGetMailTemplates` |
| `query mailTemplateSubscriptions(query)` | `.mailTemplateSubscriptions` (20 most recent, for preview sample data) | `CanGetMailTemplates` |
| `query mailTemplatePreview(input)` | `.mailTemplatePreview` | `CanGetMailTemplates` |
| `mutation createMailTemplate(input)` | `.createMailTemplate` | `CanCreateMailTemplates` |
| `mutation updateMailTemplate(id, input)` | `.updateMailTemplate` | `CanUpdateMailTemplates` |
| `mutation deleteMailTemplate(id)` | `.deleteMailTemplate` → service, refuses if still referenced or if it has mail logs | `CanDeleteMailTemplates` |
| `mutation importMailTemplatesFromProvider` | `.importMailTemplatesFromProvider` | `CanUpdateMailTemplates` |
| `mutation sendTestMailTemplate(input)` | `.sendTestMailTemplate` | `CanSendTestMailTemplates` |
| `query systemMails` | `SystemMailResolver.systemMails` | `CanGetSystemMails` |
| `mutation updateSystemMail(event, mailTemplateId)` | `.updateSystemMail` | `CanUpdateSystemMails` |
| `mutation testSystemMail(event)` | `.testSystemMail` | `CanTestSystemMails` |
| `query mailSendRecipientPreview / mailSendRecipients / mailSendPreview / mailTemplateMissingPlaceholders` | `MailSendResolver` | `CanSendMailTemplates` |
| `mutation sendMailTemplateToUser / createMailSendJob / resumeMailSendJob / cancelMailSendJob` | `MailSendResolver` | `CanSendMailTemplates` |
| `query mailSendJob / mailSendJobs / mailSendJobRecipients / mailLogs` | `MailSendResolver` | `CanGetMailLogs` |
| `mutation syncMailLogStates(limit)` | `MailSendResolver.syncMailLogStates` | `CanGetMailLogs` |
| `query subscriptionCreationMail / subscriptionCancellationMail / accountCreationMail / invoicePaymentMail` | `ActionMailResolver` | — |
| `query mailProviderSettings`, `mutation createMailProviderSetting / updateMailProviderSetting` | `libs/settings/api/.../mail-provider-settings.resolver.ts` | settings permissions |

`MailLogModel` and `MailSendJobRecipient` deliberately select only `{id,name}` of the template and `{id,email,name,firstName}` of the user, because *"templates carry their full html/text body, users their password hash"* (`mail-send.resolver.ts:24-33`).

### 11.2 Editor documents

`libs/editor/api/src/lib/schemas/` — `mail-template.graphql`, `system-mail.graphql`, `mail-send.graphql`, `mail-log.graphql`, `action-mail.graphql`, `subscription-flow.graphql`, `settings.integrations.mail.graphql`.

Two fragments matter for payload size:

```graphql
# Everything the list views and template pickers render. Deliberately without
# htmlContent/textContent: those are whole email bodies, and loading every one of
# them to populate a dropdown made the response grow with each new template.
fragment TinyMailTemplate on MailTemplateModel { id name description subject context status }

# Adds the mail bodies. Only the single-template edit view needs these.
fragment FullMailTemplate on MailTemplateModel { ...TinyMailTemplate htmlContent textContent }
```

---

## 12. Recipe: adding a NEW transactional mail a publisher can edit

There are **two different additions**, usually needed together:

* **(A) a new trigger** — a new `UserEvent` row in the user flow (or a new `SubscriptionEvent` interval), so the publisher can pick *which* template fires for it;
* **(B) a new mail type / context** — a new `MailTemplateContext`, so templates for it get the right sample data, preview, placeholder list and "missing placeholder" check.

### 12.1 Checklist (A) — new `UserEvent`-style system mail

| # | File | Change |
| --- | --- | --- |
| 1 | `libs/api/prisma/schema.prisma` (`enum UserEvent`, `:1457-1463`) | add the value |
| 2 | `libs/api/prisma/migrations/<ts>_add_<event>/migration.sql` | `ALTER TYPE "UserEvent" ADD VALUE '<EVENT>';` + any new columns |
| 3 | `libs/api/prisma/migrations/<ts+1>_seed_<event>_flow/migration.sql` | `INSERT INTO "user_communication_flows" ("modifiedAt","event") VALUES (CURRENT_TIMESTAMP,'<EVENT>') ON CONFLICT ("event") DO NOTHING;` — **must be a separate migration**: Postgres cannot use a new enum value in the same transaction that added it |
| 4 | `npx prisma generate` | regenerate the client |
| 5 | the service that triggers it | `const id = await this.mailContext.getUserTemplateId(UserEvent.X, false); await this.mailContext.sendMail({mailTemplateId: id, recipient: user, optionalData: {...}, mailType: mailLogType.UserFlow})` |
| 6 | `libs/membership/api/src/lib/system-mail/system-mail.model.ts` | nothing — `registerEnumType(UserEvent, {name:'UserEvent'})` picks the new member up automatically |
| 7 | `apps/api-example/schema-v2.graphql` | regenerated by running the API (`autoSchemaFile`) |
| 8 | `npm run generate-api` | regenerates `libs/{editor,website}/api/src/lib/gql/` + `schema-types.ts`; **never hand-edit** |
| 9 | `libs/membership/editor/src/lib/system-mail/system-mail-section.tsx:36-42` | add to `ACCOUNT_EVENT_ORDER` (optional — unlisted events are appended) |
| 10 | `apps/editor/src/app/locales/{de,en,fr}.json` | `translation.systemMails.events.<event_lowercase>` and `translation.systemMails.eventInfo.<event_lowercase>.{short,description,example}` |
| 11 | `apps/api-example/prisma/seed.ts` (`SEED_MAIL_TEMPLATES`, `:1482`) | add a starter template row (dev only) |
| 12 | spec | mock `getUserTemplateId`/`sendMail` on `MailContext` and assert the call (see §16) |

If the new mail is *also* an admin-triggered action, add a method to `ActionMailService` + a query on `ActionMailResolver` + a fragment in `action-mail.graphql`, and call `useActionMailQuestion` in the editor.

### 12.2 Checklist (B) — new `MailTemplateContext` (mail type)

| # | File | Change |
| --- | --- | --- |
| 1 | `libs/api/prisma/schema.prisma` (`enum MailTemplateContext`, `:1524-1533`) | add the value |
| 2 | migration | `ALTER TYPE "MailTemplateContext" ADD VALUE '<value>';` (exactly what `20260804200000_add_mail_template_context_no_subscription/migration.sql` does) |
| 3 | `libs/membership/api/src/lib/mail-template/mail-template-data.ts` | add to the `MailTemplateContextId` union (`:7-14`) **and** to `MAIL_TEMPLATE_CONTEXT_IDS` (`:16-24`); add a `case` to `assembleMailData` (`:58-81`) building the `optional` payload; update `contextUsesSubscription` (`:27-34`) if it needs a subscription; extend `SAMPLE_*` constants if new sample objects are needed |
| 4 | `libs/membership/editor/src/lib/mail-template/mail-placeholders.ts` | add a `MailPlaceholderContext` entry (`id`, `titleKey`, `title`, optional `note`, `placeholders[]`) to `MAIL_PLACEHOLDER_CONTEXTS` (`:244`) and a label key to `MAIL_TYPE_LABEL_KEYS` (`:399-407`) |
| 5 | `apps/editor/src/app/locales/{de,en,fr}.json` | `mailTemplates.placeholderContexts.<id>`, `mailTemplates.mailTypes.<id>`, `mailTemplates.purposeDescriptions.<id>` |
| 6 | the send path | pass `optionalData` matching the new `case` exactly, or placeholders render empty |
| 7 | `libs/membership/api/src/lib/mail-send/placeholder-check.ts` | nothing if the context is covered by `assembleMailData`; it reads `template.context ?? 'custom'` |
| 8 | regenerate | API SDL + `npm run generate-api` |
| 9 | spec | extend `mail-template.service.spec.ts` `getPlaceholderKeysByContext` assertions |

**Variables are declared in exactly two places and validated in none at save time:**

1. *Authoritatively* by `assembleMailData` + the renderer's derive functions, surfaced through `MailTemplateService.getPlaceholderKeysByContext()`.
2. *For the author's benefit* by the hand-maintained `MAIL_PLACEHOLDER_CONTEXTS` in the editor.

The only validation is **advisory and after the fact**: `findMissingPlaceholders(template, withSubscriptionData)` (`libs/membership/api/src/lib/mail-send/placeholder-check.ts:61-89`) diffs `extractPlaceholders(subject+html+text)` against `resolvableKeys(sampleData)` case-insensitively, and the editor shows the result as a warning before a manual send. Saving a template with a nonsense placeholder is allowed; it renders empty.

### 12.3 How a template gets seeded

Templates themselves are **never created by a migration**. Two mechanisms exist:

* **Dev seed** — `apps/api-example/prisma/seed.ts`: `SEED_MAIL_TEMPLATES` (11 entries, `:1482-1699`) with fixed ids `seed-account-creation`, `seed-password-reset`, `seed-login-link`, `seed-email-change`, `seed-subscription-confirmed`, … `seedMailTemplates()` (`:1701-1711`) upserts with `update: {}` so local edits survive re-seeding. The seed does **not** attach them to `UserFlowMail` rows — a developer picks them in the editor.
* **Import from provider** — `importMailTemplatesFromProvider` (§7), for installs migrating off remote templates.

### 12.4 End-to-end worked example: `EMAIL_CHANGE`

This is the most recent complete addition in the repo; every piece is reproduced below.

**1. Migration — enum value and the columns the feature needs**

```sql
-- libs/api/prisma/migrations/20260323120000_add_email_change/migration.sql
-- AlterEnum
ALTER TYPE "UserEvent" ADD VALUE 'EMAIL_CHANGE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "pendingEmail" TEXT,
ADD COLUMN "pendingEmailAt" TIMESTAMP(3);
```

**2. A second migration seeds the flow row** (separate, because of the Postgres enum-in-same-transaction rule)

```sql
-- libs/api/prisma/migrations/20260323120001_seed_email_change_flow/migration.sql
-- Seed UserFlowMail for EMAIL_CHANGE event
INSERT INTO "user_communication_flows" ("modifiedAt", "event")
VALUES (CURRENT_TIMESTAMP, 'EMAIL_CHANGE')
ON CONFLICT ("event") DO NOTHING;
```

**3. Prisma schema** — `enum UserEvent { … EMAIL_CHANGE }` (`schema.prisma:1462`).

**4. The trigger**

```ts
// libs/user/api/src/lib/user.service.ts:362-382
const user = await this.prisma.user.update({
  where: { id: userId },
  data: { pendingEmail: newEmail, pendingEmailAt: new Date() },
  select: unselectPassword,
});
await this.sessionCache.invalidate();

const mailTemplateId = await this.mailContext.getUserTemplateId(
  UserEvent.EMAIL_CHANGE,
  false
);

await this.mailContext.sendMail({
  mailTemplateId,
  recipient: user,
  optionalData: { newEmail },
  mailType: mailLogType.UserFlow,
});
```

**5. The matching mail type** — `MailTemplateContext.emailChange` existed already; its sample data is:

```ts
// libs/membership/api/src/lib/mail-template/mail-template-data.ts:62-64
case 'emailChange':
  optional = { newEmail: 'new.address@example.com' };
  break;
```

**6. The editor placeholder entry**

```ts
// libs/membership/editor/src/lib/mail-template/mail-placeholders.ts:252-264
{
  id: 'emailChange',
  titleKey: 'mailTemplates.placeholderContexts.emailChange',
  title: 'Email change',
  placeholders: [
    {
      key: 'optional_newEmail',
      label: 'New email address',
      description: 'Die neue E-Mail-Adresse, auf die gewechselt wird.',
      example: 'new.address@example.com',
    },
  ],
},
```

**7. The editor's event row** — `UserEvent.EmailChange` added to `ACCOUNT_EVENT_ORDER` (`system-mail-section.tsx:40`), plus the i18n block:

```json
"email_change": "Email address changed",
"email_change": {
  "short": "Confirm the new address.",
  "description": "Goes to the new address when someone changes their email address. The change only takes effect after the confirmation.",
  "example": "“Please confirm your new email address.”"
}
```

**8. The dev seed template**

```ts
// apps/api-example/prisma/seed.ts:1538-1556
{
  id: 'seed-email-change',
  name: 'E-Mail-Adresse ändern',
  description: 'Bestätigung der neuen Adresse bei einem Adresswechsel.',
  context: MailTemplateContext.emailChange,
  subject: 'Bestätige deine neue E-Mail-Adresse',
  htmlContent: mailDocument(`    <p>Hallo {{user_firstName}}</p>
    <p>Du möchtest künftig <strong>{{optional_newEmail}}</strong> verwenden.</p>
    <p><a href="${SEED_LOGIN_URL}">Änderung bestätigen</a></p>
    <p>Bis zur Bestätigung bleibt {{user_email}} aktiv.</p>`),
  textContent: `…`,
}
```

**9. Generated artefacts** — `apps/api-example/schema-v2.graphql:5835-5841` now lists `EMAIL_CHANGE`, and `npm run generate-api` propagated `UserEvent.EmailChange` into `libs/editor/api`.

---

## 13. Queueing, retries and failure handling

There is **no message broker**. Four independent mechanisms exist.

### 13.1 Inline send (most transactional mails)

`MailContext.sendMail` → `MailController.sendMail` runs **synchronously inside the request/job**. A provider error propagates to the caller after a `rejected` `MailLog` row has been written (`mail.controller.ts:129-140`). There is no automatic retry.

### 13.2 Nightly periodic job

`PeriodicJobExecutor` (`libs/membership/api/src/lib/periodic-job/periodic-job.executor.ts`):

* `@Cron(process.env.PERIODIC_JOB_EXECUTION_SCHEDULE || '0 0 3 * * *')`, disabled unless the expression matches `[1-5]?[0-9] [1-5]?[0-9] [1-2]?[0-9] \* \* \*` (once-a-day only).
* Cross-replica single-execution via `kv.claim('nightly-job', 12h, {retryForMs: 60_000})`; with no Dragonfly configured it falls back to `concurrentExecute()` where the DB guards it; if Dragonfly is configured but unreachable the run is **skipped** entirely.
* Missed days are caught up: `PeriodicJobService` builds a date array from the last run to today and marks the latest unfinished run `isRetry: true`.
* On a retry run, `MailController` skips any mail whose `mailIdentifier` already exists.

Recipient-specific failures are tolerated:

```ts
// libs/membership/api/src/lib/periodic-job/periodic-job.service.ts:906-934
try {
  await new MailController(this.prismaService, this.mailContext, {…}).sendMail();
} catch (error) {
  if (!(error instanceof MailProviderRecipientError)) throw error;
  this.logger.warn(`Skipping mail to ${user.email}: ${(error as Error).message}`);
}
```

`MailProviderRecipientError` is raised only by the Mandrill provider, for reject reasons in `{hard-bounce, soft-bounce, spam, unsub, custom, invalid}` (`mailchimp-mail-provider.ts:35-42, 257-282`). Everything else (`invalid-sender`, `unsigned`, `test-mode-limit`, `rule`, or any unknown reason) is treated as an account-level failure and aborts the run.

### 13.3 Manual bulk send jobs (`MailSendJobService`)

The only real queue in the system, and it is **database-backed**:

| Constant | Value | Meaning |
| --- | ---: | --- |
| `BATCH_SIZE` | 100 | recipients resolved per page while materialising |
| `SEND_BATCH_SIZE` | 25 | queue rows loaded per send round |
| `PROGRESS_EVERY` | 10 | recipients between progress writes |
| `STALLED_AFTER_MS` | 600 000 | a `running` job with no heartbeat for 10 min is considered interrupted |
| `MAX_AUTO_RESUMES` | 5 | automatic pickups before the job is marked `failed` with `ABANDONED_ERROR` |

Flow: `createJob` persists the job `queued` and fires `drain()` fire-and-forget; `MailSendJobExecutor.@Interval(60_000)` re-drains as a safety net. `drain()` guards with an in-process `draining` flag, re-queues stalled jobs, then claims each job atomically (`updateMany({where:{id, status:'queued'}, data:{status:'running'}})`, `:311-322`). `buildQueue` materialises one `MailSendJobRecipient` row per planned mail (deleting a partial queue first, which is safe because nothing can have been sent before `recipientsResolvedAt`). `sendQueue` re-checks `isRunning(jobId)` **before every single recipient** so cancelling takes effect immediately. Each recipient is claimed atomically (`pending → sending`, `attempts++`) so two workers never double-send.

`deliver()` never throws: a failure marks the row `failed` with the message and the loop continues (`:487-525`).

Continuation rules: `resumeJob(jobId, retryUnfinished=false)` re-opens only `pending` rows by default; `retryUnfinished: true` additionally re-opens `failed` **and** `sending` rows — the latter is a deliberate decision because whether that mail went out is unknown.

### 13.4 Delivery-state reconciliation

* **Webhook (primary):** `POST /mail-webhooks/:providerId`. The controller matches `providerId` against the single configured provider, calls `provider.webhookForSendMail({req})`, and for each returned `MailLogStatus` updates `mailLog.state` and `mailData`. A missing `mailLog` is skipped with a literal `// TODO: handle missing mailLog`.
* **Polling (fallback):** `MailLogSyncService.syncOpenStates(limit=100, max 500)` selects `MailLog` rows whose `state ∈ {submitted, accepted, deferred}` **and** `mailProviderMessageID != null`, newest first, asks `provider.getMessageStates(ids)` and writes back changes. Only Mandrill implements `getMessageStates`; SMTP, Slack, Log and Mailgun return `[]`, so their logs are never updated this way. Triggered exclusively by the `syncMailLogStates` mutation.

State mappings:

| Provider event/state | `MailLogState` |
| --- | --- |
| Mailgun `accepted` / `delivered` / `failed` / `rejected` | `accepted` / `delivered` / `bounced` / `rejected` |
| Mandrill webhook `send` / `deferral` / `hard_bounce`,`soft_bounce` / `reject` | `delivered` / `deferred` / `bounced` / `rejected` |
| Mandrill `messages/info` `sent`,`spam`,`unsub` / `queued`,`scheduled` / `deferred` / `bounced`,`soft-bounced` / `rejected`,`invalid` | `delivered` / `submitted` / `deferred` / `bounced` / `rejected` |

---

## 14. Local development behaviour

`docker-compose.yml:61-67`:

```yaml
  mailpit:
    image: axllent/mailpit:latest
    ports:
      # SMTP endpoint (providers connect here) + web UI to read caught mails.
      - '127.0.0.1:1025:1025'
      - '127.0.0.1:8025:8025'
```

and the API service is pointed at it (`docker-compose.yml:33-35`):

```yaml
      MAIL_SMTP_HOST: mailpit
      MAIL_SMTP_PORT: '1025'
      MAIL_SMTP_FROM: no-reply@wepublish.local
```

`SmtpMailProvider.createTransporter()` (`smtp-mail-provider.ts:22-42`) prefers the DB config and falls back to those env vars, with final defaults `localhost:1025`; `from` falls back to `MAIL_SMTP_FROM` and then `no-reply@wepublish.local`. The seeds create the `smtp` provider row, so a fresh dev database sends to Mailpit out of the box. Read the caught mail at <http://localhost:8025>.

`LogMailProvider` is the "no infrastructure at all" option. It redacts secrets before logging:

```ts
const redactSecrets = (text: string): string =>
  text
    .replace(/([?&](?:jwt|token)=)[^&#\s"'<>]+/gi, `$1[redacted]`)
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[redacted]');
```

and caps the body at `LOG_MAIL_BODY_MAX_LENGTH = 2000` and the extracted links at `LOG_MAIL_MAX_LINKS = 20`.

`FakeMailProvider` is wired by `registerMailsModule()` (`libs/membership/api/src/lib/testing/module-registrars.ts:27-52`) for integration tests, together with a pre-seeded KV entry under `settings:mailprovider`.

---

## 15. Module wiring

```ts
// apps/api-example/src/nestapp/app.module.ts:143-179 (abridged)
MailsModule.registerAsync({
  imports: [ConfigModule, PrismaModule, KvTtlCacheModule],
  useFactory: async (config, prisma, registry: ProviderRegistryService) => {
    await registry.ensureLoaded();
    const jwtPrivateKey = (config.get('JWT_PRIVATE_KEY') || '').replace(/\\n/g, '\n');
    const hostURL    = config.get('HOST_URL')    || 'http://localhost:4000';
    const websiteURL = config.get('WEBSITE_URL') || 'http://localhost:3000';
    const jwtExpiresSetting = await prisma.setting.findUnique({
      where: { name: SettingName.SEND_LOGIN_JWT_EXPIRES_MIN },
    });
    const jwtExpires = (jwtExpiresSetting?.value as number)
      ?? parseInt(config.get('SEND_LOGIN_JWT_EXPIRES_MIN') ?? `${6 * 60}`);
    return {
      mailProvider: registry.mailProvider,
      jwtGenerator: (userId: string) => generateJWT({
        id: userId, privateKey: jwtPrivateKey, issuer: hostURL,
        audience: websiteURL, expiresInMinutes: jwtExpires,
      }),
    };
  },
  inject: [ConfigService, PrismaClient, ProviderRegistryService],
  global: true,
}),
```

`MembershipModule` (`libs/membership/api/src/lib/membership.module.ts`) aggregates `SubscriptionFlowModule`, `MailTemplateModule`, `MailSendModule`, `DashboardModule`, `SystemMailModule`, `PeriodicJobModule`, `MemberContextModule`, `MailchimpSyncModule`, `ActionMailModule`.

---

## 16. Testing

Runner: **Vitest** everywhere (`libs/mail/api/vitest.config.ts` → `createVitestConfig({name:'mail-api', environment:'node', nest:true})`). Commands: `npx nx test mail-api`, `npx nx test membership-api`, `npx nx test membership-editor`.

| Spec | Technique |
| --- | --- |
| `mail-renderer.spec.ts` (263 lines, 26 tests) | Pure unit tests over `flattenMailData` / `renderTemplate` / `convertMandrillPlaceholders` / `deriveDateFormats` (incl. a `TZ`-env block) / `deriveComputedFields` / `composeMail`. |
| `mail.controller.spec.ts` (311 lines) | `Test.createTestingModule` with `PrismaClient` and `KvTtlCacheService` mocked (`createKvMock()`), a real `MailchimpMailProvider`, and **nock** intercepting `https://mandrillapp.com/api/1.0/messages/send`; asserts the composed `{subject, html, from_email, to}` and the dedup `mailLog.count` sequence `0,0,1`. |
| `mail-context.spec.ts` (57 lines) | Hand-rolled prisma mock; asserts `getUsedTemplateIdentifiers` uses `select` and not `include`. |
| `create-mail-provider.spec.ts` | Asserts `loadMailProvider` filters `deletedAt: null` and returns `null` when everything is retired. |
| `log-mail-provider.spec.ts` (178 lines) | Asserts redaction, truncation, link extraction, "no message id". |
| `mailgun-mail-provider.spec.ts`, `mailchimp-mail-provider.spec.ts` | nock + JSON fixtures in `src/lib/__fixtures__/`. |
| `mail-template.service.spec.ts`, `mail-send-job.service.spec.ts`, `mail-send-recipient.service.spec.ts`, `mail-log-sync.service.spec.ts`, `placeholder-check.spec.ts` | Service-level with prisma mocks. |
| `system-mail-section.spec.tsx`, `user-mail-log.spec.tsx` | Editor component tests. |

To test a **new** mail type the established pattern is: mock `MailContext` with `{ getUserTemplateId: vi.fn(), sendMail: vi.fn() }`, invoke the service, assert `sendMail` was called with `{mailTemplateId, recipient, optionalData, mailType}`; plus a renderer test for any new derived placeholder; plus a `placeholder-check` test if a new context was added.

---

## 17. CRITICAL — mailing a NON-user recipient

This is the single largest structural obstacle for the BKA port.

### 17.1 Why it is hard

| # | Obstacle | Evidence |
| --- | --- | --- |
| 1 | **`MailController` takes a `User`, not an address.** `MailControllerConfig.recipient: User`, and the address is read as `this.config.recipient.email`. | `mail.controller.ts:25,125` |
| 2 | **`MailLog.recipientID` is a NOT NULL FK to `users(id)`.** `writeLog` does `recipient: {connect: {id: this.config.recipient.id}}`. You cannot log a mail to an address that has no user row. | `schema.prisma:553-554`; migration `20230510133452…:27,132`; `mail.controller.ts:162-166` |
| 3 | **The JWT is minted for the recipient.** `buildData()` calls `jwtGenerator(recipient.id)` unconditionally, so every mail carries a login token *for that user id* unless `jwtOverride` is passed. For a non-user there is no id to mint for. | `mail.controller.ts:94-97` |
| 4 | **`MailContext.sendMail` is the only path that writes a `MailLog`.** The two escape hatches (`sendComposedMail`, `sendComposedContent`) accept a plain `recipient: string` but write **no log at all** — they take a `mailLogID` the caller invents and never persist it. A mail sent that way is invisible in `/maillog`, cannot be webhook-updated (the controller skips unknown ids), and cannot be polled. | `mail-context.ts:145-221`; `mail.webhook.ts:60-70` |
| 5 | **The only existing caller of `sendComposedContent` deliberately refuses arbitrary addresses.** | `mail-template.resolver.ts:174-184`: *"Test mails always go to the current editor only — never an arbitrary address — and carry that user's own login token."* |
| 6 | **Manual send jobs are user-only too.** `MailSendJobRecipient.userId` is a required FK; every audience (`allUsers`, `hasSubscription`, `noActiveSubscription`, `endedSubscription`) is derived from `prisma.user` / `prisma.subscription`. | `schema.prisma:659-684`; `mail-send-recipient.service.ts:62-113` |
| 7 | **The editor's mail types assume a `user`.** `ALWAYS_PLACEHOLDERS` is entirely `user_*` + `jwt`; `placeholder-check.ts` always binds a full `SAMPLE_RECIPIENT` user and a JWT. A "no user at all" context does not exist — even `customNoSubscription` means *a user without a subscription*, not *a non-user*. | `mail-placeholders.ts:46-125`; `placeholder-check.ts:17-33,61-89` |
| 8 | **No per-recipient language.** The renderer hard-codes `de-CH` for all derived date/money formats; there is no locale on `MailTemplate` and no per-recipient locale anywhere in the send path. | `mail-renderer.ts:171` |
| 9 | **No CC/BCC and no per-mail `replyTo`.** `SendMailProps` has `recipient`, `replyToAddress`, `subject`, `message`, `messageHtml` and nothing else; `replyToAddress` is always `config.replyToAddress ?? config.fromAddress ?? ''`. There is no `returnPath` either. | `mail-provider.interface.ts:9-16`; `mail-context.ts:177,214` |
| 10 | **One recipient per send.** Mandrill is called with a single-element `to` array and the comment *"One recipient per send, so the first result is this message."* | `mailchimp-mail-provider.ts:191-210` |
| 11 | **`SubscriptionEvent`/`UserEvent` flows are the only configurable trigger registries**, and both resolve a template for a *user* or a *subscription*. There is no registry keyed by anything else. | §3.2, §3.3 |

### 17.2 Evidence that the user-only assumption already bites

`EMAIL_CHANGE` is supposed to confirm a **new** address. The code sends to the **old** one, because `sendMail` can only address `User.email`:

```ts
// libs/user/api/src/lib/user.service.ts:362-382 — `user` still holds the OLD email;
// the new one is only in `pendingEmail` and in `optionalData.newEmail`.
const user = await this.prisma.user.update({
  where: { id: userId },
  data: { pendingEmail: newEmail, pendingEmailAt: new Date() },
  select: unselectPassword,
});
…
await this.mailContext.sendMail({ mailTemplateId, recipient: user, optionalData: { newEmail }, mailType: mailLogType.UserFlow });
```

The English i18n for this event says the opposite: *"Goes to the **new** address when someone changes their email address"* (`apps/editor/src/app/locales/en.json`, `systemMails.eventInfo.email_change.description`). **UNVERIFIED** whether sending to the old address is intentional (notify-the-old-address is a legitimate security pattern) or an accepted limitation; what *is* verified is that the code has no way to address anything other than `User.email` through `sendMail`, and that the documentation and the code disagree. Reading the git history of `user.service.ts` around `requestEmailChange`, or asking the author of `20260323120000_add_email_change`, would settle it.

### 17.3 What the BKA system actually needs (cross-reference)

`/Users/itrulia/Documents/insitu-admin/src/Mailer/Mailer.php` builds **ten** notification mails. Recipients are a heterogeneous `array<User|string|null>` — a `User` entity *or* a bare address string:

| Method | Template | Recipients | Non-user possible? |
| --- | --- | --- | --- |
| `newEventCreatedByAnotherOrganizationUser` | `emails/admin_event_1a` | `[$user]` | no |
| `newEventCreatedByAnotherOrganizationAdmin` | `emails/admin_event_1b` | place-organization users, **else `$this->replyToAddress`** | yes (fallback) |
| `newEventProposedByExternalPerson` | `emails/admin_event_2b` | place-organization users, **else `$this->replyToAddress`** | yes (fallback) |
| `newEventProposedBy` | `emails/admin_event_2a` | **`[$event->getProposedBy()->getEmail()]`** | **yes — always** |
| `eventPublished` | `emails/admin_event_3a` | `[$address]` (a raw string parameter) | **yes — always** |
| `newEventProposedByPublishedAdmin` | `emails/admin_event_3b` | other admins of the place organization | no |
| `eventModifiedByOwnerAdminPlace` | `emails/admin_event_4a` | `proposedBy->getEmail()` when externally proposed, else `$event->getUser()` | **yes — conditionally** |
| `eventModifiedByEventOwner` | `emails/admin_event_4b` | place admins **else `$this->replyToAddress`** | yes (fallback) |
| `accountCreatedChangePassword` | `propose_event/user-created` | `[$userEmail]` (string) | yes |
| `resetPasswordRequest` | `reset_password/email` | `[$userEmail]` (string) | yes |

`EventProposedBy` is explicitly **not** a `User`: it is its own entity with `firstname`, `lastname`, `email`, `phone`, `organization` and a `RESTRICT` FK from `event.proposed_by_id` (`src/Entity/EventProposedBy.php`; table verified below).

Measured on the restored BKA production database:

```
$ docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin -c \
  "SELECT count(*) AS proposals, count(DISTINCT email) AS distinct_emails FROM event_proposed_by;"
 proposals | distinct_emails
-----------+-----------------
      4366 |            1568

$ … "SELECT count(DISTINCT p.email) FROM event_proposed_by p
     JOIN \"user\" u ON lower(u.email)=lower(p.email);"
 proposer_emails_that_are_users
--------------------------------
                             65

$ … "SELECT count(*) FROM \"user\";"
 count
-------
   427
```

**1 503 of 1 568 distinct proposer addresses (95.9 %) belong to nobody with an account.** Those are exactly the recipients `MailLog.recipientID` cannot reference.

Three further BKA mail features have no counterpart in We.Publish:

* **Per-recipient locale.** `Mailer::build()` groups recipients by `User::$locale` and emits one `TemplatedEmail` per language, with `->locale($locale)` and a translated subject (`Mailer.php:195-232`); unknown addresses fall back to the sender's current locale via `localeFor()` (`:234-242`). The BKA deployment runs `LOCALES=fr|de`, `DEFAULT_LOCALE=de`.
* **BCC on every notification.** `addBccs()` (`:254-263`) copies a configured list onto every mail, and `sendEmail()` skips only a mail with no `to`, `cc` **and** `bcc` (`:170-185`) — i.e. the BCC alone is reason enough to send.
* **`replyTo` + `returnPath`** set per mail for notifications but not for account mails (`:220-222`).

---

## 18. Known rough edges in the current implementation

Facts, not opinions — each is something the port will run into.

1. `docs/emailtemplates.md` describes an architecture that was replaced (§7).
2. `MailContextConfig` and `MailProviderConfig` are duplicated verbatim in two files (`mail-context.ts:30-99`, `base-mail-provider.ts:98-165`).
3. `MailProviderProps` is declared **twice** in `base-mail-provider.ts` (`:21-24` and `:26-31`); TypeScript merges the interfaces.
4. `mailLogType` is a *numeric* TS enum whose values leak into `mailIdentifier` strings (`0-…`, `1-…`), so renumbering it would silently break retry dedup for in-flight runs.
5. `libs/mail/api/README.md` still tells you to run the tests "via Jest"; the project is Vitest-only.
6. `MailTemplateStatus.Error` exists in the interface but is never produced; the resolver only returns `Ok`/`Unused`.
7. The webhook controller skips unknown `mailLogID`s with a literal `// TODO: handle missing mailLog`.
8. `syncMailLogStates` has no scheduler — delivery states only refresh when a human presses the button or a provider webhook arrives.
9. `MAIL_PLACEHOLDER_CONTEXTS` (editor) and `getPlaceholderKeysByContext()` (API, "the single source of truth") are not diffed by any test; drift is possible.
10. `FakeMailProvider.initDatabaseConfiguration(type)` ignores its parameter (lint-visible unused arg).

---

## Porting notes

*Opinion and design input only — everything above is description.*

1. **The `MailLog.recipientID` FK is the decision point.** Mailing external organisers through the existing pipeline requires one of: (a) making `recipientID` nullable and adding a `recipientEmail` column (restoring what the 2022 schema had before the 2023 migration replaced it), (b) a parallel `EventMailLog` table keyed by address, or (c) creating shadow `User` rows for proposers — which would pollute `users`, the manual-send audiences (`allUsers` would mail 1 500 strangers), Mailchimp contact sync, and the login system. (a) is the smallest change that keeps one unified mail log, one editor page and one delivery-state pipeline.
2. **A new `recipient` abstraction is needed in `MailControllerConfig`.** Something like `recipient: User | {email: string; firstName?: string; name?: string; locale?: string}`, with `buildData()` minting a JWT only when a real user id exists, and `writeLog()` connecting the user only when there is one. Every current call site passes a `User`, so this can be additive.
3. **BKA's event mails are triggered by domain events, not by `UserEvent`/`SubscriptionEvent`.** A third flow table — e.g. `EventFlowMail { event EventMailEvent @unique, mailTemplateId }` mirroring `UserFlowMail` exactly — would reuse the whole editor section pattern (`SystemMailSection` is ~150 lines and is almost entirely generic over "a list of events each with a template dropdown").
4. **Ten BKA templates map onto ~10 new `MailTemplateContext` values** (or one `event` context with a rich `optional.event.*` payload). The latter is cheaper: one `case` in `assembleMailData`, one entry in `MAIL_PLACEHOLDER_CONTEXTS`, and a sample `Event` object. The former gives authors a tighter placeholder list per mail.
5. **Multi-recipient and BCC are missing from `SendMailProps`.** Adding `cc?: string[]`, `bcc?: string[]` and an optional per-mail `replyTo`/`returnPath` touches all six providers but each one trivially (Mandrill already takes a `to[]` array; nodemailer and Mailgun both accept cc/bcc natively).
6. **Per-recipient locale has no home today.** The renderer's `LOCALE = 'de-CH'` constant and the single-language `MailTemplate` row both need to become per-locale. The cheapest shape that matches BKA's `LOCALES=fr|de` is a `locale` column on `MailTemplate` plus a `(flowEvent, locale)` lookup, mirroring how `Mailer::build()` emits one mail per language.
7. **The block-content/revision requirement cuts across this.** Mail templates are plain HTML strings today (`htmlContent`), edited by a bespoke iframe WYSIWYG — they are *not* block content and have no draft/pending/published revisions. If event mails must render block content, the renderer gains a dependency on the block rendering stack that `composeMail` currently does not have.
8. **Keep `MailProviderRecipientError`.** Bulk-mailing 1 500 external addresses from a 2026 dataset will hit dead mailboxes; the existing "skip this recipient, keep the run going" contract is exactly right and should be extended to any new batch path.
9. **Dev story is already solved** — Mailpit at `localhost:8025` plus the `LOG` provider mean the port needs no new local mail infrastructure.
