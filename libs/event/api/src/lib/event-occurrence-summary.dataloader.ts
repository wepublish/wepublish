import { Injectable, Scope } from '@nestjs/common';
import { Occurrence, PrismaClient } from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';

export type EventOccurrenceSummary = {
  next: Occurrence | null;
  upcomingCount: number;
};

@Injectable({
  scope: Scope.REQUEST,
})
export class EventOccurrenceSummaryDataloader extends DataLoaderService<EventOccurrenceSummary> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(eventIds: string[]) {
    const now = new Date();
    const groups = await this.prisma.occurrence.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds }, dateTo: { gte: now } },
      _min: { dateFrom: true },
      _count: { _all: true },
    });

    const firsts =
      groups.length ?
        await this.prisma.occurrence.findMany({
          where: {
            dateTo: { gte: now },
            OR: groups.map(({ eventId, _min }) => ({
              eventId,
              dateFrom: _min.dateFrom ?? undefined,
            })),
          },
          orderBy: [{ dateFrom: 'asc' }, { id: 'asc' }],
        })
      : [];

    const nextByEvent = new Map<string, Occurrence>();

    for (const occurrence of firsts) {
      if (!nextByEvent.has(occurrence.eventId)) {
        nextByEvent.set(occurrence.eventId, occurrence);
      }
    }

    const countByEvent = new Map(
      groups.map(({ eventId, _count }) => [eventId, _count._all])
    );

    return eventIds.map(eventId => ({
      next: nextByEvent.get(eventId) ?? null,
      upcomingCount: countByEvent.get(eventId) ?? 0,
    }));
  }
}
