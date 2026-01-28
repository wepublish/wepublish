import {
  ArgsType,
  Field,
  Int,
  ObjectType,
  OmitType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaymentPeriodicity, SubscriptionEvent } from '@prisma/client';
import { MemberPlan } from '@wepublish/member-plan/api';
import { PaymentMethod } from '@wepublish/payment/api';

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity',
});

registerEnumType(SubscriptionEvent, {
  name: 'SubscriptionEvent',
});

@ObjectType()
export class MailTemplateRef {
  @Field()
  id!: string;

  @Field()
  name!: string;
}

@ObjectType()
export class SubscriptionInterval {
  @Field()
  id!: string;

  @Field(() => Int, { nullable: true })
  daysAwayFromEnding?: number;

  @Field(() => MailTemplateRef, { nullable: true })
  mailTemplate!: MailTemplateRef | null;

  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent;
}

@ObjectType()
export class SubscriptionFlowModel {
  @Field()
  id!: string;

  @Field()
  default!: boolean;

  @Field(() => MemberPlan, { nullable: true })
  memberPlan?: MemberPlan;

  @Field(() => [PaymentMethod])
  paymentMethods!: PaymentMethod[];

  @Field(() => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[];

  @Field(() => [Boolean])
  autoRenewal!: boolean[];

  @Field(() => [SubscriptionInterval])
  intervals!: SubscriptionInterval[];

  @Field(() => Int)
  numberOfSubscriptions!: number;
}

@ArgsType()
export class SubscriptionIntervalCreateInput {
  @Field()
  subscriptionFlowId!: string;

  @Field(() => Int, { nullable: true })
  daysAwayFromEnding?: number;

  @Field({ nullable: true })
  mailTemplateId?: string;

  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent;
}

@ArgsType()
export class SubscriptionIntervalUpdateInput extends PartialType(
  PickType(SubscriptionIntervalCreateInput, [
    'daysAwayFromEnding',
    'mailTemplateId',
  ] as const),
  ArgsType
) {
  @Field()
  id!: string;
}

@ArgsType()
export class SubscriptionFlowModelCreateInput {
  @Field()
  memberPlanId!: string;

  @Field(() => [String])
  paymentMethodIds!: string[];

  @Field(() => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[];

  @Field(() => [Boolean])
  autoRenewal!: boolean[];
}

@ArgsType()
export class SubscriptionFlowModelUpdateInput extends PartialType(
  OmitType(SubscriptionFlowModelCreateInput, ['memberPlanId'] as const),
  ArgsType
) {
  @Field()
  id!: string;
}
