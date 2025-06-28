import {ArgsType, Field, ObjectType, OmitType, PartialType, InputType} from '@nestjs/graphql'
import {MemberPlan} from '@wepublish/membership/api'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Descendant} from 'slate'

@ObjectType()
export class PaywallBypass {
  @Field()
  id!: string

  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  modifiedAt!: Date

  @Field()
  token!: string

  @Field()
  paywallId!: string
}

@ObjectType()
export class Paywall {
  @Field()
  id!: string

  @Field(() => Date)
  createdAt!: Date

  @Field(() => Date)
  modifiedAt!: Date

  @Field({nullable: true})
  name?: string

  @Field(() => GraphQLRichText, {nullable: true})
  description?: Descendant[]

  @Field(() => GraphQLRichText, {nullable: true})
  circumventDescription?: Descendant[]

  @Field()
  anyMemberPlan!: boolean

  @Field()
  active!: boolean

  @Field(() => [MemberPlan])
  memberPlans!: MemberPlan[]

  @Field(() => [PaywallBypass])
  bypasses!: PaywallBypass[]
}

@InputType()
export class CreatePaywallBypassInput {
  @Field()
  token!: string
}

@InputType()
export class UpdatePaywallBypassInput {
  @Field()
  id!: string

  @Field()
  token!: string
}

@ArgsType()
export class CreatePaywallInput extends OmitType(
  Paywall,
  ['id', 'memberPlans', 'bypasses', 'createdAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field(() => [String], {defaultValue: []})
  memberPlanIds!: string[]
}

@ArgsType()
export class UpdatePaywallInput extends PartialType(CreatePaywallInput, ArgsType) {
  @Field()
  id!: string

  @Field(() => [String], {nullable: true})
  bypassTokens?: string[]
}
