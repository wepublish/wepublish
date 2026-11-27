import { base, de_CH, en, Faker } from '@faker-js/faker';
import { ApiClient } from './api-client';
import { inPool, retryTransient } from './load';
import { MailLog } from './mail-logs';
import { MAIL_PROVIDER_FIELDS, MailProviderSetting, smtpRestore } from './mail-provider';
import { Flow, FlowQuery, flowFor } from './subscription-flows';

export type PostalAddress = {
  streetAddress: string;
  streetAddressNumber?: string;
  zipCode: string;
  city: string;
  country: string;
};

/** A Pingen account used in its staging environment only. */
export type PingenTestAccount = {
  clientId: string;
  clientSecret: string;
  organisationId: string;
};

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

/** An API key («API-Schlüssel», `wep_…`) and the user who created it. */
export type ApiKey = {
  kind: 'apiKey';
  id: string;
  name: string;
  token: string;
  creator: Reader;
};

export type AuditLogEntry = {
  mutation: string;
  tokenName: string | null;
  userId: string | null;
  userEmail: string | null;
  success: boolean;
};

export type Entity = Reader | Article | Paywall | ApiKey;

export type PeriodicJobRun = {
  id: string;
  running: boolean;
  successfullyFinished: string | null;
  finishedWithError: string | null;
  error: string | null;
};

export type ApiProcessStats = {
  hostname: string;
  uptimeSeconds: number;
  rssBytes: number;
  heapUsedBytes: number;
  externalBytes: number;
};

type Cleanup = { label: string; run: () => Promise<unknown> };

/** How many calls bulk creation and cleanup send at once. */
export const BULK_POOL = 10;

export class TestData {
  private readonly cleanups: Cleanup[] = [];
  private readonly memberPlans = new Map<string, MemberPlan>();
  /** Users a step deleted on purpose; their cleanup has nothing left to do. */
  private readonly deletedUsers = new Set<string>();
  /** The role a user created by `createStaff` holds, by user id. */
  private readonly staffRoles = new Map<string, string>();

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

  /**
   * `emailDomain`: a mailbox outside servers can deliver to, e.g. the Resend
   * domain. `localPart` replaces the run id before the `@`. `cleanup: false`
   * leaves deleting to the caller, e.g. {@link deleteAfterwards} for many.
   */
  async createUser(
    alias?: string,
    {
      emailDomain = 'example.test',
      localPart,
      address,
      cleanup = true,
      roleIDs = [] as string[],
    }: {
      emailDomain?: string;
      localPart?: string;
      address?: PostalAddress;
      cleanup?: boolean;
      roleIDs?: string[];
    } = {}
  ) {
    const api = await this.api();
    const firstName = this.faker.person.firstName();
    const name = this.faker.person.lastName();
    const password = `${this.faker.internet.password({ length: 16 })}-Aa1`;
    const email = `${localPart ?? `e2e+${this.runId()}`}@${emailDomain}`;

    const { createUser } = await api.gql<{ createUser: { id: string } }>(
      `mutation CreateUser($email: String!, $firstName: String, $name: String!, $password: String, $address: UserAddressInput, $roleIDs: [String!]!) {
        createUser(email: $email, firstName: $firstName, name: $name, password: $password,
          address: $address, active: true, emailVerifiedAt: "${new Date().toISOString()}",
          properties: [], roleIDs: $roleIDs, skipMail: true) { id }
      }`,
      { email, firstName, name, password, address, roleIDs }
    );

    if (cleanup) {
      this.onCleanup(`user ${email}`, async () => {
        if (!this.deletedUsers.has(createUser.id)) {
          await this.deleteUser(createUser.id);
        }
      });
    }

    return this.remember(alias, {
      kind: 'reader',
      id: createUser.id,
      email,
      password,
      firstName,
      name,
    } satisfies Reader);
  }

  /** A run id for many entities at once, e.g. the load test's readers. */
  newRunId() {
    return this.runId();
  }

  /** A synthetic Swiss postal address (a payment slip needs one). */
  swissAddress(): PostalAddress {
    return {
      streetAddress: this.faker.location.street(),
      streetAddressNumber: this.faker.location.buildingNumber(),
      zipCode: String(this.faker.number.int({ min: 1000, max: 9658 })),
      city: this.faker.location.city(),
      country: 'Schweiz',
    };
  }

  /**
   * Deletes many readers after the scenario, a few at a time: one by one,
   * 1500 readers would take longer than the scenario itself. Takes the
   * readers when the cleanup runs, so the caller may still add to the array.
   * `keep` leaves them, e.g. to look at them in the editor.
   */
  deleteAfterwards(readers: Reader[], { keep = false } = {}) {
    this.onCleanup('bulk readers', async () => {
      if (keep) {
        console.warn(`[e2e] kept ${readers.length} readers (${readers[0]?.email} …)`);
        return;
      }

      const failed: string[] = [];

      await inPool(readers, BULK_POOL, reader =>
        retryTransient(() => this.deleteUser(reader.id)).catch(error => {
          // A dropped delete went through after all: the retry finds nothing.
          if (/No record was found for a delete/.test((error as Error).message)) {
            return;
          }

          failed.push(`${reader.email}: ${(error as Error).message}`);
        })
      );

      if (failed.length) {
        throw new Error(`${failed.length} not deleted, first: ${failed[0]}`);
      }
    });
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

  /**
   * A user with a role of their own holding exactly `permissionIDs`, so a step
   * can take a permission away from them alone (`setStaffPermissions`).
   */
  async createStaff(alias: string, permissionIDs: string[]) {
    const api = await this.api();
    const { createUserRole } = await api.gql<{ createUserRole: { id: string } }>(
      `mutation CreateRole($name: String!, $permissionIDs: [String!]!) {
        createUserRole(name: $name, permissionIDs: $permissionIDs) { id }
      }`,
      { name: this.runId(), permissionIDs }
    );

    // Registered first, so it runs after the user is gone.
    this.onCleanup(`role ${createUserRole.id}`, () =>
      api.gql(`mutation { deleteUserRole(id: "${createUserRole.id}") { id } }`)
    );

    const staff = await this.createUser(alias, { roleIDs: [createUserRole.id] });
    this.staffRoles.set(staff.id, createUserRole.id);

    return staff;
  }

  async setStaffPermissions(staff: Reader, permissionIDs: string[]) {
    const api = await this.api();
    const roleId = this.staffRoles.get(staff.id);

    if (!roleId) {
      throw new Error(`${staff.email} was not created with createStaff.`);
    }

    await api.gql(
      `mutation UpdateRole($id: String!, $permissionIDs: [String!]) {
        updateUserRole(id: $id, permissionIDs: $permissionIDs) { id }
      }`,
      { id: roleId, permissionIDs }
    );
  }

  async setUserActive(user: Reader, active: boolean) {
    const api = await this.api();

    await api.gql(
      `mutation SetActive($id: String, $active: Boolean) { updateUser(id: $id, active: $active) { id } }`,
      { id: user.id, active }
    );
  }

  /** Deletes a user as part of the journey, not as cleanup. */
  async deleteUserNow(user: Reader) {
    this.deletedUsers.add(user.id);
    await this.deleteUser(user.id);
  }

  /**
   * An API key the user creates for themself, as in the editor. It runs out
   * after a day; cleanup revokes it while its creator still exists.
   */
  async createApiKey(alias: string, creator: Reader, scopes: string[]) {
    const asCreator = await (await this.api()).as(creator.email, creator.password);
    const name = `${alias} ${this.runId()}`;
    const { createApiToken } = await asCreator.gql<{
      createApiToken: { token: string; apiToken: { id: string } };
    }>(
      `mutation CreateKey($name: String!, $scopes: [String!]!, $expiresAt: DateTime!) {
        createApiToken(name: $name, scopes: $scopes, expiresAt: $expiresAt) { token apiToken { id } }
      }`,
      { name, scopes, expiresAt: new Date(Date.now() + 86_400_000).toISOString() }
    );
    const id = createApiToken.apiToken.id;

    this.onCleanup(`api key ${name}`, async () => {
      if (!this.deletedUsers.has(creator.id)) {
        const again = await (await this.api()).as(creator.email, creator.password);
        await again.gql(`mutation { revokeApiToken(id: "${id}") { id } }`);
      }
    });

    return this.remember(alias, {
      kind: 'apiKey',
      id,
      name,
      token: createApiToken.token,
      creator,
    } satisfies ApiKey);
  }

  /** A client that authenticates with the API key, as an integration would. */
  async withApiKey(key: ApiKey) {
    return (await this.api()).withToken(key.token);
  }

  /** What the creator's key list says about the key (`creatorState`). */
  async apiKeyCreatorState(key: ApiKey) {
    const asCreator = await (await this.api()).as(key.creator.email, key.creator.password);
    const { apiTokens } = await asCreator.gql<{
      apiTokens: {
        nodes: {
          id: string;
          creatorState: { state: string; blockedReason: string | null; missingScopes: string[] };
        }[];
      };
    }>(`query { apiTokens(take: 50) { nodes { id creatorState { state blockedReason missingScopes } } } }`);
    const listed = apiTokens.nodes.find(({ id }) => id === key.id);

    if (!listed) {
      throw new Error(`The key list of ${key.creator.email} does not show ${key.name}.`);
    }

    return listed.creatorState;
  }

  /** Who the invoice says marked it as paid. */
  async invoicePaidBy(invoiceId: string) {
    const api = await this.api();
    const { invoice } = await api.gql<{
      invoice: {
        paidAt: string | null;
        manuallySetAsPaidByUserId: string | null;
        manuallySetAsPaidByApiTokenId: string | null;
      };
    }>(
      `query Invoice($id: String!) {
        invoice(id: $id) { paidAt manuallySetAsPaidByUserId manuallySetAsPaidByApiTokenId }
      }`,
      { id: invoiceId }
    );

    return invoice;
  }

  /** The audit log entries an API key left for one mutation, newest first. */
  async auditLogOf(key: ApiKey, mutation: string) {
    const api = await this.api();
    const { auditLogs } = await api.gql<{ auditLogs: { nodes: AuditLogEntry[] } }>(
      `query AuditLogs($filter: AuditLogFilter) {
        auditLogs(filter: $filter, take: 10) { nodes { mutation tokenName userId userEmail success } }
      }`,
      { filter: { sessionId: key.id, mutation } }
    );

    return auditLogs.nodes;
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
    // Admins may put a subscription on a method the plan does not offer in
    // the checkout (Neue Wege: bexio, for readers who pay by invoice).
    const paymentMethod =
      plan.paymentMethods.find(({ slug }) => slug === paymentMethodSlug) ??
      (await this.paymentMethod(paymentMethodSlug));

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

    return {
      id: createSubscription.id,
      memberPlanId: plan.id,
      paymentMethodId: paymentMethod.id,
      periodicity: 'yearly',
      autoRenew: true,
    } satisfies FlowQuery & { id: string };
  }

  /**
   * A subscription that ran a year and ends on `paidUntil`, paid, without a
   * mail: what the import of a medium's existing members creates. The nightly
   * run bills it once `paidUntil` is as near as its invoice-creation event.
   * Deleted with the reader.
   */
  async importDueSubscription({
    reader,
    flow,
    paidUntil,
  }: {
    reader: Reader;
    flow: FlowQuery;
    paidUntil: Date;
  }) {
    const api = await this.api();
    const startsAt = new Date(paidUntil);
    startsAt.setFullYear(startsAt.getFullYear() - 1);

    const { importSubscription } = await api.gql<{ importSubscription: { id: string } }>(
      `mutation ImportSubscription($userID: String!, $memberPlanID: String!, $paymentMethodID: String!, $startsAt: DateTime!, $paidUntil: DateTime) {
        importSubscription(userID: $userID, memberPlanID: $memberPlanID, paymentMethodID: $paymentMethodID,
          startsAt: $startsAt, paidUntil: $paidUntil, monthlyAmount: 1000, paymentPeriodicity: yearly,
          autoRenew: true, extendable: true, properties: [], skipMail: true) { id }
      }`,
      {
        userID: reader.id,
        memberPlanID: flow.memberPlanId,
        paymentMethodID: flow.paymentMethodId,
        startsAt: startsAt.toISOString(),
        paidUntil: paidUntil.toISOString(),
      }
    );

    return { ...flow, id: importSubscription.id };
  }

  /** The reader's first subscription, e.g. one a dropped call created after all. */
  async subscriptionOf(reader: Reader, flow: FlowQuery) {
    const api = await this.api();
    const { subscriptions } = await api.gql<{ subscriptions: { nodes: { id: string }[] } }>(
      `query ReaderSubscriptions($userID: String!) {
        subscriptions(filter: { userID: $userID }, take: 1) { nodes { id } }
      }`,
      { userID: reader.id }
    );
    const [subscription] = subscriptions.nodes;

    return subscription && { ...flow, id: subscription.id };
  }

  /** What picks the subscription flow of a yearly, auto-renewing subscription. */
  async flowQuery(memberPlanSlug: string, paymentMethodSlug: string): Promise<FlowQuery> {
    const plan = await this.memberPlan(memberPlanSlug);
    const paymentMethod =
      plan.paymentMethods.find(({ slug }) => slug === paymentMethodSlug) ??
      (await this.paymentMethod(paymentMethodSlug));

    return {
      memberPlanId: plan.id,
      paymentMethodId: paymentMethod.id,
      periodicity: 'yearly',
      autoRenew: true,
    };
  }

  /** The invoice-creation interval of the flow the API applies to the subscription. */
  async invoiceCreationInterval(subscription: FlowQuery) {
    const api = await this.api();
    const { subscriptionFlows } = await api.gql<{ subscriptionFlows: Flow[] }>(
      `query { subscriptionFlows(defaultFlowOnly: false) {
        id default memberPlan { id } paymentMethods { id } periodicities autoRenewal
        intervals { id event daysAwayFromEnding sendAsLetter mailTemplate { id } }
      } }`
    );
    const flow = flowFor(subscriptionFlows, subscription);
    const interval = flow.intervals.find(({ event }) => event === 'INVOICE_CREATION');

    if (!interval?.mailTemplate) {
      throw new Error(
        `Subscription flow ${flow.id} has no invoice-creation mail template, so nothing would be sent.`
      );
    }

    return interval;
  }

  /**
   * Runs today's nightly job again now (review, development and local only).
   * Answers once the run started; it goes on in the background.
   */
  async runPeriodicJobNow() {
    const api = await this.api();
    const { runPeriodicJobNow } = await api.gql<{ runPeriodicJobNow: { id: string } }>(
      `mutation { runPeriodicJobNow { id } }`
    );

    return runPeriodicJobNow;
  }

  /** A run of the nightly job from its log, by id; undefined once older than the last 10. */
  async periodicJobRun(id: string) {
    const api = await this.api();
    const { periodicJobLog } = await api.gql<{ periodicJobLog: PeriodicJobRun[] }>(
      `query { periodicJobLog(take: 10) { id running successfullyFinished finishedWithError error } }`
    );

    return periodicJobLog.find(run => run.id === id);
  }

  /** Memory and uptime of the API process that answers (review, development and local only). */
  async apiProcessStats() {
    const api = await this.api();
    const { apiProcessStats } = await api.gql<{ apiProcessStats: ApiProcessStats }>(
      `query { apiProcessStats { hostname uptimeSeconds rssBytes heapUsedBytes externalBytes } }`
    );

    return apiProcessStats;
  }

  /**
   * Marks the subscription's open invoices as paid without a mail, e.g. the
   * one a new subscription starts with, so it can be renewed.
   */
  async payOpenInvoices(subscriptionId: string) {
    const api = await this.api();

    for (let open = await this.findOpenInvoice(subscriptionId); open; open = await this.findOpenInvoice(subscriptionId)) {
      await api.gql(
        `mutation MarkPaid($id: String!) { markInvoiceAsPaid(id: $id, sendMail: false) { id } }`,
        { id: open.id }
      );
    }
  }

  /**
   * Renews the subscription as an editor does, and returns the new invoice.
   * With the feature `editor-renewal-provider-invoice` this is the nightly
   * job's handling: the payment provider's invoice and the invoice-creation
   * mail or letter.
   */
  async renewSubscription(subscriptionId: string) {
    const api = await this.api();

    await api.gql(`mutation Renew($id: String!) { renewSubscription(id: $id) { id } }`, {
      id: subscriptionId,
    });

    const renewed = await this.findOpenInvoice(subscriptionId);

    if (!renewed) {
      throw new Error(`Renewing subscription ${subscriptionId} left no open invoice.`);
    }

    return renewed;
  }

  /** The features switched on for the target's medium (One or WEP_FEATURES). */
  async features() {
    const api = await this.api();
    const { features } = await api.gql<{ features: string[] }>(`query { features }`);

    return features;
  }

  /** The reader's postal address; `country` is the German name the profile form stores, e.g. `Schweiz`. */
  async setAddress(reader: Reader, address: PostalAddress) {
    const api = await this.api();

    await api.gql(
      `mutation SetAddress($id: String, $address: UserAddressInput) {
        updateUser(id: $id, address: $address) { id }
      }`,
      { id: reader.id, address }
    );
  }

  /** Letters or mails for this reader; goes with the reader when it is deleted. */
  async setDeliveryMode(reader: Reader, channel: 'mail' | 'letter') {
    const api = await this.api();
    const { setUserDeliveryMode } = await api.gql<{
      setUserDeliveryMode: { channel: string; canReceiveLetters: boolean };
    }>(
      `mutation SetDeliveryMode($userId: String!, $channel: MailChannel!) {
        setUserDeliveryMode(userId: $userId, channel: $channel, reason: "e2e") { channel canReceiveLetters }
      }`,
      { userId: reader.id, channel }
    );

    return setUserDeliveryMode;
  }

  /**
   * Changes settings of the payment provider behind a payment method for the
   * scenario and puts the values it read back afterwards. The provider is
   * shared: scenarios that change it belong in one `@mode:serial` feature.
   */
  async withPaymentProviderSettings(
    paymentMethodSlug: string,
    settings: Partial<Record<'bexio_invoiceMailByWePublish', boolean>>
  ) {
    const api = await this.api();
    const { paymentProviderID } = await this.paymentMethod(paymentMethodSlug);
    const fields = Object.keys(settings).join(' ');
    const { paymentProviderSetting } = await api.gql<{
      paymentProviderSetting: Record<string, unknown>;
    }>(`query Setting($id: String!) { paymentProviderSetting(id: $id) { ${fields} } }`, {
      id: paymentProviderID,
    });

    const update = (values: Record<string, unknown>) =>
      api
        .gql(
          `mutation UpdateSetting(${Object.keys(values)
            .map(key => `$${key}: Boolean`)
            .join(', ')}, $id: String) {
            updatePaymentProviderSetting(id: $id, ${Object.keys(values)
              .map(key => `${key}: $${key}`)
              .join(', ')}) { id }
          }`,
          { id: paymentProviderID, ...values }
        )
        .then(() => this.reloadProviders());

    await update(settings);
    this.onCleanup(`payment provider ${paymentProviderID} settings`, () =>
      update(
        Object.fromEntries(
          Object.keys(settings).map(key => [key, paymentProviderSetting[key] ?? false])
        )
      )
    );
  }

  /**
   * Has the subscription flow the API applies to this subscription send its
   * invoice-creation event as a letter (to readers in letter mode), and
   * switches it back afterwards. Shared like the payment provider.
   */
  async withInvoiceCreationAsLetter(subscription: FlowQuery) {
    const api = await this.api();
    const interval = await this.invoiceCreationInterval(subscription);

    if (interval.sendAsLetter) {
      return;
    }

    // The API drops the template unless the update names it again.
    const update = (sendAsLetter: boolean) =>
      api.gql(
        `mutation UpdateInterval($id: String!, $mailTemplateId: String, $daysAwayFromEnding: Int, $sendAsLetter: Boolean) {
          updateSubscriptionInterval(id: $id, mailTemplateId: $mailTemplateId,
            daysAwayFromEnding: $daysAwayFromEnding, sendAsLetter: $sendAsLetter) { id }
        }`,
        {
          id: interval.id,
          mailTemplateId: interval.mailTemplate?.id,
          daysAwayFromEnding: interval.daysAwayFromEnding,
          sendAsLetter,
        }
      );

    await update(true);
    this.onCleanup(`invoice-creation interval ${interval.id}`, () => update(false));
  }

  /**
   * Switches the tenant's mail provider to LOG for the scenario: mails are
   * composed, attachments included, and logged instead of sent. Puts the SMTP
   * provider back afterwards, its password from `mailbox` (the IMAP login,
   * which on Ethereal is the SMTP login too). Refuses a provider it could not
   * put back. Shared, like the payment provider.
   */
  async withLoggedMails(mailbox: { user: string; password: string } | undefined) {
    const api = await this.api();
    const { mailProviderSettings } = await api.gql<{ mailProviderSettings: MailProviderSetting[] }>(
      `query { mailProviderSettings { ${MAIL_PROVIDER_FIELDS} } }`
    );
    const [provider] = mailProviderSettings;

    if (!provider) {
      throw new Error('The target has no mail provider.');
    }

    if (provider.type === 'LOG') {
      return;
    }

    const restore = smtpRestore(provider, mailbox);
    // A type change keeps only type and name, so it takes a second update.
    const update = (values: Record<string, unknown>) =>
      api.gql(
        `mutation UpdateMailProvider($id: String, $type: MailProviderType, $name: String, $fromAddress: String,
          $replyToAddress: String, $smtp_host: String, $smtp_port: Int, $smtp_secure: Boolean,
          $smtp_user: String, $apiKey: String) {
          updateMailProviderSetting(id: $id, type: $type, name: $name, fromAddress: $fromAddress,
            replyToAddress: $replyToAddress, smtp_host: $smtp_host, smtp_port: $smtp_port,
            smtp_secure: $smtp_secure, smtp_user: $smtp_user, apiKey: $apiKey) { id }
        }`,
        values
      );

    this.onCleanup(`mail provider ${provider.id} back to SMTP`, async () => {
      const { type, name, ...settings } = restore;

      await update({ id: restore.id, type, name });
      await update(settings);
      await this.reloadProviders();
    });

    await update({ id: provider.id, type: 'LOG', name: provider.name });
    await this.reloadProviders();
  }

  /**
   * Points the letter provider at Pingen's staging environment with the test
   * account, without sending letters on: nothing is ever printed. Kept
   * afterwards, as secrets cannot be read back to restore them.
   */
  async ensureLetterProviderStaging(pingen: PingenTestAccount) {
    const api = await this.api();
    const { letterProviderSettings } = await api.gql<{
      letterProviderSettings: {
        id: string;
        environment: string;
        autoSend: boolean;
        clientId: string | null;
        organisationId: string | null;
      }[];
    }>(`query { letterProviderSettings { id environment autoSend clientId organisationId } }`);
    const [provider] = letterProviderSettings;

    if (!provider) {
      throw new Error('The target has no letter provider to send the letter with.');
    }

    if (
      provider.environment === 'staging' &&
      !provider.autoSend &&
      provider.clientId === pingen.clientId &&
      provider.organisationId === pingen.organisationId
    ) {
      return;
    }

    await api.gql(
      `mutation PingenStaging($id: String, $clientId: String, $clientSecret: String, $organisationId: String) {
        updateLetterProviderSetting(id: $id, environment: staging, autoSend: false,
          clientId: $clientId, clientSecret: $clientSecret, organisationId: $organisationId) { id }
      }`,
      { id: provider.id, ...pingen }
    );
    await this.reloadProviders();
  }

  /** The reader's mail log on one channel, newest first. */
  async mailLogs(reader: Reader, channel: MailLog['channel']) {
    const api = await this.api();
    const { mailLogs } = await api.gql<{ mailLogs: { nodes: MailLog[] } }>(
      `query MailLogs($filter: MailLogFilter) {
        mailLogs(filter: $filter, take: 20) {
          nodes { id channel state sentDate address providerLetterID error }
        }
      }`,
      { filter: { recipientId: reader.id, channel } }
    );

    return mailLogs.nodes;
  }

  private async reloadProviders() {
    const api = await this.api();

    await api.gql(`mutation { reloadProviders }`);
  }

  async paymentMethod(slug: string) {
    const api = await this.api();
    const { paymentMethods } = await api.gql<{
      paymentMethods: {
        id: string;
        slug: string;
        name: string;
        active: boolean;
        paymentProviderID: string;
      }[];
    }>(`query { paymentMethods { id slug name active paymentProviderID } }`);
    const paymentMethod = paymentMethods.find(m => m.slug === slug && m.active);

    if (!paymentMethod) {
      throw new Error(`No active payment method "${slug}".`);
    }

    return paymentMethod;
  }

  /**
   * The subscription's open invoice. Creating a subscription already bills
   * its first period; only without one is it renewed, as the nightly job
   * would (the API refuses to renew while an invoice is open).
   */
  async openInvoice(subscriptionId: string) {
    return (await this.findOpenInvoice(subscriptionId)) ?? this.renewSubscription(subscriptionId);
  }

  private async findOpenInvoice(subscriptionId: string) {
    const api = await this.api();
    const { invoices } = await api.gql<{
      invoices: { nodes: { id: string; paidAt: string | null; canceledAt: string | null }[] };
    }>(
      `query Invoices($subscriptionID: String) {
        invoices(filter: { subscriptionID: $subscriptionID }, take: 10) { nodes { id paidAt canceledAt } }
      }`,
      { subscriptionID: subscriptionId }
    );

    return invoices.nodes.find(i => !i.paidAt && !i.canceledAt);
  }

  /**
   * What the website does when the reader pays an open invoice: as the
   * reader, start a payment with the given method. For bexio the provider
   * creates the invoice in bexio and has bexio email it.
   */
  async payInvoiceAs(reader: Reader, invoiceId: string, paymentMethodSlug: string) {
    const api = await (await this.api()).as(reader.email, reader.password);
    const { createPaymentFromInvoice } = await api.gql<{
      createPaymentFromInvoice: { id: string; state: string } | null;
    }>(
      `mutation Pay($input: PaymentFromInvoiceInput!) {
        createPaymentFromInvoice(input: $input) { id state }
      }`,
      { input: { invoiceID: invoiceId, paymentMethodSlug } }
    );

    if (!createPaymentFromInvoice) {
      throw new Error(`No payment for invoice ${invoiceId} with "${paymentMethodSlug}".`);
    }

    return createPaymentFromInvoice;
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
