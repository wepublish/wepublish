import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { SubscriptionPeriod } from './subscription.model';
import { SubscriptionPeriod as PSubscriptionPeriod } from '@prisma/client';
import { InvoiceDataloader } from '../invoice/invoice.dataloader';

@Resolver(() => SubscriptionPeriod)
export class SubscriptionPeriodResolver {
  constructor(private invoiceDataloader: InvoiceDataloader) {}

  @ResolveField(() => String, { nullable: true })
  async isPaid(@Parent() parent: PSubscriptionPeriod) {
    // Batched: this resolves once per period, and a subscription list resolves
    // every period of every subscription in one request.
    const invoice = await this.invoiceDataloader.load(parent.invoiceID);

    return !!invoice?.paidAt;
  }
}
