import { Mutation, Resolver } from '@nestjs/graphql';
import { CanReloadProviders } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { ProviderRegistryService } from './provider-registry.service';

@Resolver()
export class ProviderRegistryResolver {
  constructor(private readonly registry: ProviderRegistryService) {}

  @Permissions(CanReloadProviders)
  @Mutation(returns => Boolean, {
    name: 'reloadProviders',
    description:
      'Rebuilds the payment, tracking pixel, mail and challenge providers from ' +
      'their settings, so integration changes take effect without restarting the API.',
  })
  async reloadProviders(): Promise<boolean> {
    await this.registry.reload();
    return true;
  }
}
