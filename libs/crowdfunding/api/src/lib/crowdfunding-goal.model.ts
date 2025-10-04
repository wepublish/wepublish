import {
  ArgsType,
  Directive,
  Field,
  InputType,
  ObjectType,
  PickType,
} from '@nestjs/graphql';

@ArgsType()
export class CrowdfundingGoalArgs {
  @Field()
  crowdfundingId!: string;
}

@ObjectType()
@Directive('@key(fields: "id")')
export class CrowdfundingGoal {
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

@ObjectType()
export class CrowdfundingGoalWithProgress extends CrowdfundingGoal {
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
