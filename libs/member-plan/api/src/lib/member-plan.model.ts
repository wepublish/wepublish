import {Field, InputType, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {PaginatedType} from '@wepublish/utils/api'
import {HasImage, Image} from '@wepublish/image/api'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Descendant} from 'slate'
import {PaymentMethod} from '@wepublish/payment-method/api'
import {PaymentPeriodicity} from '@prisma/client'

export enum MemberPlanSort {
  createdAt = 'createdAt',
  modifiedAt = 'modifiedAt'
}

registerEnumType(MemberPlanSort, {
  name: 'MemberPlanSort'
})

enum Currency {
  CHF = 'CHF',
  EUR = 'EUR'
}

registerEnumType(Currency, {
  name: 'Currency'
})

@ObjectType()
export class AvailablePaymentMethod {
  paymentMethodIDs!: string[]

  @Field(() => [PaymentMethod])
  paymentMethods!: PaymentMethod[]

  @Field(() => [PaymentPeriodicity])
  paymentPeriodicities!: PaymentPeriodicity[]

  @Field()
  forceAutoRenewal!: boolean
}

@ObjectType({
  implements: () => [HasImage]
})
export class MemberPlan {
  @Field()
  id!: string

  @Field()
  name!: string

  @Field()
  slug!: string

  image?: Image

  @Field(() => GraphQLRichText, {nullable: true})
  description?: Descendant[]

  @Field(() => GraphQLRichText, {nullable: true})
  shortDescription?: Descendant[]

  @Field(() => [String], {nullable: true})
  tags?: string[]

  @Field(() => Currency)
  currency!: Currency

  @Field(() => Int)
  amountPerMonthMin!: number

  @Field(() => Int, {nullable: true})
  amountPerMonthTarget?: number

  @Field(() => Int, {nullable: true})
  maxCount?: number

  @Field()
  extendable!: boolean

  @Field(() => [AvailablePaymentMethod])
  availablePaymentMethods!: AvailablePaymentMethod[]

  @Field({nullable: true})
  successPageId?: string

  @Field({nullable: true})
  failPageId?: string

  @Field({nullable: true})
  confirmationPageId?: string
}

@ObjectType()
export class MemberPlanConnection extends PaginatedType(MemberPlan) {}

@InputType()
export class MemberPlanFilter {
  @Field({nullable: true})
  name?: string

  @Field({nullable: true})
  active?: boolean

  @Field(() => [String], {nullable: true})
  tags?: string[]
}
