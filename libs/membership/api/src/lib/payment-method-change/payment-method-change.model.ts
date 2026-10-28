import {
  ArgsType,
  Field,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  Currency,
  PaymentMethodChangeKind,
  PaymentMethodChangeState,
} from '@prisma/client';
import { HasPaymentMethod, PaymentMethod } from '@wepublish/payment/api';

registerEnumType(PaymentMethodChangeKind, {
  name: 'PaymentMethodChangeKind',
  description: `How the reader proves the new payment method: by paying the open invoice with it, by authorizing it without a charge, or not at all.`,
});

registerEnumType(PaymentMethodChangeState, {
  name: 'PaymentMethodChangeState',
});

@ObjectType({
  implements: () => [HasPaymentMethod],
  description: `A reader's request to move a subscription to another payment method. The subscription keeps its current payment method until the change is completed.`,
})
export class SubscriptionPaymentMethodChange implements HasPaymentMethod {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field(() => PaymentMethodChangeKind)
  kind!: PaymentMethodChangeKind;

  @Field(() => PaymentMethodChangeState)
  state!: PaymentMethodChangeState;

  @Field()
  subscriptionID!: string;

  @Field()
  fromPaymentMethodID!: string;

  @Field(() => Int, {
    description: `Amount in cents held to authorize the payment method. It is released again and never charged.`,
  })
  amount!: number;

  @Field(() => Currency)
  currency!: Currency;

  @Field()
  expiresAt!: Date;

  @Field(() => Date, { nullable: true })
  completedAt?: Date | null;

  paymentMethodID!: string;
  paymentMethod!: PaymentMethod;
}

@ObjectType()
export class StartedSubscriptionPaymentMethodChange {
  @Field(() => SubscriptionPaymentMethodChange)
  change!: SubscriptionPaymentMethodChange;

  @Field({
    nullable: true,
    description: `Where the reader pays or authorizes: a redirect URL, or the client secret for Stripe.`,
  })
  intentSecret?: string;

  @Field()
  paymentProviderID!: string;
}

@ArgsType()
export class ChangeSubscriptionPaymentMethodArgs {
  @Field()
  subscriptionId!: string;

  @Field()
  paymentMethodId!: string;

  @Field({ nullable: true })
  successURL?: string;

  @Field({ nullable: true })
  failureURL?: string;
}
