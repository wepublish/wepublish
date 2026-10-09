import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanCreateMailProviderSettings,
  CanGetMailProviderSettings,
  CanUpdateMailProviderSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  CreateSettingMailProviderInput,
  SettingMailProvider,
  UpdateSettingMailProviderInput,
  SettingMailProviderFilter,
} from './mail-provider-settings.model';
import { MailProviderSettingsService } from './mail-provider-settings.service';
import { MailProviderSettingsDataloaderService } from './mail-provider-settings-dataloader.service';

@Resolver()
export class MailProviderSettingsResolver {
  constructor(
    private mailProviderSettingsService: MailProviderSettingsService,
    private mailProviderSettingsDataloader: MailProviderSettingsDataloaderService
  ) {}

  @Permissions(CanGetMailProviderSettings)
  @Query(returns => [SettingMailProvider], {
    name: 'mailProviderSettings',
    description: 'Returns all mail provider settings.',
  })
  mailProviderSettings(
    @Args('filter', { nullable: true }) filter?: SettingMailProviderFilter
  ) {
    return this.mailProviderSettingsService.mailProviderSettingsList(filter);
  }

  @Permissions(CanGetMailProviderSettings)
  @Query(returns => SettingMailProvider, {
    name: 'mailProviderSetting',
    description: 'Returns a single mail provider setting by id.',
  })
  mailProviderSetting(@Args('id') id: string) {
    return this.mailProviderSettingsDataloader.load(id);
  }

  @Permissions(CanCreateMailProviderSettings)
  @Mutation(returns => SettingMailProvider, {
    name: 'createMailProviderSetting',
    description:
      'Sets up the mail provider. Only possible while none is configured.',
  })
  createMailProviderSetting(@Args() input: CreateSettingMailProviderInput) {
    return this.mailProviderSettingsService.createMailProviderSetting(input);
  }

  @Permissions(CanUpdateMailProviderSettings)
  @Mutation(returns => SettingMailProvider, {
    name: 'updateMailProviderSetting',
    description: 'Updates an existing mail provider setting.',
  })
  updateMailProviderSetting(@Args() input: UpdateSettingMailProviderInput) {
    return this.mailProviderSettingsService.updateMailProviderSetting(input);
  }

  /** DISABLE FOR NOW
  @Permissions(CanDeleteMailProviderSettings)
  @Mutation(returns => SettingMailProvider, {
    name: 'deleteMailProviderSetting',
    description: 'Deletes a mail provider setting.',
  })
  deleteMailProviderSetting(@Args('id') id: string) {
    return this.mailProviderSettingsService.deleteMailProviderSetting(id);
  }
    **/
}
