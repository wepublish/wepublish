import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { SubscriptionPeriod } from './subscription.model';
import { PrismaClient } from '@prisma/client';
import { SubscriptionPeriod as PSubscriptionPeriod } from '@prisma/client';

@Resolver(() => SubscriptionPeriod)
export class SubscriptionPeriodResolver {
  constructor(private prisma: PrismaClient) {}

  @ResolveField(() => String, { nullable: true })
  async isPaid(@Parent() parent: PSubscriptionPeriod) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: parent.invoiceID,
      },
    });

    return !!invoice?.paidAt;
  }
}
