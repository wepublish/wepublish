import { Injectable, Scope } from '@nestjs/common';
import { EventRevision, PrismaClient } from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';

export type EventRevisionMap = Partial<{
  draft: EventRevision;
  pending: EventRevision;
  published: EventRevision;
}>;

@Injectable({
  scope: Scope.REQUEST,
})
export class EventRevisionDataloaderService extends DataLoaderService<EventRevisionMap> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(eventIds: string[]) {
    const events = await this.prisma.event.findMany({
      relationLoadStrategy: 'join',
      where: { id: { in: eventIds } },
      select: {
        id: true,
        published: { select: { revision: true } },
        pending: { select: { revision: true } },
        draft: { select: { revision: true } },
      },
    });

    return eventIds.map((eventId): EventRevisionMap => {
      const event = events.find(({ id }) => id === eventId);

      return {
        draft: event?.draft?.revision,
        pending: event?.pending?.revision,
        published: event?.published?.revision,
      };
    });
  }
}
