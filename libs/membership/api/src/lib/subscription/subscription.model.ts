import {Field, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity} from '@prisma/client'
import {MemberPlan} from '@wepublish/member-plan/api'
import {HasPaymentMethod, PaymentMethod} from '@wepublish/payment-method/api'
import {Property} from '@wepublish/utils/api'
import {SubscriptionDeactivationReason} from '.prisma/client'
import {HasUser, User} from '@wepublish/user/api'

registerEnumType(SubscriptionDeactivationReason, {
  name: 'SubscriptionDeactivationReason'
})

@ObjectType()
export class SubscriptionDeactivation {
  @Field()
  date!: Date

  @Field(() => SubscriptionDeactivationReason)
  reason!: SubscriptionDeactivationReason
}

@ObjectType({
  implements: () => [HasUser, HasPaymentMethod]
})
export class PublicSubscription {
  @Field()
  id!: string

  memberPlanID!: string

  @Field(() => MemberPlan)
  memberPlan!: MemberPlan

  @Field(() => PaymentPeriodicity)
  paymentPeriodicity!: PaymentPeriodicity

  @Field(() => Int)
  monthlyAmount!: number

  @Field(() => Boolean)
  autoRenew!: boolean

  @Field()
  startsAt!: Date

  @Field(() => Date, {nullable: true})
  paidUntil?: Date

  paymentMethodID!: string
  paymentMethod!: PaymentMethod

  @Field(() => Boolean)
  extendable!: boolean

  @Field(() => [Property])
  properties!: Property[]

  @Field(() => SubscriptionDeactivation, {nullable: true})
  deactivation?: SubscriptionDeactivation

  @Field(() => String)
  url!: string

  @Field(() => Boolean)
  canExtend!: boolean

  userID!: string
  user!: User
}
