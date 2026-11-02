import { expect } from '@playwright/test';
import { extractLink, poll } from '../support/inbox';
import { env } from '../support/env';
import { Given, Then, When } from './fixtures';

Given(
  'a reader {string} with an open {string} invoice',
  async ({ data, ctx }, alias: string, memberPlanSlug: string) => {
    const reader = await data.createUser(alias);
    const subscription = await data.createSubscription({ reader, memberPlanSlug });
    const invoice = await data.createRenewalInvoice(subscription.id);

    ctx.openInvoices.set(alias, invoice.id);
  }
);

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
    const invoice = await data.createRenewalInvoice(subscription.id);

    ctx.openInvoices.set(alias, invoice.id);
  }
);

When(
  '{string} pays the open invoice with {string}',
  async ({ data, ctx }, alias: string, paymentMethodSlug: string) => {
    const reader = data.get('reader', alias);

    await data.payInvoiceAs(reader, openInvoiceOf(ctx.openInvoices, alias), paymentMethodSlug);
  }
);

Then('bexio has an open invoice for {string}', async ({ bexio, ctx }, alias: string) => {
  const invoiceId = openInvoiceOf(ctx.openInvoices, alias);
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
  async ({ data, inboundInbox }, alias: string) => {
    const reader = data.get('reader', alias);
    const mail = await inboundInbox.waitForMail({ to: reader.email });

    // bexio replaces [Network Link] in the configured text with its invoice link.
    expect(() => extractLink(mail, /bexio/i)).not.toThrow();
  }
);

function openInvoiceOf(openInvoices: Map<string, string>, alias: string) {
  const invoiceId = openInvoices.get(alias);

  if (!invoiceId) {
    throw new Error(`"${alias}" has no open invoice. Add a Given step that creates it.`);
  }

  return invoiceId;
}
