import {
  ArgsType,
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import type { PaymentPeriodicity as PaymentPeriodicityType } from '@prisma/client';
import { PaymentPeriodicity } from '@prisma/client';
import { PropertyInput } from '@wepublish/property/api';
import { GraphQLSlug } from '@wepublish/utils/api';

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity',
});

@InputType()
export class UpdateUserSubscriptionInput {
  @Field()
  id!: string;

  @Field()
  memberPlanID!: string;

  @Field(() => PaymentPeriodicity)
  paymentPeriodicity!: PaymentPeriodicityType;

  @Field(() => Int)
  amount!: number;

  @Field()
  autoRenew!: boolean;

  @Field()
  paymentMethodID!: string;
}

@ObjectType()
export class CreateSubscriptionInfo {
  @Field(() => Float, { nullable: true })
  discountPercent?: number;

  @Field({ nullable: true })
  voucherValid?: boolean;
}

@ArgsType()
export class CreateSubscriptionArgs {
  @Field({ nullable: true })
  voucher?: string;

  @Field({ nullable: true })
  memberPlanID?: string;

  @Field(() => GraphQLSlug, { nullable: true })
  memberPlanSlug?: string;

  @Field()
  autoRenew!: boolean;

  @Field(() => PaymentPeriodicity)
  paymentPeriodicity!: PaymentPeriodicity;

  @Field(() => Int)
  amount!: number;

  @Field({ nullable: true })
  paymentMethodID?: string;

  @Field(() => GraphQLSlug, { nullable: true })
  paymentMethodSlug?: string;

  @Field(() => [PropertyInput], { nullable: true })
  subscriptionProperties?: PropertyInput[];

  @Field({ nullable: true })
  successURL?: string;

  @Field({ nullable: true })
  failureURL?: string;

  @Field({ nullable: true })
  deactivateSubscriptionId?: string;
}

@ArgsType()
export class CreateSubscriptionWithConfirmationArgs extends OmitType(
  CreateSubscriptionArgs,
  ['successURL', 'failureURL', 'deactivateSubscriptionId'],
  ArgsType
) {
  @Field({ nullable: true })
  userId?: string;
}

@ArgsType()
export class ExtendSubscriptionArgs {
  @Field()
  subscriptionId!: string;

  @Field({ nullable: true })
  successURL?: string;

  @Field({ nullable: true })
  failureURL?: string;
}
