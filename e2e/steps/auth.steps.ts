import { expect } from '@playwright/test';
import {
  ApiClient,
  createSession,
  websiteSessionCookie,
} from '../support/api-client';
import { Given, Then, When } from './fixtures';

// Shared website copy (libs/website/translations, de + fr), not tenant copy.
const emailField = /^e-?mail$/i;
const loginWithLink = /Mit Link einloggen|Se connecter avec un lien/i;

Given('a reader {string}', async ({ data }, alias: string) => {
  await data.ensureSystemMail('LOGIN_LINK', 'seed-login-link');
  await data.createUser(alias);
});

Given(
  'a signed-in reader {string}',
  async ({ data, request, context, baseURL }, alias: string) => {
    const reader = await data.createUser(alias);
    const session = await createSession(
      new ApiClient(request),
      reader.email,
      reader.password
    );

    await context.addCookies([
      websiteSessionCookie(session, baseURL ?? ''),
    ]);
  }
);

When(
  '{string} requests a login link on the login page',
  async ({ page, data }, alias: string) => {
    const reader = data.get('reader', alias);

    await page.goto('/login');
    await page.getByRole('textbox', { name: emailField }).fill(reader.email);
    await page.getByRole('button', { name: loginWithLink }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: reader.email })
    ).toBeVisible();
  }
);

When(
  '{string} follows the login link from the email',
  async ({ page, data, inbox }, alias: string) => {
    const reader = data.get('reader', alias);
    const mail = await inbox.waitForMail({ to: reader.email });
    const link = new URL(inbox.extractLink(mail, /\/login\?jwt=/));

    // The API builds the link from its WEBSITE_URL; stay on the site under test.
    await page.goto(`${link.pathname}${link.search}`);
  }
);

Then(
  '{string} is signed in and sees their profile',
  async ({ page, data }, alias: string) => {
    const reader = data.get('reader', alias);

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('textbox', { name: emailField })).toHaveValue(
      reader.email
    );
  }
);
