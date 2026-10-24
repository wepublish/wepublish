import { SubscribeBlockResolver } from './subscribe-block.resolver';
import { SubscribeBlock } from './subscribe-block.model';

describe('SubscribeBlockResolver gift code offers', () => {
  const offers = [{ id: 'offer-2' }, { id: 'offer-1' }];

  const setup = (enabled: boolean) => {
    const getActiveOffersByIds = vi.fn().mockResolvedValue(offers);
    const isEnabled = vi.fn().mockResolvedValue(enabled);
    const resolver = new SubscribeBlockResolver(
      {} as never,
      {} as never,
      { getActiveOffersByIds } as never,
      { isEnabled } as never
    );

    return { resolver, getActiveOffersByIds, isEnabled };
  };

  const block = (giftCodeOfferIds?: string[]) =>
    ({ giftCodeOfferIds }) as unknown as SubscribeBlock;

  it('returns the active offers of the block in the order the service gives them', async () => {
    const { resolver, getActiveOffersByIds, isEnabled } = setup(true);

    await expect(
      resolver.giftCodeOffers(block(['offer-2', 'offer-1', 'offer-3']))
    ).resolves.toEqual(offers);

    expect(isEnabled).toHaveBeenCalledWith('gift-codes');
    expect(getActiveOffersByIds).toHaveBeenCalledWith([
      'offer-2',
      'offer-1',
      'offer-3',
    ]);
  });

  it('returns no offers when the gift codes feature is off', async () => {
    const { resolver, getActiveOffersByIds } = setup(false);

    await expect(resolver.giftCodeOffers(block(['offer-1']))).resolves.toEqual(
      []
    );

    expect(getActiveOffersByIds).not.toHaveBeenCalled();
  });

  it.each([[undefined], [[]]])(
    'returns no offers when the block selects none (%j)',
    async giftCodeOfferIds => {
      const { resolver, getActiveOffersByIds } = setup(true);

      await expect(
        resolver.giftCodeOffers(block(giftCodeOfferIds))
      ).resolves.toEqual([]);

      expect(getActiveOffersByIds).not.toHaveBeenCalled();
    }
  );
});
