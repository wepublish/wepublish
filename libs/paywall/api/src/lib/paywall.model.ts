import {ArgsType, Field, ObjectType, OmitType, PartialType} from '@nestjs/graphql'
import {MemberPlan} from '@wepublish/membership/api'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Descendant} from 'slate'

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

  @Field()
  anyMemberPlan!: boolean

  @Field()
  active!: boolean

  @Field(() => [MemberPlan])
  memberPlans!: MemberPlan[]
}

@ArgsType()
export class CreatePaywallInput extends OmitType(
  Paywall,
  ['id', 'memberPlans', 'createdAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field(() => [String], {defaultValue: []})
  memberPlanIds!: string[]
}

@ArgsType()
export class UpdatePaywallInput extends PartialType(CreatePaywallInput, ArgsType) {
  @Field()
  id!: string
}
