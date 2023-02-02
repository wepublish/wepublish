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
  subscribe: MailTemplateRef
  @Field(type => MailTemplateRef, {nullable: true})
  invoiceCreation: MailTemplateRef
  @Field(type => MailTemplateRef, {nullable: true})
  renewalSuccess: MailTemplateRef
  @Field(type => MailTemplateRef, {nullable: true})
  renewalFailed: MailTemplateRef
  @Field(type => SubscriptionInterval, {nullable: true})
  deactivationUnpaid: SubscriptionInterval
  @Field(type => MailTemplateRef, {nullable: true})
  deactivationByUser: MailTemplateRef
  @Field(type => SubscriptionInterval, {nullable: true})
  reactivation: SubscriptionInterval
  @Field(type => [SubscriptionInterval])
  additionalIntervals: SubscriptionInterval[]
}
