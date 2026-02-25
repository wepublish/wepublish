import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanGetPaymentProviderSettings,
  CanUpdatePaymentProviderSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  SettingPaymentProvider,
  UpdateSettingPaymentProviderInput,
  SettingPaymentProviderFilter,
} from './payment-provider-settings.model';
import { PaymentProviderSettingsService } from './payment-provider-settings.service';
import { PaymentProviderSettingsDataloaderService } from './payment-provider-settings-dataloader.service';

@Resolver()
export class PaymentProviderSettingsResolver {
  constructor(
    private paymentProviderSettingsService: PaymentProviderSettingsService,
    private paymentProviderSettingsDataloader: PaymentProviderSettingsDataloaderService
  ) {}

  @Permissions(CanGetPaymentProviderSettings)
  @Query(returns => [SettingPaymentProvider], {
    name: 'paymentProviderSettings',
    description: 'Returns all payment provider settings.',
  })
  paymentProviderSettings(
    @Args('filter', { nullable: true }) filter?: SettingPaymentProviderFilter
  ) {
    return this.paymentProviderSettingsService.paymentProviderSettingsList(
      filter
    );
  }

  @Permissions(CanGetPaymentProviderSettings)
  @Query(returns => SettingPaymentProvider, {
    name: 'paymentProviderSetting',
    description: 'Returns a single payment provider setting by id.',
  })
  paymentProviderSetting(@Args('id') id: string) {
    return this.paymentProviderSettingsDataloader.load(id);
  }

  /** DISABLE FOR NOW
  @Permissions(CanCreatePaymentProviderSettings)
  @Mutation(returns => SettingPaymentProvider, {
    name: 'createPaymentProviderSetting',
    description: 'Creates a new payment provider setting.',
  })
  createPaymentProviderSetting(@Args() input: CreateSettingPaymentProviderInput) {
    return this.paymentProviderSettingsService.createPaymentProviderSetting(input);
  }
 **/

  @Permissions(CanUpdatePaymentProviderSettings)
  @Mutation(returns => SettingPaymentProvider, {
    name: 'updatePaymentProviderSetting',
    description: 'Updates an existing payment provider setting.',
  })
  updatePaymentProviderSetting(
    @Args() input: UpdateSettingPaymentProviderInput
  ) {
    return this.paymentProviderSettingsService.updatePaymentProviderSetting(
      input
    );
  }
  /** DISABLE FOR NOW
  @Permissions(CanDeletePaymentProviderSettings)
  @Mutation(returns => SettingPaymentProvider, {
    name: 'deletePaymentProviderSetting',
    description: 'Deletes a payment provider setting.',
  })
  deletePaymentProviderSetting(@Args('id') id: string) {
    return this.paymentProviderSettingsService.deletePaymentProviderSetting(id);
  }
    **/
}
