import { Prisma, PrismaClient } from '@prisma/client';
import { ReferralCodeService } from './referral-code.service';

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });

const makeService = (user: { referralCode: string | null } | null) => {
  const prisma = {
    user: {
      findUnique: vi.fn(async () => user),
      updateMany: vi.fn(async () => ({ count: 1 })),
      findFirst: vi.fn(async () => null),
    },
  };

  return {
    service: new ReferralCodeService(prisma as unknown as PrismaClient),
    prisma,
  };
};

describe('ReferralCodeService', () => {
  describe('getReferralCode', () => {
    it('returns the code the user already has', async () => {
      const { service, prisma } = makeService({ referralCode: 'K7QX2M9P' });

      await expect(service.getReferralCode('user-1')).resolves.toBe('K7QX2M9P');
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('gives a user without a code a new one', async () => {
      const { service, prisma } = makeService({ referralCode: null });
      prisma.user.findUnique
        .mockResolvedValueOnce({ referralCode: null })
        .mockImplementationOnce(async () => ({
          referralCode:
            prisma.user.updateMany.mock.calls[0][0].data.referralCode,
        }));

      const code = await service.getReferralCode('user-1');

      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
      // only sets a code when the user has none yet, so parallel calls agree
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-1', referralCode: null },
        data: { referralCode: code },
      });
    });

    it('tries another code when the first one is taken', async () => {
      const { service, prisma } = makeService({ referralCode: null });
      prisma.user.updateMany.mockRejectedValueOnce(uniqueViolation());
      prisma.user.findUnique
        .mockResolvedValueOnce({ referralCode: null })
        .mockResolvedValueOnce({ referralCode: null })
        .mockImplementationOnce(async () => ({
          referralCode:
            prisma.user.updateMany.mock.calls[1][0].data.referralCode,
        }));

      const code = await service.getReferralCode('user-1');

      expect(prisma.user.updateMany).toHaveBeenCalledTimes(2);
      expect(code).toBe(
        prisma.user.updateMany.mock.calls[1][0].data.referralCode
      );
    });

    it('throws for an unknown user', async () => {
      const { service } = makeService(null);

      await expect(service.getReferralCode('nobody')).rejects.toThrow();
    });
  });

  describe('findReferrerId', () => {
    it('finds the user of a code, however it was typed', async () => {
      const { service, prisma } = makeService(null);
      prisma.user.findFirst.mockResolvedValue({ id: 'referrer-1' } as never);

      await expect(service.findReferrerId(' k7qx2m9p ')).resolves.toBe(
        'referrer-1'
      );
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { referralCode: 'K7QX2M9P', active: true },
        select: { id: true },
      });
    });

    it('is null for an unknown code', async () => {
      const { service } = makeService(null);

      await expect(service.findReferrerId('NOPE1234')).resolves.toBeNull();
    });
  });
});
