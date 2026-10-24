import { Injectable, Scope } from '@nestjs/common';
import { Audience, PrismaClient, Region } from '@prisma/client';
import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';

@Injectable({
  scope: Scope.REQUEST,
})
export class RegionDataloader extends DataLoaderService<Region> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.region.findMany({ where: { id: { in: ids } } }),
      'id'
    );
  }
}

@Injectable({
  scope: Scope.REQUEST,
})
export class AudienceDataloader extends DataLoaderService<Audience> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.audience.findMany({ where: { id: { in: ids } } }),
      'id'
    );
  }
}
