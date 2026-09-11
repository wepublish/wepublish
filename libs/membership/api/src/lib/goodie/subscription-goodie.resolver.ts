import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PrismaClient, Subscription as PSubscription } from '@prisma/client';
import { PublicSubscription } from '../subscription/subscription.model';
import { GoodieDataloader } from './goodie.dataloader';
import { Goodie } from './goodie.model';

@Resolver(() => PublicSubscription)
export class SubscriptionGoodieResolver {
  constructor(
    private prisma: PrismaClient,
    private dataloader: GoodieDataloader
  ) {}

  @ResolveField(() => Goodie, { nullable: true })
  public async goodie(@Parent() subscription: PSubscription) {
    const goodieItem = await this.prisma.invoiceItem.findFirst({
      where: {
        goodieId: {
          not: null,
        },
        invoices: {
          subscriptionID: subscription.id,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!goodieItem?.goodieId) {
      return null;
    }

    return this.dataloader.load(goodieItem.goodieId);
  }
}
