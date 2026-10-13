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
export class GateMemberPlansDataloader extends DataLoaderService<
  MemberPlanWithPaymentMethods[]
> {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {
    super();
  }

  protected loadByKeys(gateIds: string[]) {
    return this.kv.getOrLoadManyNs(
      contentCacheNamespace('gates'),
      gateIds,
      missing => this.loadFromDatabase(missing),
      CONTENT_CACHE_TTL_SECONDS,
      'member-plans:'
    );
  }

  private async loadFromDatabase(gateIds: string[]) {
    const gateMemberPlans = groupBy(
      gateMemberPlan => gateMemberPlan.gateId,
      await this.prisma.gateMemberPlan.findMany({
        where: {
          gateId: {
            in: gateIds,
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

    return gateIds.map(
      gateId =>
        gateMemberPlans[gateId]?.map(({ memberPlan }) => memberPlan) ?? []
    );
  }
}
