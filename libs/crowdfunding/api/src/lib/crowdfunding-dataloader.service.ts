import {Injectable, Scope} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {Primeable, createOptionalsArray} from '@wepublish/utils/api'
import DataLoader from 'dataloader'
import {CrowdfundingWithActiveGoal} from './crowdfunding.model'
import {CrowdfundingService} from './crowdfunding.service'

@Injectable({
  scope: Scope.REQUEST
})
export class CrowdfundingDataloaderService implements Primeable<CrowdfundingWithActiveGoal> {
  private readonly dataloader = new DataLoader<string, CrowdfundingWithActiveGoal | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(ids as string[], await this.loadCrowdfundingWithActiveGoals(ids), 'id'),
    {name: 'CrowdfundingDataLoader'}
  )

  constructor(private prisma: PrismaClient, private crowdfundingService: CrowdfundingService) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, CrowdfundingWithActiveGoal | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters)
  }

  public load(
    ...parameters: Parameters<DataLoader<string, CrowdfundingWithActiveGoal | null>['load']>
  ) {
    return this.dataloader.load(...parameters)
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, CrowdfundingWithActiveGoal | null>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters)
  }

  private async loadCrowdfundingWithActiveGoals(
    ids: readonly string[]
  ): Promise<CrowdfundingWithActiveGoal[]> {
    if (!ids.length) {
      return []
    }

    const crowdfundings = await this.prisma.crowdfunding.findMany({
      where: {
        id: {
          in: ids as string[]
        }
      },
      include: {
        goals: true,
        memberPlans: true
      }
    })

    // decorate crowdfundings with active goal
    const crowdfundingsWithActiveGoal = []
    for (const crowdfunding of crowdfundings) {
      const revenue = await this.crowdfundingService.getRevenue({crowdfunding})
      const activeCrowdfundingGoal = await this.crowdfundingService.getActiveGoalWithProgress({
        crowdfunding,
        revenue
      })
      crowdfundingsWithActiveGoal.push({
        ...crowdfunding,
        revenue,
        activeCrowdfundingGoal
      })
    }

    return crowdfundingsWithActiveGoal
  }
}
