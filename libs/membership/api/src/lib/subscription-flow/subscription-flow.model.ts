import {Field, InputType, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity} from '@prisma/client'

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity'
})

// Output

@ObjectType()
class MailTemplateRef {
  @Field()
  id: number
  @Field()
  name: string
}

@ObjectType()
class MemberPlanRef {
  @Field()
  id: string
  @Field()
  name: string
}

@ObjectType()
class PaymentMethodRef {
  @Field()
  id: string
  @Field()
  name: string
}

@ObjectType()
export class SubscriptionInterval {
  @Field()
  id: number
  @Field()
  daysAwayFromEnding: number
  @Field(type => MailTemplateRef)
  mailTemplate: MailTemplateRef
  @Field()
  mailTemplateId: number
}

@ObjectType()
export class SubscriptionFlowModel {
  @Field()
  id: number
  @Field()
  default: boolean
  @Field(type => MemberPlanRef, {nullable: true})
  memberPlan: MemberPlanRef
  @Field(type => [PaymentMethodRef])
  paymentMethods: PaymentMethodRef[]
  @Field(type => [PaymentPeriodicity])
  periodicities: PaymentPeriodicity[]
  @Field(type => [Boolean])
  autoRenewal: boolean[]
  @Field(type => MailTemplateRef, {nullable: true})
  subscribeMailTemplate: MailTemplateRef
  @Field(type => SubscriptionInterval, {nullable: true})
  invoiceCreationMailTemplate: SubscriptionInterval
  @Field(type => MailTemplateRef, {nullable: true})
  renewalSuccessMailTemplate: MailTemplateRef
  @Field(type => MailTemplateRef, {nullable: true})
  renewalFailedMailTemplate: MailTemplateRef
  @Field(type => SubscriptionInterval, {nullable: true})
  deactivationUnpaidMailTemplate: SubscriptionInterval
  @Field(type => MailTemplateRef, {nullable: true})
  deactivationByUserMailTemplate: MailTemplateRef
  @Field(type => MailTemplateRef, {nullable: true})
  reactivationMailTemplate: MailTemplateRef
  @Field(type => [SubscriptionInterval])
  additionalIntervals: SubscriptionInterval[]
}

// Input

@InputType()
class MailTemplateRefInput {
  @Field()
  id: number
}

@InputType()
class MemberPlanRefInput {
  @Field()
  id: string
}

@InputType()
class PaymentMethodRefInput {
  @Field()
  id: string
}

@InputType()
class SubscriptionIntervalCreateInput {
  @Field()
  daysAwayFromEnding: number
  @Field()
  mailTemplateId: number
}
@InputType()
export class SubscriptionIntervalUpdateInput {
  @Field({nullable: true})
  id?: number
  @Field()
  daysAwayFromEnding: number
  @Field()
  mailTemplateId: number
}

@InputType()
export class SubscriptionFlowModelCreateInput {
  @Field(type => MemberPlanRefInput, {nullable: true})
  memberPlan: MemberPlanRefInput
  @Field(type => [PaymentMethodRefInput])
  paymentMethods: PaymentMethodRefInput[]
  @Field(type => [PaymentPeriodicity])
  periodicities: PaymentPeriodicity[]
  @Field(type => [Boolean])
  autoRenewal: boolean[]
  @Field(type => MailTemplateRefInput, {nullable: true})
  subscribeMailTemplate: MailTemplateRefInput
  @Field(type => SubscriptionIntervalCreateInput, {nullable: true})
  invoiceCreationMailTemplate: SubscriptionIntervalCreateInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  renewalSuccessMailTemplate: MailTemplateRefInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  renewalFailedMailTemplate: MailTemplateRefInput
  @Field(type => SubscriptionIntervalCreateInput, {nullable: true})
  deactivationUnpaidMailTemplate: SubscriptionIntervalCreateInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  deactivationByUserMailTemplate: MailTemplateRefInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  reactivationMailTemplate: MailTemplateRefInput
  @Field(type => [SubscriptionIntervalCreateInput])
  additionalIntervals: SubscriptionIntervalCreateInput[]
}

@InputType()
export class SubscriptionFlowModelUpdateInput {
  @Field()
  id: number
  @Field(type => [PaymentMethodRefInput])
  paymentMethods: PaymentMethodRefInput[]
  @Field(type => [PaymentPeriodicity])
  periodicities: PaymentPeriodicity[]
  @Field(type => [Boolean])
  autoRenewal: boolean[]
  @Field(type => MailTemplateRefInput, {nullable: true})
  subscribeMailTemplate: MailTemplateRefInput
  @Field(type => SubscriptionIntervalUpdateInput, {nullable: true})
  invoiceCreationMailTemplate: SubscriptionIntervalUpdateInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  renewalSuccessMailTemplate: MailTemplateRefInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  renewalFailedMailTemplate: MailTemplateRefInput
  @Field(type => SubscriptionIntervalUpdateInput, {nullable: true})
  deactivationUnpaidMailTemplate: SubscriptionIntervalUpdateInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  deactivationByUserMailTemplate: MailTemplateRefInput
  @Field(type => MailTemplateRefInput, {nullable: true})
  reactivationMailTemplate: MailTemplateRefInput
  @Field(type => [SubscriptionIntervalUpdateInput])
  additionalIntervals: SubscriptionIntervalUpdateInput[]
}
