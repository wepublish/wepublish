import { Injectable, Scope } from '@nestjs/common';
import { BlockStyle, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class BlockStylesDataloaderService implements Primeable<BlockStyle> {
  private dataloader = new DataLoader<string, BlockStyle | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.blockStyle.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      ),
    { name: 'BlockStylesDataloader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, BlockStyle | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, BlockStyle | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, BlockStyle | null>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
