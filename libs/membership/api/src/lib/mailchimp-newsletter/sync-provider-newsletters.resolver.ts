import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  SettingSyncProvider,
  SyncProviderSettingsService,
} from '@wepublish/settings/api';
import { SettingSyncProviderNewsletter } from './mailchimp-newsletter.model';

/**
 * Lives here instead of the settings lib, as the newsletters have images and
 * the settings lib must not depend on the image lib.
 */
@Resolver(() => SettingSyncProvider)
export class SyncProviderNewslettersResolver {
  constructor(private syncProviderSettings: SyncProviderSettingsService) {}

  @ResolveField(() => [SettingSyncProviderNewsletter])
  newsletters(@Parent() { id }: SettingSyncProvider) {
    return this.syncProviderSettings.newsletters(id);
  }
}
