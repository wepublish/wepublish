import {Args, Query, Resolver} from '@nestjs/graphql'
import {PrismaClient} from '@prisma/client'
import {Event} from './events-import.model'
// import {CanGetInvoices, Permissions} from '@wepublish/permissions/api'
// import {DashboardInvoice} from './dashboard-invoice.model'
import {EventsImportService} from './events-import.service'
// import {DashboardInvoiceService} from './dashboard-invoice.service'
// import {SettingName, Settings} from '@wepublish/settings/api'

@Resolver()
export class EventsImportResolver {
  constructor(private events: EventsImportService) {}

  @Query(returns => [Event], {
    name: 'importedEvents',
    description: `
      Returns a list of imported events from external sources, transformed to match our model.
    `
  })
  // @Permissions(CanGetInvoices)
  // @Settings(SettingName.MAKE_EXPECTED_REVENUE_API_PUBLIC)
  importedEvents() {
    // @Args('end', {nullable: true, type: () => Date}) end: Date | null // @Args('start') start: Date,
    return this.events.importedEvents()
  }
}
