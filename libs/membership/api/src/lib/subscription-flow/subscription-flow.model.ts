import {Field, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity} from '@prisma/client'

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity'
})

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
class SubscriptionInterval {
  @Field()
  daysAwayFromEnding: number
  @Field(type => MailTemplateRef)
  mailTemplate: MailTemplateRef
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
