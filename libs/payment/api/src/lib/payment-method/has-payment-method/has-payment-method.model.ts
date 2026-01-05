import { Field, InterfaceType } from '@nestjs/graphql';
import { PaymentMethod } from '../payment-method.model';

@InterfaceType()
export abstract class HasPaymentMethod {
  @Field()
  paymentMethodID!: string;

  @Field(() => PaymentMethod)
  paymentMethod!: PaymentMethod;
}
