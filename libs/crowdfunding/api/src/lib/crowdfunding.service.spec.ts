import {PrismaClient} from '@prisma/client'
import {CrowdfundingService} from './crowdfunding.service'

describe('Crowdfunding Service ', () => {
  let service: CrowdfundingService
  let prismaMock: {
    crowdfunding: {[method in keyof PrismaClient['crowdfunding']]?: jest.Mock}
    subscription: {[method in keyof PrismaClient['subscription']]?: jest.Mock}
  }

  const mockCrowdfundingData = {
    id: 'cf-1',
    name: 'multi-goal-cf',
    goals: [
      {id: 'goal-1', title: '250', amount: 250 * 100, progress: 0},
      {id: 'goal-2', title: '500', amount: 500 * 100, progress: 0},
      {id: 'goal-3', title: '750', amount: 750 * 100, progress: 0},
      {id: 'goal-4', title: '1000', amount: 1000 * 100, progress: 0}
    ],
    memberPlans: [],
    additionalRevenue: 0,
    countSubscriptionsFrom: null,
    countSubscriptionsUntil: null,
    createdAt: new Date(),
    modifiedAt: new Date()
  }

  beforeEach(() => {
    prismaMock = {
      crowdfunding: {
        findUnique: jest.fn()
      },
      subscription: {
        findMany: jest.fn()
      }
    }

    service = new CrowdfundingService(prismaMock as any)
  })

  it(`it get's correct crowdfunding goals`, async () => {
    const testCases = [
      {additionalRevenue: 0, expectedGoalAmount: 250 * 100},
      {additionalRevenue: 800 * 100, expectedGoalAmount: 1000 * 100},
      {additionalRevenue: 20000 * 100, expectedGoalAmount: 1000 * 100}
    ]

    for (const {additionalRevenue, expectedGoalAmount} of testCases) {
      const crowdfundingData = {
        ...mockCrowdfundingData,
        additionalRevenue
      }

      prismaMock.crowdfunding.findUnique!.mockResolvedValue(crowdfundingData)
      prismaMock.subscription.findMany!.mockResolvedValue([])

      const result = await service.getCrowdfundingById('cf-1')

      expect(result.activeCrowdfundingGoal?.amount).toBe(expectedGoalAmount)
    }
  })
})
