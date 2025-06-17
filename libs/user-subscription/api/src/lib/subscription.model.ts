import {Field, InputType, Int, registerEnumType} from '@nestjs/graphql'
import type {PaymentPeriodicity as PaymentPeriodicityType} from '@prisma/client'
import {PaymentPeriodicity} from '@prisma/client'

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity'
})

@InputType('SubscriptionInput')
export class UserSubscriptionInput {
  @Field()
  id!: string

  @Field()
  memberPlanID!: string

  @Field(() => PaymentPeriodicity)
  paymentPeriodicity: PaymentPeriodicityType

  @Field(() => Int)
  monthlyAmount: number

  @Field()
  autoRenew: boolean

  @Field()
  paymentMethodID: string
}
