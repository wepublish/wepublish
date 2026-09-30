import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { NewsletterEligibilityService } from './newsletter-eligibility.service';

const subscription = (overrides: Record<string, unknown> = {}) => ({
  userID: 'user-1',
  memberPlanID: 'plan-a',
  confirmed: true,
  startsAt: new Date('2026-01-01'),
  paidUntil: new Date('2027-01-01'),
  paymentMethod: { gracePeriod: 0 },
  ...overrides,
});

describe('NewsletterEligibilityService', () => {
  let service: NewsletterEligibilityService;
  let prismaMock: { subscription: { findMany: jest.Mock } };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = { subscription: { findMany: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsletterEligibilityService,
        { provide: PrismaClient, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(NewsletterEligibilityService);
  });

  describe('subscriptionsByUser', () => {
    it('groups the subscriptions of the given users with their grace period', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([
        subscription(),
        subscription({
          memberPlanID: 'plan-b',
          paymentMethod: { gracePeriod: 5 },
        }),
        subscription({ userID: 'user-2' }),
      ]);

      const result = await service.subscriptionsByUser(['user-1', 'user-2']);

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userID: { in: ['user-1', 'user-2'] } },
        })
      );
      expect(result.get('user-1')).toEqual([
        {
          memberPlanID: 'plan-a',
          confirmed: true,
          startsAt: new Date('2026-01-01'),
          paidUntil: new Date('2027-01-01'),
          gracePeriod: 0,
        },
        {
          memberPlanID: 'plan-b',
          confirmed: true,
          startsAt: new Date('2026-01-01'),
          paidUntil: new Date('2027-01-01'),
          gracePeriod: 5,
        },
      ]);
      expect(result.get('user-2')).toHaveLength(1);
      expect(result.get('user-3')).toBeUndefined();
    });

    it('does not query when no users are given', async () => {
      const result = await service.subscriptionsByUser([]);

      expect(prismaMock.subscription.findMany).not.toHaveBeenCalled();
      expect(result.size).toBe(0);
    });
  });

  describe('eligibleUserIds', () => {
    it('returns each active user with a qualifying subscription once', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([
        subscription(),
        subscription(),
        subscription({ userID: 'user-2', paidUntil: new Date('2026-01-31') }),
        subscription({ userID: 'user-3' }),
      ]);

      const result = await service.eligibleUserIds({
        requiresSubscription: true,
        anyMemberPlan: false,
        memberPlanIds: ['plan-a'],
      });

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            confirmed: true,
            user: { active: true },
            memberPlanID: { in: ['plan-a'] },
          },
        })
      );
      expect(result).toEqual(['user-1', 'user-3']);
    });

    it('does not filter by plan when any member plan qualifies', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([]);

      await service.eligibleUserIds({
        requiresSubscription: true,
        anyMemberPlan: true,
        memberPlanIds: [],
      });

      expect(prismaMock.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { confirmed: true, user: { active: true } },
        })
      );
    });
  });
});
