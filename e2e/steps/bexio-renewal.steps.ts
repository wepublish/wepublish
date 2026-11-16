import { expect } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { env } from '../support/env';
import { PostalAddress, Reader, TestData } from '../support/factories';
import { poll } from '../support/inbox';
import { newestLogSince } from '../support/mail-logs';
import { Given, ScenarioContext, Then, When } from './fixtures';

/** What the renewal through bexio needs switched on in One (or WEP_FEATURES). */
const RENEWAL_FEATURES = ['editor-renewal-provider-invoice', 'paper-letters', 'paper-letter-flow'];

/** A payment slip needs a Swiss address. */
const SWISS_ADDRESS: PostalAddress = {
  streetAddress: 'Teststrasse',
  streetAddressNumber: '1',
  zipCode: '8004',
  city: 'Zürich',
  country: 'CH',
};

Given('We.Publish delivers the bexio invoices', async ({ data, $testInfo }) => {
  const features = await data.features();
  const missing = RENEWAL_FEATURES.filter(feature => !features.includes(feature));

  $testInfo.skip(missing.length > 0, `needs the features ${missing.join(', ')} on the target`);

  await data.withPaymentProviderSettings('bexio', { bexio_invoiceMailByWePublish: true });
});

Given(
  'a reader {string} with a paid {string} subscription paying with {string}',
  async ({ data, ctx }, alias: string, memberPlanSlug: string, paymentMethodSlug: string) => {
    const reader = await data.createUser(alias);

    await subscribe(data, ctx, { alias, reader, memberPlanSlug, paymentMethodSlug });
  }
);

Given(
  'a letter reader {string} with a paid {string} subscription paying with {string}',
  async ({ data, ctx }, alias: string, memberPlanSlug: string, paymentMethodSlug: string) => {
    if (!env.pingen) {
      throw new Error('Tag the scenario with @letter.');
    }

    await data.ensureLetterProviderStaging(env.pingen);

    const reader = await data.createUser(alias);

    await data.setAddress(reader, SWISS_ADDRESS);
    const preference = await data.setDeliveryMode(reader, 'letter');
    expect(preference, 'the reader can get letters at the address').toMatchObject({
      channel: 'letter',
      canReceiveLetters: true,
    });

    const subscription = await subscribe(data, ctx, {
      alias,
      reader,
      memberPlanSlug,
      paymentMethodSlug,
    });

    // The reader's flow sends the renewal invoice as a letter; mail readers on
    // the same flow still get a mail.
    await data.withInvoiceCreationAsLetter(subscription);
  }
);

When(
  'the subscriptions of {string} and {string} are renewed',
  async ({ data, ctx }, first: string, second: string) => {
    for (const alias of [first, second]) {
      const subscription = ctx.subscriptions.get(alias);

      if (!subscription) {
        throw new Error(`"${alias}" has no subscription. Add a Given step that creates it.`);
      }

      const invoice = await data.renewSubscription(subscription.id);

      ctx.openInvoices.set(alias, { invoiceId: invoice.id, subscriptionId: subscription.id });
    }
  }
);

Then(
  '{string} receives the renewal mail with the bexio invoice attached',
  async ({ data, ctx, inbox, bexio }, alias: string) => {
    const reader = data.get('reader', alias);
    const invoiceId = renewalInvoiceOf(ctx, alias);
    const mail = await inbox.waitForMail({ to: reader.email });
    const pdfs = mail.attachments.filter(({ contentType }) => contentType === 'application/pdf');

    expect(pdfs, `pdf attachments of "${mail.subject}"`).toHaveLength(1);

    const bexioInvoice = await bexio.invoiceFor(invoiceId);

    if (!bexioInvoice) {
      throw new Error(`bexio has no invoice with api_reference ${invoiceId}`);
    }

    // The provider hands the pdf on under bexio's name. Compared by name and
    // pages, not bytes: a second download need not be byte-identical.
    const original = await bexio.pdf(bexioInvoice.id);
    const [attached] = pdfs;

    expect(attached.filename).toBe(original.name);
    expect(await pageCount(attached.content)).toBe(await pageCount(original.content));
  }
);

Then('a letter to {string} was handed to Pingen', async ({ data, ctx }, alias: string) => {
  const reader = data.get('reader', alias);
  const letter = await poll(
    async () => newestLogSince(await data.mailLogs(reader, 'letter'), ctx.startedAt),
    { timeout: 30_000, interval: 2_000, message: `no letter to "${alias}" in the mail log` }
  );

  expect(letter.state, letter.error ?? 'the letter provider took the letter').not.toBe('rejected');
  expect(letter.providerLetterID, 'the letter id at Pingen').toBeTruthy();
  expect(letter.address).toContain(`${SWISS_ADDRESS.zipCode} ${SWISS_ADDRESS.city}`);
});

async function subscribe(
  data: TestData,
  ctx: ScenarioContext,
  {
    alias,
    reader,
    memberPlanSlug,
    paymentMethodSlug,
  }: { alias: string; reader: Reader; memberPlanSlug: string; paymentMethodSlug: string }
) {
  const subscription = await data.createSubscription({ reader, memberPlanSlug, paymentMethodSlug });

  // A new subscription starts with its first invoice open, which blocks renewing.
  await data.payOpenInvoices(subscription.id);
  ctx.subscriptions.set(alias, subscription);

  return subscription;
}

function renewalInvoiceOf(ctx: ScenarioContext, alias: string) {
  const open = ctx.openInvoices.get(alias);

  if (!open) {
    throw new Error(`"${alias}" has no renewal invoice. Renew the subscription first.`);
  }

  return open.invoiceId;
}

async function pageCount(pdf: Buffer) {
  return (await PDFDocument.load(pdf)).getPageCount();
}
