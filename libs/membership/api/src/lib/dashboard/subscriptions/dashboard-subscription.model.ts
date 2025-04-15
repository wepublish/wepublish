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

@ObjectType()
export class DailySubscriptionStatsUser {
  @Field()
  id!: string

  @Field()
  name!: string

  @Field(() => String, {nullable: true})
  firstName?: string | null
}

@ObjectType()
export class DailySubscriptionStats {
  @Field()
  date!: Date

  @Field()
  total!: number

  @Field()
  created!: number

  @Field(type => [DailySubscriptionStatsUser])
  usersCreated!: DailySubscriptionStatsUser[]

  @Field()
  renewed!: number

  @Field(type => [DailySubscriptionStatsUser])
  usersRenewed!: DailySubscriptionStatsUser[]

  @Field()
  deactivated!: number

  @Field(type => [DailySubscriptionStatsUser])
  usersDeactivated!: DailySubscriptionStatsUser[]
}

@ObjectType()
export class SubscriptionStats {
  @Field(type => [DailySubscriptionStats])
  daily!: DailySubscriptionStats[]
}
