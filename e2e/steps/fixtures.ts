import { APIResponse, request as playwrightRequest } from '@playwright/test';
import { test as base, createBdd } from 'playwright-bdd';
import { ApiClient, createAdminClient } from '../support/api-client';
import { BexioTestCompany } from '../support/bexio';
import { env, missingCapabilities } from '../support/env';
import { featureKeysOf } from '../support/feature-tags';
import {
  Entity,
  nextRunId,
  seededFaker,
  TestData,
} from '../support/factories';
import { ImapInbox } from '../support/imap-inbox';
import { Inbox, mailBackend } from '../support/inbox';
import { MailpitInbox } from '../support/mailpit';
import { ReaderBrowsers } from '../support/reader-browsers';
import { ResendInbox } from '../support/resend-inbox';

/** Per-scenario state shared between steps. Extend as new steps need it. */
export type ScenarioContext = {
  response?: APIResponse;
  /** Synthetic data by the alias the Gherkin gives it (`"Paid story"`). */
  entities: Map<string, Entity>;
  /** Alias of the article the reader has open. */
  currentArticle?: string;
  /** Alias of the reader who acted last, for steps that do not name one. */
  currentReader?: string;
  /** Referral links readers copied from their profile, by reader alias. */
  referralLinks: Map<string, string>;
  /** The open we.publish invoice of a reader and its subscription, by reader alias. */
  openInvoices: Map<string, { invoiceId: string; subscriptionId: string }>;
  /** bexio invoices the scenario made the provider create; canceled afterwards. */
  bexioInvoices: number[];
};

type TestFixtures = {
  ctx: ScenarioContext;
  /** Skips the scenario when a capability tag (@mutating, @mail, …) is not configured. */
  capabilities: void;
  /** Creates synthetic data through the API and deletes it after the scenario. */
  data: TestData;
  inbox: Inbox;
  /** A browser per reader alias, for journeys with several readers. */
  readers: ReaderBrowsers;
  /**
   * Mail from outside servers (bexio), not from the target's API; needs
   * @inbound-mail. Skips the scenario when today's quota is nearly used.
   */
  inboundInbox: ResendInbox;
  /** The bexio test company; needs @bexio. */
  bexio: BexioTestCompany;
};

type WorkerFixtures = {
  /** Admin GraphQL client, logged in once per worker on first use. */
  adminApi: () => Promise<ApiClient>;
};

/**
 * Shared test instance for all step files. Add custom fixtures (page objects,
 * per-scenario state) here via `base.extend`, then import `Given/When/Then`
 * from this file, never directly from `playwright-bdd`.
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  // eslint-disable-next-line no-empty-pattern
  ctx: async ({}, use) => {
    await use({
      entities: new Map(),
      referralLinks: new Map(),
      openInvoices: new Map(),
      bexioInvoices: [],
    });
  },

  capabilities: [
    async ({ $tags, adminApi }, use, testInfo) => {
      const missing = missingCapabilities($tags);

      if (!testInfo.project.use.baseURL) {
        missing.push(`no ${testInfo.project.name} URL for this target`);
      }

      // Asked only when everything else is there: it needs the API.
      const features = featureKeysOf($tags);

      if (!missing.length && features.length) {
        const { features: enabled } = await (
          await adminApi()
        ).gql<{ features: string[] }>(`query { features }`);
        const off = features.filter(key => !enabled.includes(key));

        if (off.length) {
          missing.push(`feature ${off.join(', ')} is switched off for this medium`);
        }
      }

      testInfo.skip(missing.length > 0, missing.join(', '));
      await use();
    },
    { auto: true },
  ],

  // Known bug: the simulated checkout page is served with helmet's CSP
  // `form-action 'self'`, and Chrome then blocks the 303 back to the website
  // whenever API and website are different origins. Bypassed for @payment
  // only, until libs/payment/api widens form-action for that page.
  bypassCSP: async ({ $tags }, use) => {
    await use($tags.includes('@payment'));
  },

  adminApi: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const request = await playwrightRequest.newContext();
      let client: Promise<ApiClient> | undefined;

      await use(() => (client ??= createAdminClient(request)));
      await request.dispose();
    },
    { scope: 'worker' },
  ],

  data: async ({ adminApi, ctx }, use, testInfo) => {
    const data = new TestData(
      adminApi,
      seededFaker(testInfo.titlePath.join(' › ')),
      () => nextRunId(testInfo.workerIndex),
      ctx.entities
    );

    await use(data);
    await data.cleanup();
  },

  inbox: async ({ request }, use) => {
    // Some slack for the clock of the mail server and its whole-second dates.
    const since = new Date(Date.now() - 30_000);
    const inbox =
      mailBackend(env) === 'mailpit' && env.mailpitUrl ?
        new MailpitInbox(request, env.mailpitUrl)
      : env.imap ?
        new ImapInbox(env.imap, since, {
          purgeOlderThanDays: env.imapPurgeOlderThanDays,
        })
      : undefined;

    if (!inbox) {
      throw new Error(
        'No inbox configured; tag the scenario with @mail (see e2e/README.md).'
      );
    }

    await use(inbox);
    await inbox.close();
  },

  inboundInbox: async ({ request }, use, testInfo) => {
    if (!env.resend) {
      throw new Error(
        'No inbound inbox configured; tag the scenario with @inbound-mail (see e2e/README.md).'
      );
    }

    const inbox = new ResendInbox(request, env.resend, new Date(Date.now() - 30_000));
    const used = await inbox.receivedToday();

    // A full mailbox would fail the scenario for a reason that is not a bug.
    testInfo.skip(
      used >= env.resendDailyBudget,
      `Resend daily quota nearly used: ${used} mails today, budget ${env.resendDailyBudget}`
    );

    await use(inbox);
    await inbox.close();
  },

  bexio: async ({ request, ctx }, use) => {
    if (!env.bexio) {
      throw new Error('No bexio test company configured; tag the scenario with @bexio (see e2e/README.md).');
    }

    const bexio = new BexioTestCompany(request, env.bexio);

    await use(bexio);

    for (const id of ctx.bexioInvoices) {
      await bexio.cancel(id).catch(error =>
        console.warn(`[e2e] could not cancel bexio invoice ${id}: ${(error as Error).message}`)
      );
    }
  },

  readers: async (
    { browser, page, context, baseURL, bypassCSP, viewport, userAgent, locale },
    use
  ) => {
    const readers = new ReaderBrowsers(
      browser,
      { context, page },
      { baseURL, bypassCSP, viewport, userAgent, locale }
    );

    await use(readers);
    await readers.close();
  },
});

export const { Given, When, Then } = createBdd(test);
