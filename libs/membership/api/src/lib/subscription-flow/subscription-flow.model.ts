import {Field, InputType, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity, SubscriptionEvent} from '@prisma/client'

export enum SubscriptionIntervalTypes {
  ADDITIONAL_INTERVAL,
  CREATE_INVOICES,
  DEACTIVATION_UNPAID_INVOICE
}

registerEnumType(SubscriptionIntervalTypes, {
  name: 'SubscriptionIntervalTypes'
})

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
class PaymentMethodRef {
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
  @Field(type => MailTemplateRef)
  mailTemplate!: MailTemplateRef
  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent
}

@ObjectType()
export class SubscriptionIntervalCreated {
  @Field(() => Int)
  id!: number
  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number
  @Field(type => Int)
  mailTemplateId!: number
  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent
}

@ObjectType()
export class SubscriptionFlowModel {
  @Field(() => Int)
  id!: number
  @Field()
  default!: boolean
  @Field(type => MemberPlanRef)
  memberPlan!: MemberPlanRef
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
export class MailTemplateRefInput {
  @Field(() => Int)
  id!: number
}

@InputType()
class MemberPlanRefInput {
  @Field()
  id!: string
}

@InputType()
class PaymentMethodRefInput {
  @Field()
  id!: string
}

@InputType()
export class AdditionalIntervalCreateInput {
  @Field(() => Int)
  subscriptionFlowId!: number
  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number
  @Field(type => MailTemplateRef)
  mailTemplate!: MailTemplateRef
  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent
}

@InputType()
export class AdditionalIntervalDeleteInput {
  @Field(() => Int)
  additionalIntervalId!: number
}

@InputType()
export class SubscriptionIntervalCreateInput {
  @Field(() => Int)
  subscriptionFlowId?: number
  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number
  @Field(() => Int)
  mailTemplateId!: number
  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent
}

@InputType()
export class SubscriptionFlowModelCreateInput {
  @Field(type => MemberPlanRefInput)
  memberPlan!: MemberPlanRefInput
  @Field(type => [PaymentMethodRefInput])
  paymentMethods!: PaymentMethodRefInput[]
  @Field(type => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[]
  @Field(type => [Boolean])
  autoRenewal!: boolean[]
}

@InputType()
export class SubscriptionFlowModelUpdateInput {
  @Field(() => Int)
  id!: number
  @Field(type => [PaymentMethodRefInput])
  paymentMethods!: PaymentMethodRefInput[]
  @Field(type => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[]
  @Field(type => [Boolean])
  autoRenewal!: boolean[]
}
