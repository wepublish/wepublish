import {Field, InputType, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity} from '@prisma/client'

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity'
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
  @Field(() => Int)
  daysAwayFromEnding!: number
  @Field(type => MailTemplateRef)
  mailTemplate!: MailTemplateRef
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
  @Field(type => MailTemplateRef, {nullable: true})
  subscribeMailTemplate?: MailTemplateRef
  @Field(type => SubscriptionInterval, {nullable: true})
  invoiceCreationMailTemplate?: SubscriptionInterval
  @Field(type => MailTemplateRef, {nullable: true})
  renewalSuccessMailTemplate?: MailTemplateRef
  @Field(type => MailTemplateRef, {nullable: true})
  renewalFailedMailTemplate?: MailTemplateRef
  @Field(type => SubscriptionInterval, {nullable: true})
  deactivationUnpaidMailTemplate?: SubscriptionInterval
  @Field(type => MailTemplateRef, {nullable: true})
  deactivationByUserMailTemplate?: MailTemplateRef
  @Field(type => MailTemplateRef, {nullable: true})
  reactivationMailTemplate?: MailTemplateRef
  @Field(type => [SubscriptionInterval])
  additionalIntervals!: SubscriptionInterval[]
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
export class SubscriptionIntervalCreateInput {
  @Field(() => Int)
  daysAwayFromEnding!: number
  @Field(type => MailTemplateRefInput)
  mailTemplate!: MailTemplateRefInput
}

@InputType()
export class AdditionalIntervalCreateInput {
  @Field(() => Int)
  subscriptionFlowId!: number
  @Field(() => Int)
  daysAwayFromEnding!: number
  @Field(type => MailTemplateRefInput)
  mailTemplate!: MailTemplateRefInput
}

@InputType()
export class AdditionalIntervalDeleteInput {
  @Field(() => Int)
  subscriptionFlowId!: number
  @Field(() => Int)
  additionalIntervalId!: number
}

@InputType()
export class SubscriptionIntervalUpdateInput {
  @Field(() => Int, {nullable: true})
  id?: number
  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number
  @Field(() => MailTemplateRefInput, {nullable: true})
  mailTemplate?: MailTemplateRefInput
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
  @Field(type => MailTemplateRefInput, {nullable: true})
  subscribeMailTemplate?: MailTemplateRefInput
  @Field(type => SubscriptionIntervalCreateInput, {nullable: true})
  invoiceCreationMailTemplate?: SubscriptionIntervalCreateInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  renewalSuccessMailTemplate?: MailTemplateRefInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  renewalFailedMailTemplate?: MailTemplateRefInput
  @Field(type => SubscriptionIntervalCreateInput, {nullable: true})
  deactivationUnpaidMailTemplate?: SubscriptionIntervalCreateInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  deactivationByUserMailTemplate?: MailTemplateRefInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  reactivationMailTemplate?: MailTemplateRefInput
  @Field(type => [SubscriptionIntervalCreateInput])
  additionalIntervals!: SubscriptionIntervalCreateInput[]
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
  @Field(type => MailTemplateRefInput, {nullable: true})
  subscribeMailTemplate?: MailTemplateRefInput
  @Field(type => Number, {nullable: true})
  invoiceCreationIntervalId?: number
  @Field(type => MailTemplateRefInput, {nullable: true})
  renewalSuccessMailTemplate?: MailTemplateRefInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  renewalFailedMailTemplate?: MailTemplateRefInput
  @Field(type => Number, {nullable: true})
  deactivationUnpaidIntervalId?: number
  @Field(type => MailTemplateRefInput, {nullable: true})
  deactivationByUserMailTemplate?: MailTemplateRefInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  reactivationMailTemplate?: MailTemplateRefInput
}
