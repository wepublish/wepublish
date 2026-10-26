import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { HasPaywall, HasOptionalPaywall } from './has-paywall.model';
import { Paywall } from '../paywall.model';
import { PaywallDataloaderService } from '../paywall-dataloader.service';

@Resolver(() => HasPaywall)
export class HasPaywallResolver {
  constructor(private dataloader: PaywallDataloaderService) {}

  @ResolveField(() => Paywall, { nullable: true })
  public paywall(@Parent() block: HasOptionalPaywall | HasPaywall) {
    const id = block.paywallId;

    if (!id) {
      return null;
    }

    return this.dataloader.load(id);
  }
}

@Resolver(() => HasOptionalPaywall)
export class HasOptionalPaywallResolver extends HasPaywallResolver {}
