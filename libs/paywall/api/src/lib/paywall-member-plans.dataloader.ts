import {
  CONTENT_CACHE_TTL_SECONDS,
  KvTtlCacheService,
  contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import { DataLoaderService } from '@wepublish/utils/api';
import {
  AvailablePaymentMethod,
  MemberPlan,
  MemberPlanPeriodicityPrice,
  PrismaClient,
} from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

export type MemberPlanWithPaymentMethods = MemberPlan & {
  availablePaymentMethods: AvailablePaymentMethod[];
  periodicityPricing: MemberPlanPeriodicityPrice[];
};

@Injectable({
  scope: Scope.REQUEST,
})
export class PaywallMemberPlansDataloader extends DataLoaderService<
  MemberPlanWithPaymentMethods[]
> {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {
    super();
  }

  protected loadByKeys(paywallIds: string[]) {
    return this.kv.getOrLoadManyNs(
      contentCacheNamespace('paywalls'),
      paywallIds,
      missing => this.loadFromDatabase(missing),
      CONTENT_CACHE_TTL_SECONDS,
      'member-plans:'
    );
  }

  private async loadFromDatabase(paywallIds: string[]) {
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
              periodicityPricing: true,
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
