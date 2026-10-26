import { expect, Page } from '@playwright/test';

/**
 * The SIMULATED payment provider's checkout page, served by the API at
 * `/payment-webhooks/simulated` on non-production instances. It is the only
 * payment fake: the provider abstraction is the seam, so Stripe/Payrexx are
 * never mocked over HTTP. Each button answers with a 303 to the success or
 * failure URL.
 */
export class SimulatedCheckout {
  constructor(private readonly page: Page) {}

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/payment-webhooks\/simulated/);
    await expect(
      this.page.getByRole('heading', { name: 'Simulated payment' })
    ).toBeVisible();
  }

  pay() {
    return this.choose('Pay');
  }

  decline() {
    return this.choose('Decline');
  }

  cancel() {
    return this.choose('Cancel');
  }

  private async choose(outcome: 'Pay' | 'Decline' | 'Cancel') {
    await this.expectVisible();
    await this.page.getByRole('button', { name: outcome, exact: true }).click();
    // The 303 lands on the website, which can be slow to render the first time.
    await expect(this.page).not.toHaveURL(/\/payment-webhooks\/simulated/, {
      timeout: 20_000,
    });
  }
}
