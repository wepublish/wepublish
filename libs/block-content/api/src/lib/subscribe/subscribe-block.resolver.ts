import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  SubscribeBlock,
  SubscribeBlockMemberPlanRenderSetting,
  SubscribeBlockRenderLayout,
} from './subscribe-block.model';
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

  @ResolveField(() => [SubscribeBlockMemberPlanRenderSetting])
  memberPlanRenderSettings(
    @Parent() parent: SubscribeBlock
  ): SubscribeBlockMemberPlanRenderSetting[] {
    const { memberPlanIds, memberPlanRenderSettings } = parent;

    const settings = (memberPlanIds ?? []).map(id => {
      const renderSettings = memberPlanRenderSettings?.find(
        ({ memberPlanId }) => memberPlanId === id
      );

      return {
        memberPlanId: id,
        isDefault: renderSettings?.isDefault ?? false,
        layout: renderSettings?.layout ?? {
          type: SubscribeBlockRenderLayout.None,
        },
      };
    });

    if (settings.length && !settings.some(({ isDefault }) => isDefault)) {
      settings[0].isDefault = true;
    }

    return settings;
  }
}
