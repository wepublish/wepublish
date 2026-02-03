import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CanGetAISettings, CanUpdateAISettings } from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  SettingAIProvider,
  UpdateSettingAIProviderInput,
  SettingAIProviderFilter,
} from './ai-settings.model';
import { AISettingsService } from './ai-settings.service';
import { AISettingsDataloaderService } from './ai-settings-dataloader.service';

@Resolver()
export class AISettingsResolver {
  constructor(
    private aiSettingsService: AISettingsService,
    private aiSettingsDataloader: AISettingsDataloaderService
  ) {}

  @Permissions(CanGetAISettings)
  @Query(returns => [SettingAIProvider], {
    name: 'aiSettings',
    description: 'Returns all AI provider settings.',
  })
  aiSettings(
    @Args('filter', { nullable: true }) filter?: SettingAIProviderFilter
  ) {
    return this.aiSettingsService.aiSettingsList(filter);
  }

  @Permissions(CanGetAISettings)
  @Query(returns => SettingAIProvider, {
    name: 'aiSetting',
    description: 'Returns a single AI provider setting by id.',
  })
  aiSetting(@Args('id') id: string) {
    return this.aiSettingsDataloader.load(id);
  }

  /** DISABLE FOR NOW
  @Permissions(CanCreateAISettings)
  @Mutation(returns => SettingAIProvider, {
    name: 'createAISetting',
    description: 'Creates a new AI provider setting.',
  })
  createAISetting(@Args('input') input: CreateSettingAIProviderInput) {
    return this.aiSettingsService.createAISetting(input);
  }
   **/

  @Permissions(CanUpdateAISettings)
  @Mutation(returns => SettingAIProvider, {
    name: 'updateAISetting',
    description: 'Updates an existing AI provider setting.',
  })
  updateAISetting(@Args() input: UpdateSettingAIProviderInput) {
    return this.aiSettingsService.updateAISetting(input);
  }

  /** DISABLE FOR NOW
  @Permissions(CanDeleteAISettings)
  @Mutation(returns => SettingAIProvider, {
    name: 'deleteAISetting',
    description: 'Deletes an AI provider setting.',
  })
  deleteAISetting(@Args('id') id: string) {
    return this.aiSettingsService.deleteAISetting(id);
  }
    **/
}
