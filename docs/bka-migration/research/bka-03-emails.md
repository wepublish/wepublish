# BKA admin — outbound email: complete catalogue

Scope note. This document inventories **every email the In Situ / BKa admin backend
(`/Users/itrulia/Documents/insitu-admin`, Symfony 6.4) can send**, as the BKa product sees it
(`SYLIUS_THEME=in-situ-admin/bka`, `LOCALES=fr|de`, `DEFAULT_LOCALE=de`). There are exactly **ten**
distinct emails, produced by a single service (`App\Mailer\Mailer`) from ten Twig templates, with
exactly **three** call-site files. For each email it records: the internal builder method, the
template, the triggering code path with `file:line`, how every recipient/From/Reply-To/BCC/Return-Path
address is resolved, the subject and its translation key, the complete set of template variables, the
gating conditions, a plain-English statement of intent, and the raw Twig of the **BKa** template (the
BKa theme overrides all eight event templates and the layout; those overrides are authoritative, and
the diffs against the default In Situ versions are recorded). It also decodes the
`admin_event_1a/1b/2a/2b/3a/3b/4a/4b` naming scheme, and covers the layout/branding, inline CSS,
attachments (there are none), `MAILER_BCC_ADDRESS`, locale selection, Messenger queueing (there is
none — mail is synchronous) and bounce handling (there is none). Facts are grounded in file paths,
line numbers, `vendor/` source, SQL run against the restored BKa production database, and
`php bin/console` output from the running container. A short, clearly separated *Porting notes*
section closes the document.

---

## 1. Executive summary

### 1.1 The ten emails

| # | Internal name (`Mailer` method) | Template (BKa override) | Subject key | Recipients | Trigger |
|---|---|---|---|---|---|
| 1a | `newEventCreatedByAnotherOrganizationUser` | `emails/admin_event_1a.html.twig` | `_mails.1a.title` | the logged-in user who created the event | back-office event **create** at a foreign place |
| 1b | `newEventCreatedByAnotherOrganizationAdmin` | `emails/admin_event_1b.html.twig` | `_mails.1b.title` | users of the **place's** organisation (else Reply-To) | same create, when status is `to_validate` |
| 2a | `newEventProposedBy` | `emails/admin_event_2a.html.twig` | `_mails.2a.title` | `event.proposedBy.email` (the guest proposer) | public propose-event wizard, step 5 |
| 2b | `newEventProposedByExternalPerson` | `emails/admin_event_2b.html.twig` | `_mails.2b.title` | users of the **place's** organisation (else Reply-To) | public propose-event wizard, step 5 |
| 3a | `eventPublished` | `emails/admin_event_3a.html.twig` | `_mails.3a.title` | the event's owner — proposer email or `event.user` | back-office **edit**, `to_validate` → `publish` |
| 3b | `newEventProposedByPublishedAdmin` | `emails/admin_event_3b.html.twig` | `_mails.3b.title` | the **other** users of the place's organisation | back-office edit `to_validate` → `publish`, **and** create with status ≠ `to_validate` |
| 4a | `eventModifiedByOwnerAdminPlace` | `emails/admin_event_4a.html.twig` | `_mails.4a.title` | the event's owner — proposer email or `event.user` | back-office **edit** by someone who is not the owner |
| 4b | `eventModifiedByEventOwner` | `emails/admin_event_4b.html.twig` | `_mails.4b.title` | users of the **place's** organisation (else Reply-To) | back-office **edit** by the owner/proposer themselves |
| R | `resetPasswordRequest` | `reset_password/email.html.twig` (**no** BKa override) | `reset_password.email_content.title` | the address that requested the reset | "forgot password" form |
| U | `accountCreatedChangePassword` | `propose_event/user-created.html.twig` (**no** BKa override) | `user.created.email_content.title` | the new proposer account's address | propose-event step 5, when the proposer has no account yet |

All ten are built by `App\Mailer\Mailer` (`/Users/itrulia/Documents/insitu-admin/src/Mailer/Mailer.php`).
There is no other mail-sending code in the application:

```
$ grep -rln "Mailer" src/ | sort
src/Controller/EventController.php
src/Controller/ProposeEventController.php
src/Controller/ResetPasswordController.php
src/Mailer/Mailer.php
```

Notably **the REST APIs (v1 `/api/v1/events`, v2 API Platform `/api/v2/events`) send no email at all** —
`src/Controller/ApiEventController.php:374` tells the caller *"A notification was sent to the platform's
admins"*, but the only thing that happens there is `$this->logger->error(...)`
(`src/Controller/ApiEventController.php:366-369`). Error notification by email was replaced by Sentry
(`/Users/itrulia/Documents/insitu-admin/.env:47-51`, `config/packages/monolog.yaml:60-65`).

### 1.2 Constant envelope facts (all ten emails)

| Header | Value | Source |
|---|---|---|
| `From` | `%env(string:MAILER_FROM_ADDRESS)%`, bare address, **no display name** | `Mailer.php:213`, `config/services.yaml:20` |
| `Reply-To` | `%env(string:MAILER_REPLYTO_ADDRESS)%` — **only** for the 8 event notifications | `Mailer.php:220-222`, `config/services.yaml:21` |
| `Return-Path` | `%env(string:MAILER_RETURNPATH_ADDRESS)%` — **only** for the 8 event notifications | `Mailer.php:221`, `config/services.yaml:23` |
| `Bcc` | every non-empty entry of `%env(csv:MAILER_BCC_ADDRESS)%` — added to **all ten**, including the password emails | `Mailer.php:228`, `Mailer.php:254-262`, `config/services.yaml:22` |
| `Cc` | never set anywhere | — |
| Attachments | none anywhere (`grep -rnE "\->attach|DataPart|\->embed" src/` → no hits in mail code) | — |
| Body parts | `text/html` from Twig + an auto-generated `text/plain` alternative (`strip_tags`) | `vendor/symfony/twig-bridge/Mime/BodyRenderer.php:74-77`, `vendor/symfony/mime/HtmlToTextConverter/DefaultHtmlToTextConverter.php` |

---

## 2. Transport, configuration and delivery

### 2.1 Mailer configuration

`/Users/itrulia/Documents/insitu-admin/config/packages/mailer.yaml` — the whole file:

```yaml
framework:
    mailer:
        dsn: '%env(MAILER_DSN)%'
```

Nothing else is configured: no `envelope.sender`, no `envelope.recipients`, no `headers`, no
`message_bus` override.

### 2.2 Environment variables

`/Users/itrulia/Documents/insitu-admin/.env:69-72` (defaults, all empty):

```
MAILER_FROM_ADDRESS=
MAILER_REPLYTO_ADDRESS=
MAILER_BCC_ADDRESS=
MAILER_RETURNPATH_ADDRESS=
```

`/Users/itrulia/Documents/insitu-admin/docker-compose.yaml:29-33` (the local BKa stack):

```yaml
      MAILER_DSN: "null://localhost"
      MESSENGER_TRANSPORT_DSN: "doctrine://default?auto_setup=0"
      MAILER_FROM_ADDRESS: "test@wepublish.ch"
      MAILER_REPLYTO_ADDRESS: "test@wepublish.ch"
      MAILER_RETURNPATH_ADDRESS: "test@wepublish.ch"
```

**`MAILER_BCC_ADDRESS` is not set in the local compose file.** The container binding is
`%env(csv:MAILER_BCC_ADDRESS)%`; Symfony's CSV processor returns `[]` for an empty string
(`vendor/symfony/dependency-injection/EnvVarProcessor.php:354-355`), so locally no BCC is added. The
`null !== $address` guard in `Mailer::addBccs()` (`Mailer.php:257`) is defensive against older
Symfony versions where `str_getcsv('')` yielded `[null]`.

**Production values are UNVERIFIED.** No production env file, Helm chart or deployment manifest
exists in the repo (`.github/workflows/*` contain no `MAILER_*`), and
`git log --all -S "MAILER_BCC_ADDRESS"` returns only the initial commit. What *is* verifiable:
`symfony/mailchimp-mailer` (the Mandrill bridge) is a hard runtime dependency
(`composer.json`, `symfony/mailchimp-mailer 6.4.*`) and `.env:107-110` documents
`MAILER_DSN=mandrill://KEY@default` / `mandrill+smtp://USERNAME:PASSWORD@default`, so production
almost certainly delivers through **Mandrill (Mailchimp Transactional)**. Ask the BKa ops owner for
the real `MAILER_DSN`, `MAILER_FROM_ADDRESS`, `MAILER_REPLYTO_ADDRESS`, `MAILER_RETURNPATH_ADDRESS`
and `MAILER_BCC_ADDRESS` — the BCC in particular changes who currently sees every single email,
*including password-reset links*.

### 2.3 Messenger: mail is **synchronous**

`/Users/itrulia/Documents/insitu-admin/config/packages/messenger.yaml`:

```yaml
framework:
    messenger:
        failure_transport: failed

        transports:
            async:
                dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
                options:
                    use_notify: true
                    check_delayed_interval: 60000
                retry_strategy:
                    max_retries: 3
                    multiplier: 2
            failed: 'doctrine://default?queue_name=failed'
            sync: 'sync://'

        routing:
            Symfony\Component\Mailer\Messenger\SendEmailMessage: sync
            Symfony\Component\Notifier\Message\ChatMessage: async
            Symfony\Component\Notifier\Message\SmsMessage: async
```

`SendEmailMessage` → `sync://`. Consequences, all of which matter for the port:

* Templates are rendered **inside the HTTP request** that triggered them. `app.request.*`,
  `path()`, `url()` and `asset()` therefore all work and resolve against the live request's
  scheme/host.
* The Sylius theme is set by `App\EventListener\ThemeRequestListener::onKernelRequest()`
  (`src/EventListener/ThemeRequestListener.php:36-48`), i.e. **per HTTP request**. Because mail is
  sync, the BKa theme *is* active while the email renders. If mail were moved to the async transport
  the worker would have no request, `ThemeContext` would be `null`, and **the default In Situ
  templates and branding would be used instead** — plus `app.request.getSchemeAndHttpHost()` would
  blow up. This is a load-bearing coupling.
* Failures surface as `HandlerFailedException` from the bus, which is why
  `Mailer::sendEmail()` catches `\Throwable` rather than a transport exception
  (`Mailer.php:179-183`, with that exact comment).
* `messenger_messages` in the restored production DB is empty:

  ```
  $ docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin \
      -c "SELECT queue_name, count(*) FROM messenger_messages GROUP BY 1;"
   queue_name | count
  ------------+-------
  (0 rows)
  ```

* No `messenger:consume` worker is defined in `docker-compose.yaml`; there is no retry, no dead-letter
  handling and no delivery log for email.

### 2.4 Notifier

`/Users/itrulia/Documents/insitu-admin/config/packages/notifier.yaml` is the untouched Flex recipe:

```yaml
framework:
    notifier:
        chatter_transports:
        texter_transports:
        channel_policy:
            # use chat/slack, chat/telegram, sms/twilio or sms/nexmo
            urgent: ['email']
            high: ['email']
            medium: ['email']
            low: ['email']
        admin_recipients:
            - { email: admin@example.com }
```

**Nothing in the application uses the Notifier.** `grep -rnE "Symfony..Component..Notifier|NotifierInterface|Notification\(" src/ tests/`
returns no hits. `admin@example.com` is dead placeholder config. No chatter/texter transports are
configured, so the `ChatMessage`/`SmsMessage` routing entries in `messenger.yaml` are dead too.

### 2.5 Logging and error reporting

`config/packages/monolog.yaml` has **no** mail handler in any environment. The `prod` `main` handler
excludes the `mailer` channel (`channels: ["!mailer", "!deprecation"]`, line 49) and groups
`streamed` + `sentry`. `.env:47-51` states explicitly that Sentry "replaces the old error-notification
emails".

### 2.6 Bounce handling

**There is none.** The only trace of bounce plumbing is the `Return-Path` header:

```
$ grep -rniE "bounce|returnPath|return_path|webhook" src/ config/
src/Mailer/Mailer.php:29:        private string $returnPathAddress,
src/Mailer/Mailer.php:221:                $email->replyTo($this->replyToAddress)->returnPath($this->returnPathAddress);
config/services.yaml:23:      $returnPathAddress: '%env(string:MAILER_RETURNPATH_ADDRESS)%'
```

No webhook endpoint, no suppression list, no `enabled`/`bounced` flag on `user`
(`\d "user"` shows only `id, email, roles, password, enabled, last_login, created_at, updated_at,
locale, member, config`). Bounces land in whatever mailbox `MAILER_RETURNPATH_ADDRESS` points at and
are handled by a human, if at all. Note that the two password emails are sent with
`notification: false` and therefore carry **neither Reply-To nor Return-Path** — their bounces go to
the `From` address.

---

## 3. `App\Mailer\Mailer` — the single mail service

File: `/Users/itrulia/Documents/insitu-admin/src/Mailer/Mailer.php` (264 lines). Class docblock
(lines 15-21):

> Builds notification emails in each recipient's language (`User::$locale`).
> Every builder returns a list of emails, one per recipient language, because a single notification
> can go to several users with different languages. Plain addresses are matched to a user by email;
> unknown addresses get the current (sender's) language.

### 3.1 Constructor / DI

```php
readonly class Mailer
{
    public function __construct(
        private MailerInterface $mailer,
        private string $fromAddress,          // MAILER_FROM_ADDRESS
        private string $replyToAddress,       // MAILER_REPLYTO_ADDRESS
        private array $bccAddress,            // csv:MAILER_BCC_ADDRESS
        private string $returnPathAddress,    // MAILER_RETURNPATH_ADDRESS
        private TranslatorInterface $translator,
        private LoggerInterface $logger,
        private UserRepository $userRepository,
        private string $locales,              // '%locales%' == LOCALES == "fr|de"
    ) {
    }
```

Bindings are global, in `/Users/itrulia/Documents/insitu-admin/config/services.yaml:20-25`.

The injected `TranslatorInterface` is **not** the Symfony translator; `debug:container translator`
on the running container resolves it to
`Sylius\Bundle\ThemeBundle\Translation\ThemeAwareTranslator` (which decorates
`Sylius\...\Translation\Translator`, which decorates `translator.default`), and lists
`App\Mailer\Mailer` among its consumers. See §5.

### 3.2 `build()` — the only place an `Email` is constructed

`Mailer.php:195-232`:

```php
private function build(string $subjectKey, string $template, array $context, array $recipients, bool $notification = true): array
{
    $byLocale = [];
    foreach ($recipients as $recipient) {
        $address = $recipient instanceof User ? $recipient->getEmail() : $recipient;
        if (null === $address || '' === $address) {
            continue;
        }
        $byLocale[$this->localeFor($recipient)][] = $address;
    }

    if ([] === $byLocale) {
        $byLocale[$this->translator->getLocale()] = [];
    }

    $emails = [];
    foreach ($byLocale as $locale => $addresses) {
        $email = (new TemplatedEmail())
            ->from($this->fromAddress)
            ->locale($locale) // renders the template (and app.locale) in this language
            ->subject($this->translator->trans($subjectKey, [], null, $locale))
            ->htmlTemplate($template)
            ->context($context)
        ;

        if ($notification) {
            $email->replyTo($this->replyToAddress)->returnPath($this->returnPathAddress);
        }

        foreach ($addresses as $address) {
            $email->addTo($address);
        }

        $emails[] = $this->addBccs($email);
    }

    return $emails;
}
```

Behaviour worth porting carefully:

* **Recipients are grouped by locale**: one `TemplatedEmail` per distinct recipient locale, with all
  that locale's addresses in `To:` — so co-recipients **see each other** in the To header. There is
  no BCC-fan-out and no per-recipient personalisation beyond language.
* **Empty recipient list still produces one email** (in the sender's current locale) with no `To`.
  That email is only actually sent if `MAILER_BCC_ADDRESS` is set — the comment at `Mailer.php:188-189`
  says this is deliberate: "Without recipients a single email in the current language is still built,
  so the configured BCC addresses keep receiving it."
* Blank/`null` addresses are silently dropped (`Mailer.php:200-202`).

### 3.3 `localeFor()` — how the recipient's language is chosen

`Mailer.php:234-242`:

```php
private function localeFor(User|string $recipient): string
{
    $user = $recipient instanceof User ? $recipient : $this->userRepository->findOneBy(['email' => $recipient]);
    $locale = $user?->getLocale();

    return null !== $locale && in_array($locale, explode('|', $this->locales), true)
        ? $locale
        : $this->translator->getLocale();
}
```

* A `User` object contributes `User::$locale` directly.
* A plain string address is looked up in the `user` table **by exact email match** (`findOneBy`, i.e.
  case-sensitive `=` in Postgres).
* Anything unknown or out-of-range falls back to the translator's current locale, i.e. the **sender's**
  UI language.

`User::$locale` is a 2-char non-null column defaulting to `de`
(`src/Entity/User.php:30` `public const string DEFAULT_LOCALE = 'de';`, `:66-67`). In the restored BKa
production database **every single user is `de`**:

```
$ docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin \
    -c "SELECT locale, count(*) FROM \"user\" GROUP BY locale ORDER BY 2 DESC;"
 locale | count
--------+-------
 de     |   427
```

So today BKa effectively sends German to everyone, and the whole per-locale fan-out is latent
machinery. (It was added on 2026-09-26 in commit `7506be2` *"refactor: send emails using the users
locale"*; the DB dump is from 2026-05-21, `max(event.created_at) = 2026-05-21 04:30:15+00`.)

### 3.4 `placeAdminsOrReplyTo()` — "the place admins"

`Mailer.php:247-252`:

```php
private function placeAdminsOrReplyTo(Event $event): array
{
    return null !== $event->getPlace()->getOrganization()
        ? $event->getPlace()->getOrganization()->getUsers()->toArray()
        : [$this->replyToAddress];
}
```

"Place admins" means: **every `User` linked (many-to-many, `user_organization`) to the `Organization`
that owns the event's `Place`.** There is no role check — a plain `ROLE_USER` in that organisation
receives it. If the place has **no** organisation, the single recipient is the Reply-To address
(i.e. the platform support mailbox). If the place has an organisation but that organisation has **no**
users, the result is an empty array → an email with no `To` → BCC-only (or skipped).

Production shape of this fan-out:

```
$ docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin -c "
SELECT count(*) FILTER (WHERE p.organization_id IS NULL)                                   AS places_no_org,
       count(*) FILTER (WHERE p.organization_id IS NOT NULL AND uo.organization_id IS NULL) AS places_org_without_users,
       count(*) FILTER (WHERE uo.organization_id IS NOT NULL)                               AS places_org_with_users
FROM place p
LEFT JOIN (SELECT DISTINCT organization_id FROM user_organization) uo ON uo.organization_id = p.organization_id;"
 places_no_org | places_org_without_users | places_org_with_users
---------------+--------------------------+-----------------------
           705 |                       30 |                   541
```

Out of 1 276 places: **705 have no organisation at all** (→ the "b" mails go to Reply-To / support),
30 have an organisation with no users (→ BCC-only), 541 have real place admins. There are 507 rows in
`user_organization` across 445 organisations, so the typical fan-out is 1 recipient.

**Latent null-pointer:** `placeAdminsOrReplyTo()` dereferences `$event->getPlace()` without a null
check, but `Event::getPlace(): ?Place` is nullable (`src/Entity/Event.php:364`) and
`ACTIVATE_PROPOSAL_PLACE=true` for BKa makes place optional (see §4.4). 2 562 of the 34 279 events
have `place_id IS NULL`, 787 of them with no `proposed_by_id`. The 4b path at
`src/Controller/EventController.php:566` is **not** guarded by `if ($event->getPlace())` (unlike the
4b path at line 540), so a non-admin owner saving one of those place-less events raises
`Error: Call to a member function getOrganization() on null` *before* `sendEmail()`'s try/catch — a
500, not a swallowed log line. `Mailer::newEventProposedByExternalPerson()` (2b) uses `?->` and is
safe; `newEventProposedByPublishedAdmin()` (3b) also dereferences `getPlace()` unguarded
(`Mailer.php:107`).

### 3.5 `addBccs()` and `sendEmail()`

```php
public function sendEmail(Email|array $emails): void
{
    foreach (is_array($emails) ? $emails : [$emails] as $email) {
        if (empty($email->getTo()) && empty($email->getCc()) && empty($email->getBcc())) {
            continue;
        }

        try {
            $this->mailer->send($email);
        } catch (\Throwable $e) {
            // the email is routed through messenger's sync transport, so failures
            // arrive wrapped in HandlerFailedException rather than a transport exception
            $this->logger->critical($e->getMessage(), ['exception' => $e]);
        }
    }
}

private function addBccs(Email $email): Email
{
    foreach ($this->bccAddress as $address) {
        if (null !== $address) {
            $email->addBcc($address);
        }
    }

    return $email;
}
```

Every failure — transport error **and Twig rendering error** — is swallowed and logged at `critical`.
The user sees a success flash regardless. This is how the broken "account created" email (§6.10) can
be shipped unnoticed.

---

## 4. Decoding the `1a / 1b / 2a / 2b / 3a / 3b / 4a / 4b` scheme

This is the central question, so it gets its own section.

### 4.1 The rule

* **The digit is the lifecycle event.**
  * **1** — an event was **created in the back office** by a logged-in user, at a place that user's
    organisation does not own.
  * **2** — an event was **proposed by an external person** through the public
    `/{_locale}/proposer-un-evenement` wizard (anonymous, no account required).
  * **3** — an event **went live**: the `to_validate` → `publish` transition (plus the "created
    already published" shortcut, see 4.3).
  * **4** — an already-existing event was **modified**.
* **The letter is which side of the relationship is being told.**
  * **`a` = the author side** — the person who owns/created/proposed the event. Every `a` template is
    written in the second person about *your* event: *"Ihre Veranstaltung …"*.
  * **`b` = the venue side** — the admins of the organisation that owns the **place**. Every `b`
    template is written about *your venue*: *"… an Ihrem Ort"*.

The one apparent exception, 3b, fits: it is sent to the *other* place admins (everyone in the place's
organisation except the person who just clicked publish).

### 4.2 State-transition table

| Code | Transition | Actor | `a`/`b` recipient | Call site |
|---|---|---|---|---|
| 1a | *(new)* → `draft`/`to_validate`/`publish`, place owned by another org | logged-in non-admin user | **a** = the creating user (`$user`) | `EventController.php:456-457` |
| 1b | *(new)* → `to_validate`, place owned by another org | logged-in non-admin user | **b** = place-org users, else Reply-To | `EventController.php:461-462` |
| 2a | *(new)* → `to_validate` + `eventStatus=confirmed` via public wizard | anonymous visitor | **a** = `event.proposedBy.email` | `ProposeEventController.php:279-280` |
| 2b | same submit | anonymous visitor | **b** = place-org users, else Reply-To | `ProposeEventController.php:283-284` |
| 3a | `to_validate` → `publish` | a non-admin place admin | **a** = `event.proposedBy.email` **or** `event.user.email` | `EventController.php:525-526` (proposed) / `:558,562` (back-office) |
| 3b | `to_validate` → `publish`; **also** create with status ≠ `to_validate` | a non-admin place admin / the creator | **b** = place-org users **minus** the acting user | `EventController.php:530-531` and `:464-465` |
| 4a | any other save of an existing event, by someone who is **not** the owner | a non-admin place admin | **a** = `event.proposedBy.email` (proposed) or `event.user` (back-office) | `EventController.php:546-547` / `:560,562` |
| 4b | any other save of an existing event, by the owner/proposer **themselves** | the owner | **b** = place-org users, else Reply-To | `EventController.php:541-542` / `:566-567` |

### 4.3 The `create()` decision tree (verbatim)

`/Users/itrulia/Documents/insitu-admin/src/Controller/EventController.php:453-467`:

```php
// Verify if the user is authorized to publish event on selected place, send email notifications for validation otherwise.
if (null === $event->getPlace()->getOrganization() || (null !== $event->getPlace()->getOrganization() && !$user->getOrganizations()->contains($event->getPlace()->getOrganization()))) {
    // Send notification email to user
    $email = $this->mailer->newEventCreatedByAnotherOrganizationUser($event, $user);
    $this->mailer->sendEmail($email);

    // Send notification email to admins of selected places
    if (Event::PUBLICATION_STATUS_TO_VALIDATE === $event->getPublicationStatus()) {
        $email = $this->mailer->newEventCreatedByAnotherOrganizationAdmin($event, $user);
        $this->mailer->sendEmail($email);
    } else {
        $email = $this->mailer->newEventProposedByPublishedAdmin($event, $user);
        $this->mailer->sendEmail($email);
    }
}
```

Gate: **no email at all** if the creator's organisations contain the place's organisation (i.e. you
are posting at your own venue). Note the `else` branch reuses the 3b builder — so 3b doubles as
"an event was created already-published at your venue".

Note also that `create()` is **not** wrapped in `if (!isGranted('ROLE_ADMIN'))`, unlike `edit()` — a
platform admin creating an event at a foreign place *does* trigger 1a/1b/3b.

### 4.4 The `edit()` decision tree (verbatim)

`/Users/itrulia/Documents/insitu-admin/src/Controller/EventController.php:516-570`:

```php
if (!$this->security->isGranted('ROLE_ADMIN')) {
    /** @var User $user */
    $user = $this->getUser();

    if (null !== $event->getProposedBy()) {
        // Notifications for event proposed by an external person from the proposedBy form
        if (Event::PUBLICATION_STATUS_TO_VALIDATE === $currentEventPublicationStatus && Event::PUBLICATION_STATUS_PUBLISH === $event->getPublicationStatus()) {
            // When the email is validated from place admin
            // Send published notification email to user
            $email = $this->mailer->eventPublished($event, $event->getProposedBy()->getEmail());
            $this->mailer->sendEmail($email);

            // admin notification (for other place's organisation admins, if any)
            // emails without any recipient are skipped by sendEmail()
            $email = $this->mailer->newEventProposedByPublishedAdmin($event, $user);
            $this->mailer->sendEmail($email);
        } elseif (
            $user->getEmail() &&
            strcasecmp(
                (string) $event->getProposedBy()->getEmail(),
                $user->getEmail()
            ) === 0
        ) {
            // When the proposer edits their own event, notify the place admins
            if ($event->getPlace()) {
                $email = $this->mailer->eventModifiedByEventOwner($event, $user);
                $this->mailer->sendEmail($email);
            }
        } else {
            // When the email is modified from place admin send a notification to user
            $email = $this->mailer->eventModifiedByOwnerAdminPlace($event, $user, true);
            $this->mailer->sendEmail($email);
        }
    } elseif (null !== $event->getUser()) {
        // Notifications for event created by an admin for organisme owner of the place
        /** @var User $user */
        $user = $this->getUser();
        if ($user->getId() !== $event->getUser()->getId()) {
            // We have to check if there is an assigned user to the event
            if (!empty($event->getUser())) {
                // When the event is modified from place admin send a notification to event's owner user
                if (Event::PUBLICATION_STATUS_TO_VALIDATE === $currentEventPublicationStatus && Event::PUBLICATION_STATUS_PUBLISH === $event->getPublicationStatus()) {
                    $email = $this->mailer->eventPublished($event, $event->getUser()->getEmail());
                } else {
                    $email = $this->mailer->eventModifiedByOwnerAdminPlace($event, $user);
                }
                $this->mailer->sendEmail($email);
            }
        } else {
            // When the event is modified by event's owner, send an email to place admin
            $email = $this->mailer->eventModifiedByEventOwner($event, $user);
            $this->mailer->sendEmail($email);
        }
    }
}
```

Key gates:

* **`ROLE_ADMIN` suppresses all edit emails.** 30 of 427 users hold `ROLE_ADMIN`
  (`SELECT roles, count(*) FROM "user" GROUP BY 1` → `["ROLE_USER"]` 397, `["ROLE_USER","ROLE_ADMIN"]` 28,
  `["ROLE_ADMIN","ROLE_USER"]` 2). With `LIST_OWN_EVENTS_ONLY=true` the BKa support team are admins,
  so **BKa support editing an event sends nothing**.
* Events with a `proposedBy` take the first branch; events with only a `user` take the second;
  an event with neither sends nothing.
* `$currentEventPublicationStatus` is captured **before** `$form->handleRequest()`
  (`EventController.php:497`), so the transition test is a true before/after comparison.
* The owner-comparison for proposed events is case-insensitive (`strcasecmp`); for back-office
  events it compares `User` ids.

`Event` publication statuses (`src/Entity/Event.php:34-36`): `draft`, `publish`, `to_validate`.
Production distribution:

```
 publication_status | count
--------------------+-------
 publish            | 34076
 to_validate        |   109
 draft              |    94
```

### 4.5 The propose-event wizard (2a / 2b / U)

`/Users/itrulia/Documents/insitu-admin/src/Controller/ProposeEventController.php:255-287`:

```php
if ($form->isSubmitted() && $form->isValid()) {
    // Persist event in db
    $event->setEventStatus(Event::EVENT_STATUS_CONFIRMED);
    $event->setPublicationStatus(Event::PUBLICATION_STATUS_TO_VALIDATE);
    $eventRepository->add($event, true);

    // Create a user account for the proposer if none exists with this email
    $proposedByEmail = $event->getProposedBy()->getEmail();
    if ($proposedByEmail && !$userRepository->findOneBy(['email' => $proposedByEmail])) {
        $user = new User();
        $user->setEmail($proposedByEmail);
        $user->setMember(false);
        $user->setRoles(['ROLE_USER']);
        $user->setLocale($request->getLocale());
        $user->setPassword($userPasswordHasher->hashPassword($user, $passwordGenerator->generateNewPassword()));
        $userRepository->add($user, true);

        // Send a password reset email so the proposer can set their own password
        $resetToken = $resetPasswordHelper->generateResetToken($user);
        $emailReset = $mailer->accountCreatedChangePassword($user->getEmail(), $resetToken, $translator);
        $mailer->sendEmail($emailReset);
    }

    // Send user email
    $emailUser = $mailer->newEventProposedBy($event);
    $mailer->sendEmail($emailUser);

    // Send place admins email
    $emailAdmin = $mailer->newEventProposedByExternalPerson($event);
    $mailer->sendEmail($emailAdmin);

    return $this->redirectToRoute('propose_event_step6');
}
```

Order matters: the proposer's `User` row (with `locale = $request->getLocale()`) is created **before**
2a is built, so `Mailer::localeFor()` finds it and 2a is rendered in the wizard's URL locale.

The wizard route is public (`config/packages/security.yaml:85`
`- { path: ^/(fr|de)/proposer-un-evenement, roles: PUBLIC_ACCESS }`) and is restricted to the locales in
`LOCALES` by a route condition (`ProposeEventController.php:34-38`).

Volume, from production:

```
$ docker exec insitu-admin-postgres-1 psql -U postgres -d insitu-admin -c "
SELECT date_trunc('year', created_at) AS yr,
       count(*) FILTER (WHERE proposed_by_id IS NOT NULL) AS proposed, count(*) AS total
FROM event GROUP BY 1 ORDER BY 1;"
           yr           | proposed | total
------------------------+----------+-------
 2023-01-01 00:00:00+00 |        1 |  1978
 2024-01-01 00:00:00+00 |     1951 | 14053
 2025-01-01 00:00:00+00 |     1661 | 12890
 2026-01-01 00:00:00+00 |      675 |  5358   (to 2026-05-21)
```

≈1 600–2 000 guest proposals per year ⇒ ≈1 600–2 000 × (2a + 2b) per year, plus 3a/3b when each one is
approved. 4 288 of 34 279 events carry a `proposed_by_id`; 1 561 distinct proposer email addresses
exist, of which only 65 currently have a user account.

### 4.6 Password reset (R)

`/Users/itrulia/Documents/insitu-admin/src/Controller/ResetPasswordController.php:142-182`. The
`/reset-password` form posts an email; if no `User` matches, the controller silently redirects to
`app_check_email` without sending anything (line 149-151, "Do not reveal whether a user account was
found"). Otherwise `ResetPasswordHelperInterface::generateResetToken()` runs and:

```php
$email = $this->mailer->resetPasswordRequest(
    $user->getEmail(),
    $resetToken,
    $this->translator
);

$this->mailer->sendEmail($email);
```

Token lifetime and throttle both default to **3600 s** —
`config/packages/reset_password.yaml` sets only `request_password_repository`, and
`vendor/symfonycasts/reset-password-bundle/src/DependencyInjection/Configuration.php:34-44` defaults
`lifetime: 3600`, `throttle_limit: 3600`, `enable_garbage_collection: true`.
`reset_password_request` in the production dump is empty (0 rows) — expected, since rows are removed
on use and garbage-collected.

---

## 5. Theming, localisation and rendering

### 5.1 How the BKa theme overrides templates

`config/packages/sylius_theme.yaml`:

```yaml
sylius_theme:
  sources:
    filesystem: ~
```

`themes/bka/composer.json`:

```json
{
  "name": "in-situ-admin/bka",
  "title": "Theme for BKA"
}
```

`SYLIUS_THEME=in-situ-admin/bka` → `%sylius_theme%` → bound to
`App\EventListener\ThemeRequestListener::$syliusTheme` (`config/services.yaml:17`), which sets the
theme on every main request. `Sylius\Bundle\ThemeBundle\Twig\Loader\ThemedTemplateLoader` decorates
`twig.loader` with priority 256, so `emails/admin_event_1a.html.twig` resolves to
`themes/bka/templates/emails/admin_event_1a.html.twig` when the theme is active.

Email templates overridden by the BKa theme (all nine):

```
themes/bka/templates/emails/admin_event_1a.html.twig
themes/bka/templates/emails/admin_event_1b.html.twig
themes/bka/templates/emails/admin_event_2a.html.twig
themes/bka/templates/emails/admin_event_2b.html.twig
themes/bka/templates/emails/admin_event_3a.html.twig
themes/bka/templates/emails/admin_event_3b.html.twig
themes/bka/templates/emails/admin_event_4a.html.twig
themes/bka/templates/emails/admin_event_4b.html.twig
themes/bka/templates/emails/layout.html.twig
themes/bka/templates/includes/event_dates.html.twig        (shared include)
```

**Not** overridden, so the default In Situ versions are what BKa sends:

```
templates/reset_password/email.html.twig
templates/propose_event/user-created.html.twig
```

(Both still `{% extends 'emails/layout.html.twig' %}`, so they pick up the BKa *layout* — BKa logo,
`support@bka.ch`, Berner Kulturagenda copyright — while their bodies come from the default theme.)

Live confirmation that the running instance is BKa-themed:

```
$ curl -s http://localhost:8080/login | grep -ioE "bka|berner|in situ|insitu" | sort | uniq -c
   2 BKA
   6 bka
```

### 5.2 How the BKa theme overrides translations

`themes/bka/translations/` contains exactly one file: `messages.de.yml` (82 lines). Sylius exposes
theme catalogues as a locale **modifier**:
`ThemeAwareTranslator::transformLocale()` turns `de` into `de@in-situ-admin-bka`
(`vendor/sylius/theme-bundle/src/Translation/ThemeAwareTranslator.php:115-127`), and
`Translator::computeFallbackLocales()` builds the chain
`de@in-situ-admin-bka` → `de` → *(configured fallback)* `de`
(`vendor/sylius/theme-bundle/src/Translation/Translator.php:100-121`;
`config/packages/translation.yaml` sets `fallbacks: ['%locale%']` with `%locale%` = `DEFAULT_LOCALE` = `de`).

The entire `_mails` section the BKa theme overrides is
`themes/bka/translations/messages.de.yml:77-82`:

```yaml
_mails:
  1b:
    title: Veranstaltung wartet auf Genehmigung

  4a:
    title: Veranstaltung von der/dem Verantwortlichen für den Ort geändert
```

**That is all.** Everything else — including every single `_mails.misc.*` label — comes from
`translations/messages.de.yml` / `messages.fr.yml`.

Because the theme ships **no `messages.fr.yml`**, a French recipient gets:
* a **French subject** (from `translations/messages.fr.yml`, via the `fr@in-situ-admin-bka` → `fr`
  fallback), and
* a **German body**, because the BKa template bodies hard-code German prose (§6). Only the
  `_mails.misc.*` field labels and the dates line would come out French.

This mismatch is real for 1b, 2a, 2b, 3a, 3b, 4a and 4b. Only 1a is fully translatable in the BKa
theme. In practice it is currently invisible because all 427 users are `de`.

### 5.3 Render-time locale mechanics

`TemplatedEmail::locale($locale)` is honoured by
`vendor/symfony/twig-bridge/Mime/BodyRenderer.php:80-86`:

```php
$locale = $message->getLocale();

if ($locale && $this->localeSwitcher) {
    $this->localeSwitcher->runWithLocale($locale, $callback);
    return;
}
```

`debug:container twig.mime_body_renderer` confirms the arguments are `Service(twig)` and
`Service(translation.locale_switcher)`.

`LocaleSwitcher::setLocale()` (`vendor/symfony/translation/LocaleSwitcher.php:34-50`) sets
`\Locale::setDefault()`, stores the plain locale, updates the `RequestContext` `_locale` parameter and
calls `setLocale()` on every `kernel.locale_aware` service — which includes the
`ThemeAwareTranslator` (`debug:container translator` lists the tag). **It does not touch the
`Request` object.**

Therefore inside an email template:

| Expression | Resolves to |
|---|---|
| `{{ 'key'\|trans }}` | the **recipient's** locale (switched) |
| `{{ app.locale }}` | the **recipient's** locale (`AppVariable::getLocale()` → `LocaleSwitcher::getLocale()`, `vendor/symfony/twig-bridge/AppVariable.php:155-161`) |
| `{{ app.request.locale }}` | the **sender's** request locale — *not* switched |
| `{{ app.request.getSchemeAndHttpHost() }}` | the live request's scheme+host |
| `{{ path(...) }}` / `{{ url(...) }}` | generated from the live `RequestContext` |

Commit `7506be2` migrated the **default** `templates/emails/admin_event_2a.html.twig` from
`app.request.locale` to `app.locale` for category and audience labels, **but did not update the BKa
override**. The BKa 2a therefore still reads:

```twig
{{ cat.label[app.request.locale] }}
{{ event.audience.label[app.request.locale] }}
```

i.e. category and audience names are picked in the *sender's* language. For 2a (sent from the public
wizard to the proposer, whose account was just created with the wizard's locale) the two coincide, so
this is currently harmless.

A related edge case, reasoned from source and **UNVERIFIED at runtime**: `ThemeAwareTranslator::getLocale()`
returns the *inner* translator's locale, which the theme decorator has already suffixed, i.e.
`de@in-situ-admin-bka`. In the no-recipient branch (`Mailer.php:206-208`) and the unknown-address
branch (`Mailer.php:241`) this suffixed string becomes the email's locale, so `app.locale` would be
`de@in-situ-admin-bka`; `|trans` still resolves via the fallback chain, but an array lookup like
`cat.label[app.locale]` would miss. Only the default-theme 2a uses `app.locale`, and 2a always has a
resolvable recipient, so this does not bite today.

### 5.4 Plain-text alternative

`league/html-to-markdown` is **not** installed (`ls vendor/league/` → `event, flysystem,
flysystem-aws-s3-v3, flysystem-bundle, flysystem-local, mime-type-detection, oauth2-server,
oauth2-server-bundle, uri, uri-interfaces`). `BodyRenderer` therefore falls back to
`DefaultHtmlToTextConverter`:

```php
public function convert(string $html, string $charset): string
{
    return strip_tags(preg_replace('{<(head|style)\b.*?</\1>}is', '', $html));
}
```

So every email carries a `text/plain` part that is the HTML table skeleton with tags stripped — a wall
of whitespace with the words in it. No one has authored a real text template.

---

## 6. The ten emails in full

Throughout: *BKa template* = `themes/bka/templates/emails/...` (authoritative);
*default template* = `templates/emails/...` (In Situ, shown only as a diff).

### 6.1 `admin_event_1a` — "your event was sent for validation"

| Field | Value |
|---|---|
| Builder | `Mailer::newEventCreatedByAnotherOrganizationUser(Event $event, User $user)` — `Mailer.php:40-45` |
| Template | `emails/admin_event_1a.html.twig` → `themes/bka/templates/emails/admin_event_1a.html.twig` |
| Trigger | `src/Controller/EventController.php:456-457` |
| Gate | back-office create **and** (`place.organization IS NULL` **or** the creator's organisations do not contain `place.organization`) — `EventController.php:454` |
| To | `[$user]` — the logged-in creator, a `User`, so locale = `user.locale` |
| From / Reply-To / Return-Path / Bcc | `MAILER_FROM_ADDRESS` / `MAILER_REPLYTO_ADDRESS` / `MAILER_RETURNPATH_ADDRESS` / `MAILER_BCC_ADDRESS` |
| Subject key | `_mails.1a.title` → **de** "Veranstaltung zur Validierung gesendet" / **fr** "Événement envoyé pour validation" (no BKa override) |
| Context | `{'event': Event}` |
| Template reads | `event.name`, `event.place.name`, plus the `event_dates` include (`event.dateFrom`, `event.dateTo`, `event.openingTime`, `event.subEvents`, `event.recurrenceWeekDays`) |

**Intent (plain English).** "Thank you for adding the following event: *name*, *dates*, *place*." It is
a receipt confirming the event was registered. The BKa version stops there; the default In Situ
version additionally explains that because the event is at a venue you do not manage, the venue's
organisation has been notified, and that the event is live immediately if you chose "publish" or waits
for the venue if you chose "to validate".

**BKa template (verbatim):**

```twig
{% extends 'emails/layout.html.twig' %}

{% block title %}{{ '_mails.1a.title'|trans }}{% endblock %}

{% block content %}
    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff"
            align="left">
            <p
                style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#000000;font-size:16px">
                {{ '_mails.1a.intro'|trans }}</p>
            <p
                style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#000000;font-size:16px">
                <br>
            </p>
            <p
                style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#000000;font-size:16px">
                <span style="color:#FFFFFF">
                    <span style="background-color:#000000">{{ '_mails.misc.name'|trans }}</span>
                </span>
                {{ event.name }}</p>
            {{ include('includes/event_dates.html.twig') }}
            <p
                style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#000000;font-size:16px">
                <span style="color:#FFFFFF">
                    <span style="background-color:#000000">{{ '_mails.misc.place'|trans }}</span>
                </span>
                {{ event.place.name }}</p>
            <p
                style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#000000;font-size:16px">
                <br></p>
        </td>
    </tr>
{% endblock %}
```

**Diff vs default** (`templates/emails/admin_event_1a.html.twig`): the BKa version **drops the closing
paragraph** that the default renders —

```twig
                {{ '_mails.1a.phrase_1'|trans }}&nbsp;<br><br>{{ '_mails.1a.phrase_2'|trans }}<br>
```

(`_mails.1a.phrase_1` / `phrase_2`, quoted in §8). Everything else is whitespace. 1a is the only BKa
email template that contains **no hard-coded German**.

---

### 6.2 `admin_event_1b` — "an event is waiting for your approval"

| Field | Value |
|---|---|
| Builder | `Mailer::newEventCreatedByAnotherOrganizationAdmin(Event $event, User $user)` — `Mailer.php:50-56` |
| Template | `themes/bka/templates/emails/admin_event_1b.html.twig` |
| Trigger | `src/Controller/EventController.php:461-462` |
| Gate | as 1a, **plus** `$event->getPublicationStatus() === Event::PUBLICATION_STATUS_TO_VALIDATE` |
| To | `placeAdminsOrReplyTo($event)` — all `User`s of `event.place.organization`, else `[MAILER_REPLYTO_ADDRESS]` |
| Subject key | `_mails.1b.title` → **BKa de override** "Veranstaltung wartet auf Genehmigung" (default de: "Veranstaltung wartet auf Validierung"; fr: "Événement en attente de validation") |
| Context | `{'event': Event, 'user': User}` — `user` is the **creator**, not the recipient |
| Template reads | `event.organization.name`, `event.name`, `event.place.name`, `event.slug`, `user.email`, `event_dates` include |

**Intent.** "You have received a request from **\<creating organisation\>**, which wants to produce an
event at your venue." Then the event summary (name / dates / place), a big pill button
**"Anfrage(n) bearbeiten"** linking to `/events/edit/{slug}` on the admin host, then: "If the event
needs corrections, please contact the organisation looking after it", the creator's organisation name
and email, and finally "Once the request(s) are approved the organising organisation is notified by
email and its event(s) are published in the calendar."

**BKa template (verbatim):**

```twig
{% extends 'emails/layout.html.twig' %}

{% block title %}{{ '_mails.1b.title'|trans }}{% endblock %}

{% block content %}
    <tr>
        <td align="left" style="padding:0;Margin:0">
            <p
                    style="Margin:0;...;color:#000000;font-size:16px">
                Sie haben eine Anfrage von <strong>{{ event.organization.name }}</strong> erhalten, die
                eine Veranstaltung(en) an Ihrem Ort produzieren
                möchte.<br></p>
        </td>
    </tr>

    <tr>
        <td align="left" style="padding:0;Margin:0"><br>
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.name'|trans }}</span></span>
                {{ event.name }}</p>
            {{ include('includes/event_dates.html.twig') }}
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.place'|trans }}</span></span>
                {{ event.place.name }}</p>
            <p style="...;color:#333333;font-size:16px">
                <br></p>
        </td>
    </tr>

    <tr>
        <td align="center" style="padding:0;Margin:0">
            <!--[if mso]><a href="{{ app.request.getSchemeAndHttpHost() ~ path('events_edit', {slug: event.slug}) }}" target="_blank" hidden> <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="" style="height:41px; v-text-anchor:middle; width:252px" arcsize="50%" strokecolor="#000000" strokeweight="2px" fillcolor="#ffffff"> <w:anchorlock></w:anchorlock> <center style='color:#000000; font-family:arial, "helvetica neue", helvetica, sans-serif; font-size:15px; font-weight:700; line-height:15px; mso-text-raise:1px'>{{ '_mails.misc.manage_request'|trans }}</center> </v:roundrect></a>
            <![endif]--> <!--[if !mso]><!-- --><span class="msohide es-button-border-1671466373131 es-button-border"
                                                     style="border-style:solid;border-color:#000000;background:#ffffff;border-width:2px;display:inline-block;border-radius:40px;width:auto;mso-hide:all">
                <a
                        href="{{ app.request.getSchemeAndHttpHost() ~ path('events_edit', {slug: event.slug}) }}"
                        class="es-button es-button-1671466373104"
                        target="_blank"
                        style="mso-style-priority:100 !important;text-decoration:none;...;color:#000000;font-size:18px;display:inline-block;background:#31CB4B;border-radius:40px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:bold;font-style:normal;line-height:22px;width:auto;text-align:center;padding:10px 20px;mso-padding-alt:0;mso-border-alt:10px solid #ffffff;background-color:#ffffff">{{ '_mails.misc.manage_request'|trans }}</a>
            </span> <!--<![endif]--></td>
    </tr>

    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff" align="left">
            <p style="...;color:#000000;font-size:16px">
            </p>
            <p style="...;color:#000000;font-size:16px">
                <br></p>
            <p style="...;color:#000000;font-size:16px">
                Wenn die Veranstaltung Korrekturen erfordert,
                wenden Sie sich bitte an die Organisation, die
                die Veranstaltung betreut.</p>
            <p style="...;color:#000000;font-size:16px">
                <br></p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.organization'|trans }}</span></span>
                {{ event.organization.name }}</p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.email'|trans }}</span></span>
                {{ user.email }}</p>
            <br>
            <p style="...;color:#000000;font-size:16px">
                Sobald die Anfrage(n) genehmigt wurde(n), wird
                die veranstaltende Organisation per E-Mail
                benachrichtigt und ihre Veranstaltung(en) im
                Kalender veröffentlicht.</p>
            <p style="...;color:#000000;font-size:16px">
                <br>
            </p>
        </td>
    </tr>
{% endblock %}
```

> The `style="..."` ellipses above elide only the repeated reset string
> `-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px`
> which is identical on every `<p>` in every template. Nothing structural is omitted.

**Diff vs default.** The default uses translation keys where BKa hard-codes German:

| Default | BKa |
|---|---|
| `{{ '_mails.1b.intro_1'\|trans }} <strong>{{ event.organization.name }}</strong> {{ '_mails.1b.intro_2'\|trans }}` | hard-coded *"Sie haben eine Anfrage von \<org\> erhalten, die eine Veranstaltung(en) an Ihrem Ort produzieren möchte."* |
| `{{ '_mails.1b.phrase_1'\|trans }}` | hard-coded *"Wenn die Veranstaltung Korrekturen erfordert, wenden Sie sich bitte an die Organisation, die die Veranstaltung betreut."* |
| `{{ '_mails.1b.phrase_2'\|trans }}` | hard-coded *"Sobald die Anfrage(n) genehmigt wurde(n), …"* |
| button CSS class `es-button-border-2` / `es-button-1`, width `251px` | `es-button-border-1671466373131` / `es-button-1671466373104`, width `252px` |

The button label itself stays translated (`_mails.misc.manage_request`) in both.

---

### 6.3 `admin_event_2a` — "thank you for your proposal" (the big one)

| Field | Value |
|---|---|
| Builder | `Mailer::newEventProposedBy(Event $event)` — `Mailer.php:75-80` |
| Template | `themes/bka/templates/emails/admin_event_2a.html.twig` |
| Trigger | `src/Controller/ProposeEventController.php:279-280` |
| Gate | public propose-event wizard step 5 submitted and valid; always sent |
| To | `[$event->getProposedBy()->getEmail()]` — a plain string; `localeFor()` looks it up in `user` (the account was created moments earlier at `ProposeEventController.php:263-270` with `locale = $request->getLocale()`) |
| Subject key | `_mails.2a.title` → de "Vorschlag zur Validierung gesendet" / fr "Proposition envoyée pour validation" |
| Context | `{'event': Event}` |
| Template reads | `event.name`, `event.placeProposed.name` \| `event.place.name`, `event.categories[].label[app.request.locale]`, `event.label(locale,'description')`, `event.images[].fileName`, `event.audience.label[app.request.locale]`, `event.rates[].label(locale,'designation')`, `event.rates[].price`, `event.specialRate`, `event.label(locale,'ticketingUrl')`, `event.proposedBy.{firstname,lastname,email,phone,organization}`, the `event_dates` include, the Twig global `app_locales` |

**Intent.** A full echo-back receipt. "Thank you for your event proposal! Your event has been
registered. **It will now be submitted to the Berner Kulturagenda support team for approval and then
published.** Once the event is confirmed it will be published in the calendar according to your
publication date/time settings." Then a `**Ihre Veranstaltung**` heading, a black rule, and a labelled
dump of everything the proposer entered: name, place (proposed place wins over the real one),
categories, dates, description per language, image links (absolute URLs into `/img/…`), target
audience, every rate (`designation : price CHF`, price divided by 100 by the `price_formatted` filter),
special rate, ticketing URLs per language. Then a `**Ihre Kontaktdaten**` heading, another rule, and the
proposer's name & surname, email, **"Handy"** (mobile), and organisation.

**BKa template (verbatim, style resets elided as above):**

```twig
{% extends 'emails/layout.html.twig' %}

{% block title %}{{ '_mails.2a.title'|trans }}{% endblock %}

{% block content %}
    <tr>
        <td align="left" style="padding:0;Margin:0">
            <p style="...;color:#333333;font-size:16px">
                Vielen Dank für Ihren
                Veranstaltungsvorschlag!&nbsp;</p>
            <p style="...;color:#333333;font-size:16px"><br></p>
            <p style="...;color:#333333;font-size:16px">
                Ihre Veranstaltung wurde registriert.
                <strong>Sie wird nun dem Support der Berner Kulturagenda zur Genehmigung vorgelegt und anschliessend publiziert.</strong>
            </p>
            <p style="...;color:#333333;font-size:16px"><br></p>
            <p style="...;color:#333333;font-size:16px">
                Sobald die Veranstaltung bestätigt wurde, wird sie dann im Kalender veröffentlicht, je nach Ihren Einstellungen für Datum und Uhrzeit der Veröffentlichung.</p>
            <p style="...;color:#333333;font-size:16px"><br></p>
        </td>
    </tr>

    <tr>
        <td align="left" style="padding:0;Margin:0">
            <p style="...;color:#000000;font-size:16px">
                <strong>Ihre Veranstaltung</strong></p>
        </td>
    </tr>

    <tr>
        <td style="padding:0;Margin:0;padding-top:5px;padding-bottom:15px;font-size:0" align="center">
            <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0"
                   style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tr>
                    <td style="padding:0;Margin:0;border-bottom:2px solid #000000;background:unset;height:1px;width:100%;margin:0px">
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff" align="left">
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.name'|trans }}</span></span> {{ event.name }}</p>
            </p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.place'|trans }}</span></span> {% if event.placeProposed is not null %}{{ event.placeProposed.name }}{% else %}{{ event.place.name }}{% endif %}
            </p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.categories'|trans }}</span></span> {% for cat in event.categories %}{{ cat.label[app.request.locale] }}{% if not loop.last %}, {% endif %}{% endfor %}
            </p>
            {{ include('includes/event_dates.html.twig') }}
            {% for locale in app_locales|split('|') %}
                {% if event.label(locale,'description') is not null %}
                    <p style="...;color:#000000;font-size:16px">
                        <span style="color:#FFFFFF"><span style="background-color:#000000"></span>
                        </span><span style="color:#FFFFFF"><span
                                    style="background-color:#000000">{{ '_mails.misc.description'|trans }} ({{ locale|display_language|lower }})</span></span><br>
                    </p>
                    <div style="...;color:#000000;font-size:16px">
                        {{ event.label(locale,'description')|raw }}
                    </div>
                {% endif %}
            {% endfor %}
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.images'|trans }}</span></span>
                {% for image in event.images %}
                    <a href="{{ app.request.schemeAndHttpHost }}{{ asset('/img/'~image.fileName) }}"
                       alt="{{ loop.index }}">
                        {{ image.filename }}
                    </a><br>
                {% endfor %}
            </p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.audience'|trans }}</span></span> {{ event.audience.label[app.request.locale] }}
            </p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.rates'|trans }}</span></span>
                {% for rate in event.rates %}
                    {% set rateLabeled = false %}
                    {% for locale in app_locales|split('|') %}
                        {% if rate.label(locale,'designation') is not null %}
                            {% if rateLabeled is same as(true) %} / {% endif %}{{ rate.label(locale,'designation') }}
                            {% set rateLabeled = true %}
                        {% endif %}
                    {% endfor %}
                    {% if rateLabeled %} : {% endif %}{{ rate.price|price_formatted }} CHF
                    <br>
                {% endfor %}
            </p>
            {% if event.specialRate %}
                <p style="...;color:#000000;font-size:16px">
                    <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.rates_special'|trans }}</span></span> {{ ('event.specialRates.' ~ event.specialRate)|trans }}
                </p>
            {% endif %}
            {% for locale in app_locales|split('|') %}
                {% if event.label(locale,'ticketingUrl') is not null %}
                    <p style="...;color:#000000;font-size:16px">
                        <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.ticketing_url'|trans }}</span></span> ({{ locale|display_language|lower }})
                        <a href="{{ event.label(locale,'ticketingUrl') }}">
                            {{ event.label(locale,'ticketingUrl') }}
                        </a>
                    </p>
                {% endif %}
            {% endfor %}
            <p style="...;color:#000000;font-size:16px">
                <br>
            </p>
        </td>
    </tr>

    <tr>
        <td align="left" style="padding:0;Margin:0">
            <p style="...;color:#333333;font-size:16px">
                <strong>{{ '_mails.misc.your_contactdetails'|trans }}</strong></p>
        </td>
    </tr>

    <tr>
        <td style="padding:0;Margin:0;padding-top:5px;padding-bottom:15px;font-size:0" align="center">
            <table width="100%" height="100%" cellspacing="0" cellpadding="0" border="0"
                   style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                <tr>
                    <td style="padding:0;Margin:0;border-bottom:2px solid #000000;background:unset;height:1px;width:100%;margin:0px">
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff" align="left">
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.name'|trans }}
                    &amp; {{ '_mails.misc.surname'|trans }}</span></span> {{ event.proposedBy.firstname }} {{ event.proposedBy.lastname }}
            </p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.email'|trans }}</span></span> {{ event.proposedBy.email }}
            </p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">Handy</span></span> {{ event.proposedBy.phone }}
            </p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.organization'|trans }}</span></span> {{ event.proposedBy.organization }}
                <br type="_moz"></p></td>
    </tr>
{% endblock %}
```

**Diff vs default** (`templates/emails/admin_event_2a.html.twig`):

| Aspect | Default | BKa |
|---|---|---|
| Intro paragraphs | `_mails.2a.intro_1` … `intro_7` (7 keys, translated) | three hard-coded German paragraphs; the middle one names **"dem Support der Berner Kulturagenda"** instead of "the person responsible for the venue" |
| "Your event" heading | `{{ '_mails.2a.your_event'\|trans }}` | hard-coded `<strong>Ihre Veranstaltung</strong>` |
| Category / audience locale | `app.locale` (recipient) | `app.request.locale` (sender) |
| Phone label | `{{ '_mails.misc.tel'\|trans }}` | hard-coded **`Handy`** |
| Contact ordering | name&surname, email, tel, organisation | identical |
| `role="presentation"` on spacer tables | present | absent |

BKa edit history: `c897f2a` (2026-06-26, "BKA-75 email changes") removed the "you will receive a second
notification" promise; `fa78fcc` (2026-09-11) rewrote the approval sentence to name BKa support.

**Note for the port**: `{{ event.label(locale,'description')|raw }}` injects stored HTML into the email
unescaped.

---

### 6.4 `admin_event_2b` — "a proposal is waiting at your venue"

| Field | Value |
|---|---|
| Builder | `Mailer::newEventProposedByExternalPerson(Event $event)` — `Mailer.php:61-70` |
| Template | `themes/bka/templates/emails/admin_event_2b.html.twig` |
| Trigger | `src/Controller/ProposeEventController.php:283-284` |
| Gate | always, right after 2a |
| To | `$event->getPlace()?->getOrganization()` non-null → all its `User`s; otherwise `[MAILER_REPLYTO_ADDRESS]` (note: `?->`, so a place-less proposal falls back cleanly — unlike `placeAdminsOrReplyTo()`) |
| Subject key | `_mails.2b.title` → de "Vorschlag wartet auf Validierung" / fr "Proposition en attente de validation" |
| Context | `{'event': Event}` — **no `user`** |
| Template reads | `event.name`, `event.placeProposed.name` \| `event.place.name`, `event.slug`, `event.proposedBy.{organization,firstname,lastname,email,phone}`, `event_dates` include |

**Intent.** "A proposal has been made for an event at a venue you are responsible for." Event summary
(name / dates / place — proposed place wins), a pill button **"Den/die Antrag/e verwalten"** linking to
`/events/edit/{slug}`, then "If the event needs corrections, please contact the person who proposed it:"
with the proposer's organisation, name & surname, email and phone, and finally "Once the request is
confirmed a notification is sent to the email address of the user who proposed the event, and the event
becomes visible in the calendar."

**BKa template (verbatim, style resets elided):**

```twig
{% extends 'emails/layout.html.twig' %}

{% block title %}{{ '_mails.2b.title'|trans }}{% endblock %}

{% block content %}
    <tr>
        <td align="left" style="padding:0;Margin:0">
            <p style="...;color:#000000;font-size:16px">
                Es wurde ein Vorschlag für eine Veranstaltung an
                einem Ort gemacht, für den Sie verantwortlich
                sind.</p>
            <p style="...;color:#000000;font-size:16px"><br></p>
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.name'|trans }}</span></span>
                {{ event.name }}</p>
            {{ include('includes/event_dates.html.twig') }}
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.place'|trans }}</span></span> {% if event.placeProposed is not null %}{{ event.placeProposed.name }}{% else %}{{ event.place.name }}{% endif %}</p>
            <p style="...;color:#333333;font-size:16px"><br></p>
        </td>
    </tr>

    <tr>
        <td align="center" style="padding:0;Margin:0"> <!--[if mso]><a href="{{ app.request.getSchemeAndHttpHost() ~ path('events_edit', {slug: event.slug}) }}" target="_blank" hidden> <v:roundrect ... > <w:anchorlock></w:anchorlock> <center style='...'>Den/die Antrag/e verwalten</center> </v:roundrect></a>
            <![endif]--> <!--[if !mso]><!-- --><span class="msohide es-button-border-1671466373131 es-button-border"
                                                     style="border-style:solid;border-color:#000000;background:#ffffff;border-width:2px;display:inline-block;border-radius:40px;width:auto;mso-hide:all"><a
                        href="{{ app.request.getSchemeAndHttpHost() ~ path('events_edit', {slug: event.slug}) }}"
                        class="es-button es-button-1671466373104"
                        target="_blank"
                        style="...;background:#31CB4B;border-radius:40px;...;background-color:#ffffff">Den/die
                                                                            Antrag/e verwalten</a></span>
            <!--<![endif]--></td>
    </tr>

    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff" align="left">
            <p style="...;color:#000000;font-size:16px"><br></p>
            <p style="...;color:#000000;font-size:16px">
                Wenn die Veranstaltung Korrekturen erfordert,
                wenden Sie sich bitte an die Person, die die
                Veranstaltung vorgeschlagen hat:</p>
            <p style="...;color:#000000;font-size:16px"><br></p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.organization'|trans }}</span></span> {{ event.proposedBy.organization }}
            </p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.name'|trans }}
                    &amp; {{ '_mails.misc.surname'|trans }}</span></span> {{ event.proposedBy.firstname }} {{ event.proposedBy.lastname }}</p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.email'|trans }}</span></span> {{ event.proposedBy.email }}</p>
            <p style="...;color:#000000;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.tel'|trans }}</span></span>
                {{ event.proposedBy.phone }}</p><br>
            <p style="...;color:#000000;font-size:16px">
                Sobald die Anfrage bestätigt wurde, wird eine
                Benachrichtigung an die E-Mail-Adresse des
                Nutzers-rice-x gesendet, der die Veranstaltung
                vorgeschlagen hat, und die Veranstaltung wird im
                Kalender sichtbar.</p>
            <p style="...;color:#000000;font-size:16px"><br></p>
        </td>
    </tr>
{% endblock %}
```

**Diff vs default:**

| Default | BKa |
|---|---|
| `{{ '_mails.2b.intro'\|trans }}` | hard-coded German |
| button label `{{ '_mails.misc.manage_request'\|trans }}` | hard-coded **"Den/die Antrag/e verwalten"** (the only template where the button label is not translated) |
| `{{ '_mails.2b.content_1'\|trans }}` | hard-coded German |
| `{{ '_mails.2b.content_2'\|trans }}` | hard-coded German containing the mangled string **"des Nutzers-rice-x"** — a literal mis-transliteration of the French inclusive form `l'utilisateur·rice·x` in `_mails.2b.content_2` (fr). This is a visible copy bug in production German mail. |

---

### 6.5 `admin_event_3a` — "your event is live"

| Field | Value |
|---|---|
| Builder | `Mailer::eventPublished(Event $event, ?string $address)` — `Mailer.php:85-90` |
| Template | `themes/bka/templates/emails/admin_event_3a.html.twig` |
| Triggers | `src/Controller/EventController.php:525-526` (`$address = $event->getProposedBy()->getEmail()`) and `:558,562` (`$address = $event->getUser()->getEmail()`) |
| Gate | non-admin editor **and** `to_validate` → `publish` |
| To | `[$address]` if non-null, else `[]` → a BCC-only email (or skipped entirely if no BCC) |
| Subject key | `_mails.3a.title` → de "Auf der Plattform veröffentlichte Veranstaltung" / fr "Événement publié sur la plateforme" |
| Context | `{'event': Event}` |
| Template reads | `event.name`, `event.place.name`, `event_dates` include |

**Intent.** "Your event has been published on the platform!" followed by name, dates and place.
Nothing else — no link to the event, no link back into the admin.

**BKa template (verbatim — note the malformed nesting, two `<tr>` openings and one close):**

```twig
{% extends 'emails/layout.html.twig' %}

{% block title %}{{ '_mails.3a.title'|trans }}{% endblock %}

{% block content %}
    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff" bgcolor="#ffffff" align="left">
    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff"
            bgcolor="#ffffff" align="left">
            <p style="...;color:#000000;font-size:16px">
                Ihre Veranstaltung wurde auf der Plattform veröffentlicht!
            </p>
            <p style="...;color:#000000;font-size:16px"><br></p>
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.name'|trans }}</span></span> {{ event.name }}</p>
            {{ include('includes/event_dates.html.twig') }}
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.place'|trans }}</span></span> {{ event.place.name }}
            </p>
            <p style="...;color:#333333;font-size:16px"><br></p>
        </td>
    </tr>
{% endblock %}
```

**Diff vs default:** default uses `{{ '_mails.3a.intro'|trans }}`; BKa hard-codes the identical German
sentence. Default has a single, well-formed `<tr><td>`; **BKa has an unbalanced duplicated
`<tr><td>` opener** (lines 6-10) that is never closed. Mail clients recover from it, but any strict
HTML processing in the port must not copy it.

---

### 6.6 `admin_event_3b` — "an event at your venue went live"

| Field | Value |
|---|---|
| Builder | `Mailer::newEventProposedByPublishedAdmin(Event $event, ?User $adminUser = null)` — `Mailer.php:95-119` |
| Template | `themes/bka/templates/emails/admin_event_3b.html.twig` |
| Triggers | `src/Controller/EventController.php:530-531` (after an approval) and `:464-465` (create with status ≠ `to_validate`) |
| To | every `User` of `$event->getPlace()->getOrganization()` **whose email differs from `$adminUser`'s** (`Mailer.php:106-112`) — so the acting admin is excluded; an empty result yields a BCC-only email |
| Subject key | `_mails.3b.title` → de "Veranstaltung an Ihrem Ort veröffentlicht" / fr "Événement publié dans votre lieu" |
| Context | `{'event': Event, 'organizationName': ?string, 'organizationEmail': ?string}` |

`organizationName` / `organizationEmail` resolution (`Mailer.php:97-104`):

```php
$organizationName = $event->getProposedBy()?->getOrganization();   // free-text string column
if (null === $organizationName) {
    $organizationName = $event->getOrganization()?->getName();
}
$organizationEmail = $event->getProposedBy()?->getEmail();
if (null === $organizationEmail) {
    $organizationEmail = $adminUser->getEmail();
}
```

**Intent.** "An event produced at your venue has been published on the platform!" plus name, dates,
place. The default In Situ template then adds "If the event needs corrections, contact the organisation
in charge:" with `organizationName` and `organizationEmail`.

> **The BKa version never shows that contact block.** It guards it with
> `{% if user is defined and user is not null %}`, but the builder's context has **no `user` key** and
> `user` is not a Twig global (`config/packages/twig.yaml:6-18` lists
> `app_google_map_api_key, app_google_map_id, app_locales, sponsoredEventsActivated,
> clipboardEventLinks, joinUsLink, eventVideosActivated, proinfirmisActivated, hasPrintOptions,
> imageGeneratorActivated, showManual, multiTicketingsActivated` — no `user`). The condition is always
> false. The BKa 3b therefore ends after the place name, and `organizationName`/`organizationEmail`
> are **dead context** for BKa.

**BKa template (verbatim):**

```twig
{% extends 'emails/layout.html.twig' %}

{% block title %}{{ '_mails.3b.title'|trans }}{% endblock %}

{% block content %}
    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff" bgcolor="#ffffff" align="left">
            <p style="...;color:#000000;font-size:16px">
                Eine Veranstaltung, die an Ihrem Ort produziert
                wurde, wurde auf der Plattform veröffentlicht!
            </p>
            <p style="...;color:#000000;font-size:16px"><br></p>
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.name'|trans }}</span></span> {{ event.name }}
            </p>
            {{ include('includes/event_dates.html.twig') }}
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.place'|trans }}</span></span> {{ event.place.name }}
                <br type="_moz"></p>

            {% if user is defined and user is not null %}

                <p style="...;color:#333333;font-size:16px"><br></p>
                <p style="...;color:#333333;font-size:16px">
                    Wenn die Veranstaltung Korrekturen erfordert,
                    wenden Sie sich bitte an die Organisation, die
                    die Veranstaltung betreut :</p>
                <p style="...;color:#333333;font-size:16px"><br></p>
                <p style="...;color:#333333;font-size:16px">
                    <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.organization'|trans }}</span></span>{% if event.organization is not null %} {{ event.organization.name }}{% endif %}
                </p>
                <p style="...;color:#333333;font-size:16px">
                    <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.email'|trans }}</span></span> {{ user.email }}
                </p>
                <p style="...;color:#333333;font-size:16px"><br></p>
            {% endif %}
        </td>
    </tr>
{% endblock %}
```

**Diff vs default** (`templates/emails/admin_event_3b.html.twig`): the default renders

```twig
<p …>{{ '_mails.3b.content'|trans }}</p>
…
<span …>{{ '_mails.misc.organization'|trans }}</span> {{ organizationName }}
…
<span …>{{ '_mails.misc.email'|trans }}</span> {{ organizationEmail }}
```

unconditionally, with the *correct* context variables. BKa swapped them for `event.organization.name`
and `user.email` and wrapped the lot in a condition that can never be true.

---

### 6.7 `admin_event_4a` — "the venue manager changed your event"

| Field | Value |
|---|---|
| Builder | `Mailer::eventModifiedByOwnerAdminPlace(Event $event, User $adminUser, bool $eventProposedByExternalPerson = false)` — `Mailer.php:124-134` |
| Template | `themes/bka/templates/emails/admin_event_4a.html.twig` |
| Triggers | `src/Controller/EventController.php:546-547` (`$eventProposedByExternalPerson = true`) and `:560,562` (default `false`) |
| To | `[$event->getProposedBy()->getEmail()]` when the third argument is `true`, otherwise `[$event->getUser()]` (a `User` object) |
| Subject key | `_mails.4a.title` → **BKa de override** "Veranstaltung von der/dem Verantwortlichen für den Ort geändert" (default de "Veranstaltung von der für den Ort verantwortlichen Person geändert"; fr "Événement modifié par le/la responsable du lieu") |
| Context | `{'event': Event, 'user': User}` — `user` is the **editor** (the place admin) |

**Intent.** "The person responsible for the venue **\<editor email\>** has modified an event you
published." Then name, dates, place.

**BKa template (verbatim):**

```twig
{% extends 'emails/layout.html.twig' %}

{% block title %}{{ '_mails.4a.title'|trans }}{% endblock %}

{% block content %}
    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff"
            bgcolor="#ffffff" align="left">
            <p style="...;color:#000000;font-size:16px">
                Der Verantwortliche für den Ort <strong>{{ user.email }}</strong> hat eine von Ihnen
                veröffentlichte Veranstaltung geändert.</p>
            <p style="...;color:#000000;font-size:16px"><br></p>
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.name'|trans }}</span></span> {{ event.name }}
            </p>
            {{ include('includes/event_dates.html.twig') }}
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.place'|trans }}</span></span> {{ event.place.name }}
            </p>
            <p style="...;color:#333333;font-size:16px"><br></p>
        </td>
    </tr>
{% endblock %}
```

**Diff vs default:** default renders
`{{ '_mails.4a.intro_1'|trans }} <strong>{{ user.email }}</strong> {{ '_mails.4a.intro_2'|trans }}`;
BKa hard-codes the German sentence around `{{ user.email }}`. BKa also adds a trailing empty
paragraph. BKa overrides the subject.

---

### 6.8 `admin_event_4b` — "someone changed an event at your venue"

| Field | Value |
|---|---|
| Builder | `Mailer::eventModifiedByEventOwner(Event $event, User $user)` — `Mailer.php:139-145` |
| Template | `themes/bka/templates/emails/admin_event_4b.html.twig` |
| Triggers | `src/Controller/EventController.php:541-542` (proposer edits their own proposal; guarded by `if ($event->getPlace())`) and `:566-567` (back-office owner edits their own event; **not** guarded) |
| To | `placeAdminsOrReplyTo($event)` |
| Subject key | `_mails.4b.title` → de "Geänderte Veranstaltung" / fr "Événement modifié" (no BKa override) |
| Context | `{'event': Event, 'user': User}` — `user` is the **editing owner** |

**Intent.** "**\<owner email\>** has modified an event published at your venue." Then name, dates,
place.

**BKa template (verbatim):**

```twig
{% extends 'emails/layout.html.twig' %}

{% block title %}{{ '_mails.4b.title'|trans }}{% endblock %}

{% block content %}
    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff"
            bgcolor="#ffffff" align="left">
            <p style="...;color:#000000;font-size:16px">
                <strong>{{ user.email }}</strong> hat eine
                Veranstaltung geändert, die an Ihrem Ort
                veröffentlicht wurde.</p>
            <p style="...;color:#000000;font-size:16px"><br></p>
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.name'|trans }}</span></span> {{ event.name }}
            </p>
            {{ include('includes/event_dates.html.twig') }}
            <p style="...;color:#333333;font-size:16px">
                <span style="color:#FFFFFF"><span style="background-color:#000000">{{ '_mails.misc.place'|trans }}</span></span> {{ event.place.name }}
            </p>
            <p style="...;color:#333333;font-size:16px">
                <br style="font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:16px">
            </p>
        </td>
    </tr>
{% endblock %}
```

**Diff vs default:** default renders
`<strong>{{ user.email }}</strong>&nbsp;{{ '_mails.4b.intro'|trans }}`; BKa hard-codes the German.

---

### 6.9 `reset_password/email.html.twig` — password reset

| Field | Value |
|---|---|
| Builder | `Mailer::resetPasswordRequest(string $userEmail, ResetPasswordToken $resetToken, TranslatorInterface $translator)` — `Mailer.php:160-165`; `$translator` is **unused dead parameter** |
| Template | `templates/reset_password/email.html.twig` — **no BKa override**, so default body inside the BKa layout |
| Trigger | `src/Controller/ResetPasswordController.php:170-176`, reached from `POST /reset-password` (`:41-60` → `:142`) |
| Gate | a `User` with that exact email exists (`:144-151`) and `generateResetToken()` did not throw (`:153-168`) |
| To | `[$user->getEmail()]` — plain string, locale resolved by DB lookup |
| Reply-To / Return-Path | **not set** (`notification: false`) |
| Bcc | **still added** — the reset link is BCC'd to `MAILER_BCC_ADDRESS` |
| Subject key | `reset_password.email_content.title` → de "Passwort zurücksetzen" / fr "Réinitialisation de mot de passe" |
| Context | `{'resetToken': ResetPasswordToken}` |
| Token lifetime | 3600 s; throttle 3600 s (bundle defaults, not overridden) |

**Intent.** "To reset your password, please visit the following link" + the bare absolute URL twice
(as href and as link text) + "This link expires in \<n minutes/hour\>".

**Template (verbatim, complete file):**

```twig

{% extends 'emails/layout.html.twig' %}

{% block title %}{{ 'reset_password.email_content.title'|trans }} {% endblock %}

{% block content %}
    <tr>
        <td style="padding:0;Margin:0;color:#1a82ff" bgcolor="#ffffff" align="left">
            <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#000000;font-size:16px">{{ 'reset_password.email_content.intro'|trans }}</p>
            <a href="{{ url('app_reset_password', {token: resetToken.token}) }}">{{ url('app_reset_password', {token: resetToken.token}) }}</a>
            <p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#000000;font-size:16px">{{ 'reset_password.email_content.expire'|trans }} {{ resetToken.expirationMessageKey|trans(resetToken.expirationMessageData, 'ResetPasswordBundle') }}.</p>
        </td>
    </tr>
{% endblock %}
```

`app_reset_password` = `/reset-password/reset/{token}` (confirmed via `debug:router`). The expiry
sentence is translated from the **`ResetPasswordBundle`** domain, not `messages`.

---

### 6.10 `propose_event/user-created.html.twig` — "your account was created" — **BROKEN**

| Field | Value |
|---|---|
| Builder | `Mailer::accountCreatedChangePassword(string $userEmail, ResetPasswordToken $resetToken, TranslatorInterface $translator)` — `Mailer.php:150-155`; `$translator` unused |
| Template | `templates/propose_event/user-created.html.twig` — **no BKa override** |
| Trigger | `src/Controller/ProposeEventController.php:272-275` |
| Gate | propose-event step 5 **and** no `User` row exists with the proposer's email |
| To | the new account's email |
| Reply-To / Return-Path | not set (`notification: false`); Bcc still added |
| Subject key | `user.created.email_content.title` → de "Nutzerkonto erstellt" / fr "Compte créé" |
| Context | `{'resetToken': ResetPasswordToken}` |

**Template (verbatim, complete file):**

```twig

{% extends 'emails/layout.html.twig' %}

{% block title %}{{ 'user.created.email_content.title'|trans }} {% endblock %}

{% block content %}
    <tr>
        <td style="padding:0;margin:0;color:#1a82ff" bgcolor="#ffffff" align="left">
            <p style="margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#000000;font-size:16px">{{ 'user.created.email_content.intro'|trans }}</p>
            <a href="{{ url('app_user.created', {token: resetToken.token}) }}">{{ url('app_user.created', {token: resetToken.token}) }}</a>
            <p style="margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#000000;font-size:16px">{{ 'user.created.email_content.expire'|trans }} {{ resetToken.expirationMessageKey|trans(resetToken.expirationMessageData, 'ResetPasswordBundle') }}.</p>
        </td>
    </tr>
{% endblock %}
```

**The route `app_user.created` does not exist.** It appears nowhere outside this template
(`grep -rnE "app_user.created|app_user_created" src/ templates/ config/` → only line 10 of this file)
and is absent from `php bin/console debug:router` (the only matching names are `users_index`,
`users_create`, `users_edit`, `users_delete`, `users_password`, `app_reset_password`,
`app_forgot_password_request`, `app_check_email`).

Consequence: rendering throws `RouteNotFoundException` inside
`MailerInterface::send()` → wrapped in `HandlerFailedException` by the sync bus → caught by
`Mailer::sendEmail()`'s `catch (\Throwable)` → logged `critical` → **the proposer never receives the
email, and the wizard still reports success.** The account row is created either way (it is persisted
at `ProposeEventController.php:270`, before the mail), so proposers get an account they cannot log
into and are never told about.

This is **UNVERIFIED in production** only in the sense that nobody has watched a production log; the
missing route is verified. The feature landed 2026-07-08 (`1f8578f`), after the 2026-05-21 database
dump, which is why the dump shows no post-May user rows (`max(user.created_at) = 2026-05-20
08:26:27+00`) and only 65 of 1 561 distinct proposer addresses have accounts. The intended fix is
almost certainly `app_reset_password`.

---

## 7. The layout, the shared include, branding and CSS

### 7.1 `themes/bka/templates/emails/layout.html.twig` (693 lines) — structure

Every one of the ten emails extends this file (the two password templates extend it via the default
theme path, which the themed Twig loader still resolves to the BKa file). It exposes exactly two
blocks: `title` and `content`.

```
line   1-4    <!DOCTYPE … XHTML 1.0 Transitional>
              <html dir="ltr" xmlns:o="…office" lang="DE" style="font-family:arial, …">
line   6-28   <head>: utf-8, viewport, x-apple-disable-message-reformatting, X-UA-Compatible,
              format-detection=telephone=no, <title>{% block title %}{% endblock %}</title>,
              MSO conditional <style> blocks and <o:OfficeDocumentSettings>
line  29-456  <style type="text/css"> … </style>   (the full responsive email CSS, see §7.3)
line 459-460  <body style="width:100%;font-family:arial,…;padding:0;Margin:0">
line 461      <div dir="ltr" class="es-wrapper-color" lang="DE" style="background-color:transparent">
line 462-465  MSO <v:background> fallback
line 466-470  <table class="es-wrapper" …>
line 471-509  HEADER  — es-header-body, background #ffe800 (inner td #ffffff, padding 20px),
                        <a href="{{ app.request.getSchemeAndHttpHost() }}">
                        <img src="{{ app.request.getSchemeAndHttpHost() }}{{ asset('emails_assets/bka_logo_baseline_side.png') }}"
                             alt="BKA Logo" title="BKA Logo" width="560" class="adapt-img">
line 511-618  CONTENT — es-content-body, background #f2f2f2 (inner cells #ffffff)
              line 529-540:  2px black rule
              line 545-548:  <h1 … font-size:32px;color:#060606>{{ block('title') }}</h1>
              line 552-564:  2px black rule
              line 582:      {% block content %}{% endblock %}
              line 584-607:  BKa support + newsletter footer copy (hard-coded German, see §7.2)
line 621-686  FOOTER  — es-footer-body, background #ffe800 (inner td #ffffff)
              line 638-658:  one social icon — Facebook
              line 659-669:  "Copyright © {{ 'now' | date('Y') }} Berner Kulturagenda" / "Sulgenrain 28, 3007 Bern"
line 688-693  closing tags
```

Note the subject text is rendered **twice**: in `<title>` and as the `<h1>`.

### 7.2 BKa branding strings in the layout (verbatim)

Support block (lines 584-593):

```twig
<p style="…;line-height:24px;color:#333333;font-size:16px">
    Bei Fragen oder Problemen können Sie sich gerne
    an unseren Support wenden: <a target="_blank"
                                  href="mailto:support@bka.ch"
                                  style="…;text-decoration:underline;color:#e6007d;font-size:16px;font-family:arial, 'helvetica neue', helvetica, sans-serif">support@bka.ch</a>
</p>
```

Newsletter block (lines 597-606):

```twig
<p style="…;line-height:24px;color:#333333;font-size:16px">
    Bleiben Sie über die Neuigkeiten der
    <strong>BKa</strong> auf dem Laufenden,
    indem Sie <a target="_blank"
                 href="https://www.bka.ch/newsletter-signup"
                 style="…;text-decoration:underline;color:#e6007d;font-size:16px;font-family:arial, 'helvetica neue', helvetica, sans-serif">unseren
        Newsletter</a> abonnieren und uns in den
    sozialen Netzwerken folgen.
</p>
```

Social + copyright (lines 646-667):

```twig
<a target="_blank"
   href="https://www.facebook.com/people/Berner-Kulturagenda/100063983086454/"
   style="…;color:#FFFFFF;font-size:14px"><img
        src="{{ app.request.getSchemeAndHttpHost() }}{{ asset('emails_assets/facebook-circle-black.png') }}"
        alt="Fb" title="Facebook" width="32" …></a>
…
<p style="…;line-height:14px;color:#060606;font-size:12px">
    Copyright © {{ 'now' | date('Y') }} Berner
    Kulturagenda<br></p>
<p style="…;line-height:14px;color:#060606;font-size:12px">
    Sulgenrain 28, 3007 Bern</p>
```

The address changed from "Brunnmattstrasse 21, 3007 Bern" to "Sulgenrain 28, 3007 Bern" in commit
`c897f2a` (2026-06-26).

**BKa brand colours used in mail:** `#ffe800` (header/footer band), `#e6007d` (magenta links),
`#000000` (2px rules, inverted label chips), `#060606` (h1 / footer text), `#f2f2f2` (content
backdrop), `#ffffff` (cards). The green `#31CB4B` and hover `#56d66b` / `#42d159` in the button CSS
are inherited In Situ values that BKa never retuned (and the inline `background-color:#ffffff` later
in the same attribute wins, so the buttons render white with a black border).

**Layout diff BKa ← default** (whitespace-normalised structural diff, excluding the `<style>` block):

| # | Default (In Situ) | BKa |
|---|---|---|
| 1 | `<html xmlns=… style=…>` | `<html dir="ltr" … lang="DE" …>` |
| 2 | `<div class="es-wrapper-color" …>` | `<div dir="ltr" class="es-wrapper-color" lang="DE" …>` |
| 3 | header body `background-color:#ffffff` | `background-color:#ffe800` |
| 4 | logo link `https://insitu.live/agenda`, image `emails_assets/logo_x01.png`, alt/title "In Situ Logo" | link `{{ app.request.getSchemeAndHttpHost() }}`, image `emails_assets/bka_logo_baseline_side.png`, alt/title "BKA Logo" |
| 5 | footer copy via `_mails.footer.support` / `news_1`–`news_4`, `mailto:support1@venue-example.org`, Mailchimp signup URL, link colour `#1a82ff` | hard-coded German, `mailto:support@bka.ch`, `https://www.bka.ch/newsletter-signup`, link colour `#e6007d` |
| 6 | three social icons: Facebook `insitu.kultur`, Instagram `insitu.kultur`, LinkedIn `insitu-kultur` | one social icon: Facebook `Berner-Kulturagenda/100063983086454` |
| 7 | `Copyright © {{year}} {{ '_mails.footer.in_situ_association'\|trans }}<br>Route de la fonderie 7, 1700&nbsp;{{ '_mails.footer.fribourg_ch'\|trans }}` | `Copyright © {{year}} Berner Kulturagenda` + separate `<p>Sulgenrain 28, 3007 Bern</p>` |
| 8 | `role="presentation"` on six inner tables | attribute absent |

Consequence: the `_mails.footer.*` translation keys (`support`, `news_1`–`news_4`,
`in_situ_association`, `fribourg_ch`) are **dead for BKa**.

### 7.3 Inline CSS

The `<style>` block is a Stripo-exported responsive email stylesheet,
**`themes/bka/templates/emails/layout.html.twig:29-456`** (428 lines) vs
**`templates/emails/layout.html.twig:28-412`** (385 lines). After whitespace normalisation the two
are byte-identical apart from three rules:

* present in default only:
  ```css
  td.es-button-border:hover a.es-button-1 { background:#efefef!important; border-color:#efefef!important; color:#000000!important; }
  td.es-button-border-2:hover { background:#efefef!important; border-color:#000000 #000000 #000000 #000000!important; border-style:solid solid solid solid!important; }
  ```
* present in BKa only:
  ```css
  .h-auto { height:auto!important }
  ```

The non-generic desktop rules, verbatim (BKa lines 30-66):

```css
#outlook a { padding: 0; }
.es-button { mso-style-priority: 100 !important; text-decoration: none !important; }
a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important;
    font-size: inherit !important; font-family: inherit !important;
    font-weight: inherit !important; line-height: inherit !important; }
.es-desk-hidden { display: none; float: left; overflow: hidden; width: 0;
    max-height: 0; line-height: 0; mso-hide: all; }
.es-button-border:hover a.es-button,
.es-button-border:hover button.es-button { background: #56d66b !important; }
.es-button-border:hover { border-color: #42d159 #42d159 #42d159 #42d159 !important;
    background: #56d66b !important; }
```

Everything after that lives inside a single `@media only screen and (max-width: 600px)` block and is
the standard Stripo mobile pack: `p/ul li/ol li/a {line-height:150%}`, `h1 {30px}`, `h2 {24px}`,
`h3 {20px}`, `.es-header-body|.es-content-body|.es-footer-body p/li/a {font-size:14px}`,
`.es-infoblock {12px}`, `.es-m-txt-c|-r|-l` alignment helpers, `.es-button-border{display:inline-block}`,
`a.es-button{font-size:18px}`, `.es-adaptive table|.es-left|.es-right{width:100%}`,
`.es-content table|.es-header table|.es-footer table{width:100%;max-width:600px}`,
`.adapt-img{width:100%;height:auto}`, the `.es-m-p*` padding utilities (`p0`, `p0r`, `p0l`, `p0t`,
`p0b`, `p5`, `p5t`, `p5b`, `p5r`, `p5l`, `p10…p40` family), `.es-mobile-hidden|.es-hidden{display:none}`,
`tr|td|table.es-desk-hidden` reveal rules, `table.es-table-not-adapt{width:auto}`,
`table.es-social{display:inline-block}` and `.h-auto{height:auto}`.

Beyond that stylesheet, **every element also carries an inline `style` attribute** — the templates are
written for Outlook-grade clients with table layout, `bgcolor` attributes, `mso-*` properties and
`<!--[if mso]> / <![endif]-->` VML button fallbacks.

### 7.4 The shared include `includes/event_dates.html.twig`

Both themes have a copy; they differ only in the paragraph text colour
(`#333333` default → `#000000` BKa). BKa version verbatim
(`themes/bka/templates/includes/event_dates.html.twig`):

```twig
<p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:24px;color:#000000;font-size:16px">
    <span style="color:#FFFFFF">
        <span style="background-color:#000000">{{ '_mails.misc.dates'|trans }}</span>
    </span>
    {{ '_mails.misc.from'|trans }} {{ event.dateFrom|date('d.m.Y') }} {{ '_mails.misc.time_at'|trans }} {{ event.dateFrom|date('G\\hi') }}
    {{ '_mails.misc.to'|trans }} {{ event.dateTo|date('d.m.Y') }} {{ '_mails.misc.time_at'|trans }} {{ event.dateTo|date('G\\hi') }}{% if event.openingTime %}, {{ '_mails.misc.opening_doors'|trans }} {{ event.openingTime }}{% endif %}
    {% for subevent in event.subEvents %}
        <br>{{ '_mails.misc.from'|trans }} {{ subevent.dateFrom|date('d.m.Y') }} {{ '_mails.misc.time_at'|trans }} {{ subevent.dateFrom|date('G\\hi') }} {{ '_mails.misc.to'|trans }} {{ subevent.dateTo|date('d.m.Y') }} {{ '_mails.misc.time_at'|trans }} {{ subevent.dateTo|date('G\\hi') }}{% if event.openingTime %}, {{ '_mails.misc.opening_doors'|trans }} {{ event.openingTime }}{% endif %}{% if not loop.last %}
    {% endif %}
    {% endfor %}
    {% for day in event.recurrenceWeekDays %}
        {{ ('event.weekdays.'~day)|trans }}{% if not loop.last %}, {% endif %}
    {% endfor %}
    <br type="_moz">
</p>
```

Formatting facts: dates are `d.m.Y`, times are `G\hi` (e.g. `20h30`, 24-hour, no leading zero).
Timezone is `Europe/Zurich` (`config/packages/twig.yaml:3-4`). `event.openingTime` is a free-text
string column (`src/Entity/Event.php:139`). `event.subEvents` and `event.recurrenceWeekDays` exist only
on `MainEvent` (`src/Entity/MainEvent.php:43,107`), not on `SubEvent`; Twig's `for` over an undefined
value yields an empty loop, so the include is safe for either subclass of the
`SINGLE_TABLE`-inherited `Event` (`src/Entity/Event.php:23-28`, discriminator map
`mainevent`/`subevent`).

### 7.5 Images

All images are referenced by **absolute URL** (`{{ app.request.getSchemeAndHttpHost() }}{{ asset(...) }}`);
nothing is attached or embedded as CID. They live in `public/emails_assets/`, *not* in
`themes/bka/public/`, so Sylius's `PathResolver` leaves the path alone
(`vendor/sylius/theme-bundle/src/Asset/PathResolver.php:57-71` only rewrites to
`/_themes/<theme>/…` when the file exists under the theme). Verified live:

```
$ curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}\n" \
    http://localhost:8080/emails_assets/bka_logo_baseline_side.png
200 image/png 31753
```

| File | Size | Dimensions | Used by |
|---|---|---|---|
| `public/emails_assets/bka_logo_baseline_side.png` | 31 753 B | 1568×332 | BKa layout header (rendered at `width="560"`) |
| `public/emails_assets/facebook-circle-black.png` | 870 B | 64×64 | both layouts, footer (rendered at `width="32"`) |
| `public/emails_assets/logo_x01.png` | 12 538 B | 745×199 | default layout header only |
| `public/emails_assets/instagram-circle-black.png` | 780 B | — | default layout only |
| `public/emails_assets/linkedin-circle-black.png` | 736 B | — | default layout only |
| `twitter-circle-black.png`, `*-logo-black.png`, `mail-logo-black.png` | — | — | unused |

Event images in 2a are linked (not embedded) as
`{{ app.request.schemeAndHttpHost }}{{ asset('/img/'~image.fileName) }}` → route
`legacy_image_redirect` = `/img/{path}`, which is a `security: false` firewall
(`config/packages/security.yaml:54-56`), so the links are publicly fetchable.

---

## 8. Translation reference

### 8.1 `_mails.misc.*` — shared field labels

| Key | de (`translations/messages.de.yml:707-726`) | fr (`translations/messages.fr.yml:707-726`) | Used by (BKa) |
|---|---|---|---|
| `name` | Name | Nom | 1a 1b 2a 2b 3a 3b 4a 4b |
| `surname` | Vorname | prénom | 2a 2b |
| `dates` | Datum/Uhrzeit | Dates/Heures | all (via include) |
| `from` | Von | Du | all (via include) |
| `to` | bis | au | all (via include) |
| `opening_doors` | Einlass ist um | ouverture des portes | all (via include) |
| `time_at` | um | à | all (via include) |
| `place` | Ort | Lieu | 1a 1b 2a 2b 3a 3b 4a 4b |
| `manage_request` | Anfrage(n) bearbeiten | Gérer la/les demande(s) | 1b only (2b hard-codes it) |
| `organization` | Organisation | Organisme | 1b 2a 2b 3b* |
| `email` | E-mail | Email | 1b 2a 2b 3b* |
| `categories` | Kategorie(n) | Catégorie(s) | 2a |
| `description` | Beschreibung | Description | 2a |
| `images` | Bild(er) | Image(s) | 2a |
| `audience` | Zielpublikum | Public cible | 2a |
| `rates` | Tarif(e) | Tarif(s) | 2a |
| `rates_special` | Besondere Tarife | Tarifs spéciaux | 2a |
| `ticketing_url` | Link zum Kartenverkauf | Lien de billetterie | 2a |
| `your_contactdetails` | Ihre Kontaktdaten | Vos coordonnées | 2a |
| `tel` | Tel | Tél | 2b only (2a hard-codes "Handy") |

\* in the dead `{% if user is defined %}` block.

### 8.2 `_mails.<code>.*` — per-email copy

| Key | de | fr | Used by BKa? |
|---|---|---|---|
| `1a.title` | Veranstaltung zur Validierung gesendet | Événement envoyé pour validation | **yes (subject)** |
| `1a.intro` | Vielen Dank, dass Sie die folgende Veranstaltung hinzugefügt haben : | Merci pour votre ajout de l'événement suivant : | **yes** |
| `1a.phrase_1` | Ihre Veranstaltung wurde registriert. Da sie an einem Ort stattfindet, für den Sie nicht verantwortlich sind, wurde eine Benachrichtigung an die Organisation gesendet, die für die Verwaltung des Ortes zuständig ist, an dem Sie die Veranstaltung Ihren Angaben zufolge durchführen wollen. | Votre événement a bien été enregistré. Comme il prend place dans un lieu dont vous n'êtes pas responsable, une notification a été envoyée à l'organisme chargé de la gestion du lieu dans lequel vous avez indiqué vouloir le produire. | no (BKa drops it) |
| `1a.phrase_2` | Wenn Sie als Veröffentlichungsstatus (letztes Feld des Formulars) "Veröffentlichen" gewählt haben, ist Ihre Veranstaltung bereits am ausgewählten Datum im Kalender sichtbar. Wenn Sie "Noch zu bestätigen" gewählt haben, muss, die für den Veranstaltungsort verantwortliche Person die Veranstaltung auf "Veröffentlichen" setzen, bevor sie dort erscheint. | Si vous avez choisi le Statut de publication (dernier champ du formulaire) "Publier" votre événement est d'ores et déjà visible dans l'agenda à la date sélectionnée. Si vous avez choisi "à valider" le responsable du lieu devra le passer en "publier" avant qu'il n'y apparaisse. | no |
| `1b.title` | *(BKa de override)* **Veranstaltung wartet auf Genehmigung** — base de: Veranstaltung wartet auf Validierung | Événement en attente de validation | **yes (subject)** |
| `1b.intro_1` / `intro_2` | Sie haben eine Anfrage von / erhalten, die eine Veranstaltung(en) an Ihrem Ort durchführen möchte. | Vous avez reçu une demande de / souhaitant produire un événement dans un lieu dont vous êtes responsable. | no |
| `1b.phrase_1` | Wenn die Veranstaltung Korrekturen erfordert, wenden Sie sich bitte an die Organisation, die für Veranstaltung verantwortlich ist. | Si l'événement nécessite des corrections, veuillez prendre contact avec l'organisme en charge de l'événement : | no |
| `1b.phrase_2` | Sobald die Anfrage(n) genehmigt wurde(n), wird die veranstaltende Organisation per E-Mail benachrichtigt und ihre Veranstaltung(en) im Kalender veröffentlicht. | Une fois la(les) demande(s) validée(s), l'organisme organisateur sera notifié par e-mail et son(ses) événement(s) publié(s) sur l'agenda. | no |
| `2a.title` | Vorschlag zur Validierung gesendet | Proposition envoyée pour validation | **yes (subject)** |
| `2a.intro_1` … `intro_7`, `2a.your_event` | see `translations/messages.de.yml:750-759` | see `messages.fr.yml:750-759` | no (BKa hard-codes) |
| `2b.title` | Vorschlag wartet auf Validierung | Proposition en attente de validation | **yes (subject)** |
| `2b.intro` | Es wurde ein Vorschlag für eine Veranstaltung an einem Ort gemacht, für den Sie verantwortlich sind. | Une proposition d'événement a été faite dans un lieu dont vous êtes responsable. | no |
| `2b.content_1` | Wenn die Veranstaltung Korrekturen erfordert, wenden Sie sich bitte an die Person, die die Veranstaltung vorgeschlagen hat: | Si l'événement nécessite des corrections, veuillez prendre contact avec la personne ayant proposée l'événement : | no |
| `2b.content_2` | Sobald die Anfrage bestätigt wurde, wird eine Benachrichtigung an die E-Mail-Adresse der Nutzerin/des Nutzers gesendet, die/der Veranstaltung vorgeschlagen hat, und die Veranstaltung wird im Kalender sichtbar. | Une fois la demande validée, une notification sera envoyée à l'adresse email de l'utilisateur·rice·x qui a proposé l'événement et celui-ci sera visible dans l'agenda. | no |
| `3a.title` | Auf der Plattform veröffentlichte Veranstaltung | Événement publié sur la plateforme | **yes (subject)** |
| `3a.intro` | Ihre Veranstaltung wurde auf der Plattform veröffentlicht! | Votre événement a été publié sur la plateforme ! | no (BKa hard-codes the same German) |
| `3b.title` | Veranstaltung an Ihrem Ort veröffentlicht | Événement publié dans votre lieu | **yes (subject)** |
| `3b.intro` | Eine Veranstaltung, die an Ihrem Ort stattfindet, wurde auf der Plattform veröffentlicht! | Un événement produit dans votre lieu a été publié sur la plateforme ! | no |
| `3b.content` | Wenn die Veranstaltung Korrekturen erfordert, wenden Sie sich bitte an die Organisation, für die Veranstaltung verantwortlich ist: | Si l'événement nécessite des corrections, veuillez prendre contact avec l'organisme en charge de l'événement : | no |
| `4a.title` | *(BKa de override)* **Veranstaltung von der/dem Verantwortlichen für den Ort geändert** — base de: Veranstaltung von der für den Ort verantwortlichen Person geändert | Événement modifié par le/la responsable du lieu | **yes (subject)** |
| `4a.intro_1` / `intro_2` | Die für den Ort verantwortliche Person / hat eine von Ihnen veröffentlichte Veranstaltung geändert. | Le responsable du lieu / a modifié un événement que vous avez publié. | no |
| `4b.title` | Geänderte Veranstaltung | Événement modifié | **yes (subject)** |
| `4b.intro` | hat eine Veranstaltung geändert, die an Ihrem Ort veröffentlicht wurde. | a modifié un événement publié dans votre lieu. | no |
| `footer.support`, `footer.news_1`–`news_4`, `footer.in_situ_association`, `footer.fribourg_ch` | see `messages.de.yml:728-735` | see `messages.fr.yml:728-735` | **no — dead for BKa** |

### 8.3 Password-email keys

| Key | de | fr |
|---|---|---|
| `reset_password.email_content.title` | Passwort zurücksetzen | Réinitialisation de mot de passe |
| `reset_password.email_content.intro` | Um Ihr Passwort zurückzusetzen, besuchen Sie bitte den folgenden Link | Pour réinitialiser votre mot de passe, veuillez consulter le lien suivant |
| `reset_password.email_content.expire` | Dieser Link läuft ab in | Ce lien expirera dans |
| `user.created.email_content.title` | Nutzerkonto erstellt | Compte créé |
| `user.created.email_content.intro` | Um Ihr Nutzerkonto vollständig einzurichten, besuchen Sie bitte den folgenden Link | Pour finaliser la configuration de votre compte utilisateur, veuillez visiter le lien suivant |
| `user.created.email_content.expire` | Dieser Link läuft ab in | Ce lien expire dans |

(`translations/messages.de.yml:592-596, 621-624`; `messages.fr.yml:592-596, 621-624`.)

The expiry duration itself comes from the `ResetPasswordBundle` domain via
`resetToken.expirationMessageKey|trans(resetToken.expirationMessageData, 'ResetPasswordBundle')`.

### 8.4 Keys used indirectly from 2a

* `('event.specialRates.' ~ event.specialRate)|trans` →
  * `event.specialRates.free_entry` — de "Freier Eintritt (gratis)" / fr "Entrée libre (accès non payant)"
  * `event.specialRates.free_price` — **BKa de override** "Freie Preiswahl oder Kollekte"
    (`themes/bka/translations/messages.de.yml:27`); base de "Freier Preis (gemäss vorhandenen Mitteln)" /
    fr "Prix libre (selon vos moyens)"
  * `event.specialRates.none` — de "Ohne" / fr "Aucun"

  Production distribution: `free_entry` 5 103, `free_price` 3 000, empty 26 176.
* `('event.weekdays.' ~ day)|trans` (from the dates include) → `1`…`7` =
  Montag…Sonntag / Lundi…Dimanche (`messages.*.yml:357-364`).
* `locale|display_language|lower` → `\Locale::getDisplayLanguage($locale)`
  (`src/Twig/AppExtension.php:82-85`) — rendered with the **PHP default locale**, which
  `LocaleSwitcher` has set to the recipient's locale.
* `rate.price|price_formatted` → `number_format(floatval($price)/100, 2)`
  (`src/Twig/AppExtension.php:87-93`) — prices are stored in **cents**.

---

## 9. Data shapes referenced by the templates

| Expression | Backing field | Notes |
|---|---|---|
| `event.name` | `event.name` | |
| `event.slug` | `event.slug` | used for `path('events_edit', {slug: …})` = `/events/edit/{slug}` |
| `event.dateFrom` / `event.dateTo` | `\DateTime` | |
| `event.openingTime` | `?string` free text (`Event.php:139`) | |
| `event.subEvents` | `MainEvent::$subEvents` Collection | `SINGLE_TABLE` inheritance, discriminator `subevent` |
| `event.recurrenceWeekDays` | `MainEvent::$recurrenceWeekDays` `?array` of 1-7 | |
| `event.place.name` | `Place` | `Event::getPlace(): ?Place` — **nullable**, 2 562/34 279 are null |
| `event.placeProposed.name` | `PlaceProposed` | 1 823 rows; only consulted in 2a/2b |
| `event.organization.name` | `Organization` | 27 949/34 279 events have one |
| `event.user` | `?User` | 21 378/34 279 events have one; event "owner" |
| `event.proposedBy` | `?EventProposedBy` | 4 288/34 279; columns `firstname varchar(55) NOT NULL`, `lastname varchar(55) NOT NULL`, `email varchar(155) NOT NULL`, `phone varchar(35) NULL`, `organization varchar(255) NULL` — **free-text org name, not a FK** |
| `event.categories[].label[locale]` | `Category::$label` JSON map | |
| `event.audience.label[locale]` | `Audience::$label` JSON map, FK `nullable: false` | |
| `event.images[].fileName` | `Image` | |
| `event.rates[].label(locale,'designation')`, `.price` | `Rate`, price in cents | |
| `event.label(locale, 'description'\|'ticketingUrl')` | `TranslatableEntity::getLabel()` over the `labels` JSON column (`src/Traits/TranslatableEntity.php:69-85`) | returns `null` when absent |
| `event.specialRate` | `?string` enum-ish: `free_entry`, `free_price`, `''` | |
| `user.email` | `User::$email` | |
| `app_locales` | Twig global `'%locales%'` = `"fr|de"` (`config/packages/twig.yaml:9`) | split on `|` in 2a |

---

## 10. Defects, dead code and quirks found while reading

| # | Severity | Finding | Evidence |
|---|---|---|---|
| D1 | **High** | The "account created" email can never be delivered — `url('app_user.created', …)` references a route that does not exist. The render throws, `sendEmail()` swallows it, the wizard still succeeds. | `templates/propose_event/user-created.html.twig:10`; `php bin/console debug:router` has no such route; `Mailer.php:177-184` |
| D2 | **High** | BKa 3b's "who to contact for corrections" block is unreachable: `{% if user is defined and user is not null %}` but the builder passes no `user`, and `user` is not a Twig global. `organizationName`/`organizationEmail` are computed and never used. | `themes/bka/templates/emails/admin_event_3b.html.twig:30`; `Mailer.php:114-118`; `config/packages/twig.yaml:6-18` |
| D3 | **High** | French recipients get a French **subject** and a German **body** for 1b/2a/2b/3a/3b/4a/4b, because BKa hard-codes German prose and ships no `messages.fr.yml`. Currently invisible — all 427 production users are `de`. | `ls themes/bka/translations/` → `messages.de.yml` only; templates quoted in §6 |
| D4 | Medium | `Mailer::placeAdminsOrReplyTo()` and `newEventProposedByPublishedAdmin()` dereference `$event->getPlace()` without a null check while `getPlace(): ?Place`. `EventController.php:566` reaches 4b unguarded. 2 562 events have `place_id IS NULL`. | `Mailer.php:249,107`; `EventController.php:540` (guarded) vs `:566` (not) |
| D5 | Medium | BKa 2a still uses `app.request.locale` (sender) for category/audience labels; the default template was migrated to `app.locale` (recipient) in `7506be2` and the override was missed. | `themes/bka/.../admin_event_2a.html.twig:71,102` vs `templates/.../admin_event_2a.html.twig:71,103` |
| D6 | Medium | Password-reset and account-created emails are BCC'd to `MAILER_BCC_ADDRESS` along with everything else — the BCC mailbox receives live reset links. | `Mailer.php:228` runs for `notification: false` too |
| D7 | Medium | Co-recipients of a "b" email are all in `To:` and see each other's addresses. | `Mailer.php:224-226` |
| D8 | Low | BKa 2b contains the mangled string **"des Nutzers-rice-x"** (a literal transliteration of the French `l'utilisateur·rice·x`). | `themes/bka/.../admin_event_2b.html.twig:79-83` |
| D9 | Low | BKa 3a has an unbalanced duplicated `<tr><td>` opener. | `themes/bka/.../admin_event_3a.html.twig:6-10` |
| D10 | Low | BKa 2a hard-codes the phone label as **"Handy"**, bypassing `_mails.misc.tel`; BKa 2b hard-codes the CTA label "Den/die Antrag/e verwalten", bypassing `_mails.misc.manage_request`. | `admin_event_2a.html.twig:185`, `admin_event_2b.html.twig:33,39-40` |
| D11 | Low | `accountCreatedChangePassword()` / `resetPasswordRequest()` take a `TranslatorInterface $translator` argument that is never used. | `Mailer.php:150,160` |
| D12 | Low | `_mails.footer.*`, `_mails.1a.phrase_*`, `_mails.1b.intro_*`/`phrase_*`, `_mails.2a.intro_*`/`your_event`, `_mails.2b.intro`/`content_*`, `_mails.3a.intro`, `_mails.3b.intro`/`content`, `_mails.4a.intro_*`, `_mails.4b.intro` are all dead for BKa. | §8.2 |
| D13 | Low | Nothing uses the Notifier; `admin@example.com` and the `ChatMessage`/`SmsMessage` routes are placeholder config. | `config/packages/notifier.yaml`, `messenger.yaml:21-22` |
| D14 | Low | The API v1 error message claims "A notification was sent to the platform's admins"; no notification is sent. | `src/Controller/ApiEventController.php:374,484` vs `:366-369` |
| D15 | Info | Mail is sync-only and depends on the request-scoped Sylius theme + `app.request.*`. Moving it to the async transport would silently switch to the default In Situ branding and crash on `app.request`. | `messenger.yaml:20`, `src/EventListener/ThemeRequestListener.php:38-47` |
| D16 | Info | No delivery log, no retry, no bounce processing, no suppression list. Every failure is a `critical` log line. | §2.6, `Mailer.php:179-183` |

---

## 11. Production volume reference (measured)

All figures from the restored BKa production database (`insitu-admin-postgres-1`, snapshot
≈2026-05-21).

```
events                           34 279
  with proposed_by_id             4 288   → 2a + 2b at submission
  with user_id                   21 378
  with place_id                  31 717   (2 562 without)
  with organization_id           27 949
publication_status  publish      34 076 / to_validate 109 / draft 94

places                            1 276
  no organisation                   705   → "b" mails fall back to MAILER_REPLYTO_ADDRESS
  org but no users                   30   → "b" mails have no To (BCC-only)
  org with users                     541
user_organization rows              507   across 445 organisations

users                               427   (all locale = 'de')
  ROLE_USER only                    397
  ROLE_ADMIN                         30   → their edits send nothing

distinct proposer emails          1 561
  …that have a user account           65

guest proposals / year      ~1 951 (2024), ~1 661 (2025), 675 (2026 to 21 May)

messenger_messages                    0 rows
reset_password_request                0 rows
```

A rough steady-state estimate: **≈4 000–6 000 outbound emails per year**, dominated by the
2a/2b pair on guest proposals and their 3a/3b follow-ups.

---

## Porting notes

*Opinion and suggestion only — everything above this line is observed fact.*

1. **The scheme to carry over is "author side / venue side", not the file names.** `1a/1b/…/4b` are
   opaque. In We.Publish terms the four digits map onto revision-system transitions:
   1 = *draft/pending created at a foreign venue*, 2 = *pending created by an anonymous proposer*,
   3 = *pending → published*, 4 = *published revision superseded*. Model the recipient as a role
   (`EVENT_AUTHOR` vs `VENUE_ADMIN`) rather than reproducing eight template names.
2. **`placeAdminsOrReplyTo` is the only audience-resolution rule worth preserving**, and it is weaker
   than it looks: it is "every user of the organisation that owns the place", with no role filter, and
   705 of 1 276 places have no organisation at all so the mail falls through to a support mailbox. The
   port needs a deliberate decision here — carry the fallback or require an owner.
3. **Drop `ROLE_ADMIN` suppression deliberately, or keep it deliberately.** Today BKa support can edit
   anything without notifying anyone (`EventController.php:516`). That is probably intentional
   (support fixes typos), but it is implicit and undocumented; make it an explicit rule.
4. **Rebuild the templates rather than porting them.** They are Stripo exports with inline styles,
   MSO conditionals and VML buttons, and the BKa overrides have drifted into hard-coded German, dead
   conditionals (D2), and copy bugs (D8). A single MJML/React-Email layout with one `title` + one
   `content` slot reproduces the entire structure; the only branding facts that must survive are the
   BKa palette (`#ffe800`, `#e6007d`, `#000000`, `#f2f2f2`, `#060606`), the 560px logo
   `bka_logo_baseline_side.png`, `support@bka.ch`, `https://www.bka.ch/newsletter-signup`, the
   Facebook URL, and "Berner Kulturagenda / Sulgenrain 28, 3007 Bern".
5. **Fix D1 and D2 as part of the port, not before.** `app_user.created` → the reset-password route;
   3b's contact block → use the already-computed `organizationName`/`organizationEmail`.
6. **Decide on queueing early.** The current design only works because mail is synchronous and inherits
   the request's theme, host and locale. Any queued implementation must capture `baseUrl`, `locale` and
   `theme` into the job payload instead of reading ambient state.
7. **Per-recipient locale is already modelled** (`User.locale`, 2-char, default `de`) but every BKa user
   is `de` today, so the fr path has effectively never run in production. Treat the French strings in
   `translations/messages.fr.yml` as untested, and note that the BKa bodies would need real
   translation work before fr can be switched on.
8. **Get the production `MAILER_*` values before cut-over**, especially `MAILER_BCC_ADDRESS` — whoever
   is on it currently receives every event notification *and* every password-reset link, and that
   should be an explicit product decision in the new system rather than an inherited env var.
