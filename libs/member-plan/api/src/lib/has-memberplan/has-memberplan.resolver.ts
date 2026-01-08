import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  HasMemberPlan,
  HasMemberPlanLc,
  HasOptionalMemberPlan,
  HasOptionalMemberPlanLc,
} from './has-memberplan.model';
import { MemberPlan } from '../member-plan.model';
import { MemberPlanDataloader } from '../member-plan.dataloader';

@Resolver(() => HasMemberPlan)
export class HasMemberPlanResolver {
  constructor(private dataloader: MemberPlanDataloader) {}

  @ResolveField(() => MemberPlan, { nullable: true })
  public memberplan(
    @Parent()
    block:
      | HasOptionalMemberPlan
      | HasMemberPlan
      | HasOptionalMemberPlanLc
      | HasMemberPlanLc
  ) {
    const id =
      'memberPlanId' in block ? block.memberPlanId
      : 'memberPlanID' in block ? block.memberPlanID
      : null;

    if (!id) {
      return null;
    }

    return this.dataloader.load(id);
  }
}

@Resolver(() => HasMemberPlanLc)
export class HasMemberPlanLcResolver extends HasMemberPlanResolver {}

@Resolver(() => HasOptionalMemberPlan)
export class HasOptionalMemberPlanResolver extends HasMemberPlanResolver {}

@Resolver(() => HasOptionalMemberPlanLc)
export class HasOptionalMemberPlanLcResolver extends HasMemberPlanResolver {}
