import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PaywallDataloaderService } from './paywall-dataloader.service';
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
  CanUpdatePaywall,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { Public } from '@wepublish/authentication/api';
import { MemberPlan } from '@wepublish/member-plan/api';

@Resolver(() => Paywall)
export class PaywallResolver {
  constructor(
    private paywallDataloader: PaywallDataloaderService,
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
    return (await this.paywallService.deletePaywall(id)).id;
  }

  @ResolveField(() => [MemberPlan])
  async memberPlans(@Parent() parent: PPaywall) {
    return this.paywallService.getPaywallMemberplans(parent.id);
  }

  @ResolveField(() => [PaywallBypass])
  async bypasses(@Parent() parent: PPaywall) {
    return this.paywallService.getPaywallBypasses(parent.id);
  }
}
