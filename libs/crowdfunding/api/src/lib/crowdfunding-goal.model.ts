import {
  Field,
  InputType,
  InterfaceType,
  ObjectType,
  PickType,
} from '@nestjs/graphql';

@InterfaceType()
export class BaseCrowdfundingGoal {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  amount!: number;
}

@ObjectType({
  implements: () => [BaseCrowdfundingGoal],
})
export class CrowdfundingGoal extends BaseCrowdfundingGoal {}

@ObjectType({
  implements: () => [BaseCrowdfundingGoal],
})
export class CrowdfundingGoalWithProgress extends BaseCrowdfundingGoal {
  @Field(() => Number, { nullable: true })
  progress?: number;
}

@InputType()
export class CreateCrowdfundingGoalInput extends PickType(
  CrowdfundingGoal,
  ['title', 'description', 'amount'],
  InputType
) {}

@InputType()
export class UpdateCrowdfundingGoalInput extends PickType(
  CrowdfundingGoal,
  ['id', 'title', 'description', 'amount'],
  InputType
) {}
