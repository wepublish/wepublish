import { DataLoaderService } from '@wepublish/utils/api';
import { CrowdfundingGoal, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class CrowdfundingGoalDataloader extends DataLoaderService<
  CrowdfundingGoal[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(crowdfundingIds: string[]) {
    const goals = groupBy(
      funding => funding.crowdfundingId!,
      await this.prisma.crowdfundingGoal.findMany({
        where: {
          crowdfundingId: {
            in: crowdfundingIds,
          },
        },
      })
    );

    return crowdfundingIds.map(fundingId => goals[fundingId] ?? []);
  }
}
