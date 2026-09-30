import { PaymentPeriodicity, PrismaClient } from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';
import { MemberContext } from './member-context';

const subscription = {
  id: 'subscription-1',
  userID: 'user-1',
  memberPlanID: 'plan-a',
  periods: [],
  deactivation: null,
};

const invoice = { id: 'invoice-1', items: [] };

const createContext = (autoSubscribe: jest.Mock) => {
  const prisma = {
    memberPlan: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'plan-a',
        currency: 'CHF',
        maxCount: null,
      }),
    },
    subscription: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(subscription),
    },
  };

  const context = new MemberContext({
    prisma: prisma as unknown as PrismaClient,
    paymentProviders: [],
    mailContext: {} as MailContext,
    newsletter: { autoSubscribe },
  });

  jest
    .spyOn(context, 'renewSubscriptionForUser')
    .mockResolvedValue(invoice as never);
  jest
    .spyOn(context, 'sendMailForSubscriptionEvent')
    .mockResolvedValue(undefined as never);

  return context;
};

const subscriptionInput = {
  userID: 'user-1',
  paymentMethodID: 'payment-method-1',
  paymentPeriodicity: PaymentPeriodicity.yearly,
  monthlyAmount: 1000,
  memberPlanID: 'plan-a',
  properties: [],
  autoRenew: true,
  extendable: true,
};

describe('MemberContext newsletter auto-subscribe', () => {
  it('adds the user to automatic newsletter lists when a subscription is created', async () => {
    const autoSubscribe = jest.fn().mockResolvedValue(undefined);
    const context = createContext(autoSubscribe);

    await context.createSubscription(subscriptionInput);

    expect(autoSubscribe).toHaveBeenCalledWith('user-1', 'plan-a');
  });

  it('still creates the subscription when the newsletter auto-subscribe fails', async () => {
    const autoSubscribe = jest.fn().mockRejectedValue(new Error('db down'));
    const context = createContext(autoSubscribe);

    await expect(
      context.createSubscription(subscriptionInput)
    ).resolves.toEqual({ subscription, invoice });
  });

  it('adds the user to automatic newsletter lists when a subscription is imported', async () => {
    const autoSubscribe = jest.fn().mockResolvedValue(undefined);
    const context = createContext(autoSubscribe);

    await context.importSubscription({
      ...subscriptionInput,
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      skipMail: true,
    });

    expect(autoSubscribe).toHaveBeenCalledWith('user-1', 'plan-a');
  });
});
