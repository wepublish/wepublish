import {Args, Int, Query, Resolver} from '@nestjs/graphql'
import {ImportedEventFilter, ImportedEventDocument} from './events-import.model'
import {EventsImportService} from './events-import.service'

@Resolver()
export class EventsImportResolver {
  constructor(private events: EventsImportService) {}

  @Query(returns => ImportedEventDocument, {
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
}
