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

  @Field({
    description:
      'A flow for the matching subscriptions of every member plan. It comes after the flows of the plan itself and before the default flow, and has no memberPlan.',
  })
  allMemberPlans!: boolean;

  @Field({
    description:
      'An inactive flow is skipped: its subscriptions fall to the next flow. The default flow is always active.',
  })
  active!: boolean;

  @Field(() => MemberPlan, { nullable: true })
  memberPlan?: MemberPlan;

  @Field(() => [PaymentMethod])
  paymentMethods!: PaymentMethod[];

  @Field(() => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[];

  @Field(() => [Boolean])
  autoRenewal!: boolean[];

  @Field(() => [Boolean], {
    description: `Whom the flow is for: legacy subscriptions (true, imported and not paid for here yet), all the others (false), or both.`,
  })
  legacy!: boolean[];

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

@InputType({
  description:
    'What a list of flows is narrowed by. Each given field narrows the count of every flow to the subscriptions with one of its values.',
})
export class SubscriptionFlowCountFilter {
  @Field(() => [String], { nullable: true })
  memberPlanIds?: string[];

  @Field(() => [String], { nullable: true })
  paymentMethodIds?: string[];

  @Field(() => [PaymentPeriodicity], { nullable: true })
  periodicities?: PaymentPeriodicity[];

  @Field(() => [Boolean], { nullable: true })
  autoRenewal?: boolean[];
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
  @Field({
    nullable: true,
    description:
      'The member plan the flow is for. Leave out with allMemberPlans.',
  })
  memberPlanId?: string;

  @Field({
    nullable: true,
    description:
      'Creates the flow for the matching subscriptions of every member plan instead of one.',
  })
  allMemberPlans?: boolean;

  @Field(() => [String])
  paymentMethodIds!: string[];

  @Field(() => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[];

  @Field(() => [Boolean])
  autoRenewal!: boolean[];

  @Field(() => [Boolean], {
    nullable: true,
    description: `Whom the flow is for: legacy subscriptions (true), all the others (false), or both, which is the default. Anything but both needs the legacy-subscriptions feature.`,
  })
  legacy?: boolean[];
}

@ArgsType()
export class SubscriptionFlowModelUpdateInput extends PartialType(
  OmitType(SubscriptionFlowModelCreateInput, [
    'memberPlanId',
    'allMemberPlans',
  ] as const),
  ArgsType
) {
  @Field()
  id!: string;
}
