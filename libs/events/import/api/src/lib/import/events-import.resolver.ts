import {Args, Int, Query, Resolver} from '@nestjs/graphql'
import {
  ImportedEventFilter,
  ImportedEventsDocument,
  Event,
  SingleEventFilter
} from './events-import.model'
import {EventsImportService} from './events-import.service'

@Resolver()
export class EventsImportResolver {
  constructor(private events: EventsImportService) {}

  @Query(returns => ImportedEventsDocument, {
    name: 'importedEvents',
    description: `
      Returns a list of imported events from external sources, transformed to match our model.
    `
  })
  importedEvents(
    @Args('filter', {nullable: true}) filter: ImportedEventFilter,
    @Args('order', {nullable: true, type: () => Int}) order: 1 | -1,
    @Args('skip', {nullable: true, type: () => Int}) skip: number,
    @Args('take', {nullable: true, type: () => Int}) take: number,
    @Args('sort', {nullable: true}) sort: string
  ) {
    return this.events.importedEvents({filter, order, skip, take, sort})
  }

  @Query(returns => Event, {
    name: 'importedEvent',
    description: `
      Returns a more detailed version of a single importable event, by id and source (e.g. AgendaBasel).
    `
  })
  importedEvent(@Args('filter') filter: SingleEventFilter) {
    return this.events.importedEvent(filter)
  }
}
