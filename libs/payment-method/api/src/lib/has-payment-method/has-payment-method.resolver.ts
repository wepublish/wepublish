import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { HasPaymentMethod } from './has-payment-method.model';
import { PaymentMethod } from '../payment-method.model';
import { PaymentMethodDataloader } from '../payment-method.dataloader';

@Resolver(() => HasPaymentMethod)
export class HasPaymentMethodResolver {
  constructor(private dataloader: PaymentMethodDataloader) {}

  @ResolveField(() => PaymentMethod, { nullable: true })
  public paymentMethod(
    @Parent()
    parent: HasPaymentMethod
  ) {
    const id = 'paymentMethodID' in parent ? parent.paymentMethodID : null;

    if (!id) {
      return null;
    }

    return this.dataloader.load(id);
  }
}
