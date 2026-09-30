import { ChallengeProviderType } from '@prisma/client';
import { loadChallengeProvider } from './create-challenge-provider';
import { HCaptchaProvider } from './providers/h-captcha.provider';

vi.mock('@wepublish/settings/api', () => ({ SecretCrypto: class {} }));

describe('loadChallengeProvider', () => {
  it('only considers providers that were not retired', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: 'hcaptcha',
      type: ChallengeProviderType.HCAPTCHA,
    });

    const provider = await loadChallengeProvider({
      prisma: { settingChallengeProvider: { findFirst } } as never,
      kv: {} as never,
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } })
    );
    expect(provider).toBeInstanceOf(HCaptchaProvider);
  });
});
