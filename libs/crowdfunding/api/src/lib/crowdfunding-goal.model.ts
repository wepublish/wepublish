import {Directive, Field, ID, InputType, ObjectType, PickType} from '@nestjs/graphql'

@ObjectType()
@Directive('@key(fields: "id")')
export class CrowdfundingGoal {
  @Field(() => ID)
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  title!: string

  @Field()
  description?: string

  @Field()
  goal!: number
}

@InputType()
export class CreateCrowdfundingGoalInput extends PickType(
  CrowdfundingGoal,
  ['title', 'description', 'goal'],
  InputType
) {}
