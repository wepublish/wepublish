import {ArgsType, Directive, Field, ID, InputType, ObjectType, PickType} from '@nestjs/graphql'
import {PaginatedType} from '@wepublish/api'
import {CreateCrowdfundingGoalInput, CrowdfundingGoal} from './crowdfunding-goal.model'
import {Input} from '@mui/material'

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
}

@ArgsType()
export class CrowdfundingId {
  @Field(() => ID)
  id!: string
}

@ObjectType()
export class PaginatedCrowdfundings extends PaginatedType(Crowdfunding) {}

@InputType()
export class CreateCrowdfundingInput extends PickType(Crowdfunding, ['name'], InputType) {
  @Field(() => [CreateCrowdfundingGoalInput], {nullable: true})
  goals?: CreateCrowdfundingGoalInput[]
}

@InputType()
export class UpdateCrowdfundingInput extends PickType(Crowdfunding, ['id', 'name'], InputType) {}
