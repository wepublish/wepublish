import { expect } from '@playwright/test';
import { target } from '../support/env';
import { subscribePlanOf } from '../support/targets';
import { Given, Then, When } from './fixtures';

// Shared website copy (libs/website/translations, de + fr), not tenant copy.
const discountCodeField = /^(Rabattcode|Code de réduction)$/i;
const discountCodeInvalid = /Rabattcode ungültig|Code de réduction invalide/i;

/** Kept like `/mitmachen`, its subscribe block shows the discount code field. */
const discountSubscribePage = 'e2e-rabattcode';

Given('a subscribe page that accepts discount codes', async ({ data }) => {
  await data.ensureSubscribePage(discountSubscribePage, {
    showDiscountCodes: true,
  });
});

Given(
  "a discount code {string} of {int}% for the tenant's subscribe plan that requires {int} referrals",
  async (
    { data },
    alias: string,
    discountPercent: number,
    minReferrals: number
  ) => {
    await data.createDiscountCode({
      alias,
      memberPlanSlug: subscribePlanOf(target.app),
      discountPercent,
      minReferrals,
    });
  }
);

When(
  "{string} enters the discount code {string} for the tenant's subscribe plan",
  async ({ readers, data, ctx }, reader: string, alias: string) => {
    const page = await readers.page(reader);
    const { code } = data.get('discountCode', alias);
    const plan = await data.memberPlan(subscribePlanOf(target.app));

    await page.goto(`/${discountSubscribePage}`);
    // The radio's name also holds price and description, so pick it by the
    // plan name inside its label (rendered twice, both select the plan).
    await page.getByText(plan.name, { exact: true }).first().click();

    // Every change asks the API again; wait for the answer to the whole code.
    const checked = page.waitForResponse(
      response =>
        !!response.request().postData()?.includes(code) &&
        response.request().postData()!.includes('createSubscriptionInfo')
    );
    await page.getByRole('textbox', { name: discountCodeField }).fill(code);
    await checked;
    ctx.currentReader = reader;
  }
);

Then(
  '{string} sees a discount of {int}% applied',
  async ({ readers }, reader: string, discountPercent: number) => {
    const page = await readers.page(reader);

    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: new RegExp(`${discountPercent}\\s?%`) })
    ).toBeVisible();
    await expect(
      page.getByRole('alert').filter({ hasText: discountCodeInvalid })
    ).toBeHidden();
  }
);

Then(
  '{string} is told the discount code is invalid',
  async ({ readers }, reader: string) => {
    const page = await readers.page(reader);

    await expect(
      page.getByRole('alert').filter({ hasText: discountCodeInvalid })
    ).toBeVisible();
  }
);
