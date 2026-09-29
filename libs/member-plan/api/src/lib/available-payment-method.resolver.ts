import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PrismaClient } from '@prisma/client';
import { AvailablePaymentMethod } from './member-plan.model';
import {
  PaymentMethod,
  PaymentMethodDataloader,
  retiredPaymentProviderIds,
} from '@wepublish/payment/api';

@Resolver(() => AvailablePaymentMethod)
export class AvailablePaymentMethodResolver {
  constructor(
    private paymentMethodDataloader: PaymentMethodDataloader,
    private prisma: PrismaClient
  ) {}

  @ResolveField(() => [PaymentMethod])
  async paymentMethods(@Parent() { paymentMethodIDs }: AvailablePaymentMethod) {
    const [paymentMethods, retired] = await Promise.all([
      this.paymentMethodDataloader.loadMany(paymentMethodIDs),
      retiredPaymentProviderIds(this.prisma),
    ]);

    return paymentMethods.filter(
      paymentMethod =>
        !(
          paymentMethod &&
          !(paymentMethod instanceof Error) &&
          retired.has(paymentMethod.paymentProviderID)
        )
    );
  }
}
