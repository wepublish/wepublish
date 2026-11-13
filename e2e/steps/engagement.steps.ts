import { expect, Page } from '@playwright/test';
import { EngagementRule } from '../support/factories';
import { Given, Then, When } from './fixtures';

// Shared website copy (libs/website/translations, de + fr), not tenant copy.
const emailField = /^e-?mail$/i;
const passwordField = /^(passwort|mot de passe)$/i;
const loginWithPassword = /Mit Passwort einloggen|Se connecter avec un mot de passe/i;
const submitLogin = /^(Einloggen|Se connecter)$/i;

/** The prompt of a rule, found by the unique title its stage shows. */
const promptOf = (page: Page, rule: EngagementRule) =>
  page.locator('section').filter({ has: page.getByText(rule.title) });

Given(
  'a registration wall {string} after {int} free articles',
  async ({ data }, alias: string, freeArticles: number) => {
    await data.createRegistrationWall({ alias, freeArticles });
  }
);

Given(
  'the articles {string}, {string} and {string}',
  async ({ data }, first: string, second: string, third: string) => {
    for (const alias of [first, second, third]) {
      await data.createArticle({ alias });
    }
  }
);

Given('a page {string}', async ({ data }, alias: string) => {
  await data.createPage(alias);
});

Then(
  'the registration wall {string} cuts the article off',
  async ({ page, data, ctx }, alias: string) => {
    const rule = data.get('engagementRule', alias);
    const article = data.get('article', ctx.currentArticle ?? '');

    await expect(promptOf(page, rule)).toBeVisible();
    // Cut on the server: the ending is not in the page at all, not just hidden.
    await expect(page.getByText(article.ending)).toHaveCount(0);
  }
);

When(
  '{string} signs in with their password from the registration wall',
  async ({ page, data, ctx }, alias: string) => {
    const reader = data.get('reader', alias);
    const article = data.get('article', ctx.currentArticle ?? '');
    const rule = [...ctx.entities.values()].find(
      (entity): entity is EngagementRule => entity.kind === 'engagementRule'
    );

    if (!rule) {
      throw new Error('No registration wall in this scenario.');
    }

    await promptOf(page, rule)
      .getByRole('link', { name: `Sign in ${rule.name}` })
      .click();

    await page.getByRole('textbox', { name: emailField }).fill(reader.email);
    await page.getByRole('button', { name: loginWithPassword }).click();
    await page.getByLabel(passwordField).fill(reader.password);
    await page.getByRole('button', { name: submitLogin }).click();

    // The wall remembered the article, so the login leads back to it.
    await expect(page).toHaveURL(new RegExp(`${article.path}$`));
  }
);
