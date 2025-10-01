import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { SubscribeBlock } from './subscribe-block.model';
import {
  MemberPlan,
  MemberPlanDataloader,
  MemberPlanService,
} from '@wepublish/member-plan/api';

@Resolver(() => SubscribeBlock)
export class SubscribeBlockResolver {
  constructor(
    private memberPlanDataloader: MemberPlanDataloader,
    private memberPlanService: MemberPlanService
  ) {}

  @ResolveField(() => [MemberPlan])
  async memberPlans(@Parent() parent: SubscribeBlock) {
    const { memberPlanIds } = parent;

    if (!memberPlanIds?.length) {
      return await this.memberPlanService.getActiveMemberPlans();
    }

    return this.memberPlanDataloader.loadMany(memberPlanIds);
  }
}
