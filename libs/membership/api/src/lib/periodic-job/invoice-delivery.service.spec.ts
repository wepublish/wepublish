import {
  MailChannel,
  PaymentPeriodicity,
  PaymentState,
  PrismaClient,
  SubscriptionEvent,
  User,
} from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';
import { PaymentsService } from '@wepublish/payment/api';
import { InvoiceDeliveryService } from './invoice-delivery.service';

const user = { id: 'user-1', email: 'jane@example.com' } as User;
const subscription: any = {
  id: 'sub-1',
  userID: 'user-1',
  memberPlanID: 'mp-1',
  paymentMethodID: 'pm-1',
  autoRenew: true,
  paymentPeriodicity: PaymentPeriodicity.yearly,
  user,
};
const invoice: any = { id: 'inv-1', items: [] };
const intent = {
  intentID: '42',
  intentSecret: '',
  intentData: '{"id":42}',
  state: PaymentState.submitted,
};

const flow = (sendAsLetter: boolean) => ({
  id: 'default-flow',
  default: true,
  memberPlanId: null,
  autoRenewal: [],
  periodicities: [],
  paymentMethods: [],
  intervals: [
    {
      id: 'interval-invoice-creation',
      event: SubscriptionEvent.INVOICE_CREATION,
      daysAwayFromEnding: -14,
      mailTemplate: { id: 'mt-4' },
      sendAsLetter,
    },
  ],
});

function setup({ letters = false }: { letters?: boolean } = {}) {
  const provider = {
    createRemoteInvoice: vi.fn(async () => ({ intent })),
    renderRemoteInvoice: vi.fn(async () => undefined),
    deliversInvoiceItself: vi.fn(async () => true),
  };
  const letterSender = {
    isConfigured: vi.fn(async () => true),
    canReceiveLetters: vi.fn(() => true),
    sendLetter: vi.fn(async () => 'log-1'),
  };
  const prisma = {
    subscriptionFlow: { findMany: vi.fn(async () => [flow(letters)]) },
    payment: {
      create: vi.fn(async ({ data }) => ({ id: 'pay-1', ...data })),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    subscriptionPeriod: { deleteMany: vi.fn() },
    invoiceItem: { deleteMany: vi.fn() },
    invoice: { delete: vi.fn() },
    mailLog: { count: vi.fn(async () => 0), create: vi.fn() },
    mailTemplate: { findUnique: vi.fn(async () => null) },
    userDeliveryPreference: {
      findUnique: vi.fn(async () =>
        letters ? { channel: MailChannel.letter } : null
      ),
    },
    mailTemplateVariant: {
      findUnique: vi.fn(async () => ({ id: 'variant-1' })),
    },
    user: {
      findUnique: vi.fn(async () => ({
        ...user,
        address: { city: 'Bern', country: 'CH' },
      })),
    },
    $transaction: vi.fn(async (operations: unknown[]) =>
      Promise.all(operations)
    ),
  };
  const mailContext = {
    mailProvider: { id: 'fakeMail' },
    jwtGenerator: vi.fn(async () => 'jwt-1'),
    sendComposedMail: vi.fn(async () => ({ subject: 'S' })),
    isPlaceholderEmail: vi.fn(async () => false),
    purlProvider: {
      purlFor: vi.fn(async () => ({ purl: '', purlCode: '', purlQr: '' })),
    },
    buildMailData: MailContext.prototype.buildMailData,
    letterSender,
  };
  const payments = {
    findPaymentProviderByPaymentMethodeId: vi.fn(async () => provider),
    findByInvoiceId: vi.fn(async () => []),
  };

  const service = new InvoiceDeliveryService(
    prisma as unknown as PrismaClient,
    mailContext as unknown as MailContext,
    payments as unknown as PaymentsService
  );

  return { service, provider, letterSender, prisma, mailContext };
}

describe('InvoiceDeliveryService.deliverRenewal', () => {
  it('has the provider create the invoice, keeps it as a payment and sends the invoice-creation mail', async () => {
    const { service, provider, prisma, mailContext } = setup();

    await service.deliverRenewal(subscription, invoice);

    expect(provider.createRemoteInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice: expect.objectContaining({ id: 'inv-1' }),
        channel: MailChannel.mail,
      })
    );
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ intentID: '42' }),
      })
    );
    expect(mailContext.sendComposedMail).toHaveBeenCalledTimes(1);
  });

  it('prints the invoice after the letter for a reader in letter mode', async () => {
    const { service, provider, letterSender, mailContext } = setup({
      letters: true,
    });
    provider.createRemoteInvoice.mockResolvedValue({
      intent,
      document: { content: Buffer.from('pdf'), name: 'RE-1.pdf', mime: 'x' },
    });

    await service.deliverRenewal(subscription, invoice);

    expect(letterSender.sendLetter).toHaveBeenCalledWith(
      expect.objectContaining({
        attachment: { content: Buffer.from('pdf'), name: 'RE-1.pdf' },
      })
    );
    expect(mailContext.sendComposedMail).not.toHaveBeenCalled();
  });

  it('mails the invoice-creation mail without the pdf when the provider emails the invoice itself', async () => {
    const { service, mailContext } = setup();

    await service.deliverRenewal(subscription, invoice);

    expect(mailContext.sendComposedMail.mock.calls[0][0]).not.toHaveProperty(
      'attachments'
    );
  });

  describe('when we.publish delivers the invoices', () => {
    const pdf = {
      content: Buffer.from('pdf'),
      name: 'RE-1.pdf',
      mime: 'application/pdf',
    };

    it('attaches the pdf to the invoice-creation mail', async () => {
      const { service, provider, mailContext } = setup();
      provider.deliversInvoiceItself.mockResolvedValue(false);
      provider.createRemoteInvoice.mockResolvedValue({
        intent,
        document: pdf,
      });

      await service.deliverRenewal(subscription, invoice);

      expect(mailContext.sendComposedMail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              filename: 'RE-1.pdf',
              contentType: 'application/pdf',
              content: pdf.content,
            },
          ],
        })
      );
    });

    // Bexio sends nothing then; the night sweep mails it once there is a pdf.
    it('leaves the mail to the night sweep when the provider rendered no pdf', async () => {
      const { service, provider, mailContext, prisma } = setup();
      provider.deliversInvoiceItself.mockResolvedValue(false);
      provider.createRemoteInvoice.mockResolvedValue({
        intent,
        deliveryError: 'pdf failed',
      });

      await expect(
        service.deliverRenewal(subscription, invoice)
      ).resolves.toBeUndefined();

      expect(mailContext.sendComposedMail).not.toHaveBeenCalled();
      // The entry is what tells the sweep this mail is still owed — and the
      // editor why the reader is waiting.
      expect(prisma.mailLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          state: 'deferred',
          mailTemplate: { connect: { id: 'mt-4' } },
          error: expect.stringContaining('pdf'),
        }),
      });
    });
  });

  it('notes no deferred mail for a reader in letter mode', async () => {
    // The letter sweep finds them by their delivery preference.
    const { service, provider, prisma } = setup({ letters: true });
    provider.createRemoteInvoice.mockResolvedValue({
      intent,
      deliveryError: 'pdf failed',
    });

    await service.deliverRenewal(subscription, invoice);

    expect(prisma.mailLog.create).not.toHaveBeenCalled();
  });

  // The editor sees the error; the invoice is gone, so they can simply retry.
  it('fails and removes the invoice when the provider could not create it', async () => {
    const { service, provider, prisma, mailContext } = setup();
    provider.createRemoteInvoice.mockRejectedValue(new Error('bexio down'));

    await expect(service.deliverRenewal(subscription, invoice)).rejects.toThrow(
      /could not create the invoice/
    );

    expect(prisma.invoice.delete).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
    });
    expect(mailContext.sendComposedMail).not.toHaveBeenCalled();
  });

  it('leaves the letter to the night sweep when the provider rendered no pdf', async () => {
    const { service, provider, letterSender, mailContext } = setup({
      letters: true,
    });
    provider.createRemoteInvoice.mockResolvedValue({
      intent,
      deliveryError: 'pdf failed',
    });

    await expect(
      service.deliverRenewal(subscription, invoice)
    ).resolves.toBeUndefined();

    expect(letterSender.sendLetter).not.toHaveBeenCalled();
    expect(mailContext.sendComposedMail).not.toHaveBeenCalled();
  });

  it('fails when the flow has no invoice-creation event', async () => {
    const { service, prisma, provider } = setup();
    prisma.subscriptionFlow.findMany.mockResolvedValue([
      { ...flow(false), intervals: [] },
    ]);

    await expect(service.deliverRenewal(subscription, invoice)).rejects.toThrow(
      'No invoice creation found'
    );
    expect(provider.createRemoteInvoice).not.toHaveBeenCalled();
  });
});
