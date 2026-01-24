import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AvailablePaymentMethod } from './member-plan.model';
import { PaymentMethod, PaymentMethodDataloader } from '@wepublish/payment/api';

@Resolver(() => AvailablePaymentMethod)
export class AvailablePaymentMethodResolver {
  constructor(private paymentMethodDataloader: PaymentMethodDataloader) {}

  @ResolveField(() => [PaymentMethod])
  async paymentMethods(@Parent() { paymentMethodIDs }: AvailablePaymentMethod) {
    return this.paymentMethodDataloader.loadMany(paymentMethodIDs);
  }
}
