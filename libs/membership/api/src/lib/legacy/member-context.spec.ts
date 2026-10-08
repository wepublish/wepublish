import {
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionDeactivationReason,
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
  vi.spyOn(context, 'getSubscriptionTemplateIdentifier').mockResolvedValue(
    'template-1'
  );

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
