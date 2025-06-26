import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {AvailablePaymentMethod} from './member-plan.model'
import {PaymentMethod, PaymentMethodService} from '@wepublish/payment-method/api'

@Resolver(() => AvailablePaymentMethod)
export class AvailablePaymentMethodResolver {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @ResolveField(() => [PaymentMethod])
  async paymentMethods(@Parent() {paymentMethodIDs}: AvailablePaymentMethod) {
    return this.paymentMethodService.getAvailablePaymentMethodsByIds(paymentMethodIDs)
  }
}
