import { Injectable, Scope } from '@nestjs/common';
import { GiftCodeOffer, PrismaClient } from '@prisma/client';
import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';

@Injectable({ scope: Scope.REQUEST })
export class GiftCodeOfferDataloader extends DataLoaderService<GiftCodeOffer> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.giftCodeOffer.findMany({
        where: { id: { in: ids } },
      }),
      'id'
    );
  }
}
