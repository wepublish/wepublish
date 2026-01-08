import { Field, InterfaceType } from '@nestjs/graphql';
import { MemberPlan } from '../member-plan.model';

@InterfaceType()
export abstract class HasOptionalMemberPlan {
  @Field({ nullable: true })
  memberPlanID?: string;

  @Field(() => MemberPlan, { nullable: true })
  memberPlan?: MemberPlan;
}

@InterfaceType()
export abstract class HasMemberPlan {
  @Field()
  memberPlanID!: string;

  @Field(() => MemberPlan)
  memberPlan!: MemberPlan;
}

// New Style

@InterfaceType()
export abstract class HasMemberPlanLc {
  @Field()
  memberPlanId!: string;

  @Field(() => MemberPlan)
  memberPlan!: MemberPlan;
}

@InterfaceType()
export abstract class HasOptionalMemberPlanLc {
  @Field({ nullable: true })
  memberPlanId?: string;

  @Field(() => MemberPlan, { nullable: true })
  memberPlan?: MemberPlan;
}
