import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { SubscribeBlock } from './subscribe-block.model';
import {
  MemberPlan,
  MemberPlanDataloader,
  MemberPlanService,
} from '@wepublish/member-plan/api';
import { forwardRef, Inject } from '@nestjs/common';

@Resolver(() => SubscribeBlock)
export class SubscribeBlockResolver {
  constructor(
    @Inject(forwardRef(() => MemberPlanDataloader))
    private memberPlanDataloader: MemberPlanDataloader,
    @Inject(forwardRef(() => MemberPlanService))
    private memberPlanService: MemberPlanService
  ) {}

  @ResolveField(() => [MemberPlan])
  async memberPlans(@Parent() parent: SubscribeBlock) {
    const { memberPlanIds } = parent;

    if (!memberPlanIds?.length) {
      return await this.memberPlanService.getActiveMemberPlans();
    }

    return (await this.memberPlanDataloader.loadMany(memberPlanIds)).filter(
      Boolean
    );
  }
}
