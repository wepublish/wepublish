import { Test, TestingModule } from '@nestjs/testing';
import { Crowdfunding, CrowdfundingGoalType } from '@prisma/client';
import { CrowdfundingResolver } from './crowdfunding.resolver';
import { CrowdfundingService } from './crowdfunding.service';
import { CrowdfundingDataloaderService } from './crowdfunding-dataloader.service';
import { CrowdfundingGoalDataloader } from './crowdfunding-goal.dataloader';
import { CrowdfundingMemberPlanDataloader } from './crowdfunding-memberplan.dataloader';
import type { Mock } from 'vitest';

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
  goalType: CrowdfundingGoalType.Subscription,
  ...override,
});

describe('CrowdfundingResolver', () => {
  let resolver: CrowdfundingResolver;
  let crowdfundingService: { getSubscriptions: Mock };
  let memberPlanDataloader: { load: Mock };

  beforeEach(async () => {
    crowdfundingService = { getSubscriptions: vi.fn() };
    memberPlanDataloader = { load: vi.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrowdfundingResolver,
        { provide: CrowdfundingService, useValue: crowdfundingService },
        {
          provide: CrowdfundingDataloaderService,
          useValue: { load: vi.fn() },
        },
        {
          provide: CrowdfundingMemberPlanDataloader,
          useValue: memberPlanDataloader,
        },
        { provide: CrowdfundingGoalDataloader, useValue: { load: vi.fn() } },
      ],
    }).compile();

    resolver = module.get(CrowdfundingResolver);
  });

  describe('subscriptions', () => {
    it('adds the external subscriptions as whole subscriptions', async () => {
      crowdfundingService.getSubscriptions.mockResolvedValue([{}, {}]);

      // additionalRevenue holds the manually added subscription count for
      // Subscription goals - 1 means exactly 1 extra subscription.
      const subscriptions = await resolver.subscriptions(
        mockCrowdfunding({ additionalRevenue: 1 })
      );

      // 2 counted subscriptions + 1 added manually = 3
      expect(subscriptions).toBe(3);
    });

    it('counts only real subscriptions when no external ones are set', async () => {
      crowdfundingService.getSubscriptions.mockResolvedValue([{}, {}, {}]);

      const subscriptions = await resolver.subscriptions(
        mockCrowdfunding({ additionalRevenue: null })
      );

      expect(subscriptions).toBe(3);
    });
  });
});
