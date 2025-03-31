import {ArgsType, Directive, Field, ID, InputType, ObjectType, PickType} from '@nestjs/graphql'
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
  @Field(() => ID)
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
  @Field(() => ID)
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  name!: string

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
  @Field(() => ID)
  id!: string
}

@InputType()
export class CreateCrowdfundingInput extends PickType(Crowdfunding, ['name'], InputType) {
  @Field(() => [CreateCrowdfundingGoalInput], {nullable: true})
  goals?: CreateCrowdfundingGoalInput[]

  @Field(() => [CreateCrowdfundingMemberPlan], {nullable: true})
  memberPlans?: CreateCrowdfundingMemberPlan[]
}

@InputType()
export class UpdateCrowdfundingInput extends PickType(Crowdfunding, ['id', 'name'], InputType) {
  @Field(() => [CreateCrowdfundingGoalInput], {nullable: true})
  goals!: CreateCrowdfundingGoalInput[]

  @Field(() => [CreateCrowdfundingMemberPlan], {nullable: true})
  memberPlans?: CreateCrowdfundingMemberPlan[]
}
