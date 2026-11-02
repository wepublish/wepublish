import { expect } from '@playwright/test';
import { bexioMailFor } from '../support/bexio';
import { extractLink, poll } from '../support/inbox';
import { env } from '../support/env';
import { ScenarioContext, Given, Then, When } from './fixtures';

Given(
  'a reader {string} with an inbound mailbox and an open {string} invoice',
  async ({ data, ctx, inboundInbox }, alias: string, memberPlanSlug: string) => {
    // Using the inbox checks the daily quota before bexio sends anything.
    void inboundInbox;

    if (!env.resend) {
      throw new Error('Tag the scenario with @inbound-mail.');
    }

    const reader = await data.createUser(alias, { emailDomain: env.resend.domain });
    const subscription = await data.createSubscription({ reader, memberPlanSlug });
    const invoice = await data.openInvoice(subscription.id);

    ctx.openInvoices.set(alias, { invoiceId: invoice.id, subscriptionId: subscription.id });
  }
);

When(
  '{string} pays the open invoice with {string}',
  async ({ data, ctx }, alias: string, paymentMethodSlug: string) => {
    const reader = data.get('reader', alias);

    await data.payInvoiceAs(reader, openInvoiceOf(ctx, alias).invoiceId, paymentMethodSlug);
  }
);

Then('bexio has an open invoice for {string}', async ({ bexio, ctx }, alias: string) => {
  const { invoiceId } = openInvoiceOf(ctx, alias);
  const invoice = await poll(() => bexio.invoiceFor(invoiceId), {
    timeout: 20_000,
    interval: 2_000,
    message: `bexio has no invoice with api_reference ${invoiceId}`,
  });

  ctx.bexioInvoices.push(invoice.id);
  expect(invoice.status).toBe('open');
});

Then(
  '{string} receives the invoice from bexio by email',
  async ({ ctx, inboundInbox }, alias: string) => {
    // The provider sends invoice mails for the Resend domain to its test mailbox.
    const to = env.bexio?.testMailbox;

    if (!to) {
      throw new Error('Needs E2E_BEXIO_TEST_MAILBOX, the bexio provider\'s test mailbox.');
    }

    const mail = await inboundInbox.waitForMail({
      to,
      subject: bexioMailFor(openInvoiceOf(ctx, alias).subscriptionId),
    });

    // bexio replaces [Network Link] in the configured text with its invoice link.
    expect(() => extractLink(mail, /^https?:\/\/network\.bexio\.com\/invoice\//)).not.toThrow();
  }
);

function openInvoiceOf(ctx: ScenarioContext, alias: string) {
  const open = ctx.openInvoices.get(alias);

  if (!open) {
    throw new Error(`"${alias}" has no open invoice. Add a Given step that creates it.`);
  }

  return open;
}
