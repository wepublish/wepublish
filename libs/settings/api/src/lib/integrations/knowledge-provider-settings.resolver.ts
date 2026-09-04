import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanGetKnowledgeProviderSettings,
  CanUpdateKnowledgeProviderSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';

import { KnowledgeProviderSettingsDataloaderService } from './knowledge-provider-settings-dataloader.service';
import {
  SettingKnowledgeProvider,
  SettingKnowledgeProviderFilter,
  UpdateSettingKnowledgeProviderInput,
} from './knowledge-provider-settings.model';
import { KnowledgeProviderSettingsService } from './knowledge-provider-settings.service';

@Resolver()
export class KnowledgeProviderSettingsResolver {
  constructor(
    private service: KnowledgeProviderSettingsService,
    private dataloader: KnowledgeProviderSettingsDataloaderService
  ) {}

  @Permissions(CanGetKnowledgeProviderSettings)
  @Query(returns => [SettingKnowledgeProvider], {
    name: 'knowledgeProviderSettings',
    description: 'Returns all knowledge provider settings.',
  })
  knowledgeProviderSettings(
    @Args('filter', { nullable: true }) filter?: SettingKnowledgeProviderFilter
  ) {
    return this.service.knowledgeProviderSettingsList(filter);
  }

  @Permissions(CanGetKnowledgeProviderSettings)
  @Query(returns => SettingKnowledgeProvider, {
    name: 'knowledgeProviderSetting',
    description: 'Returns a single knowledge provider setting by id.',
  })
  knowledgeProviderSetting(@Args('id') id: string) {
    return this.dataloader.load(id);
  }

  @Permissions(CanUpdateKnowledgeProviderSettings)
  @Mutation(returns => SettingKnowledgeProvider, {
    name: 'updateKnowledgeProviderSetting',
    description: 'Updates an existing knowledge provider setting.',
  })
  updateKnowledgeProviderSetting(
    @Args() input: UpdateSettingKnowledgeProviderInput
  ) {
    return this.service.updateKnowledgeProviderSetting(input);
  }
}
