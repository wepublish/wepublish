import {
  ObjectType,
  Field,
  ID,
  InputType,
  ArgsType,
  registerEnumType,
  OmitType,
  Int,
  Directive
} from '@nestjs/graphql'
import {ListingArgsType} from '@wepublish/utils/api'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {Image} from '@wepublish/image/api'

@ObjectType()
@Directive('@key(fields: "id")')
export class MemberPlan {
  @Field(() => ID)
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  name!: string

  @Field()
  slug!: string

  @Field(() => [String])
  tags!: string[]

  @Field(() => GraphQLRichText)
  description!: string

  @Field()
  active!: boolean

  @Field(() => Int)
  amountPerMonthMin!: number

  @Field()
  extendable!: boolean

  @Field(() => Int, {nullable: true})
  maxCount?: number

  @Field({nullable: true})
  imageID?: string

  @Field({nullable: true})
  image?: Image

  // @Field(() => [AvailablePaymentMethod])
  // availablePaymentMethods!: AvailablePaymentMethod[];
}

export enum MemberPlanSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt'
}

registerEnumType(MemberPlanSort, {
  name: 'MemberPlanSort'
})

@InputType()
export class MemberPlansFilter {
  @Field({nullable: true})
  name?: string

  @Field({nullable: true})
  active?: boolean

  @Field(() => [String], {nullable: true})
  tags?: string[]
}

@ArgsType()
export class GetMemberPlansArgs extends ListingArgsType {
  @Field(() => MemberPlansFilter, {nullable: true})
  filter?: MemberPlansFilter

  @Field(() => MemberPlanSort, {nullable: true})
  sort?: MemberPlanSort
}

@InputType()
export class ActiveMemberPlansFilter extends OmitType(
  MemberPlansFilter,
  ['active'] as const,
  InputType
) {}

@ArgsType()
export class GetActiveMemberPlansArgs extends ListingArgsType {
  @Field(() => ActiveMemberPlansFilter, {nullable: true})
  filter?: ActiveMemberPlansFilter

  @Field(() => MemberPlanSort, {nullable: true})
  sort?: MemberPlanSort
}

@InputType()
export class AvailablePaymentMethodInput {
  // Define the fields according to Prisma schema
}

@InputType()
export class CreateMemberPlanInput {
  @Field()
  name!: string

  @Field()
  slug!: string

  @Field(() => [String])
  tags!: string[]

  @Field()
  description!: string

  @Field()
  active!: boolean

  @Field()
  amountPerMonthMin!: number

  // @Field(() => [AvailablePaymentMethodInput])
  // availablePaymentMethods!: AvailablePaymentMethodInput[];

  @Field()
  extendable!: boolean

  @Field({nullable: true})
  maxCount?: number

  @Field({nullable: true})
  imageID?: string
}

@ArgsType()
export class CreateMemberPlanArgs {
  @Field()
  memberPlan!: CreateMemberPlanInput
}

@InputType()
export class UpdateMemberPlanInput extends CreateMemberPlanInput {
  @Field(() => ID)
  id!: string
}

@ArgsType()
export class UpdateMemberPlanArgs {
  @Field()
  memberPlan!: UpdateMemberPlanInput
}

@ArgsType()
export class MemberPlanByIdArgs {
  @Field(() => ID)
  id!: string
}

@ArgsType()
export class MemberPlanBySlugArgs {
  @Field()
  slug!: string
}
