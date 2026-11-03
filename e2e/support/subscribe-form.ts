import { expect, Page } from '@playwright/test';
import { MemberPlan } from './factories';

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Picks the plan and its simulated payment method on the subscribe form the
 * page shows, and submits it. The reader is signed in, so the form asks for
 * nothing else.
 */
export async function subscribeWithSimulatedPayment(
  page: Page,
  plan: MemberPlan
) {
  const simulated = plan.paymentMethods.find(
    ({ slug }) => slug === 'simulated'
  );

  if (!simulated) {
    throw new Error(
      `Plan "${plan.slug}" does not offer the simulated payment method.`
    );
  }

  // The radio's name also holds price and description, so pick it by the
  // plan name inside its label (rendered twice, both select the plan).
  await page.getByText(plan.name, { exact: true }).first().click();
  // The payment radios are `visibility: hidden` (PaymentRadio), so they are
  // missing from the a11y tree; click the label that wraps them instead.
  const paymentMethod = page.getByRole('radio', {
    name: new RegExp(escapeRegExp(simulated.name)),
    includeHidden: true,
  });
  await page.locator('label', { has: paymentMethod }).click();
  await expect(paymentMethod).toBeChecked();

  await page
    .locator('form')
    .filter({ has: paymentMethod })
    .locator('button[type="submit"]')
    .click();
}
