import { PaymentPeriodicity, SubscriptionEvent } from '@prisma/client';

import { SubscriptionEventDictionary } from './subscription-event-dictionary';

const interval = (templateId: string) => ({
  id: `interval-${templateId}`,
  event: SubscriptionEvent.INVOICE_CREATION,
  daysAwayFromEnding: -14,
  sendAsLetter: false,
  mailTemplate: { id: templateId },
});

const flow = (id: string, legacy: boolean[]) => ({
  id,
  default: false,
  memberPlanId: 'plan-1',
  periodicities: [PaymentPeriodicity.yearly],
  autoRenewal: [true],
  legacy,
  paymentMethods: [{ id: 'invoice' }],
  intervals: [interval(`${id}-template`)],
});

const defaultFlow = {
  id: 'default',
  default: true,
  memberPlanId: null,
  periodicities: [],
  autoRenewal: [],
  legacy: [true, false],
  paymentMethods: [],
  intervals: [interval('default-template')],
};

const lookup = {
  memberplanId: 'plan-1',
  paymentMethodId: 'invoice',
  periodicity: PaymentPeriodicity.yearly,
  autorenwal: true,
  events: [SubscriptionEvent.INVOICE_CREATION],
};

const dictionaryWith = (flows: unknown[]) => {
  const prisma = {
    subscriptionFlow: {
      findMany: vi.fn().mockResolvedValue(flows),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };

  return { prisma, dictionary: new SubscriptionEventDictionary(prisma as any) };
};

const templatesOf = (actions: { mailTemplateId: string | null }[]) =>
  actions.map(action => action.mailTemplateId);

describe('SubscriptionEventDictionary legacy subscriptions', () => {
  // Two flows that only differ in whom they are for must not be mixed up:
  // the imported reader gets the "we moved" wording, everyone else the usual.
  const flows = [defaultFlow, flow('regular', [false]), flow('legacy', [true])];

  it('gives a legacy subscription the flow for legacy subscriptions', async () => {
    const { dictionary } = dictionaryWith(flows);

    expect(
      templatesOf(
        await dictionary.getActionsForSubscriptions({ ...lookup, legacy: true })
      )
    ).toEqual(['legacy-template']);
  });

  it('gives every other subscription the regular flow', async () => {
    const { dictionary } = dictionaryWith(flows);

    expect(
      templatesOf(
        await dictionary.getActionsForSubscriptions({
          ...lookup,
          legacy: false,
        })
      )
    ).toEqual(['regular-template']);
  });

  it('keeps one flow for both when the flow does not tell them apart', async () => {
    const { dictionary } = dictionaryWith([
      defaultFlow,
      flow('both', [true, false]),
    ]);

    for (const legacy of [true, false]) {
      expect(
        templatesOf(
          await dictionary.getActionsForSubscriptions({ ...lookup, legacy })
        )
      ).toEqual(['both-template']);
    }
  });

  it('falls back to the default flow when only the other kind has a flow', async () => {
    const { dictionary } = dictionaryWith([
      defaultFlow,
      flow('legacy', [true]),
    ]);

    expect(
      templatesOf(
        await dictionary.getActionsForSubscriptions({
          ...lookup,
          legacy: false,
        })
      )
    ).toEqual(['default-template']);
  });

  // A flow for all plans leaves conditions open, but never whom it is for.
  it('keeps a legacy flow for all plans away from the other subscriptions', async () => {
    const { dictionary } = dictionaryWith([
      defaultFlow,
      {
        ...flow('all-plans-legacy', [true]),
        memberPlanId: null,
        allMemberPlans: true,
        paymentMethods: [],
        autoRenewal: [],
      },
    ]);

    expect(
      templatesOf(
        await dictionary.getActionsForSubscriptions({ ...lookup, legacy: true })
      )
    ).toEqual(['all-plans-legacy-template']);
    expect(
      templatesOf(
        await dictionary.getActionsForSubscriptions({
          ...lookup,
          legacy: false,
        })
      )
    ).toEqual(['default-template']);
  });

  describe('template of a single event', () => {
    it('asks a flow for all plans for the same kind of subscription', async () => {
      const { prisma, dictionary } = dictionaryWith([]);

      await dictionary.getSubscriptionTemplateAction(
        {
          memberPlanID: 'plan-1',
          paymentMethodID: 'invoice',
          paymentPeriodicity: PaymentPeriodicity.yearly,
          autoRenew: true,
          importedAt: new Date('2026-11-01T08:00:00Z'),
          legacyEndedAt: null,
        } as any,
        SubscriptionEvent.DEACTIVATION_BY_USER
      );

      expect(prisma.subscriptionFlow.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            allMemberPlans: true,
            legacy: { has: true },
          }),
        })
      );
    });

    const subscription = {
      memberPlanID: 'plan-1',
      paymentMethodID: 'invoice',
      paymentPeriodicity: PaymentPeriodicity.yearly,
      autoRenew: true,
    };

    it('looks for a flow for legacy subscriptions when the subscription is one', async () => {
      const { prisma, dictionary } = dictionaryWith([]);

      await dictionary.getSubscriptionTemplateAction(
        {
          ...subscription,
          importedAt: new Date('2026-11-01T08:00:00Z'),
          legacyEndedAt: null,
        } as any,
        SubscriptionEvent.DEACTIVATION_BY_USER
      );

      expect(prisma.subscriptionFlow.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ legacy: { has: true } }),
        })
      );
    });

    it('looks for a regular flow once the subscription was paid for here', async () => {
      const { prisma, dictionary } = dictionaryWith([]);

      await dictionary.getSubscriptionTemplateAction(
        {
          ...subscription,
          importedAt: new Date('2026-11-01T08:00:00Z'),
          legacyEndedAt: new Date('2026-11-19T10:00:00Z'),
        } as any,
        SubscriptionEvent.DEACTIVATION_BY_USER
      );

      expect(prisma.subscriptionFlow.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ legacy: { has: false } }),
        })
      );
    });
  });
});
