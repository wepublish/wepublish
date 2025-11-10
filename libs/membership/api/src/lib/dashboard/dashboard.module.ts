import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { DashboardInvoiceResolver } from './invoices/dashboard-invoice.resolver';
import { DashboardInvoiceService } from './invoices/dashboard-invoice.service';
import { DashboardSubscriptionResolver } from './subscriptions/dashboard-subscription.resolver';
import { DashboardSubscriptionService } from './subscriptions/dashboard-subscription.service';

@Module({
  imports: [PrismaModule],
  providers: [
    DashboardSubscriptionResolver,
    DashboardSubscriptionService,
    DashboardInvoiceResolver,
    DashboardInvoiceService,
  ],
})
export class DashboardModule {}
