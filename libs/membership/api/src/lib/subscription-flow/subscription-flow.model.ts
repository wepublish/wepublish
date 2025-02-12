import {
  ArgsType,
  Field,
  Int,
  ObjectType,
  PartialType,
  OmitType,
  registerEnumType,
  PickType
} from '@nestjs/graphql'
import {PaymentPeriodicity, SubscriptionEvent} from '@prisma/client'
import {Image} from '@wepublish/image/api'
import {GraphQLSlug} from '@wepublish/utils/api'
import {GraphQLRichText} from '@wepublish/richtext/api'

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity'
})

registerEnumType(SubscriptionEvent, {
  name: 'SubscriptionEvent'
})

@ObjectType()
export class MailTemplateRef {
  @Field()
  id!: string

  @Field()
  name!: string
}

enum Currency {
  CHF = 'CHF',
  EUR = 'EUR'
}

registerEnumType(Currency, {
  name: 'Currency'
})

@ObjectType()
class AvailablePaymentMethod {
  @Field(() => [PaymentMethod])
  paymentMethods!: PaymentMethod[]

  @Field(() => [PaymentPeriodicity])
  paymentPeriodicities!: PaymentPeriodicity[]

  @Field()
  forceAutoRenewal!: boolean
}

@ObjectType()
class MemberPlan {
  @Field()
  id!: string

  @Field()
  name!: string

  @Field()
  slug!: string

  @Field(() => Image, {nullable: true})
  image?: Image

  @Field(() => GraphQLRichText, {nullable: true})
  description?: Node[]

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

  @Field(() => String, {nullable: true})
  successPageId?: string

  // @Field({nullable: true})
  // successPage?: Page

  @Field(() => String, {nullable: true})
  failPageId?: string

  // @Field({nullable: true})
  // failPage?: Page

  @Field(() => String, {nullable: true})
  confirmationPageId?: string

  // @Field({nullable: true})
  // confirmationPage?: Page
}

@ObjectType()
export class PaymentMethod {
  @Field()
  id!: string

  @Field()
  name!: string

  @Field()
  paymentProviderID!: string

  @Field(() => GraphQLSlug)
  slug!: typeof GraphQLSlug

  @Field()
  description!: string

  @Field({nullable: true})
  imageId?: string

  @Field(() => Image, {nullable: true})
  image?: Image
}

@ObjectType()
export class SubscriptionInterval {
  @Field()
  id!: string

  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number

  @Field(() => MailTemplateRef, {nullable: true})
  mailTemplate!: MailTemplateRef | null

  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent
}

@ObjectType()
export class SubscriptionFlowModel {
  @Field()
  id!: string

  @Field()
  default!: boolean

  @Field(() => MemberPlan, {nullable: true})
  memberPlan?: MemberPlan

  @Field(() => [PaymentMethod])
  paymentMethods!: PaymentMethod[]

  @Field(() => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[]

  @Field(() => [Boolean])
  autoRenewal!: boolean[]

  @Field(() => [SubscriptionInterval])
  intervals!: SubscriptionInterval[]

  @Field(() => Int)
  numberOfSubscriptions!: number
}

@ArgsType()
export class SubscriptionIntervalCreateInput {
  @Field()
  subscriptionFlowId!: string

  @Field(() => Int, {nullable: true})
  daysAwayFromEnding?: number

  @Field({nullable: true})
  mailTemplateId?: string

  @Field(() => SubscriptionEvent)
  event!: SubscriptionEvent
}

@ArgsType()
export class SubscriptionIntervalUpdateInput extends PartialType(
  PickType(SubscriptionIntervalCreateInput, ['daysAwayFromEnding', 'mailTemplateId'] as const),
  ArgsType
) {
  @Field()
  id!: string
}

@ArgsType()
export class SubscriptionFlowModelCreateInput {
  @Field()
  memberPlanId!: string

  @Field(() => [String])
  paymentMethodIds!: string[]

  @Field(() => [PaymentPeriodicity])
  periodicities!: PaymentPeriodicity[]

  @Field(() => [Boolean])
  autoRenewal!: boolean[]
}

@ArgsType()
export class SubscriptionFlowModelUpdateInput extends PartialType(
  OmitType(SubscriptionFlowModelCreateInput, ['memberPlanId'] as const),
  ArgsType
) {
  @Field()
  id!: string
}
