import {
  Args,
  Mutation,
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
import { GraphQLSlug } from '@wepublish/utils/api';
import {
  CreateMemberPlanInput,
  MemberPlan,
  PaginatedMemberPlans,
  MemberPlanListArgs,
  UpdateMemberPlanInput,
} from './member-plan.model';
import { MemberPlanService } from './member-plan.service';
import { MemberPlanDataloader } from './member-plan.dataloader';
import { hasPermission, Permissions } from '@wepublish/permissions/api';
import {
  CanCreateMemberPlan,
  CanDeleteMemberPlan,
  CanGetMemberPlan,
  CanGetMemberPlans,
} from '@wepublish/permissions';
import {
  BadRequestException,
  forwardRef,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Page, PageDataloaderService } from '@wepublish/page/api';
import { PaymentMethod, PaymentMethodDataloader } from '@wepublish/payment/api';

@Resolver(() => MemberPlan)
export class MemberPlanResolver {
  constructor(
    private memberPlanService: MemberPlanService,
    private memberPlanDataloader: MemberPlanDataloader,
    @Inject(forwardRef(() => PageDataloaderService))
    private pageDataloader: PageDataloaderService,
    private paymentMethodDataloader: PaymentMethodDataloader
  ) {}

  @Public()
  @Query(() => MemberPlan, {
    description: `Returns a memberplan by id or slug.`,
  })
  async memberPlan(
    @Args('id', { nullable: true }) id?: string,
    @Args('slug', { type: () => GraphQLSlug, nullable: true }) slug?: string
  ) {
    if (id) {
      const memberPlan = await this.memberPlanDataloader.load(id);

      if (!memberPlan) {
        throw new NotFoundException(`Memberplan with id ${id} was not found.`);
      }

      return memberPlan;
    }

    if (slug) {
      const memberPlan = await this.memberPlanService.getMemberPlanBySlug(slug);

      if (!memberPlan) {
        throw new NotFoundException(
          `Memberplan with slug ${slug} was not found.`
        );
      }

      return memberPlan;
    }

    throw new BadRequestException('Memberplan id or slug required.');
  }

  @Public()
  @Query(() => PaginatedMemberPlans, {
    description: `Returns a paginated list of memberplans based on the filters given.`,
  })
  async memberPlans(@Args() input: MemberPlanListArgs) {
    return this.memberPlanService.getMemberPlans(input);
  }

  @Permissions(CanCreateMemberPlan)
  @Mutation(returns => MemberPlan, { description: `Creates a new memberplan.` })
  public createMemberPlan(@Args() input: CreateMemberPlanInput) {
    return this.memberPlanService.createMemberPlan(input);
  }

  @Permissions(CanCreateMemberPlan)
  @Mutation(returns => MemberPlan, {
    description: `Updates an existing memberplan.`,
  })
  public updateMemberPlan(@Args() input: UpdateMemberPlanInput) {
    return this.memberPlanService.updateMemberPlan(input);
  }

  @Permissions(CanDeleteMemberPlan)
  @Mutation(returns => MemberPlan, {
    description: `Deletes an existing memberplan.`,
  })
  public deleteMemberPlan(@Args('id') id: string) {
    return this.memberPlanService.deleteMemberPlan(id);
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

  @ResolveField(() => Page, { nullable: true })
  async successPage(@Parent() parent: MemberPlan) {
    return parent.successPageId ?
        this.pageDataloader.load(parent.successPageId)
      : null;
  }

  @ResolveField(() => Page, { nullable: true })
  async failPage(@Parent() parent: MemberPlan) {
    return parent.failPageId ?
        this.pageDataloader.load(parent.failPageId)
      : null;
  }

  @ResolveField(() => Page, { nullable: true })
  async confirmationPage(@Parent() parent: MemberPlan) {
    return parent.confirmationPageId ?
        this.pageDataloader.load(parent.confirmationPageId)
      : null;
  }

  @ResolveField(() => PaymentMethod, { nullable: true })
  async migrateToTargetPaymentMethod(@Parent() parent: MemberPlan) {
    return parent.migrateToTargetPaymentMethodID ?
        this.paymentMethodDataloader.load(parent.migrateToTargetPaymentMethodID)
      : null;
  }
}
