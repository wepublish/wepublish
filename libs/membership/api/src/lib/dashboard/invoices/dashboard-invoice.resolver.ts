import {Args, Query, Resolver} from '@nestjs/graphql'
import {CanGetInvoices, Permissions} from '@wepublish/permissions/api'
import {DashboardInvoice} from './dashboard-invoice.model'
import {DashboardInvoiceService} from './dashboard-invoice.service'
import {SettingName, Settings} from '@wepublish/settings/api'

@Resolver()
export class DashboardInvoiceResolver {
  constructor(private subscriptions: DashboardInvoiceService) {}

  @Query(returns => [DashboardInvoice], {
    name: 'expectedRevenue',
    description: `
      Returns the expected revenue for the time period given.
      Excludes cancelled or manually set as paid invoices.
    `
  })
  @Permissions(CanGetInvoices)
  @Settings(SettingName.MAKE_EXPECTED_REVENUE_API_PUBLIC)
  expectedRevenue(
    @Args('start') start: Date,
    @Args('end', {nullable: true, type: () => Date}) end: Date | null
  ) {
    return this.subscriptions.expectedRevenue(start, end ?? new Date())
  }

  @Query(returns => [DashboardInvoice], {
    name: 'revenue',
    description: `
      Returns the revenue generated for the time period given.
      Only includes paid invoices that have not been manually paid.
    `
  })
  @Permissions(CanGetInvoices)
  @Settings(SettingName.MAKE_REVENUE_API_PUBLIC)
  revenue(
    @Args('start') start: Date,
    @Args('end', {nullable: true, type: () => Date}) end: Date | null
  ) {
    return this.subscriptions.revenue(start, end ?? new Date())
  }
}
