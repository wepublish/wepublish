import {Field, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaymentPeriodicity, SubscriptionDeactivationReason} from '@prisma/client'

registerEnumType(SubscriptionDeactivationReason, {
  name: 'SubscriptionDeactivationReason'
})

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity'
})

@ObjectType()
export class PeriodicJobModel {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  date!: Date

  @Field({nullable: true})
  executionTime?: Date | null

  @Field({nullable: true})
  successfullyFinished?: Date | null

  @Field({nullable: true})
  finishedWithError?: Date | null

  @Field()
  tries!: number

  @Field({nullable: true})
  error?: string | null
}
