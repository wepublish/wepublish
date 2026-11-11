import { TrackingPixelProviderType } from '@prisma/client';
import { createNamespacedCacheTesting } from '@wepublish/kv-ttl-cache/api/testing';
import { loadTrackingPixelProviders } from './create-tracking-pixel-providers';

vi.mock('@wepublish/settings/api', () => ({ SecretCrypto: class {} }));

describe('loadTrackingPixelProviders', () => {
  it('only starts providers that were not deleted', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([
        { id: 'prolitteris', type: TrackingPixelProviderType.prolitteris },
      ]);
    const testing = await createNamespacedCacheTesting();

    const providers = await loadTrackingPixelProviders({
      prisma: { settingTrackingPixel: { findMany } } as never,
      kv: testing.cache,
      httpClient: {} as never,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } })
    );
    expect(providers.map(provider => provider.id)).toEqual(['prolitteris']);
    await testing.close();
  });
});
