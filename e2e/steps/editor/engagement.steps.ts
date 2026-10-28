import {
  APIRequestContext,
  Browser,
  expect,
  Page,
} from '@playwright/test';
import {
  ApiClient,
  createSession,
  websiteSessionCookie,
} from '../../support/api-client';
import { env, target } from '../../support/env';
import {
  Reader,
  TestData,
  Page as WebsitePage,
} from '../../support/factories';
import { waitForOperation } from '../../support/graphql-traffic';
import { Given, Then, When } from '../fixtures';

const ENGAGEMENT_PATH = '/audience-engagement';

/**
 * A reader in a browser of their own, apart from the editor's session, that
 * opens the page and waits until the site asked for its prompts. Anonymous
 * unless `signedIn` names who it is.
 */
async function openAsReader(
  browser: Browser,
  page: WebsitePage,
  signedIn?: { reader: Reader; request: APIRequestContext }
) {
  if (!target.websiteUrl) {
    throw new Error('No website URL for this target.');
  }

  const context = await browser.newContext({ baseURL: target.websiteUrl });

  if (signedIn) {
    const session = await createSession(
      new ApiClient(signedIn.request),
      signedIn.reader.email,
      signedIn.reader.password
    );

    await context.addCookies([
      websiteSessionCookie(session, target.websiteUrl),
    ]);
  }

  const reader = await context.newPage();
  const prompts = waitForOperation(reader, 'EngagementPrompts');

  await reader.goto(page.path);
  await prompts;

  return { reader, close: () => context.close() };
}

/**
 * The editor keeps its session token in localStorage (`LocalStorageKey`) and
 * restores it with a `me` query, so a session of the admin is put there
 * before the editor loads. An API token is no user, so this needs
 * E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD outside the local stack. The language
 * is pinned to English, the copy the steps match.
 */
Given(
  'an editor signed in to the editor',
  async ({ context, request, baseURL }) => {
    const session = await createSession(
      new ApiClient(request),
      env.adminEmail,
      env.adminPassword
    );

    await context.addInitScript(
      ({ origin, token }) => {
        if (window.location.origin === origin) {
          window.localStorage.setItem('sessionToken', token);
          window.localStorage.setItem('i18nextLng', 'en');
        }
      },
      { origin: new URL(baseURL ?? '').origin, token: session.token }
    );
  }
);

/**
 * Sets up an announcement on one page through the form, confirms the summary
 * shown before saving and comes back to the list.
 */
async function announce(
  page: Page,
  data: TestData,
  alias: string,
  pageAlias: string,
  memberPlanSlug?: string
) {
  const websitePage = data.get('page', pageAlias);
  const rule = data.planEngagementRule(alias);

  await page.goto(`${ENGAGEMENT_PATH}/create`);
  await page.getByText('Display an announcement', { exact: true }).click();

  await page.getByLabel('Name', { exact: true }).fill(rule.name);
  await page.getByLabel('Active', { exact: true }).check();

  if (memberPlanSlug) {
    const plan = await data.memberPlan(memberPlanSlug);

    await page
      .getByLabel('Readers with a specific subscription')
      .check();
    await page.getByLabel('Member plans').fill(plan.name);
    await page.getByRole('option', { name: plan.name, exact: true }).click();
  }

  await page.getByLabel('Show on articles', { exact: true }).uncheck();
  await page.getByLabel('Show on pages').fill(websitePage.title);
  await page.getByRole('option', { name: websitePage.title }).click();
  await page.getByLabel('Title', { exact: true }).fill(rule.title);

  await page.getByRole('button', { name: 'Save & Close' }).click();

  // A new rule is summed up before it is saved, with a preview of its prompt.
  const review = page.getByRole('dialog');
  // The rule's name, then the title in the preview of its prompt.
  await expect(
    review.getByRole('heading', { name: rule.name, level: 5 })
  ).toBeVisible();
  await expect(
    review.getByRole('heading', { name: rule.title, level: 6 })
  ).toBeVisible();
  await review.getByRole('button', { name: 'Create rule' }).click();

  await expect(page).toHaveURL(new RegExp(`${ENGAGEMENT_PATH}$`));
  await expect(page.getByRole('link', { name: rule.name })).toBeVisible();

  rule.id = (await data.findEngagementRule(rule.name))?.id;
}

When(
  'the editor announces {string} on the page {string}',
  async ({ page, data }, alias: string, pageAlias: string) => {
    await announce(page, data, alias, pageAlias);
  }
);

When(
  'the editor announces {string} on the page {string} to members of the plan {string}',
  async ({ page, data }, alias: string, pageAlias: string, slug: string) => {
    await announce(page, data, alias, pageAlias, slug);
  }
);

Given(
  'an announcement {string} on the page {string}',
  async ({ data }, alias: string, pageAlias: string) => {
    await data.createAnnouncement({ alias, page: data.get('page', pageAlias) });
  }
);

Given(
  'a reader {string} with a subscription to the plan {string}',
  async ({ data }, alias: string, slug: string) => {
    const reader = await data.createUser(alias);

    await data.createSubscription({ reader, memberPlanSlug: slug });
  }
);

Then(
  'the editor is told that {string} competes with {string}',
  async ({ page, data }, alias: string, otherAlias: string) => {
    const rule = data.get('engagementRule', alias);
    const other = data.get('engagementRule', otherAlias);
    const row = page
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name: rule.name }) });

    await page.goto(ENGAGEMENT_PATH);
    await expect(row).toContainText(`Competes with “${other.name}”`);
  }
);

When(
  'the editor shows the rule {string} first',
  async ({ page, data }, alias: string) => {
    const rule = data.get('engagementRule', alias);

    await page.goto(ENGAGEMENT_PATH);
    await page.getByRole('link', { name: rule.name }).click();

    // Only offered while the rule competes with another one.
    await page.getByLabel('Show this first', { exact: true }).check();

    const saved = waitForOperation(page, 'UpdateEngagementRule');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await saved).ok()).toBe(true);
  }
);

Then(
  '{string} sees the announcement {string} on the page {string}',
  async (
    { browser, data, request },
    readerAlias: string,
    alias: string,
    pageAlias: string
  ) => {
    const rule = data.get('engagementRule', alias);
    const { reader, close } = await openAsReader(
      browser,
      data.get('page', pageAlias),
      { reader: data.get('reader', readerAlias), request }
    );

    try {
      await expect(reader.getByText(rule.title)).toBeVisible();
    } finally {
      await close();
    }
  }
);

When(
  'the editor switches off the rule {string}',
  async ({ page, data }, alias: string) => {
    const rule = data.get('engagementRule', alias);
    const toggle = page.getByRole('switch', { name: `Activate ${rule.name}` });

    await page.goto(ENGAGEMENT_PATH);
    await expect(toggle).toBeChecked();

    // The switch shows the saved rule, so it only flips once the update is back.
    const saved = waitForOperation(page, 'UpdateEngagementRule');
    await toggle.click();
    expect((await saved).ok()).toBe(true);
    await expect(toggle).not.toBeChecked();
  }
);

Then(
  'readers of the page {string} see the announcement {string}',
  async ({ browser, data }, pageAlias: string, alias: string) => {
    const rule = data.get('engagementRule', alias);
    const { reader, close } = await openAsReader(
      browser,
      data.get('page', pageAlias)
    );

    try {
      await expect(reader.getByText(rule.title)).toBeVisible();
    } finally {
      await close();
    }
  }
);

Then(
  'readers of the page {string} do not see the announcement {string}',
  async ({ browser, data }, pageAlias: string, alias: string) => {
    const rule = data.get('engagementRule', alias);
    const { reader, close } = await openAsReader(
      browser,
      data.get('page', pageAlias)
    );

    try {
      // The prompts arrived, so an absent banner is not just a slow one.
      await expect(reader.getByText(rule.title)).toHaveCount(0);
    } finally {
      await close();
    }
  }
);
