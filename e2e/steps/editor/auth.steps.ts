import { expect } from '@playwright/test';
import { Then } from '../fixtures';

// Editor copy (apps/editor/src/app/locales, en + de + fr).
const emailField = /^e-?mail$/i;
const passwordField = /^(password|passwort|mot de passe)$/i;

Then('the editor asks for an email and a password', async ({ page }) => {
  await expect(page.getByRole('textbox', { name: emailField })).toBeVisible();
  await expect(page.getByLabel(passwordField)).toBeVisible();
});
