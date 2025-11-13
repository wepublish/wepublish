import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  PickType,
} from '@nestjs/graphql';
import {
  CreateCrowdfundingGoalInput,
  CrowdfundingGoal,
  CrowdfundingGoalWithProgress,
} from './crowdfunding-goal.model';
import { MemberPlan } from '@wepublish/member-plan/api';

@InputType()
export class CreateCrowdfundingMemberPlan extends PickType(
  MemberPlan,
  ['id'],
  InputType
) {}

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

  @Field(type => [CrowdfundingGoal])
  goals?: CrowdfundingGoal[];

  @Field(type => [MemberPlan])
  memberPlans?: MemberPlan[];

  @Field(() => Number, { nullable: true })
  revenue?: number;

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
  ],
  InputType
) {
  @Field(() => [CreateCrowdfundingGoalInput], { nullable: true })
  goals?: CreateCrowdfundingGoalInput[];

  @Field(() => [CreateCrowdfundingMemberPlan], { nullable: true })
  memberPlans?: CreateCrowdfundingMemberPlan[];
}

@InputType()
export class UpdateCrowdfundingInput extends PickType(
  Crowdfunding,
  [
    'id',
    'name',
    'countSubscriptionsFrom',
    'countSubscriptionsUntil',
    'additionalRevenue',
  ],
  InputType
) {
  @Field(() => [CreateCrowdfundingGoalInput], { nullable: true })
  goals!: CreateCrowdfundingGoalInput[];

  @Field(() => [CreateCrowdfundingMemberPlan], { nullable: true })
  memberPlans?: CreateCrowdfundingMemberPlan[];
}
