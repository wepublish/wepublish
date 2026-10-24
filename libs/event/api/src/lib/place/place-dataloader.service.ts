import { Injectable, Scope } from '@nestjs/common';
import { Place, PrismaClient } from '@prisma/client';
import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';

@Injectable({
  scope: Scope.REQUEST,
})
export class PlaceDataloaderService extends DataLoaderService<Place> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.place.findMany({ where: { id: { in: ids } } }),
      'id'
    );
  }
}
