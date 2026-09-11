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
import { ascend, sortWith } from 'ramda';

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
    const { memberPlanIds, memberPlanRenderSettings } = parent;

    const settingsOrder =
      memberPlanRenderSettings?.map(({ memberPlanId }) => memberPlanId) ?? [];

    const ids = sortWith(
      [ascend(id => settingsOrder.indexOf(id))],
      memberPlanIds ?? []
    );

    if (!ids.length) {
      return await this.memberPlanService.getActiveMemberPlans();
    }

    return (await this.memberPlanDataloader.loadMany(ids)).filter(Boolean);
  }

  @ResolveField(() => [String])
  async memberPlanIds(@Parent() parent: SubscribeBlock): Promise<string[]> {
    const { memberPlanIds } = parent;
    const ids = memberPlanIds ?? [];
    const memberPlans = await this.memberPlanDataloader.loadMany(ids);

    return ids.filter((_id, index) => !!memberPlans[index]);
  }

  @ResolveField(() => [SubscribeBlockMemberPlanRenderSetting])
  async memberPlanRenderSettings(
    @Parent() parent: SubscribeBlock
  ): Promise<SubscribeBlockMemberPlanRenderSetting[]> {
    const { memberPlanIds, memberPlanRenderSettings } = parent;

    const settingsOrder =
      memberPlanRenderSettings?.map(({ memberPlanId }) => memberPlanId) ?? [];

    const sortedIds = sortWith(
      [ascend(id => settingsOrder.indexOf(id))],
      memberPlanIds ?? []
    );

    const memberPlans = await this.memberPlanDataloader.loadMany(sortedIds);
    const ids = sortedIds.filter((_id, index) => !!memberPlans[index]);

    const settings = ids.map(id => {
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
