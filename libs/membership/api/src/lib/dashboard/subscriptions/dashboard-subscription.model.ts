import {Field, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity, SubscriptionDeactivationReason} from '@prisma/client'

registerEnumType(SubscriptionDeactivationReason, {
  name: 'SubscriptionDeactivationReason'
})

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity'
})

@ObjectType()
export class DashboardSubscription {
  @Field()
  startsAt!: Date

  @Field({nullable: true})
  endsAt?: Date

  @Field({nullable: true})
  deactivationDate?: Date

  @Field({nullable: true})
  renewsAt?: Date

  @Field()
  memberPlan!: string

  @Field(type => PaymentPeriodicity)
  paymentPeriodicity!: PaymentPeriodicity

  @Field(type => Int)
  monthlyAmount!: number

  @Field(type => SubscriptionDeactivationReason, {nullable: true})
  reasonForDeactivation?: SubscriptionDeactivationReason
}
