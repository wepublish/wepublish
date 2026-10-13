import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { GateMode } from '@prisma/client';
import { Public } from '@wepublish/authentication/api';
import {
  GateDataloaderService,
  GateMemberPlansDataloader,
  GateService,
} from '@wepublish/gate/api';
import { MemberPlan } from '@wepublish/member-plan/api';
import { Paywall, PaywallBypass } from './paywall.model';
import { toPaywall } from './to-paywall';

/**
 * Paywalls are gates with mode PAYWALL. Only the website reads them here,
 * the editor manages them through the gate API.
 */
@Resolver(() => Paywall)
export class PaywallResolver {
  constructor(
    private gateDataloader: GateDataloaderService,
    private gateMemberPlansDataloader: GateMemberPlansDataloader,
    private gateService: GateService
  ) {}

  @Public()
  @Query(() => Paywall, { description: `Returns an paywall by id.` })
  public async paywall(@Args('id') id: string) {
    return toPaywall(await this.gateDataloader.load(id));
  }

  @Public()
  @Query(() => [Paywall], {
    description: `Returns a list of paywalls based on the filters given.`,
  })
  public async paywalls() {
    const gates = await this.gateService.getGates({ mode: GateMode.PAYWALL });

    return gates.map(toPaywall);
  }

  @ResolveField(() => [MemberPlan])
  async memberPlans(@Parent() parent: Paywall) {
    return this.gateMemberPlansDataloader.load(parent.id);
  }

  @ResolveField(() => [PaywallBypass])
  async bypasses(@Parent() parent: Paywall) {
    const bypasses = await this.gateService.getBypasses(parent.id);

    return bypasses.map(bypass => ({ ...bypass, paywallId: bypass.gateId }));
  }
}
