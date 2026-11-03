import { PrismaClient } from '@prisma/client';
import { ReferralCodeService } from './referral/referral-code.service';
import { SensitiveDataUserResolver } from './sensitive-data-user.resolver';

const makeResolver = () => {
  const referralCodeService = {
    getReferralCode: vi.fn(async () => 'K7QX2M9P'),
  };
  const resolver = new SensitiveDataUserResolver(
    {} as PrismaClient,
    null as any,
    null as any,
    null as any,
    referralCodeService as unknown as ReferralCodeService
  );

  return { resolver, referralCodeService };
};

describe('SensitiveDataUserResolver.referralCode', () => {
  it('gives readers their own referral code', async () => {
    const { resolver, referralCodeService } = makeResolver();

    await expect(
      resolver.referralCode(
        { user: { id: 'user-1' } } as any,
        {
          id: 'user-1',
        } as any
      )
    ).resolves.toBe('K7QX2M9P');
    expect(referralCodeService.getReferralCode).toHaveBeenCalledWith('user-1');
  });

  it('hides the referral code of other users', async () => {
    const { resolver, referralCodeService } = makeResolver();

    await expect(
      resolver.referralCode(
        { user: { id: 'editor' } } as any,
        {
          id: 'user-1',
        } as any
      )
    ).resolves.toBeNull();
    expect(referralCodeService.getReferralCode).not.toHaveBeenCalled();
  });

  it('hides it without a session', async () => {
    const { resolver } = makeResolver();

    await expect(
      resolver.referralCode(undefined, { id: 'user-1' } as any)
    ).resolves.toBeNull();
  });
});
