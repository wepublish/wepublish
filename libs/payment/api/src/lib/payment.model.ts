import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaymentState } from '@prisma/client';
import { HasPaymentMethod, PaymentMethod } from '@wepublish/payment-method/api';
import { GraphQLSlug } from '@wepublish/utils/api';

registerEnumType(PaymentState, {
  name: 'PaymentState',
});

@ObjectType({ implements: () => HasPaymentMethod })
export class Payment {
  @Field()
  id!: string;

  @Field()
  intentSecret!: string;

  @Field(() => PaymentState)
  state!: PaymentState;

  paymentMethodID!: string;
  paymentMethod!: PaymentMethod;
}

@InputType()
export class PaymentFromInvoiceInput {
  @Field()
  invoiceID!: string;

  @Field({ nullable: true })
  paymentMethodID?: string;

  @Field(() => GraphQLSlug, { nullable: true })
  paymentMethodSlug?: string;

  @Field({ nullable: true })
  successURL?: string;

  @Field({ nullable: true })
  failureURL?: string;
}

@ArgsType()
export class PaymentFromSubscriptionArgs {
  @Field({ nullable: true })
  subscriptionId?: string;

  @Field({ nullable: true })
  successURL?: string;

  @Field({ nullable: true })
  failureURL?: string;
}
