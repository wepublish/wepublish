import { Injectable, Scope } from '@nestjs/common';
import { EventDate, EventImage, PrismaClient, Rate } from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class EventDatesDataloader extends DataLoaderService<EventDate[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(eventIds: string[]) {
    const dates = groupBy(
      date => date.eventId,
      await this.prisma.eventDate.findMany({
        where: { eventId: { in: eventIds } },
        orderBy: [{ dateFrom: 'asc' }, { sortOrder: 'asc' }],
      })
    );

    return eventIds.map(eventId => dates[eventId] ?? []);
  }
}

@Injectable({
  scope: Scope.REQUEST,
})
export class EventRatesDataloader extends DataLoaderService<Rate[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(eventIds: string[]) {
    const rates = groupBy(
      rate => rate.eventId,
      await this.prisma.rate.findMany({
        where: { eventId: { in: eventIds } },
        orderBy: { sortOrder: 'asc' },
      })
    );

    return eventIds.map(eventId => rates[eventId] ?? []);
  }
}

@Injectable({
  scope: Scope.REQUEST,
})
export class EventRevisionImagesDataloader extends DataLoaderService<
  EventImage[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(revisionIds: string[]) {
    const images = groupBy(
      image => image.revisionId,
      await this.prisma.eventImage.findMany({
        where: { revisionId: { in: revisionIds } },
        orderBy: { sortOrder: 'asc' },
      })
    );

    return revisionIds.map(revisionId => images[revisionId] ?? []);
  }
}
