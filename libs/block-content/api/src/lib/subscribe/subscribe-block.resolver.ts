import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { SubscribeBlock } from './subscribe-block.model';
import { MemberPlan, MemberPlanDataloader } from '@wepublish/member-plan/api';

@Resolver(() => SubscribeBlock)
export class SubscribeBlockResolver {
  constructor(private memberPlanDataloader: MemberPlanDataloader) {}

  @ResolveField(() => [MemberPlan])
  memberPlans(@Parent() parent: SubscribeBlock) {
    const { memberPlanIds } = parent;

    if (!memberPlanIds?.length) {
      return [];
    }

    return this.memberPlanDataloader.loadMany(memberPlanIds);
  }
}
