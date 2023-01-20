import {Args, Query, Resolver} from '@nestjs/graphql'
import {DashboardInvoice} from './dashboard-invoice.model'
import {DashboardInvoiceService} from './dashboard-invoice.service'

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
  expectedRevenue(@Args('start') start: Date, @Args('end', {defaultValue: new Date()}) end: Date) {
    return this.subscriptions.expectedRevenue(start, end)
  }

  @Query(returns => [DashboardInvoice], {
    name: 'revenue',
    description: `
      Returns the revenue generated for the time period given.
      Only includes paid invoices that have not been manually paid.
    `
  })
  revenue(@Args('start') start: Date, @Args('end', {defaultValue: new Date()}) end: Date) {
    return this.subscriptions.revenue(start, end)
  }
}
