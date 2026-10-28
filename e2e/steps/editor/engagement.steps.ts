import { Browser, expect } from '@playwright/test';
import { ApiClient, createSession } from '../../support/api-client';
import { env, target } from '../../support/env';
import { Page as WebsitePage } from '../../support/factories';
import { waitForOperation } from '../../support/graphql-traffic';
import { Given, Then, When } from '../fixtures';

const ENGAGEMENT_PATH = '/audience-engagement';

/**
 * A reader in a browser of their own, apart from the editor's session, that
 * opens the page and waits until the site asked for its prompts.
 */
async function openAsReader(browser: Browser, page: WebsitePage) {
  if (!target.websiteUrl) {
    throw new Error('No website URL for this target.');
  }

  const context = await browser.newContext({ baseURL: target.websiteUrl });
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

When(
  'the editor announces {string} on the page {string}',
  async ({ page, data }, alias: string, pageAlias: string) => {
    const websitePage = data.get('page', pageAlias);
    const rule = data.planEngagementRule(alias);

    await page.goto(`${ENGAGEMENT_PATH}/create`);
    await page.getByText('Display an announcement', { exact: true }).click();

    await page.getByLabel('Name', { exact: true }).fill(rule.name);
    await page.getByLabel('Active', { exact: true }).check();
    await page.getByLabel('Show on articles', { exact: true }).uncheck();
    await page.getByLabel('Show on pages').fill(websitePage.title);
    await page.getByRole('option', { name: websitePage.title }).click();
    await page.getByLabel('Title', { exact: true }).fill(rule.title);

    await page.getByRole('button', { name: 'Save & Close' }).click();

    // A new rule is summed up before it is saved.
    const review = page.getByRole('dialog');
    await expect(review.getByText(rule.title)).toBeVisible();
    await review.getByRole('button', { name: 'Create rule' }).click();

    await expect(page).toHaveURL(new RegExp(`${ENGAGEMENT_PATH}$`));
    await expect(page.getByRole('link', { name: rule.name })).toBeVisible();

    rule.id = (await data.findEngagementRule(rule.name))?.id;
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
  'readers of the page {string} no longer see the announcement {string}',
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
