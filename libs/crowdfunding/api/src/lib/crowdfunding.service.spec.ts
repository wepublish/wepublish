import { Test, TestingModule } from '@nestjs/testing';
import {
  Crowdfunding,
  CrowdfundingGoal,
  CrowdfundingGoalType,
  PaymentPeriodicity,
  PrismaClient,
} from '@prisma/client';
import { CrowdfundingService } from './crowdfunding.service';
import { CrowdfundingDataloaderService } from './crowdfunding-dataloader.service';

const mockCrowdfunding = (
  override: Partial<Crowdfunding> = {}
): Crowdfunding => ({
  id: 'cf-1',
  createdAt: new Date('2023-01-01'),
  modifiedAt: new Date('2023-01-01'),
  name: 'Test',
  countSubscriptionsFrom: null,
  countSubscriptionsUntil: null,
  additionalRevenue: null,
  goalType: CrowdfundingGoalType.Revenue,
  ...override,
});

const mockGoal = (override: Partial<CrowdfundingGoal> = {}): CrowdfundingGoal =>
  ({
    id: 'goal-1',
    createdAt: new Date('2023-01-01'),
    modifiedAt: new Date('2023-01-01'),
    title: 'Goal',
    description: null,
    amount: 100,
    crowdfundingId: 'cf-1',
    ...override,
  }) as CrowdfundingGoal;

describe('CrowdfundingService', () => {
  let service: CrowdfundingService;
  let prismaMock: {
    subscription: { findMany: jest.Mock };
    crowdfunding: { [key: string]: jest.Mock };
  };

  beforeEach(async () => {
    prismaMock = {
      subscription: { findMany: jest.fn() },
      crowdfunding: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrowdfundingService,
        { provide: PrismaClient, useValue: prismaMock },
        {
          provide: CrowdfundingDataloaderService,
          useValue: { prime: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(CrowdfundingService);
  });

  describe('getActiveGoalWithProgress', () => {
    it('uses the subscription count for a Subscription goal', () => {
      const goals = [mockGoal({ id: 'a', amount: 100 })];

      const activeGoal = service.getActiveGoalWithProgress({
        goalType: CrowdfundingGoalType.Subscription,
        goals,
        revenue: 999999,
        subscriptions: 50,
      });

      // progress is based on subscriptions (50/100), not revenue
      expect(activeGoal?.progress).toBe(50);
    });

    it('uses the revenue for a Revenue goal', () => {
      const goals = [mockGoal({ id: 'a', amount: 100 })];

      const activeGoal = service.getActiveGoalWithProgress({
        goalType: CrowdfundingGoalType.Revenue,
        goals,
        revenue: 25,
        subscriptions: 999,
      });

      expect(activeGoal?.progress).toBe(25);
    });

    it('returns the first goal when no progress has been made', () => {
      const goals = [
        mockGoal({ id: 'b', amount: 200 }),
        mockGoal({ id: 'a', amount: 100 }),
      ];

      const activeGoal = service.getActiveGoalWithProgress({
        goalType: CrowdfundingGoalType.Subscription,
        goals,
        revenue: 0,
        subscriptions: 0,
      });

      expect(activeGoal?.id).toBe('a');
    });
  });

  describe('getRevenue', () => {
    it('sums up monthly revenue and adds the external revenue', async () => {
      prismaMock.subscription.findMany.mockResolvedValue([
        {
          monthlyAmount: 1000,
          paymentPeriodicity: PaymentPeriodicity.yearly,
        },
      ]);

      const revenue = await service.getRevenue(
        mockCrowdfunding({ additionalRevenue: 500 }),
        ['mp-1']
      );

      // 1000 * 12 (yearly) + 500 external = 12500
      expect(revenue).toBe(12500);
    });
  });

  describe('calcMonthFactor', () => {
    it.each([
      [PaymentPeriodicity.monthly, 1],
      [PaymentPeriodicity.quarterly, 3],
      [PaymentPeriodicity.biannual, 6],
      [PaymentPeriodicity.yearly, 12],
      [PaymentPeriodicity.biennial, 24],
      [PaymentPeriodicity.lifetime, 1200],
    ])('maps %s to a factor of %i', (periodicity, factor) => {
      expect(service.calcMonthFactor(periodicity)).toBe(factor);
    });
  });
});
