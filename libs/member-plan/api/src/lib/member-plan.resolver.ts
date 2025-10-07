import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CurrentUser,
  Public,
  UserSession,
} from '@wepublish/authentication/api';
import { GraphQLSlug, SortOrder } from '@wepublish/utils/api';
import {
  MemberPlan,
  MemberPlanConnection,
  MemberPlanFilter,
  MemberPlanSort,
} from './member-plan.model';
import { MemberPlanService } from './member-plan.service';
import { UserInputError } from '@nestjs/apollo';
import { MemberPlanDataloader } from './member-plan.dataloader';
import { hasPermission } from '@wepublish/permissions/api';
import { CanGetMemberPlan, CanGetMemberPlans } from '@wepublish/permissions';

@Resolver(() => MemberPlan)
export class MemberPlanResolver {
  constructor(
    private memberPlanService: MemberPlanService,
    private memberPlanDataloader: MemberPlanDataloader
  ) {}

  @Public()
  @Query(() => MemberPlan, {
    description: 'This query returns a member plan.',
    nullable: true,
  })
  async memberPlan(
    @Args('id', { nullable: true }) id?: string,
    @Args('slug', { type: () => GraphQLSlug, nullable: true }) slug?: string
  ) {
    if ((!id && !slug) || (id && slug)) {
      throw new UserInputError('You must provide either `id` or `slug`.');
    }

    return id ?
        this.memberPlanDataloader.load(id)
      : this.memberPlanService.getMemberPlanBySlug(slug!);
  }

  @Public()
  @Query(() => MemberPlanConnection, {
    description: 'This query returns the member plans.',
  })
  async memberPlans(
    @Args('cursor', { nullable: true }) cursor?: string,
    @Args('take', { type: () => Int, defaultValue: 10 }) take?: number,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip?: number,
    @Args('filter', { nullable: true }) filter?: MemberPlanFilter,
    @Args('sort', {
      type: () => MemberPlanSort,
      defaultValue: MemberPlanSort.createdAt,
    })
    sort?: MemberPlanSort,
    @Args('order', {
      type: () => SortOrder,
      defaultValue: SortOrder.Descending,
    })
    order?: SortOrder
  ) {
    return this.memberPlanService.getMemberPlans(
      filter,
      sort,
      order,
      cursor,
      skip,
      take
    );
  }

  @ResolveField(() => String, { nullable: true })
  async externalReward(
    @Parent() parent: MemberPlan,
    @CurrentUser() user: UserSession | undefined
  ) {
    const canManage = hasPermission(
      [CanGetMemberPlan, CanGetMemberPlans],
      user?.roles ?? []
    );

    return canManage ? parent.externalReward : null;
  }
}
