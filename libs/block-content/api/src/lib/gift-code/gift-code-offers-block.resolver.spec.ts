import { GiftCodeOffersBlockResolver } from './gift-code-offers-block.resolver';
import { GiftCodeOffersBlock } from './gift-code-offers-block.model';

describe('GiftCodeOffersBlockResolver', () => {
  const offers: Record<
    string,
    { id: string; active: boolean; memberPlanId: string }
  > = {
    a: { id: 'a', active: true, memberPlanId: 'plan' },
    b: { id: 'b', active: true, memberPlanId: 'plan' },
    inactive: { id: 'inactive', active: false, memberPlanId: 'plan' },
    inactivePlan: {
      id: 'inactivePlan',
      active: true,
      memberPlanId: 'inactivePlan',
    },
  };
  const memberPlans: Record<string, { id: string; active: boolean }> = {
    plan: { id: 'plan', active: true },
    inactivePlan: { id: 'inactivePlan', active: false },
  };

  const resolverWith = (enabled: boolean) => {
    const features = { isEnabled: vi.fn().mockResolvedValue(enabled) };
    const dataloader = {
      loadMany: vi.fn(async (ids: string[]) =>
        ids.map(id => offers[id] ?? null)
      ),
    };

    const memberPlanDataloader = {
      loadMany: vi.fn(async (ids: string[]) =>
        ids.map(id => memberPlans[id] ?? null)
      ),
    };

    return {
      dataloader,
      resolver: new GiftCodeOffersBlockResolver(
        features as never,
        dataloader as never,
        memberPlanDataloader as never
      ),
    };
  };

  const block = (giftCodeOfferIds: string[]) =>
    ({ giftCodeOfferIds }) as GiftCodeOffersBlock;

  it('resolves the active offers in the selected order', async () => {
    const { resolver } = resolverWith(true);

    await expect(
      resolver.giftCodeOffers(block(['b', 'missing', 'inactive', 'a']))
    ).resolves.toEqual([offers['b'], offers['a']]);
  });

  it('leaves out offers whose member plan is inactive', async () => {
    const { resolver } = resolverWith(true);

    await expect(
      resolver.giftCodeOffers(block(['inactivePlan', 'a']))
    ).resolves.toEqual([offers['a']]);
  });

  it('has no offers when the feature is off', async () => {
    const { resolver, dataloader } = resolverWith(false);

    await expect(resolver.giftCodeOffers(block(['a']))).resolves.toEqual([]);
    expect(dataloader.loadMany).not.toHaveBeenCalled();
  });

  it('has no offers when none are selected', async () => {
    const { resolver } = resolverWith(true);

    await expect(
      resolver.giftCodeOffers({} as GiftCodeOffersBlock)
    ).resolves.toEqual([]);
  });

  it('keeps the selected ids of offers that still exist', async () => {
    const { resolver } = resolverWith(true);

    await expect(
      resolver.giftCodeOfferIds(block(['b', 'missing', 'inactive', 'a']))
    ).resolves.toEqual(['b', 'inactive', 'a']);
  });
});
