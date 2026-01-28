import { Injectable, Scope } from '@nestjs/common';
import { Event, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class EventDataloaderService implements Primeable<Event> {
  private dataloader = new DataLoader<string, Event | null>(
    async (ids: readonly string[]) => {
      return createOptionalsArray(
        ids as string[],
        await this.prisma.event.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
        }),
        'id'
      );
    },
    { name: 'EventDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, Event | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, Event | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, Event | null>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
