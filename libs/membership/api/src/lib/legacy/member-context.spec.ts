import {
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionDeactivationReason,
  SubscriptionEvent,
} from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';

import { MemberContext } from './member-context';

const subscription = {
  id: 'subscription-1',
  userID: 'user-1',
  memberPlanID: 'plan-1',
  paidUntil: null,
  startsAt: new Date('2026-10-01T00:00:00.000Z'),
};
const invoice = { id: 'invoice-1', items: [] };

const setup = () => {
  const prisma = {
    memberPlan: {
      findUnique: vi
        .fn()
        .mockResolvedValue({ id: 'plan-1', maxCount: null, currency: 'CHF' }),
    },
    subscription: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue(subscription),
      update: vi.fn().mockResolvedValue(subscription),
    },
    user: {
      findUnique: vi
        .fn()
        .mockResolvedValue({ id: 'user-1', email: 'reader@example.com' }),
    },
  };

  const mailContext = { sendMail: vi.fn().mockResolvedValue(undefined) };

  const context = new MemberContext({
    prisma: prisma as unknown as PrismaClient,
    paymentProviders: [],
    mailContext: mailContext as unknown as MailContext,
  });
  vi.spyOn(context, 'renewSubscriptionForUser').mockResolvedValue(
    invoice as never
  );
  vi.spyOn(context, 'getSubscriptionTemplateAction').mockResolvedValue({
    mailTemplateId: 'template-1',
    sendAsLetter: true,
  });

  return { context, mailContext };
};

const createInput = {
  userID: 'user-1',
  paymentMethodID: 'payment-method-1',
  paymentPeriodicity: PaymentPeriodicity.yearly,
  monthlyAmount: 1000,
  memberPlanID: 'plan-1',
  properties: [],
  autoRenew: true,
  extendable: true,
};

describe('MemberContext.createSubscription', () => {
  it('sends the subscribe mail', async () => {
    const { context, mailContext } = setup();

    await context.createSubscription(createInput);

    expect(mailContext.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ mailTemplateId: 'template-1' })
    );
  });

  it('hands the letter switch of the event to the mail', async () => {
    const { context, mailContext } = setup();

    await context.createSubscription(createInput);

    expect(mailContext.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ asLetter: true })
    );
  });

  // An editor creating a subscription by hand chooses whether the reader is
  // mailed; the subscription and its invoice are created either way.
  it('sends no mail with skipMail', async () => {
    const { context, mailContext } = setup();

    await expect(
      context.createSubscription({ ...createInput, skipMail: true })
    ).resolves.toEqual({ subscription, invoice });
    expect(mailContext.sendMail).not.toHaveBeenCalled();
  });
});

describe('MemberContext.deactivateSubscription', () => {
  const deactivate = (context: MemberContext, skipMail?: boolean) => {
    vi.spyOn(context, 'cancelRemoteSubscription').mockResolvedValue();
    vi.spyOn(context, 'cancelInvoicesForSubscription').mockResolvedValue();

    return context.deactivateSubscription({
      subscription: subscription as never,
      deactivationReason: SubscriptionDeactivationReason.userSelfDeactivated,
      skipMail,
    });
  };

  it('sends the deactivation mail', async () => {
    const { context, mailContext } = setup();

    await deactivate(context);

    expect(mailContext.sendMail).toHaveBeenCalledTimes(1);
  });

  it('sends no mail with skipMail', async () => {
    const { context, mailContext } = setup();

    await deactivate(context, true);

    expect(mailContext.sendMail).not.toHaveBeenCalled();
  });
});

describe('MemberContext.updateRemoteSubscription', () => {
  it('names the payment provider that cannot change the subscription', async () => {
    const { context } = setup();

    await expect(
      context.updateRemoteSubscription({
        paymentProvider: { getName: async () => 'Payrexx Abo' } as never,
        input: { memberPlanID: 'plan-2' } as never,
        originalSubscription: { memberPlanID: 'plan-1' } as never,
      })
    ).rejects.toThrow(
      'It is not possible to update the subscription with payment provider "Payrexx Abo".'
    );
  });
});

describe('MemberContext.renewSubscriptionForUser', () => {
  const paidUntil = new Date('2026-12-31T00:00:00.000Z');
  const paidPeriod = {
    id: 'period-paid',
    startsAt: new Date('2026-01-01T00:00:00.000Z'),
    endsAt: paidUntil,
    invoiceID: 'invoice-paid',
  };
  const renewable = {
    id: 'subscription-1',
    userID: 'user-1',
    memberPlanID: 'plan-1',
    paymentMethodID: 'payment-method-1',
    paymentPeriodicity: PaymentPeriodicity.yearly,
    monthlyAmount: 1000,
    autoRenew: true,
    currency: 'CHF',
    paidUntil,
    deactivation: null,
    periods: [paidPeriod],
  };

  const renewSetup = () => {
    const prisma = {
      invoice: {
        findUnique: vi.fn(),
        create: vi
          .fn()
          .mockImplementation(async ({ data }: { data: object }) => ({
            id: 'invoice-next',
            ...data,
            items: [],
          })),
      },
      subscriptionPeriod: { create: vi.fn().mockResolvedValue({}) },
      user: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'user-1', email: 'reader@example.com' }),
      },
      memberPlan: {
        findUnique: vi.fn().mockResolvedValue({ id: 'plan-1', name: 'Plan' }),
      },
    };
    const context = new MemberContext({
      prisma: prisma as unknown as PrismaClient,
      paymentProviders: [],
      mailContext: {} as MailContext,
    });
    vi.spyOn(context, 'getActionsForSubscriptions').mockResolvedValue([
      { type: SubscriptionEvent.DEACTIVATION_UNPAID, daysAwayFromEnding: 5 },
    ] as never);

    return { context, prisma };
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-24T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the open invoice of the latest unpaid period without creating one', async () => {
    const { context, prisma } = renewSetup();
    const openInvoice = {
      id: 'invoice-open',
      paidAt: null,
      canceledAt: null,
      items: [],
    };
    prisma.invoice.findUnique.mockResolvedValue(openInvoice);

    const invoice = await context.renewSubscriptionForUser({
      subscription: {
        ...renewable,
        periods: [
          paidPeriod,
          {
            id: 'period-open',
            startsAt: new Date('2027-01-01T00:00:00.000Z'),
            endsAt: new Date('2027-12-31T00:00:00.000Z'),
            invoiceID: 'invoice-open',
          },
        ],
      } as never,
    });

    expect(invoice).toBe(openInvoice);
    expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
      where: { id: 'invoice-open' },
      include: { items: true },
    });
    expect(prisma.invoice.create).not.toHaveBeenCalled();
    expect(prisma.subscriptionPeriod.create).not.toHaveBeenCalled();
  });

  it('creates the next period, starting the day after paidUntil, when every period is paid', async () => {
    const { context, prisma } = renewSetup();
    const nextStart = new Date('2027-01-01T00:00:00.000Z');

    const invoice = await context.renewSubscriptionForUser({
      subscription: renewable as never,
    });

    expect(invoice?.id).toBe('invoice-next');
    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subscriptionID: 'subscription-1',
          dueAt: nextStart,
          currency: 'CHF',
        }),
      })
    );
    expect(prisma.subscriptionPeriod.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: 'subscription-1',
        startsAt: nextStart,
        amount: 12000,
        invoiceID: 'invoice-next',
      }),
    });
  });

  it('does not renew a deactivated subscription', async () => {
    const { context, prisma } = renewSetup();

    await expect(
      context.renewSubscriptionForUser({
        subscription: {
          ...renewable,
          deactivation: { date: paidUntil, reason: 'userSelfDeactivated' },
        } as never,
      })
    ).resolves.toBeNull();
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });
});
