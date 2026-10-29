import { ChallengeProviderType } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { loadChallengeProvider } from './create-challenge-provider';
import { HCaptchaProvider } from './providers/h-captcha.provider';

vi.mock('@wepublish/settings/api', () => ({ SecretCrypto: class {} }));

describe('loadChallengeProvider', () => {
  let testing: NamespacedCacheTesting;

  beforeEach(async () => {
    testing = await createNamespacedCacheTesting();
  });

  afterEach(() => testing.close());

  it('only considers providers that were not retired', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: 'hcaptcha',
      type: ChallengeProviderType.HCAPTCHA,
    });

    const provider = await loadChallengeProvider({
      prisma: { settingChallengeProvider: { findFirst } } as never,
      kv: testing.cache,
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } })
    );
    expect(provider).toBeInstanceOf(HCaptchaProvider);
  });
});
