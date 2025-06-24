import {ArgsType, Directive, Field, InputType, ObjectType, PickType} from '@nestjs/graphql'
import {
  CreateCrowdfundingGoalInput,
  CrowdfundingGoal,
  CrowdfundingGoalWithProgress
} from './crowdfunding-goal.model'

/**
 * This Memberplan is only here to provide the interface and
 * can be removed when MemberPlans are moved to APIv2
 */
@ObjectType()
class CrowdfundingMemberPlan {
  @Field()
  id!: string

  @Field()
  name!: string
}

@InputType()
export class CreateCrowdfundingMemberPlan extends PickType(
  CrowdfundingMemberPlan,
  ['id'],
  InputType
) {}

@ObjectType()
@Directive('@key(fields: "id")')
export class Crowdfunding {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  name!: string

  @Field(() => Date, {nullable: true})
  countSubscriptionsFrom!: Date | null

  @Field(() => Date, {nullable: true})
  countSubscriptionsUntil!: Date | null

  @Field(() => Number, {nullable: true})
  additionalRevenue!: number | null

  @Field(() => Number, {nullable: true})
  revenue?: number

  @Field(type => [CrowdfundingGoal])
  goals?: CrowdfundingGoal[]

  @Field(type => [CrowdfundingMemberPlan])
  memberPlans?: CrowdfundingMemberPlan[]
}

@ObjectType()
export class CrowdfundingWithActiveGoal extends Crowdfunding {
  @Field(() => CrowdfundingGoalWithProgress, {nullable: true})
  activeCrowdfundingGoal?: CrowdfundingGoalWithProgress
}

@ArgsType()
export class CrowdfundingId {
  @Field()
  id!: string
}

@InputType()
export class CreateCrowdfundingInput extends PickType(
  Crowdfunding,
  ['name', 'countSubscriptionsFrom', 'countSubscriptionsUntil', 'additionalRevenue'],
  InputType
) {
  @Field(() => [CreateCrowdfundingGoalInput], {nullable: true})
  goals?: CreateCrowdfundingGoalInput[]

  @Field(() => [CreateCrowdfundingMemberPlan], {nullable: true})
  memberPlans?: CreateCrowdfundingMemberPlan[]
}

@InputType()
export class UpdateCrowdfundingInput extends PickType(
  Crowdfunding,
  ['id', 'name', 'countSubscriptionsFrom', 'countSubscriptionsUntil', 'additionalRevenue'],
  InputType
) {
  @Field(() => [CreateCrowdfundingGoalInput], {nullable: true})
  goals!: CreateCrowdfundingGoalInput[]

  @Field(() => [CreateCrowdfundingMemberPlan], {nullable: true})
  memberPlans?: CreateCrowdfundingMemberPlan[]
}
