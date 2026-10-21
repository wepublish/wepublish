import { expect } from '@playwright/test';
import { Given, Then, When } from './fixtures';

Given('I open the homepage', async ({ page }) => {
  await page.goto('/');
});

Given('I open {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

Then('the page has a title', async ({ page }) => {
  await expect(page).toHaveTitle(/\S/);
});

Then('the page has a meta description', async ({ page }) => {
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /\S/
  );
});

When('I request {string}', async ({ request, ctx }, path: string) => {
  ctx.response = await request.get(path);
});

Then('the response status is {int}', async ({ ctx }, status: number) => {
  expect(ctx.response, 'no request was made in this scenario').toBeDefined();
  expect(ctx.response!.status()).toBe(status);
});
