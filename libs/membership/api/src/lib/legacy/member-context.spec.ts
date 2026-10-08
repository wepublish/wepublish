import { MemberContext } from './member-context';

describe('MemberContext.updateRemoteSubscription', () => {
  it('names the payment provider that cannot change the subscription', async () => {
    const context = new MemberContext({
      paymentProviders: [],
      prisma: {},
      mailContext: {},
    } as never);

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
