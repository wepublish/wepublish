import { expect } from '@playwright/test';
import { SimulatedCheckout } from '../support/simulated-payment';
import { target } from '../support/env';
import { subscribeWithSimulatedPayment } from '../support/subscribe-form';
import { subscribePlanOf } from '../support/targets';
import { Then, When } from './fixtures';

// Shared website copy (libs/website/translations, de + fr), not tenant copy.
const referralLinkField = /^(Empfehlungslink|Lien de parrainage)$/i;
const copyButton = /^(Kopieren|Copier)$/i;
const copied = /Link kopiert|Lien copié/i;
const referrerField = /^(Empfehlungscode|Code de parrainage)$/i;

When(
  '{string} copies their referral link from their profile',
  async ({ readers, data, ctx, baseURL }, alias: string) => {
    // The link leads to the subscribe page a freshly seeded stack lacks.
    await data.ensureSubscribePage();

    const { context, page } = await readers.of(alias);
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: new URL(baseURL!).origin,
    });

    await page.goto('/profile');
    await expect(
      page.getByRole('textbox', { name: referralLinkField })
    ).toHaveValue(/referrer=/);
    await page.getByRole('button', { name: copyButton }).click();
    await expect(page.getByRole('alert').filter({ hasText: copied })).toBeVisible();

    ctx.referralLinks.set(
      alias,
      await page.evaluate(() => navigator.clipboard.readText())
    );
    ctx.currentReader = alias;
  }
);

When(
  '{string} opens the referral link of {string}',
  async ({ readers, ctx }, reader: string, referrer: string) => {
    const link = ctx.referralLinks.get(referrer);

    if (!link) {
      throw new Error(
        `"${referrer}" has not copied a referral link in this scenario.`
      );
    }

    await (await readers.page(reader)).goto(link);
    ctx.currentReader = reader;
  }
);

Then(
  '{string} sees the referral code of {string} filled in',
  async ({ readers, ctx }, reader: string, referrer: string) => {
    const code = new URL(ctx.referralLinks.get(referrer) ?? '').searchParams.get(
      'referrer'
    );

    await expect(
      (await readers.page(reader)).getByRole('textbox', {
        name: referrerField,
      })
    ).toHaveValue(code ?? '');
  }
);

When(
  "{string} subscribes to the tenant's subscribe plan",
  async ({ readers, data, ctx }, reader: string) => {
    await subscribeWithSimulatedPayment(
      await readers.page(reader),
      await data.memberPlan(subscribePlanOf(target.app))
    );
    ctx.currentReader = reader;
  }
);

When(
  '{string} declines the payment on the simulated checkout',
  async ({ readers }, reader: string) => {
    await new SimulatedCheckout(await readers.page(reader)).decline();
  }
);
