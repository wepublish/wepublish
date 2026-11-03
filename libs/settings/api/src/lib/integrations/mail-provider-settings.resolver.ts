import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { SettingMailProvider as SettingMailProviderRow } from '@prisma/client';
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

@Resolver(() => SettingMailProvider)
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

  @ResolveField(() => Boolean, {
    description:
      'Whether an API key is stored. The key itself is never returned.',
  })
  isApiKeySet(@Parent() setting: SettingMailProviderRow) {
    return !!setting.apiKey;
  }

  @ResolveField(() => Boolean, {
    description:
      'Whether a webhook signing secret is stored. The secret itself is never returned.',
  })
  isWebhookEndpointSecretSet(@Parent() setting: SettingMailProviderRow) {
    return !!setting.webhookEndpointSecret;
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
