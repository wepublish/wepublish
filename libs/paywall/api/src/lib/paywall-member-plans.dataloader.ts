import { DataLoaderService } from '@wepublish/utils/api';
import {
  AvailablePaymentMethod,
  MemberPlan,
  PrismaClient,
} from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

export type MemberPlanWithPaymentMethods = MemberPlan & {
  availablePaymentMethods: AvailablePaymentMethod[];
};

@Injectable({
  scope: Scope.REQUEST,
})
export class PaywallMemberPlansDataloader extends DataLoaderService<
  MemberPlanWithPaymentMethods[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(paywallIds: string[]) {
    const paywallMemberPlans = groupBy(
      paywallMemberPlan => paywallMemberPlan.paywallId,
      await this.prisma.paywallMemberplan.findMany({
        where: {
          paywallId: {
            in: paywallIds,
          },
        },
        include: {
          memberPlan: {
            include: {
              availablePaymentMethods: true,
            },
          },
        },
      })
    );

    return paywallIds.map(
      paywallId =>
        paywallMemberPlans[paywallId]?.map(({ memberPlan }) => memberPlan) ?? []
    );
  }
}
