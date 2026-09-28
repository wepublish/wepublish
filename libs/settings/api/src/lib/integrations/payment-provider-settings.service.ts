import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingPaymentProvider } from '@prisma/client';
import {
  CreateSettingPaymentProviderInput,
  UpdateSettingPaymentProviderInput,
  SettingPaymentProviderFilter,
} from './payment-provider-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { PaymentProviderSettingsDataloaderService } from './payment-provider-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './secrets-crypto';
import { ProviderSettingsChanged } from './provider-settings-changed';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class PaymentProviderSettingsService {
  private readonly crypto = new SecretCrypto();
  private readonly logger = new Logger(PaymentProviderSettingsService.name);
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService,
    private providerSettingsChanged: ProviderSettingsChanged
  ) {}

  private encryptSecretsIfPresent<
    T extends { apiKey?: string | null; webhookEndpointSecret?: string | null },
  >(data: T): T {
    let result = { ...data };
    if (typeof data.apiKey === 'string' && data.apiKey.length > 0) {
      result = { ...result, apiKey: this.crypto.encrypt(data.apiKey) };
    }
    if (
      typeof data.webhookEndpointSecret === 'string' &&
      data.webhookEndpointSecret.length > 0
    ) {
      result = {
        ...result,
        webhookEndpointSecret: this.crypto.encrypt(data.webhookEndpointSecret),
      };
    }
    return result;
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async paymentProviderSettingsList(
    filter?: SettingPaymentProviderFilter
  ): Promise<SettingPaymentProvider[]> {
    // A deleted provider is gone from the lists; that is the entire effect of
    // deleting one.
    const data = await this.prisma.settingPaymentProvider.findMany({
      where: { ...filter, deletedAt: null },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async paymentProviderSetting(id: string): Promise<SettingPaymentProvider> {
    const data = await this.prisma.settingPaymentProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Payment Provider Setting with id ${id} not found`
      );
    }

    return data;
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async createPaymentProviderSetting(
    input: CreateSettingPaymentProviderInput
  ): Promise<SettingPaymentProvider> {
    const output = this.encryptSecretsIfPresent(input);

    // Deleting only hides a provider, so adding one back is an undelete rather
    // than a name clash. The configuration it had is left exactly as it was —
    // the row comes back the way the operator left it.
    const returnValue = await this.prisma.settingPaymentProvider.upsert({
      where: { id: output.id },
      create: output,
      update: { deletedAt: null },
    });

    await this.kv.resetNamespace('settings:paymentprovider');
    await this.providerSettingsChanged.notify('Payment provider');

    return returnValue;
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async updatePaymentProviderSetting(
    input: UpdateSettingPaymentProviderInput
  ): Promise<SettingPaymentProvider> {
    const output = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = output;

    const existingSetting = await this.prisma.settingPaymentProvider.findUnique(
      {
        where: { id },
      }
    );

    if (!existingSetting) {
      throw new NotFoundException(
        `Payment Provider Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const returnValue = await this.prisma.settingPaymentProvider.update({
      where: { id },
      data: filteredUpdateData,
    });
    await this.kv.resetNamespace('settings:paymentprovider');
    await this.providerSettingsChanged.notify('Payment provider');
    return returnValue;
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async deletePaymentProviderSetting(
    id: string
  ): Promise<SettingPaymentProvider> {
    const existingSetting = await this.prisma.settingPaymentProvider.findUnique(
      {
        where: { id },
      }
    );

    if (!existingSetting) {
      throw new NotFoundException(
        `Payment Provider Setting with id ${id} not found`
      );
    }

    const usage = await this.countUsage(id);

    if (usage) {
      const message =
        `Payment provider ${id} was deleted while still used by ${usage} subscription(s). ` +
        `It keeps running so existing records stay intact, but it is no longer offered.`;

      this.logger.warn(message);
      Sentry.captureMessage(message, 'warning');
    }

    const returnValue = await this.prisma.settingPaymentProvider.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.kv.resetNamespace('settings:paymentprovider');
    await this.providerSettingsChanged.notify('Payment provider');
    return returnValue;
  }

  /**
   * Payment methods reference their provider by id, and subscriptions,
   * payments and invoices all hang off those — which is why deleting is a soft
   * delete. An operator removing a provider that still carries live traffic is
   * worth knowing about all the same.
   */
  private async countUsage(id: string): Promise<number> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { paymentProviderID: id },
      select: { id: true },
    });

    if (!paymentMethods.length) {
      return 0;
    }

    return this.prisma.subscription.count({
      where: {
        paymentMethodID: { in: paymentMethods.map(method => method.id) },
      },
    });
  }
}
