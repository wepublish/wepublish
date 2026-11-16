import { expect, Page } from '@playwright/test';
import { TestData } from '../support/factories';
import { env } from '../support/env';
import { Given, Then, When } from './fixtures';

// Shared website copy (libs/website/translations, de + fr), not tenant copy.
const save = /^(Speichern|Enregistrer)$/;
const saved =
  /Newsletter-Auswahl wurde gespeichert|choix de newsletters a été enregistré/;

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const checkboxOf = (page: Page, data: TestData, alias: string) =>
  page.getByRole('checkbox', {
    name: new RegExp(escapeRegExp(data.get('newsletter', alias).name)),
  });

/**
 * The newsletter choice has no landmark: the innermost element holding the
 * newsletter's checkbox and a save button (the personal data form has its own).
 */
const newslettersOf = (page: Page, data: TestData, alias: string) =>
  page
    .locator('div')
    .filter({ has: checkboxOf(page, data, alias) })
    .filter({ has: page.getByRole('button', { name: save }) })
    .last();

Given(
  'the newsletter {string} offered through Mailchimp',
  async ({ data, mailchimp: _audience }, alias: string) => {
    if (!env.mailchimp) {
      throw new Error('Tag the scenario with @mailchimp (see e2e/README.md).');
    }

    await data.offerMailchimpNewsletter(alias, env.mailchimp);
  }
);

When('{string} opens their profile', async ({ page }, _reader: string) => {
  await page.goto('/profile');
});

async function chooseNewsletter(
  page: Page,
  data: TestData,
  alias: string,
  subscribed: boolean
) {
  const checkbox = checkboxOf(page, data, alias);

  await checkbox.setChecked(subscribed);
  await newslettersOf(page, data, alias)
    .getByRole('button', { name: save })
    .click();
}

When(
  '{string} subscribes to the newsletter {string} in their profile',
  async ({ page, data }, _reader: string, alias: string) =>
    chooseNewsletter(page, data, alias, true)
);

When(
  '{string} unsubscribes from the newsletter {string} in their profile',
  async ({ page, data }, _reader: string, alias: string) =>
    chooseNewsletter(page, data, alias, false)
);

Then(
  '{string} sees that their newsletter choice was saved',
  async ({ page }, _reader: string) => {
    await expect(page.getByRole('alert').filter({ hasText: saved })).toBeVisible();
  }
);

Then(
  '{string} is subscribed to the newsletter {string}',
  async ({ page, data }, _reader: string, alias: string) => {
    await expect(checkboxOf(page, data, alias)).toBeChecked();
  }
);

Then(
  '{string} is not subscribed to the newsletter {string}',
  async ({ page, data }, _reader: string, alias: string) => {
    const checkbox = checkboxOf(page, data, alias);

    // visible first: an absent checkbox would pass `not.toBeChecked`
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
  }
);
