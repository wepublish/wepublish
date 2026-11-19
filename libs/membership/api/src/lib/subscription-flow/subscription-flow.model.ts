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

  @Field({
    description:
      'Users in letter mode get this event printed instead of mailed.',
  })
  sendAsLetter!: boolean;
}

@ObjectType({
  description:
    'The earliest day an event of a flow may lie on, and what holds it there.',
})
export class SubscriptionFlowEarliestDay {
  @Field(() => Int, {
    description:
      'Days away from the end of the subscription, negative: before it ends.',
  })
  days!: number;

  @Field(() => PaymentPeriodicity, {
    nullable: true,
    description:
      'The shortest periodicity a member plan flow applies to, which sets the day. Null for the default flow: its day is fixed.',
  })
  periodicity!: PaymentPeriodicity | null;
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

  @Field(() => SubscriptionFlowEarliestDay, {
    description:
      'The earliest day an event of this flow may lie on. Follows from the shortest periodicity the flow applies to.',
  })
  earliestDay!: SubscriptionFlowEarliestDay;
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

  @Field({ nullable: true })
  sendAsLetter?: boolean;
}

@ArgsType()
export class SubscriptionIntervalUpdateInput extends PartialType(
  PickType(SubscriptionIntervalCreateInput, [
    'daysAwayFromEnding',
    'mailTemplateId',
    'sendAsLetter',
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
