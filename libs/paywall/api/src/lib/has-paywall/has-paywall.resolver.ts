import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GateDataloaderService } from '@wepublish/gate/api';
import { HasPaywall, HasOptionalPaywall } from './has-paywall.model';
import { Paywall } from '../paywall.model';
import { toPaywall } from '../to-paywall';

@Resolver(() => HasPaywall)
export class HasPaywallResolver {
  constructor(private dataloader: GateDataloaderService) {}

  @ResolveField(() => Paywall, { nullable: true })
  public async paywall(@Parent() block: HasOptionalPaywall | HasPaywall) {
    const id = block.paywallId;

    if (!id) {
      return null;
    }

    return toPaywall(await this.dataloader.load(id));
  }
}

@Resolver(() => HasOptionalPaywall)
export class HasOptionalPaywallResolver extends HasPaywallResolver {}
