import {Field, InputType, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity, SubscriptionEvent} from '@prisma/client'

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity'
})

registerEnumType(SubscriptionEvent, {
  name: 'SubscriptionEvent'
})

// Output

@ObjectType()
class MailTemplateRef {
  @Field(() => Int)
  id!: number
  @Field()
  name!: string
}

@ObjectType()
class MemberPlanRef {
  @Field()
  id!: string
  @Field()
  name!: string
}

@ObjectType()
export class PaymentMethodRef {
  @Field()
  id!: string
  @Field()
  name!: string
}

@ObjectType()
export class SubscriptionInterval {
  @Field(() => Int)
  id!: number
  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number
  @Field(type => MailTemplateRef, {nullable: true})
  mailTemplate!: MailTemplateRef | null
  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent
}

@ObjectType()
export class SubscriptionFlowModel {
  @Field(() => Int)
  id!: number
  @Field()
  default!: boolean
  @Field(type => MemberPlanRef, {nullable: true})
  memberPlan?: MemberPlanRef
  @Field(type => [PaymentMethodRef])
  paymentMethods!: PaymentMethodRef[]
  @Field(type => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[]
  @Field(type => [Boolean])
  autoRenewal!: boolean[]
  @Field(type => [SubscriptionInterval])
  intervals!: SubscriptionInterval[]
}

// Input

@InputType()
export class SubscriptionIntervalCreateInput {
  @Field(() => Int)
  subscriptionFlowId?: number
  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number
  @Field(() => Int, {nullable: true})
  mailTemplateId!: number | null
  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent
}

@InputType()
export class SubscriptionIntervalUpdateInput {
  @Field(() => Int)
  id!: number
  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number
  @Field(() => Int, {nullable: true})
  mailTemplateId!: number | null
}

@InputType()
export class SubscriptionIntervalDeleteInput {
  @Field(() => Int)
  id!: number
}

@InputType()
export class SubscriptionFlowModelCreateInput {
  @Field()
  memberPlanId!: string
  @Field(type => [String])
  paymentMethodIds!: string[]
  @Field(type => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[]
  @Field(type => [Boolean])
  autoRenewal!: boolean[]
}

@InputType()
export class SubscriptionFlowModelUpdateInput {
  @Field(() => Int)
  id!: number
  @Field(type => [String])
  paymentMethodIds!: string[]
  @Field(type => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[]
  @Field(type => [Boolean])
  autoRenewal!: boolean[]
}
