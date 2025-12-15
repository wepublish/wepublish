import { Inject, Injectable } from '@nestjs/common';

import {
  ImportEventArgs,
  EventFromSource,
  ImportedEventFilter,
  ImportedEventSort,
  PaginatedEventsFromSources,
  SingleEventFilter,
} from './events-import.model';
import { PrismaClient } from '@prisma/client';
import { SortOrder } from '@wepublish/utils/api';

export interface ImportedEventsResolverParams {
  filter: ImportedEventFilter;
  order: SortOrder;
  skip: number;
  take: number;
  sort: ImportedEventSort;
}

export interface ImportedEventResolverParams {
  id: string;
}

export interface ImportedEventParams {
  id: string;
}

export interface CreateEventParams {
  id: string;
}

export interface EventsProvider {
  name: string;
  importedEvents(): Promise<EventFromSource[]>;
  importedEvent({ id }: ImportedEventResolverParams): Promise<EventFromSource>;
  createEvent({ id }: CreateEventParams): Promise<string>;
}

export const EVENT_IMPORT_PROVIDER = Symbol('Event Import Provider');

@Injectable()
export class EventsImportService {
  constructor(
    @Inject(EVENT_IMPORT_PROVIDER) private providers: EventsProvider[],
    private prisma: PrismaClient
  ) {}

  async importedEvents({
    filter,
    skip,
    take,
  }: ImportedEventsResolverParams): Promise<PaginatedEventsFromSources> {
    const importableEvents = Promise.all(
      this.providers.map(async provider => await provider.importedEvents())
    );

    try {
      const events = await importableEvents;
      const flattened = events.flat();

      // sort events
      let sortedEvents = flattened.sort((a, b) => {
        // by startsAt date by default
        return +a.startsAt - +b.startsAt;
      });

      // apply filters to events
      if (filter.providers && filter.providers.length) {
        sortedEvents = sortedEvents.filter(
          e =>
            e.externalSourceName &&
            filter?.providers?.includes(e.externalSourceName)
        );
      }

      if (filter.from) {
        sortedEvents = sortedEvents.filter(
          e => e.startsAt > new Date(filter.from as string)
        );
      }

      if (filter.name) {
        const nameFilter = filter.name.toLowerCase();
        sortedEvents = sortedEvents.filter(e =>
          e.name.toLowerCase().includes(nameFilter)
        );
      }

      if (filter.location) {
        const locationFilter = filter.location.toLowerCase();
        sortedEvents = sortedEvents.filter(e =>
          e.location?.toLowerCase().includes(locationFilter)
        );
      }

      if (filter.to) {
        sortedEvents = sortedEvents
          .filter(e => e.endsAt)
          .filter(e => e.endsAt! < new Date(filter.to as string));
      }

      // apply pagination
      const paginatedEvents = sortedEvents.slice(skip, skip + take);

      const firstEvent = sortedEvents[0];
      const lastEvent = sortedEvents[sortedEvents.length - 1];
      const aggregated = {
        nodes: paginatedEvents,
        totalCount: sortedEvents.length,
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          startCursor: firstEvent?.id,
          endCursor: lastEvent?.id,
        },
      };

      return aggregated;
    } catch (e) {
      throw new Error(e as string);
    }
  }

  async importedEvent(filter: SingleEventFilter) {
    const { id, source } = filter;
    return this.providers.find(p => p.name === source)?.importedEvent({ id });
  }

  async createEventFromSource({ id, source }: ImportEventArgs) {
    return this.providers.find(p => p.name === source)?.createEvent({ id });
  }

  async importedEventsIds() {
    const externalEventsIds = this.prisma.event
      .findMany({
        where: {
          externalSourceId: {
            not: null,
          },
        },
      })
      .then(res => res.map(single => single.externalSourceId));

    return externalEventsIds;
  }

  async getProviders() {
    return this.providers.map(provider => provider.name);
  }
}
