import { base, de_CH, en, Faker } from '@faker-js/faker';
import { ApiClient } from './api-client';

/**
 * Synthetic test data, created through the GraphQL API and deleted again after
 * the scenario. Every entity carries a `runId`
 * (`e2e-<yyyymmddhhmmss>-w<worker>-<n>`) in its slug/name/email, so stale data
 * from an aborted run is easy to find (`e2e+` users, `e2e-` slugs).
 */

const runStamp = new Date()
  .toISOString()
  .replace(/[^0-9]/g, '')
  .slice(0, 14);
let sequence = 0;

export const nextRunId = (workerIndex: number) =>
  `e2e-${runStamp}-w${workerIndex}-${++sequence}`;

/** Same scenario, same names: faker is seeded from the test title. */
export function seededFaker(seed: string) {
  let hash = 0x811c9dc5;

  for (const char of seed) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0;
  }

  const faker = new Faker({ locale: [de_CH, en, base] });
  faker.seed(hash);

  return faker;
}

/** ProseMirror document as the RichText scalar expects it. */
export const richText = (...paragraphs: string[]) => ({
  type: 'doc',
  content: paragraphs.map(text => ({
    type: 'paragraph',
    content: [{ type: 'text', text }],
  })),
});

export type Reader = {
  kind: 'reader';
  id: string;
  email: string;
  password: string;
  firstName: string;
  name: string;
};

export type Article = {
  kind: 'article';
  id: string;
  slug: string;
  title: string;
  /** Path on the website, resolved against BASE_URL. */
  path: string;
  /** Text of the last block, only visible when the article is not cut off. */
  ending: string;
  paywall?: Paywall;
};

export type Paywall = {
  kind: 'paywall';
  id: string;
  /** Unique text the paywall shows, used to find it on the page. */
  description: string;
};

export type MemberPlan = {
  id: string;
  name: string;
  slug: string;
  paymentMethods: { id: string; slug: string; name: string }[];
};

export type Entity = Reader | Article | Paywall;

type Cleanup = { label: string; run: () => Promise<unknown> };

export class TestData {
  private readonly cleanups: Cleanup[] = [];
  private readonly memberPlans = new Map<string, MemberPlan>();

  constructor(
    private readonly api: () => Promise<ApiClient>,
    private readonly faker: Faker,
    private readonly runId: () => string,
    private readonly entities: Map<string, Entity>
  ) {}

  /** Looks up an entity a previous step created under `alias`. */
  get<K extends Entity['kind']>(kind: K, alias: string) {
    const entity = this.entities.get(alias);

    if (entity?.kind !== kind) {
      throw new Error(
        `No ${kind} "${alias}" in this scenario. Add a Given step that creates it.`
      );
    }

    return entity as Extract<Entity, { kind: K }>;
  }

  private remember<E extends Entity>(alias: string | undefined, entity: E) {
    if (alias) {
      this.entities.set(alias, entity);
    }

    return entity;
  }

  private onCleanup(label: string, run: () => Promise<unknown>) {
    this.cleanups.push({ label, run });
  }

  /** Deletes everything in reverse creation order; never throws. */
  async cleanup() {
    const failed: string[] = [];

    for (const { label, run } of this.cleanups.reverse()) {
      try {
        await run();
      } catch (error) {
        failed.push(`${label}: ${(error as Error).message}`);
      }
    }

    if (failed.length) {
      console.warn(`[e2e] could not clean up:\n  ${failed.join('\n  ')}`);
    }
  }

  async createUser(alias?: string) {
    const api = await this.api();
    const runId = this.runId();
    const firstName = this.faker.person.firstName();
    const name = this.faker.person.lastName();
    const password = `${this.faker.internet.password({ length: 16 })}-Aa1`;
    const email = `e2e+${runId}@example.test`;

    const { createUser } = await api.gql<{ createUser: { id: string } }>(
      `mutation CreateUser($email: String!, $firstName: String, $name: String!, $password: String) {
        createUser(email: $email, firstName: $firstName, name: $name, password: $password,
          active: true, emailVerifiedAt: "${new Date().toISOString()}",
          properties: [], roleIDs: [], skipMail: true) { id }
      }`,
      { email, firstName, name, password }
    );

    this.onCleanup(`user ${email}`, () => this.deleteUser(createUser.id));

    return this.remember(alias, {
      kind: 'reader',
      id: createUser.id,
      email,
      password,
      firstName,
      name,
    } satisfies Reader);
  }

  /**
   * Registration needs a captcha. A freshly seeded stack has the Turnstile
   * provider without keys, so the challenge query fails; it then gets
   * Cloudflare's always-pass test keys and keeps them. Configured keys are
   * never touched.
   */
  async ensureChallengeKeys(providerId = 'turnstile') {
    const api = await this.api();
    const configured = await api
      .gql<{ challenge: { challengeID: string } }>(
        `query { challenge { challengeID } }`
      )
      .then(({ challenge }) => !!challenge.challengeID)
      .catch(() => false);

    if (configured) {
      return;
    }

    await api.gql(
      `mutation UpdateChallengeKeys($id: String, $siteKey: String, $secret: String) {
        updateChallengeProviderSetting(id: $id, siteKey: $siteKey, secret: $secret) { id }
      }`,
      {
        id: providerId,
        siteKey: '1x00000000000000000000AA',
        secret: '1x0000000000000000000000000000000AA',
      }
    );
  }

  /**
   * Subscriptions do not cascade with the user, so they go first. Their
   * invoices stay behind (mail `e2e+…`): subscription periods outlive the
   * subscription and block deleting them, and the API cannot delete periods.
   */
  private async deleteUser(userID: string) {
    const api = await this.api();
    const { subscriptions } = await api.gql<{
      subscriptions: { nodes: { id: string }[] };
    }>(
      `query UserSubscriptions($userID: String!) {
        subscriptions(filter: { userID: $userID }, take: 100) { nodes { id } }
      }`,
      { userID }
    );

    for (const { id } of subscriptions.nodes) {
      await api.gql(`mutation { deleteSubscription(id: "${id}") { id } }`);
    }

    await api.gql(`mutation { deleteUser(id: "${userID}") { id } }`);
  }

  async memberPlan(slug: string) {
    const cached = this.memberPlans.get(slug);

    if (cached) {
      return cached;
    }

    const api = await this.api();
    const { memberPlan } = await api.gql<{
      memberPlan: Omit<MemberPlan, 'paymentMethods'> & {
        availablePaymentMethods: { paymentMethods: MemberPlan['paymentMethods'] }[];
      };
    }>(
      `query MemberPlan($slug: Slug!) {
        memberPlan(slug: $slug) {
          id name slug
          availablePaymentMethods { paymentMethods { id slug name } }
        }
      }`,
      { slug }
    );

    const plan: MemberPlan = {
      id: memberPlan.id,
      name: memberPlan.name,
      slug: memberPlan.slug,
      paymentMethods: memberPlan.availablePaymentMethods.flatMap(
        ({ paymentMethods }) => paymentMethods
      ),
    };
    this.memberPlans.set(slug, plan);

    return plan;
  }

  async createPaywall({
    memberPlanSlugs,
    alias,
  }: {
    memberPlanSlugs: string[];
    alias?: string;
  }) {
    const api = await this.api();
    const runId = this.runId();
    const plans = await Promise.all(memberPlanSlugs.map(s => this.memberPlan(s)));
    const description = `Paywall ${runId}: ${this.faker.lorem.sentence()}`;

    const { createPaywall } = await api.gql<{ createPaywall: { id: string } }>(
      `mutation CreatePaywall($name: String, $description: RichText, $memberPlanIds: [String!]!) {
        createPaywall(name: $name, description: $description, circumventDescription: $description,
          memberPlanIds: $memberPlanIds, active: true, anyMemberPlan: false,
          bypassTokens: [], fadeout: false, hideContentAfter: 2) { id }
      }`,
      {
        name: runId,
        description: richText(description),
        memberPlanIds: plans.map(({ id }) => id),
      }
    );

    this.onCleanup(`paywall ${runId}`, () =>
      api.gql(`mutation { deletePaywall(id: "${createPaywall.id}") { id } }`)
    );

    return this.remember(alias, {
      kind: 'paywall',
      id: createPaywall.id,
      description,
    } satisfies Paywall);
  }

  async createArticle({
    alias,
    paywall,
  }: { alias?: string; paywall?: Paywall } = {}) {
    const api = await this.api();
    const runId = this.runId();
    const title = this.faker.lorem.sentence({ min: 3, max: 6 });
    const paragraphs = Array.from({ length: 3 }, () =>
      this.faker.lorem.paragraph()
    );
    const ending = `The end of ${runId}.`;

    const { createArticle } = await api.gql<{ createArticle: { id: string } }>(
      `mutation CreateArticle($slug: String, $title: String, $blocks: [BlockContentInput!]!, $paywallId: String) {
        createArticle(slug: $slug, title: $title, blocks: $blocks, paywallId: $paywallId,
          authors: [], breaking: false, disableComments: true, hidden: false, hideAuthor: true,
          properties: [], shared: false, socialMediaAuthorIds: [], tagIds: []) { id }
      }`,
      {
        slug: runId,
        title,
        paywallId: paywall?.id,
        blocks: [
          { title: { title, lead: this.faker.lorem.sentence() } },
          ...[...paragraphs, ending].map(text => ({
            richText: { richText: richText(text) },
          })),
        ],
      }
    );

    this.onCleanup(`article ${runId}`, () =>
      api.gql(`mutation { deleteArticle(id: "${createArticle.id}") }`)
    );

    const { publishArticle } = await api.gql<{
      publishArticle: { url: string };
    }>(
      `mutation PublishArticle($id: String!, $publishedAt: DateTime!) {
        publishArticle(id: $id, publishedAt: $publishedAt) { url }
      }`,
      {
        id: createArticle.id,
        publishedAt: new Date(Date.now() - 60_000).toISOString(),
      }
    );

    return this.remember(alias, {
      kind: 'article',
      id: createArticle.id,
      slug: runId,
      title,
      path: new URL(publishArticle.url).pathname,
      ending,
      paywall,
    } satisfies Article);
  }

  async createPaywalledArticle({
    alias,
    memberPlanSlugs,
  }: {
    alias?: string;
    memberPlanSlugs: string[];
  }) {
    const paywall = await this.createPaywall({ memberPlanSlugs });

    return this.createArticle({ alias, paywall });
  }

  /** An active subscription that skips checkout, e.g. for "existing member" journeys. */
  async createSubscription({
    reader,
    memberPlanSlug,
    paymentMethodSlug = 'simulated',
  }: {
    reader: Reader;
    memberPlanSlug: string;
    paymentMethodSlug?: string;
  }) {
    const api = await this.api();
    const plan = await this.memberPlan(memberPlanSlug);
    const paymentMethod = plan.paymentMethods.find(
      ({ slug }) => slug === paymentMethodSlug
    );

    if (!paymentMethod) {
      throw new Error(`Plan "${memberPlanSlug}" does not offer "${paymentMethodSlug}".`);
    }

    const { createSubscription } = await api.gql<{
      createSubscription: { id: string };
    }>(
      `mutation CreateSubscription($userID: String!, $memberPlanID: String!, $paymentMethodID: String!, $startsAt: DateTime!, $paidUntil: DateTime) {
        createSubscription(userID: $userID, memberPlanID: $memberPlanID, paymentMethodID: $paymentMethodID,
          startsAt: $startsAt, paidUntil: $paidUntil, monthlyAmount: 1000, paymentPeriodicity: yearly,
          autoRenew: true, extendable: true, properties: [], skipMail: true) { id }
      }`,
      {
        userID: reader.id,
        memberPlanID: plan.id,
        paymentMethodID: paymentMethod.id,
        startsAt: new Date().toISOString(),
        paidUntil: new Date(Date.now() + 365 * 86_400_000).toISOString(),
      }
    );

    // Deleted together with the reader; this covers readers created elsewhere.
    this.onCleanup(`subscription ${createSubscription.id}`, () =>
      api.gql(`mutation { deleteSubscription(id: "${createSubscription.id}") { id } }`)
    );

    return createSubscription;
  }

  /**
   * Real tenants assign a template to every system mail; a freshly seeded
   * stack has the templates (`seed-*`) but leaves them unassigned. Assigns
   * `fallbackTemplateId` only if nothing is assigned yet, and keeps it.
   */
  async ensureSystemMail(event: string, fallbackTemplateId: string) {
    const api = await this.api();
    const { systemMails } = await api.gql<{
      systemMails: { event: string; mailTemplate: { id: string } | null }[];
    }>(`query { systemMails { event mailTemplate { id } } }`);

    if (systemMails.find(mail => mail.event === event)?.mailTemplate) {
      return;
    }

    await api.gql(
      `mutation UpdateSystemMail($event: UserEvent!, $mailTemplateId: String) {
        updateSystemMail(event: $event, mailTemplateId: $mailTemplateId) { event }
      }`,
      { event, mailTemplateId: fallbackTemplateId }
    );
  }

  /**
   * The paywall links to `/mitmachen`, a CMS page with a subscribe block. Real
   * tenants have it; a freshly seeded stack does not, so it is created once and
   * kept, like seed data (removing it would break scenarios running in parallel).
   */
  async ensureSubscribePage(slug = 'mitmachen') {
    const api = await this.api();
    const exists = await api
      .gql(`query Page($slug: String) { page(slug: $slug) { id } }`, { slug })
      .then(() => true)
      .catch(() => false);

    if (exists) {
      return;
    }

    try {
      const { createPage } = await api.gql<{ createPage: { id: string } }>(
        `mutation CreatePage($slug: String) {
          createPage(slug: $slug, title: "Mitmachen", hidden: false, properties: [], tagIds: [],
            blocks: [{ subscribe: { memberPlanRenderSettings: [] } }]) { id }
        }`,
        { slug }
      );
      await api.gql(
        `mutation PublishPage($id: String!, $publishedAt: DateTime!) {
          publishPage(id: $id, publishedAt: $publishedAt) { id }
        }`,
        { id: createPage.id, publishedAt: new Date(Date.now() - 60_000).toISOString() }
      );
    } catch (error) {
      // Another worker created it in the meantime.
      if (!/unique|already/i.test((error as Error).message)) {
        throw error;
      }
    }
  }
}
