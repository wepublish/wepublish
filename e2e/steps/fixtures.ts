import { APIResponse, request as playwrightRequest } from '@playwright/test';
import { test as base, createBdd } from 'playwright-bdd';
import { ApiClient, createAdminClient } from '../support/api-client';
import { env, missingCapabilities } from '../support/env';
import {
  Entity,
  nextRunId,
  seededFaker,
  TestData,
} from '../support/factories';
import { ImapInbox } from '../support/imap-inbox';
import { Inbox, mailBackend } from '../support/inbox';
import { MailpitInbox } from '../support/mailpit';
import { SimulatedCheckout } from '../support/simulated-payment';

/** Per-scenario state shared between steps. Extend as new steps need it. */
export type ScenarioContext = {
  response?: APIResponse;
  /** Synthetic data by the alias the Gherkin gives it (`"Paid story"`). */
  entities: Map<string, Entity>;
  /** Alias of the article the reader has open. */
  currentArticle?: string;
};

type TestFixtures = {
  ctx: ScenarioContext;
  /** Skips the scenario when a capability tag (@mutating, @mail, …) is not configured. */
  capabilities: void;
  /** Creates synthetic data through the API and deletes it after the scenario. */
  data: TestData;
  inbox: Inbox;
  checkout: SimulatedCheckout;
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
    await use({ entities: new Map() });
  },

  capabilities: [
    async ({ $tags }, use, testInfo) => {
      const missing = missingCapabilities($tags);

      if (!testInfo.project.use.baseURL) {
        missing.push(`no ${testInfo.project.name} URL for this target`);
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

  checkout: async ({ page }, use) => {
    await use(new SimulatedCheckout(page));
  },
});

export const { Given, When, Then } = createBdd(test);
