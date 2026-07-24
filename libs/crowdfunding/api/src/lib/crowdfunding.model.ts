import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import {
  CreateCrowdfundingGoalInput,
  CrowdfundingGoal,
  CrowdfundingGoalWithProgress,
} from './crowdfunding-goal.model';
import { MemberPlan } from '@wepublish/member-plan/api';
import { CrowdfundingGoalType } from '@prisma/client';

registerEnumType(CrowdfundingGoalType, {
  name: 'CrowdfundingGoalType',
});

@InputType()
export class CreateCrowdfundingMemberPlan {
  @Field()
  id!: string;
}

@ObjectType()
export class Crowdfunding {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field(() => Date, { nullable: true })
  countSubscriptionsFrom!: Date | null;

  @Field(() => Date, { nullable: true })
  countSubscriptionsUntil!: Date | null;

  @Field(() => Number, { nullable: true })
  additionalRevenue!: number | null;

  @Field(() => CrowdfundingGoalType)
  goalType!: CrowdfundingGoalType;

  @Field(type => [CrowdfundingGoal])
  goals?: CrowdfundingGoal[];

  @Field(type => [MemberPlan])
  memberPlans?: MemberPlan[];

  @Field(() => Number, { nullable: true })
  revenue?: number;

  @Field(() => Int, { nullable: true })
  subscriptions?: number;

  @Field(() => CrowdfundingGoalWithProgress, { nullable: true })
  activeGoal?: CrowdfundingGoalWithProgress;
}

@ArgsType()
export class CrowdfundingId {
  @Field()
  id!: string;
}

@InputType()
export class CreateCrowdfundingInput extends PickType(
  Crowdfunding,
  [
    'name',
    'countSubscriptionsFrom',
    'countSubscriptionsUntil',
    'additionalRevenue',
    'goalType',
  ],
  InputType
) {
  @Field(() => [CreateCrowdfundingGoalInput], { nullable: true })
  goals?: CreateCrowdfundingGoalInput[];

  @Field(() => [CreateCrowdfundingMemberPlan], { nullable: true })
  memberPlans?: CreateCrowdfundingMemberPlan[];
}

@InputType()
export class UpdateCrowdfundingInput extends PartialType(
  CreateCrowdfundingInput,
  InputType
) {
  @Field()
  id!: string;
}
