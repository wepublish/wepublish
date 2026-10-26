import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PaywallDataloaderService } from './paywall-dataloader.service';
import { PaywallMemberPlansDataloader } from './paywall-member-plans.dataloader';
import {
  Paywall,
  PaywallBypass,
  CreatePaywallInput,
  UpdatePaywallInput,
} from './paywall.model';
import { PaywallService } from './paywall.service';
import { Paywall as PPaywall } from '@prisma/client';
import {
  CanCreatePaywall,
  CanDeletePaywall,
  CanGetArticle,
  CanUpdatePaywall,
} from '@wepublish/permissions';
import {
  Permissions,
  hasPermission,
  permissionsOf,
} from '@wepublish/permissions/api';
import {
  AuthSession,
  CurrentUser,
  Public,
} from '@wepublish/authentication/api';
import { MemberPlan } from '@wepublish/member-plan/api';

@Resolver(() => Paywall)
export class PaywallResolver {
  constructor(
    private paywallDataloader: PaywallDataloaderService,
    private paywallMemberPlansDataloader: PaywallMemberPlansDataloader,
    private paywallService: PaywallService
  ) {}

  @Public()
  @Query(() => Paywall, { description: `Returns an paywall by id.` })
  public async paywall(@Args('id') id: string) {
    return await this.paywallDataloader.load(id);
  }

  @Public()
  @Query(() => [Paywall], {
    description: `Returns a list of paywalls based on the filters given.`,
  })
  public paywalls() {
    return this.paywallService.getPaywalls();
  }

  @Permissions(CanCreatePaywall)
  @Mutation(() => Paywall, {
    description: `Creates a paywall.`,
  })
  public createPaywall(@Args() input: CreatePaywallInput) {
    return this.paywallService.createPaywall(input);
  }

  @Permissions(CanUpdatePaywall)
  @Mutation(() => Paywall, {
    description: `Updates a paywall.`,
  })
  public updatePaywall(@Args() input: UpdatePaywallInput) {
    return this.paywallService.updatePaywall(input);
  }

  @Permissions(CanDeletePaywall)
  @Mutation(() => Paywall, {
    description: `Deletes a paywall.`,
  })
  public async deletePaywall(@Args('id') id: string) {
    return this.paywallService.deletePaywall(id);
  }

  @ResolveField(() => [MemberPlan])
  async memberPlans(@Parent() parent: PPaywall) {
    return this.paywallMemberPlansDataloader.load(parent.id);
  }

  @ResolveField(() => [PaywallBypass], {
    description: `Empty for enforced paywalls, unless the reader may edit paywalls or read every article: their tokens open the article on the server.`,
  })
  async bypasses(
    @Parent() parent: PPaywall,
    @CurrentUser() session: AuthSession | undefined
  ) {
    const permissions = permissionsOf(session);

    if (
      parent.enforced &&
      ![CanCreatePaywall, CanUpdatePaywall, CanGetArticle].some(permission =>
        hasPermission(permission, permissions)
      )
    ) {
      return [];
    }

    return this.paywallService.getPaywallBypasses(parent.id);
  }
}
