import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CanGetMailchimpSyncSettings,
  CanUpdateMailchimpSyncSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  MailchimpMapping,
  SettingSyncProvider,
  UpdateSettingSyncProviderInput,
  SettingSyncProviderFilter,
} from './sync-provider-settings.model';
import { SyncProviderSettingsService } from './sync-provider-settings.service';
import { SyncProviderSettingsDataloaderService } from './sync-provider-settings-dataloader.service';

@Resolver(() => SettingSyncProvider)
export class SyncProviderSettingsResolver {
  constructor(
    private syncProviderSettingsService: SyncProviderSettingsService,
    private syncProviderSettingsDataloader: SyncProviderSettingsDataloaderService
  ) {}

  @Permissions(CanGetMailchimpSyncSettings)
  @Query(returns => [SettingSyncProvider], {
    name: 'syncProviderSettings',
    description: 'Returns all sync provider settings.',
  })
  syncProviderSettings(
    @Args('filter', { nullable: true }) filter?: SettingSyncProviderFilter
  ) {
    return this.syncProviderSettingsService.syncProviderSettingsList(filter);
  }

  @Permissions(CanGetMailchimpSyncSettings)
  @Query(returns => SettingSyncProvider, {
    name: 'syncProviderSetting',
    description: 'Returns a single sync provider setting by id.',
  })
  syncProviderSetting(@Args('id') id: string) {
    return this.syncProviderSettingsDataloader.load(id);
  }

  @Permissions(CanUpdateMailchimpSyncSettings)
  @Mutation(returns => SettingSyncProvider, {
    name: 'updateSyncProviderSetting',
    description: 'Updates an existing sync provider setting.',
  })
  updateSyncProviderSetting(@Args() input: UpdateSettingSyncProviderInput) {
    return this.syncProviderSettingsService.updateSyncProviderSetting(input);
  }

  @Permissions(CanGetMailchimpSyncSettings)
  @ResolveField(() => [MailchimpMapping], {
    description: 'Returns the per-member-plan Mailchimp mappings.',
  })
  mailchimpMappings(@Parent() provider: SettingSyncProvider) {
    return this.syncProviderSettingsService.getMailchimpMappings(provider.id);
  }
}
