import {Args, Query, Resolver} from '@nestjs/graphql'
import {ImportedEventFilter, ImportedEventDocument} from './events-import.model'
import {EventsImportService} from './events-import.service'
import {PrismaClient} from '@prisma/client'
import {Event} from './events-import.model'
// import {CanGetInvoices, Permissions} from '@wepublish/permissions/api'
// import {DashboardInvoice} from './dashboard-invoice.model'
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
    @Args('order', {nullable: true}) order: 1 | -1,
    @Args('skip', {nullable: true}) skip: number,
    @Args('take', {nullable: true}) take: number,
    @Args('sort', {nullable: true}) sort: string
  ) {
    return this.events.importedEvents({filter, order, skip, take, sort})
  }
}
