import { DataLoaderService } from '@wepublish/utils/api';
import { MemberPlan, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({
  scope: Scope.REQUEST,
})
export class CrowdfundingMemberPlanDataloader extends DataLoaderService<
  MemberPlan[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(crowdfundingIds: string[]) {
    const crowdfundings = await this.prisma.crowdfunding.findMany({
      where: {
        id: {
          in: crowdfundingIds,
        },
      },
      select: {
        id: true,
        memberPlans: {
          include: {
            availablePaymentMethods: true,
          },
        },
      },
    });

    return crowdfundingIds.map(
      fundingId =>
        crowdfundings.find(fund => fund.id === fundingId)?.memberPlans ?? []
    );
  }
}
