import {Field, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity} from '@wepublish/editor/api'

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity'
})

@ObjectType()
class IdField {
  @Field()
  id: number
  @Field()
  name: string
}
@ObjectType()
class SubscriptionInterval {
  @Field()
  daysAwayFromEnding: number
  @Field(type => IdField)
  mailTemplate: IdField
}

@ObjectType()
class SubscriptionCommunicationFlow {
  @Field()
  id: number
  @Field()
  default: boolean
  @Field(type => IdField, {nullable: true})
  memberPlan: IdField
  @Field(type => [IdField])
  paymentMethods: IdField[]
  @Field(type => [PaymentPeriodicity])
  periodicities: [PaymentPeriodicity]
  @Field(type => [Boolean])
  autoRenewal: boolean[]
  @Field(type => IdField, {nullable: true})
  subscribe: IdField
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
export class SubscriptionCommunicationFlows {
  @Field(type => [SubscriptionCommunicationFlow])
  subscriptionCommunicationFlows: SubscriptionCommunicationFlow[]
}
