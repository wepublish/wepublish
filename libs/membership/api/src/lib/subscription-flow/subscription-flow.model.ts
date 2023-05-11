import {Field, InputType, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity, SubscriptionEvent} from '@prisma/client'

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity'
})

registerEnumType(SubscriptionEvent, {
  name: 'SubscriptionEvent'
})

@ObjectType()
export class MailTemplateRef {
  @Field()
  id!: string
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
  @Field()
  id!: string
  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number
  @Field(type => MailTemplateRef, {nullable: true})
  mailTemplate!: MailTemplateRef | null
  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent
}

@ObjectType()
export class SubscriptionFlowModel {
  @Field()
  id!: string
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
  @Field(() => Int)
  numberOfSubscriptions!: number
}

@InputType()
export class SubscriptionIntervalCreateInput {
  @Field()
  subscriptionFlowId!: string
  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number
  @Field({nullable: true})
  mailTemplateId?: string
  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent
}

@InputType()
export class SubscriptionIntervalUpdateInput {
  @Field()
  id!: string
  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number
  @Field({nullable: true})
  mailTemplateId?: string
}

@InputType()
export class SubscriptionIntervalsUpdateInput {
  intervals: SubscriptionIntervalUpdateInput[]

  constructor(intervals: SubscriptionIntervalUpdateInput[]) {
    this.intervals = intervals
  }
}

@InputType()
export class SubscriptionIntervalDeleteInput {
  @Field()
  id!: string
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
  @Field()
  id!: string
  @Field(type => [String])
  paymentMethodIds!: string[]
  @Field(type => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[]
  @Field(type => [Boolean])
  autoRenewal!: boolean[]
}
