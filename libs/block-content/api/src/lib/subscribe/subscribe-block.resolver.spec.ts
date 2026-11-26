import { SubscribeBlockResolver } from './subscribe-block.resolver';
import { SubscribeBlock } from './subscribe-block.model';

describe('SubscribeBlockResolver gift code redemption', () => {
  const page = { id: 'page-1' };

  const resolverWith = (enabled: boolean) => {
    const features = { isEnabled: vi.fn().mockResolvedValue(enabled) };
    const pageDataloader = { load: vi.fn().mockResolvedValue(page) };

    return {
      features,
      pageDataloader,
      resolver: new SubscribeBlockResolver(
        {} as never,
        {} as never,
        features as never,
        pageDataloader as never
      ),
    };
  };

  const block = (values: Partial<SubscribeBlock>) => values as SubscribeBlock;

  it('offers the redemption when the feature is on', async () => {
    const { resolver, features } = resolverWith(true);

    await expect(
      resolver.showGiftCodeRedemption(block({ showGiftCodeRedemption: true }))
    ).resolves.toBe(true);
    expect(features.isEnabled).toHaveBeenCalledWith('gift-codes');
  });

  it('never offers the redemption when the feature is off', async () => {
    const { resolver } = resolverWith(false);

    await expect(
      resolver.showGiftCodeRedemption(block({ showGiftCodeRedemption: true }))
    ).resolves.toBe(false);
  });

  it('does not offer the redemption when the option is off', async () => {
    const { resolver } = resolverWith(true);

    await expect(resolver.showGiftCodeRedemption(block({}))).resolves.toBe(
      false
    );
  });

  it('resolves the redemption page', async () => {
    const { resolver, pageDataloader } = resolverWith(true);

    await expect(
      resolver.giftCodeRedemptionPage(
        block({
          showGiftCodeRedemption: true,
          giftCodeRedemptionPageId: 'page-1',
        })
      )
    ).resolves.toBe(page);
    expect(pageDataloader.load).toHaveBeenCalledWith('page-1');
  });

  it.each([
    [
      'the feature is off',
      false,
      { showGiftCodeRedemption: true, giftCodeRedemptionPageId: 'page-1' },
    ],
    [
      'the option is off',
      true,
      { showGiftCodeRedemption: false, giftCodeRedemptionPageId: 'page-1' },
    ],
    ['no page is selected', true, { showGiftCodeRedemption: true }],
  ])('has no redemption page when %s', async (_case, enabled, values) => {
    const { resolver, pageDataloader } = resolverWith(enabled);

    await expect(
      resolver.giftCodeRedemptionPage(block(values))
    ).resolves.toBeNull();
    expect(pageDataloader.load).not.toHaveBeenCalled();
  });
});
