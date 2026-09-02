import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
} from '@prisma/client';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { RenewalSuccessMailService } from './renewal-success-mail.service';

const INVOICE_ID = 'inv-2';
const PERIOD_START = new Date('2026-08-01T00:00:00.000Z');

const createFlows = (mailTemplate: { id: string } | null) => [
  {
    id: 'default-flow',
    default: true,
    memberPlanId: null,
    autoRenewal: [],
    periodicities: [],
    paymentMethods: [],
    intervals: [
      {
        id: 'interval-renewal-success',
        event: SubscriptionEvent.RENEWAL_SUCCESS,
        daysAwayFromEnding: null,
        mailTemplate,
      },
    ],
  },
];

const createInvoice = (overrides: Record<string, unknown> = {}) => ({
  id: INVOICE_ID,
  mail: 'member@test.wepublish.com',
  paidAt: new Date('2026-08-02T00:00:00.000Z'),
  canceledAt: null,
  renewalSuccessMailSentAt: null,
  suppressRenewalSuccessMail: false,
  items: [{ id: 'item-1', name: 'Membership', amount: 200, quantity: 1 }],
  subscriptionPeriods: [
    {
      id: 'period-2',
      startsAt: PERIOD_START,
      endsAt: new Date('2027-08-01T00:00:00.000Z'),
      paymentPeriodicity: PaymentPeriodicity.yearly,
      amount: 200,
      invoiceID: INVOICE_ID,
      subscriptionId: 'sub-1',
    },
  ],
  subscription: {
    id: 'sub-1',
    userID: 'user-1',
    memberPlanID: 'plan-yearly',
    paymentMethodID: 'stripe',
    paymentPeriodicity: PaymentPeriodicity.yearly,
    autoRenew: true,
    user: {
      id: 'user-1',
      name: 'test user',
      email: 'member@test.wepublish.com',
    },
    memberPlan: { name: 'yearly', slug: 'yearly' },
    paymentMethod: { id: 'stripe', paymentProviderID: 'stripe' },
  },
  ...overrides,
});

type SetupOptions = {
  invoice?: unknown;
  earlierPeriods?: number;
  claimCount?: number;
  mailTemplate?: { id: string } | null;
  flowsReject?: boolean;
  findUniqueRejects?: boolean;
};

async function setup(options: SetupOptions = {}) {
  const {
    invoice = createInvoice(),
    earlierPeriods = 1,
    claimCount = 1,
    mailTemplate = { id: 'mt-renewal-success' },
    flowsReject = false,
    findUniqueRejects = false,
  } = options;

  const prisma = {
    subscriptionFlow: {
      findMany:
        flowsReject ?
          jest.fn().mockRejectedValue(new Error('database is down'))
        : jest.fn().mockResolvedValue(createFlows(mailTemplate)),
    },
    invoice: {
      findUnique:
        findUniqueRejects ?
          jest.fn().mockRejectedValue(new Error('connection pool timeout'))
        : jest.fn().mockResolvedValue(invoice),
      updateMany: jest.fn().mockResolvedValue({ count: claimCount }),
    },
    subscriptionPeriod: {
      count: jest.fn().mockResolvedValue(earlierPeriods),
    },
  };

  const mailContext = { sendMail: jest.fn().mockResolvedValue(undefined) };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      RenewalSuccessMailService,
      { provide: PrismaClient, useValue: prisma },
      { provide: MailContext, useValue: mailContext },
    ],
  }).compile();

  return {
    service: module.get<RenewalSuccessMailService>(RenewalSuccessMailService),
    prisma,
    mailContext,
  };
}

describe('RenewalSuccessMailService', () => {
  it('sends the renewal success mail for a renewal', async () => {
    const { service, prisma, mailContext } = await setup();

    await service.onInvoicePaid(INVOICE_ID);

    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: {
        id: INVOICE_ID,
        renewalSuccessMailSentAt: null,
        suppressRenewalSuccessMail: false,
      },
      data: { renewalSuccessMailSentAt: expect.any(Date) },
    });
    expect(mailContext.sendMail).toHaveBeenCalledTimes(1);

    const [sent] = mailContext.sendMail.mock.calls[0];
    expect(sent.mailTemplateId).toBe('mt-renewal-success');
    expect(sent.mailType).toBe(mailLogType.SubscriptionFlow);
    expect(sent.recipient.id).toBe('user-1');
    expect(sent.optionalData.errorCode).toBe('');
    expect(sent.optionalData.subscription.id).toBe('sub-1');
    expect(sent.optionalData.items).toHaveLength(1);
    expect(sent.optionalData.subscriptionPeriods).toHaveLength(1);
    expect(sent.optionalData.invoice.id).toBe(INVOICE_ID);
    expect(sent.optionalData.invoice.subscription).toBeUndefined();
    expect(sent.optionalData.invoice.items).toBeUndefined();
    expect(sent.optionalData.invoice.subscriptionPeriods).toBeUndefined();
  });

  it('loads the invoice with exactly the relations the mail payload needs', async () => {
    const { service, prisma } = await setup();

    await service.onInvoicePaid(INVOICE_ID);

    expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
      where: { id: INVOICE_ID },
      include: {
        items: true,
        subscriptionPeriods: { orderBy: { startsAt: 'asc' } },
        subscription: {
          include: { user: true, memberPlan: true, paymentMethod: true },
        },
      },
    });
  });

  it('resolves when loading the invoice fails', async () => {
    const { service, mailContext } = await setup({ findUniqueRejects: true });

    await expect(service.onInvoicePaid(INVOICE_ID)).resolves.toBeUndefined();

    expect(mailContext.sendMail).not.toHaveBeenCalled();
  });

  it('counts earlier periods of the same subscription to detect a renewal', async () => {
    const { service, prisma } = await setup();

    await service.onInvoicePaid(INVOICE_ID);

    expect(prisma.subscriptionPeriod.count).toHaveBeenCalledWith({
      where: { subscriptionId: 'sub-1', startsAt: { lt: PERIOD_START } },
    });
  });

  it('does not send for the first period of a subscription', async () => {
    const { service, prisma, mailContext } = await setup({ earlierPeriods: 0 });

    await service.onInvoicePaid(INVOICE_ID);

    expect(mailContext.sendMail).not.toHaveBeenCalled();
    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
  });

  it('does not send when the mail already went out', async () => {
    const { service, prisma, mailContext } = await setup({
      invoice: createInvoice({ renewalSuccessMailSentAt: new Date() }),
    });

    await service.onInvoicePaid(INVOICE_ID);

    expect(mailContext.sendMail).not.toHaveBeenCalled();
    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
  });

  it('does not send when an admin suppressed the mail', async () => {
    const { service, prisma, mailContext } = await setup({
      invoice: createInvoice({ suppressRenewalSuccessMail: true }),
    });

    await service.onInvoicePaid(INVOICE_ID);

    expect(mailContext.sendMail).not.toHaveBeenCalled();
    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
  });

  it('does not send when the claim was lost to a concurrent caller', async () => {
    const { service, mailContext } = await setup({ claimCount: 0 });

    await service.onInvoicePaid(INVOICE_ID);

    expect(mailContext.sendMail).not.toHaveBeenCalled();
  });

  it('does not claim when the flow has no renewal success template', async () => {
    const { service, prisma, mailContext } = await setup({
      mailTemplate: null,
    });

    await service.onInvoicePaid(INVOICE_ID);

    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
    expect(mailContext.sendMail).not.toHaveBeenCalled();
  });

  it('does not claim and does not throw when the template lookup fails', async () => {
    const { service, prisma, mailContext } = await setup({ flowsReject: true });

    await expect(service.onInvoicePaid(INVOICE_ID)).resolves.toBeUndefined();

    expect(prisma.invoice.updateMany).not.toHaveBeenCalled();
    expect(mailContext.sendMail).not.toHaveBeenCalled();
  });

  it('does not send for an unpaid invoice', async () => {
    const { service, mailContext } = await setup({
      invoice: createInvoice({ paidAt: null }),
    });

    await service.onInvoicePaid(INVOICE_ID);

    expect(mailContext.sendMail).not.toHaveBeenCalled();
  });

  it('does not send for an invoice without a subscription', async () => {
    const { service, mailContext } = await setup({
      invoice: createInvoice({ subscription: null }),
    });

    await service.onInvoicePaid(INVOICE_ID);

    expect(mailContext.sendMail).not.toHaveBeenCalled();
  });

  it('does not send for an unknown invoice', async () => {
    const { service, mailContext } = await setup({ invoice: null });

    await service.onInvoicePaid('does-not-exist');

    expect(mailContext.sendMail).not.toHaveBeenCalled();
  });

  it('resolves and keeps the claim when the send fails', async () => {
    const { service, prisma, mailContext } = await setup();
    mailContext.sendMail.mockRejectedValue(new Error('provider rejected'));

    await expect(service.onInvoicePaid(INVOICE_ID)).resolves.toBeUndefined();

    expect(prisma.invoice.updateMany).toHaveBeenCalledTimes(1);
  });
});
