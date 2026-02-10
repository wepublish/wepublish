import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, Tag } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class EventTagDataloader extends DataLoaderService<Tag[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(eventIds: string[]) {
    const tags = groupBy(
      tag => tag.eventId!,
      await this.prisma.taggedEvents.findMany({
        where: {
          eventId: {
            in: eventIds,
          },
        },
        include: {
          tag: true,
        },
      })
    );

    return eventIds.map(eventId => tags[eventId]?.map(tag => tag.tag) ?? []);
  }
}
