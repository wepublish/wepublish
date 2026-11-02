import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DiscountCodeService } from './discountCode.service';

const discountCode = {
  id: 'code-1',
  code: 'friends',
  discountPercent: 20,
  memberPlanId: 'plan-1',
  validFrom: new Date('2026-01-01'),
  validTo: new Date('2027-01-01'),
  minReferrals: null as number | null,
};

const makeService = ({
  minReferrals = null,
  referrals = 0,
}: {
  minReferrals?: number | null;
  referrals?: number;
} = {}) => {
  const prisma = {
    discountCode: {
      findUnique: vi.fn(async () => ({ ...discountCode, minReferrals })),
    },
    user: { count: vi.fn(async () => referrals) },
  };
  const service = new DiscountCodeService(prisma as unknown as PrismaClient);

  // @PrimeDataLoader injects the dataloader as a property, which Nest does not
  // do for a manually constructed service.
  (service as any)['__DATALOADER__DiscountCodeDataloader'] = {
    prime: vi.fn(),
  };

  return { service, prisma };
};

describe('DiscountCodeService.getValidDiscountCode', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-02'));
  });
  afterAll(() => vi.useRealTimers());

  it('accepts a code without conditions without counting referrals', async () => {
    const { service, prisma } = makeService();

    await expect(
      service.getValidDiscountCode('FRIENDS', 'plan-1')
    ).resolves.toMatchObject({ id: 'code-1' });
    expect(prisma.user.count).not.toHaveBeenCalled();
  });

  it('accepts a code once the user referred enough readers', async () => {
    const { service, prisma } = makeService({ minReferrals: 2, referrals: 2 });

    await expect(
      service.getValidDiscountCode('friends', 'plan-1', 'user-1')
    ).resolves.toMatchObject({ id: 'code-1' });

    // only other readers count, and only with a paid subscription
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        id: { not: 'user-1' },
        subscriptions: {
          some: { referredByID: 'user-1', paidUntil: { not: null } },
        },
      },
    });
  });

  it('refuses a code when the user referred too few readers', async () => {
    const { service } = makeService({ minReferrals: 3, referrals: 2 });

    await expect(
      service.getValidDiscountCode('friends', 'plan-1', 'user-1')
    ).rejects.toThrow(
      new BadRequestException('DiscountCode requires 3 referrals.')
    );
  });

  it('refuses a code with a referral condition without a user', async () => {
    const { service, prisma } = makeService({ minReferrals: 1, referrals: 5 });

    await expect(
      service.getValidDiscountCode('friends', 'plan-1')
    ).rejects.toThrow(
      new BadRequestException('DiscountCode requires 1 referrals.')
    );
    expect(prisma.user.count).not.toHaveBeenCalled();
  });
});

describe('DiscountCodeService.createDiscountCode', () => {
  it('refuses a negative number of referrals', async () => {
    const { service } = makeService();

    await expect(
      service.createDiscountCode({
        code: 'friends',
        discountPercent: 20,
        memberPlanId: 'plan-1',
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2027-01-01'),
        minReferrals: -1,
      })
    ).rejects.toThrow(
      new BadRequestException('minReferrals can not be negative')
    );
  });
});
