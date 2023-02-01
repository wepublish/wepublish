import {Field, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity} from '@wepublish/editor/api'

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
  id: number
  @Field()
  name: string
}

@ObjectType()
class PaymentMethodRef {
  @Field()
  id: number
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
class SubscriptionFlow {
  @Field()
  id: number
  @Field()
  default: boolean
  @Field(type => MemberPlanRef, {nullable: true})
  memberPlan: MemberPlanRef
  @Field(type => [PaymentMethodRef])
  paymentMethods: PaymentMethodRef[]
  @Field(type => [PaymentPeriodicity])
  periodicities: [PaymentPeriodicity]
  @Field(type => [Boolean])
  autoRenewal: boolean[]
  @Field(type => MailTemplateRef, {nullable: true})
  subscribe: MailTemplateRef
  @Field(type => SubscriptionInterval, {nullable: true})
  invoiceCreation: SubscriptionInterval
  @Field(type => SubscriptionInterval, {nullable: true})
  renewalSuccess: SubscriptionInterval
  @Field(type => SubscriptionInterval, {nullable: true})
  renewalFailed: SubscriptionInterval
  @Field(type => SubscriptionInterval, {nullable: true})
  deactivationUnpaid: SubscriptionInterval
  @Field(type => SubscriptionInterval, {nullable: true})
  deactivationByUser: SubscriptionInterval
  @Field(type => SubscriptionInterval, {nullable: true})
  reactivation: SubscriptionInterval
  @Field(type => [SubscriptionInterval])
  additionalIntervals: SubscriptionInterval[]
}

@ObjectType()
export class SubscriptionFlows {
  @Field(type => [SubscriptionFlow])
  subscriptionFlows: SubscriptionFlow[]
}
