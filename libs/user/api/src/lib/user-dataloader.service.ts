import { Injectable, Scope } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { createOptionalsArray, Primeable } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class UserDataloaderService implements Primeable<User> {
  private dataloader = new DataLoader<string, User | null>(
    async (ids: readonly string[]) => {
      return createOptionalsArray(
        ids as string[],
        await this.prisma.user.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      );
    },
    { name: 'UserDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, User | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, User | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, User | null>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
