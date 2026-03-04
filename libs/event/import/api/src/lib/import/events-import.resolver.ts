import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  ImportedEventFilter,
  PaginatedEventsFromSources,
  EventFromSource,
  SingleEventFilter,
  ImportEventArgs,
  ImportedEventSort,
} from './events-import.model';
import { EventsImportService } from './events-import.service';
import { SortOrder } from '@wepublish/utils/api';
import { CanCreateEvent, CanGetImportedEvents } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';

@Resolver()
export class EventsImportResolver {
  constructor(private events: EventsImportService) {}

  @Permissions(CanGetImportedEvents)
  @Query(returns => PaginatedEventsFromSources, {
    name: 'importedEvents',
    description: `
      Returns a list of imported events from external sources, transformed to match our model.
    `,
  })
  importedEvents(
    @Args('filter', { nullable: true }) filter: ImportedEventFilter,
    @Args('order', { nullable: true, type: () => Int }) order: SortOrder,
    @Args('skip', { nullable: true, type: () => Int }) skip: number,
    @Args('take', { nullable: true, type: () => Int }) take: number,
    @Args('sort', { nullable: true, type: () => ImportedEventSort })
    sort: ImportedEventSort
  ) {
    return this.events.importedEvents({ filter, order, skip, take, sort });
  }

  @Permissions(CanGetImportedEvents)
  @Query(returns => EventFromSource, {
    description: `
      Returns a more detailed version of a single importable event, by id and source.
    `,
  })
  importedEvent(@Args('filter') filter: SingleEventFilter) {
    return this.events.importedEvent(filter);
  }

  @Permissions(CanGetImportedEvents)
  @Query(returns => [String], {
    description: `
      Returns a list of external source ids of already imported events.
    `,
  })
  importedEventsIds() {
    return this.events.importedEventsIds();
  }

  @Permissions(CanGetImportedEvents)
  @Query(returns => [String], {
    description: `
      Returns a list of Importable Event Providers
    `,
  })
  eventProviders() {
    return this.events.getProviders();
  }

  @Permissions(CanCreateEvent)
  @Mutation(returns => String, {
    description: `
      Creates and event based on data from importable events list and an id and provider.
      Also, uploads an image to WePublish Image library.
    `,
  })
  importEvent(@Args() filter: ImportEventArgs) {
    return this.events.createEventFromSource(filter);
  }
}
