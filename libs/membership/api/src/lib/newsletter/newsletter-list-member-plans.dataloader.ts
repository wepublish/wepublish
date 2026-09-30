import { Injectable, Scope } from '@nestjs/common';
import {
  AvailablePaymentMethod,
  MemberPlan,
  MemberPlanPeriodicityPrice,
  PrismaClient,
} from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';
import { groupBy } from 'ramda';

type MemberPlanWithPaymentMethods = MemberPlan & {
  availablePaymentMethods: AvailablePaymentMethod[];
  periodicityPricing: MemberPlanPeriodicityPrice[];
};

@Injectable({
  scope: Scope.REQUEST,
})
export class NewsletterListMemberPlansDataloader extends DataLoaderService<
  MemberPlanWithPaymentMethods[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(listIds: string[]) {
    const listMemberPlans = groupBy(
      listMemberPlan => listMemberPlan.listId,
      await this.prisma.newsletterListMemberPlan.findMany({
        where: { listId: { in: listIds } },
        include: {
          memberPlan: {
            include: {
              availablePaymentMethods: true,
              periodicityPricing: true,
            },
          },
        },
      })
    );

    return listIds.map(
      listId =>
        listMemberPlans[listId]?.map(({ memberPlan }) => memberPlan) ?? []
    );
  }
}
