import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {
  HasOptionalPaymentMethod,
  HasOptionalPaymentMethodLc,
  HasPaymentMethod,
  HasPaymentMethodLc
} from './has-payment-method.model'
import {PaymentMethod} from '../payment-method.model'
import {PaymentMethodDataloader} from '../payment-method.dataloader'

@Resolver(() => HasPaymentMethod)
export class HasPaymentMethodResolver {
  constructor(private dataloader: PaymentMethodDataloader) {}

  @ResolveField(() => PaymentMethod, {nullable: true})
  public paymentMethod(
    @Parent()
    block:
      | HasOptionalPaymentMethod
      | HasPaymentMethod
      | HasOptionalPaymentMethodLc
      | HasPaymentMethodLc
  ) {
    const id =
      'paymentMethodId' in block
        ? block.paymentMethodId
        : 'paymentMethodID' in block
        ? block.paymentMethodID
        : null

    if (!id) {
      return null
    }

    return this.dataloader.load(id)
  }
}

@Resolver(() => HasPaymentMethodLc)
export class HasPaymentMethodLcResolver extends HasPaymentMethodResolver {}

@Resolver(() => HasOptionalPaymentMethod)
export class HasOptionalPaymentMethodResolver extends HasPaymentMethodResolver {}

@Resolver(() => HasOptionalPaymentMethodLc)
export class HasOptionalPaymentMethodLcResolver extends HasPaymentMethodResolver {}
