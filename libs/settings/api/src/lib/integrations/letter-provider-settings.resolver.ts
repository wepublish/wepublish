import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanCreateLetterProviderSettings,
  CanDeleteLetterProviderSettings,
  CanGetLetterProviderSettings,
  CanUpdateLetterProviderSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  CreateSettingLetterProviderInput,
  SettingLetterProvider,
  UpdateSettingLetterProviderInput,
  SettingLetterProviderFilter,
} from './letter-provider-settings.model';
import { LetterProviderSettingsService } from './letter-provider-settings.service';
import { LetterProviderSettingsDataloaderService } from './letter-provider-settings-dataloader.service';

@Resolver()
export class LetterProviderSettingsResolver {
  constructor(
    private letterProviderSettingsService: LetterProviderSettingsService,
    private letterProviderSettingsDataloader: LetterProviderSettingsDataloaderService
  ) {}

  @Permissions(CanGetLetterProviderSettings)
  @Query(returns => [SettingLetterProvider], {
    name: 'letterProviderSettings',
    description: 'Returns all letter provider settings.',
  })
  letterProviderSettings(
    @Args('filter', { nullable: true }) filter?: SettingLetterProviderFilter
  ) {
    return this.letterProviderSettingsService.letterProviderSettingsList(
      filter
    );
  }

  @Permissions(CanGetLetterProviderSettings)
  @Query(returns => SettingLetterProvider, {
    name: 'letterProviderSetting',
    description: 'Returns a single letter provider setting by id.',
  })
  letterProviderSetting(@Args('id') id: string) {
    return this.letterProviderSettingsDataloader.load(id);
  }

  @Permissions(CanCreateLetterProviderSettings)
  @Mutation(returns => SettingLetterProvider, {
    name: 'createLetterProviderSetting',
    description: 'Creates a new letter provider setting.',
  })
  createLetterProviderSetting(@Args() input: CreateSettingLetterProviderInput) {
    return this.letterProviderSettingsService.createLetterProviderSetting(
      input
    );
  }

  @Permissions(CanUpdateLetterProviderSettings)
  @Mutation(returns => SettingLetterProvider, {
    name: 'updateLetterProviderSetting',
    description: 'Updates an existing letter provider setting.',
  })
  updateLetterProviderSetting(@Args() input: UpdateSettingLetterProviderInput) {
    return this.letterProviderSettingsService.updateLetterProviderSetting(
      input
    );
  }

  @Permissions(CanDeleteLetterProviderSettings)
  @Mutation(returns => SettingLetterProvider, {
    name: 'deleteLetterProviderSetting',
    description: 'Deletes an existing letter provider setting.',
  })
  deleteLetterProviderSetting(@Args('id') id: string) {
    return this.letterProviderSettingsService.deleteLetterProviderSetting(id);
  }
}
