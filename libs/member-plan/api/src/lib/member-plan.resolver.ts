import {Resolver, Query, Mutation, Args} from '@nestjs/graphql'
import {MemberPlanService} from './member-plan.service'
import {
  CreateMemberPlanArgs,
  GetActiveMemberPlansArgs,
  GetMemberPlansArgs,
  MemberPlan,
  MemberPlanByIdArgs,
  MemberPlanBySlugArgs,
  UpdateMemberPlanArgs
} from './member-plan.model'
import {
  Permissions,
  CanCreateMemberPlan,
  CanDeleteMemberPlan,
  CanGetMemberPlan,
  CanGetMemberPlans
} from '@wepublish/permissions/api'
import {MemberPlanDataloader} from './member-plan.dataloader'
import {UserInputError} from '@nestjs/apollo'

@Resolver(() => MemberPlan)
export class MemberPlanResolver {
  constructor(
    private readonly memberPlanService: MemberPlanService,
    private readonly memberPlanDataloader: MemberPlanDataloader
  ) {}

  @Query(() => MemberPlan)
  @Permissions(CanGetMemberPlan)
  async getMemberPlanById(@Args() {id}: MemberPlanByIdArgs) {
    const memberPlan = await this.memberPlanDataloader.load(id)

    if (null === memberPlan) {
      throw new UserInputError('Member plan not found')
    }
    return memberPlan
  }

  @Query(() => MemberPlan)
  @Permissions(CanGetMemberPlan)
  async getMemberPlanBySlug(@Args() {slug}: MemberPlanBySlugArgs) {
    const memberPlan = await this.memberPlanService.getMemberPlanBySlug(slug)
    if (null === memberPlan) {
      throw new UserInputError('Member plan not found')
    }
    return memberPlan
  }

  @Query(() => [MemberPlan])
  getActiveMemberPlans(@Args() args: GetActiveMemberPlansArgs) {
    return this.memberPlanService.getActiveMemberPlans(args)
  }

  @Query(() => [MemberPlan])
  @Permissions(CanGetMemberPlans)
  getMemberPlans(@Args() args: GetMemberPlansArgs) {
    return this.memberPlanService.getMemberPlans(args)
  }

  @Mutation(() => MemberPlan)
  @Permissions(CanCreateMemberPlan)
  createMemberPlan(@Args() {memberPlan}: CreateMemberPlanArgs) {
    return this.memberPlanService.createMemberPlan(memberPlan)
  }

  @Mutation(() => MemberPlan)
  @Permissions(CanCreateMemberPlan)
  updateMemberPlan(@Args() {memberPlan}: UpdateMemberPlanArgs) {
    return this.memberPlanService.updateMemberPlan(memberPlan)
  }

  @Mutation(() => MemberPlan)
  @Permissions(CanDeleteMemberPlan)
  deleteMemberPlanById(@Args() args: MemberPlanByIdArgs) {
    return this.memberPlanService.deleteMemberPlanById(args.id)
  }
}
