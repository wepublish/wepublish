import {ArgsType, Field, InputType, Int, registerEnumType} from '@nestjs/graphql'
import type {PaymentPeriodicity as PaymentPeriodicityType} from '@prisma/client'
import {PaymentPeriodicity} from '@prisma/client'
import {GraphQLSlug, PublicPropertyInput} from '@wepublish/utils/api'

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

@ArgsType()
export class CreateSubscriptionArgs {
  @Field({nullable: true})
  memberPlanID?: string

  @Field(() => GraphQLSlug, {nullable: true})
  memberPlanSlug?: string

  @Field()
  autoRenew!: boolean

  @Field(() => PaymentPeriodicity)
  paymentPeriodicity!: PaymentPeriodicity

  @Field(() => Int)
  monthlyAmount!: number

  @Field({nullable: true})
  paymentMethodID?: string

  @Field(() => GraphQLSlug, {nullable: true})
  paymentMethodSlug?: string

  @Field(() => [PublicPropertyInput], {nullable: true})
  subscriptionProperties?: PublicPropertyInput[]

  @Field({nullable: true})
  successURL?: string

  @Field({nullable: true})
  failureURL?: string

  @Field({nullable: true})
  deactivateSubscriptionId?: string
}
