import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanGetChallengeProviderSettings,
  CanUpdateChallengeProviderSettings,
  CanCreateChallengeProviderSettings,
  CanDeleteChallengeProviderSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  SettingChallengeProvider,
  CreateSettingChallengeProviderInput,
  UpdateSettingChallengeProviderInput,
  SettingChallengeProviderFilter,
} from './challenge-provider-settings.model';
import { ChallengeProviderSettingsService } from './challenge-provider-settings.service';
import { ChallengeProviderSettingsDataloaderService } from './challenge-provider-settings-dataloader.service';

@Resolver()
export class ChallengeProviderSettingsResolver {
  constructor(
    private challengeProviderSettingsService: ChallengeProviderSettingsService,
    private challengeProviderSettingsDataloader: ChallengeProviderSettingsDataloaderService
  ) {}

  @Permissions(CanGetChallengeProviderSettings)
  @Query(returns => [SettingChallengeProvider], {
    name: 'challengeProviderSettings',
    description: 'Returns all challenge provider settings.',
  })
  challengeProviderSettings(
    @Args('filter', { nullable: true }) filter?: SettingChallengeProviderFilter
  ) {
    return this.challengeProviderSettingsService.challengeProviderSettingsList(
      filter
    );
  }

  @Permissions(CanGetChallengeProviderSettings)
  @Query(returns => SettingChallengeProvider, {
    name: 'challengeProviderSetting',
    description: 'Returns a single challenge provider setting by id.',
  })
  challengeProviderSetting(@Args('id') id: string) {
    return this.challengeProviderSettingsDataloader.load(id);
  }
  /** DISABLE FOR NOW
  @Permissions(CanCreateChallengeProviderSettings)
  @Mutation(returns => SettingChallengeProvider, {
    name: 'createChallengeProviderSetting',
    description: 'Creates a new challenge provider setting.',
  })
  createChallengeProviderSetting(@Args('input') input: CreateSettingChallengeProviderInput) {
    return this.challengeProviderSettingsService.createChallengeProviderSetting(input);
  }
 **/

  @Permissions(CanUpdateChallengeProviderSettings)
  @Mutation(returns => SettingChallengeProvider, {
    name: 'updateChallengeProviderSetting',
    description: 'Updates an existing challenge provider setting.',
  })
  updateChallengeProviderSetting(
    @Args() input: UpdateSettingChallengeProviderInput
  ) {
    return this.challengeProviderSettingsService.updateChallengeProviderSetting(
      input
    );
  }

  /** DISABLE FOR NOW
  @Permissions(CanDeleteChallengeProviderSettings)
  @Mutation(returns => SettingChallengeProvider, {
    name: 'deleteChallengeProviderSetting',
    description: 'Deletes a challenge provider setting.',
  })
  deleteChallengeProviderSetting(@Args('id') id: string) {
    return this.challengeProviderSettingsService.deleteChallengeProviderSetting(id);
  }
    **/
}
