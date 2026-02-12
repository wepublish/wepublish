import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  PaymentPeriodicity,
  Currency,
  SubscriptionDeactivationReason,
} from '@prisma/client';
import { HasMemberPlan, MemberPlan } from '@wepublish/member-plan/api';
import { HasPaymentMethod, PaymentMethod } from '@wepublish/payment/api';
import { HasUser, User } from '@wepublish/user/api';
import { Property, PropertyInput } from '@wepublish/property/api';
import { DateFilter, PaginatedType, SortOrder } from '@wepublish/utils/api';

export enum SubscriptionSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
}

registerEnumType(Currency, {
  name: 'Currency',
});

registerEnumType(SubscriptionSort, {
  name: 'SubscriptionSort',
});

registerEnumType(SubscriptionDeactivationReason, {
  name: 'SubscriptionDeactivationReason',
});

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity',
});

@ObjectType()
export class SubscriptionDeactivation {
  @Field()
  date!: Date;

  @Field(() => SubscriptionDeactivationReason)
  reason!: SubscriptionDeactivationReason;
}

@ObjectType({})
export class SubscriptionPeriod {
  @Field()
  id!: string;
  @Field()
  createdAt!: Date;
  @Field()
  modifiedAt!: Date;

  @Field()
  startsAt!: Date;
  @Field()
  endsAt!: Date;

  @Field(() => PaymentPeriodicity)
  paymentPeriodicity!: PaymentPeriodicity;

  @Field()
  invoiceID!: string;

  @Field()
  amount!: number;

  @Field()
  isPaid!: boolean;
}

@ObjectType({
  implements: () => [HasUser, HasPaymentMethod, HasMemberPlan],
})
export class PublicSubscription
  implements HasUser, HasPaymentMethod, HasMemberPlan
{
  @Field()
  id!: string;
  @Field()
  createdAt!: Date;
  @Field()
  modifiedAt!: Date;

  @Field(() => Boolean)
  confirmed!: boolean;

  @Field(() => PaymentPeriodicity)
  paymentPeriodicity!: PaymentPeriodicity;

  @Field(() => Int)
  monthlyAmount!: number;

  @Field(() => Boolean)
  autoRenew!: boolean;

  @Field()
  startsAt!: Date;

  @Field(() => Date, { nullable: true })
  paidUntil?: Date;

  @Field(() => Boolean)
  extendable!: boolean;

  @Field(() => [Property])
  properties!: Property[];

  @Field(() => SubscriptionDeactivation, { nullable: true })
  deactivation?: SubscriptionDeactivation;

  @Field()
  url!: string;

  @Field(() => Boolean)
  isActive!: boolean;

  @Field(() => Boolean)
  canExtend!: boolean;

  @Field({ nullable: true })
  externalReward?: string;

  @Field(() => [SubscriptionPeriod])
  periods!: SubscriptionPeriod[];

  @Field(() => Currency)
  currency!: Currency;

  userID!: string;
  user!: User;

  paymentMethodID!: string;
  paymentMethod!: PaymentMethod;

  memberPlanID!: string;
  memberPlan!: MemberPlan;
}

@ObjectType()
export class PublicSubscriptionConnection extends PaginatedType(
  PublicSubscription
) {}

@ArgsType()
export class CreatePublicSubscriptionInput extends PickType(
  PublicSubscription,
  [
    'paymentPeriodicity',
    'monthlyAmount',
    'autoRenew',
    'startsAt',
    'paidUntil',
    'extendable',
    // Bugged, seems like PickType ignores `implements` meta
    'paymentMethodID',
    'userID',
    'memberPlanID',
  ] as const,
  ArgsType
) {
  @Field(() => [PropertyInput])
  properties!: PropertyInput[];

  @Field()
  override userID!: string;
  @Field()
  override memberPlanID!: string;
  @Field()
  override paymentMethodID!: string;
}

@ArgsType()
export class ImportPublicSubscriptionInput extends OmitType(
  CreatePublicSubscriptionInput,
  [] as const,
  ArgsType
) {}

@ArgsType()
export class UpdatePublicSubscriptionInput extends PartialType(
  CreatePublicSubscriptionInput,
  ArgsType
) {
  @Field()
  id!: string;
}

@ArgsType()
export class CancelPublicSubscriptionInput extends PickType(
  SubscriptionDeactivation,
  ['reason'] as const,
  ArgsType
) {
  @Field()
  id!: string;
}

@InputType()
export class SubscriptionFilter {
  @Field(() => DateFilter, { nullable: true })
  startsAtFrom?: DateFilter;
  @Field(() => DateFilter, { nullable: true })
  startsAtTo?: DateFilter;
  @Field(() => DateFilter, { nullable: true })
  paidUntilFrom?: DateFilter;
  @Field(() => DateFilter, { nullable: true })
  paidUntilTo?: DateFilter;
  @Field(() => DateFilter, { nullable: true })
  deactivationDateFrom?: DateFilter;
  @Field(() => DateFilter, { nullable: true })
  deactivationDateTo?: DateFilter;
  @Field(() => DateFilter, { nullable: true })
  cancellationDateFrom?: DateFilter;
  @Field(() => DateFilter, { nullable: true })
  cancellationDateTo?: DateFilter;

  @Field(() => String, { nullable: true })
  deactivationReason?: SubscriptionDeactivationReason;

  @Field({ nullable: true })
  autoRenew?: boolean;

  @Field({ nullable: true })
  paymentMethodID?: string;

  @Field({ nullable: true })
  memberPlanID?: string;

  @Field(() => PaymentPeriodicity, { nullable: true })
  paymentPeriodicity?: PaymentPeriodicity;

  @Field({ nullable: true })
  userHasAddress?: boolean;

  @Field({ nullable: true })
  userID?: string;

  @Field(() => [String], { nullable: true })
  userIDs?: string[];

  @Field(() => [String], { nullable: true })
  subscriptionIDs?: string[];

  @Field({ nullable: true })
  extendable?: boolean;
}

@ArgsType()
export class SubscriptionListArgs {
  @Field(() => SubscriptionFilter, { nullable: true })
  filter?: SubscriptionFilter;

  @Field(type => SubscriptionSort, {
    nullable: true,
    defaultValue: SubscriptionSort.ModifiedAt,
  })
  sort?: SubscriptionSort;

  @Field(type => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Ascending,
  })
  order?: SortOrder;

  @Field(type => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(type => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}

@ArgsType()
export class SubscriptionsCSVArgs extends OmitType(
  SubscriptionFilter,
  [] as const,
  ArgsType
) {}
