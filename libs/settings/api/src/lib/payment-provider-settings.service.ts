import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, SettingPaymentProvider } from '@prisma/client';
import {
  CreateSettingPaymentProviderInput,
  UpdateSettingPaymentProviderInput,
  SettingPaymentProviderFilter,
} from './payment-provider-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { PaymentProviderSettingsDataloaderService } from './payment-provider-settings-dataloader.service';

@Injectable()
export class PaymentProviderSettingsService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async paymentProviderSettingsList(
    filter?: SettingPaymentProviderFilter
  ): Promise<SettingPaymentProvider[]> {
    const data = await this.prisma.settingPaymentProvider.findMany({
      where: filter,
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
    return this.prisma.settingPaymentProvider.create({
      data: input,
    });
  }

  @PrimeDataLoader(PaymentProviderSettingsDataloaderService, 'id')
  async updatePaymentProviderSetting(
    input: UpdateSettingPaymentProviderInput
  ): Promise<SettingPaymentProvider> {
    const { id, ...updateData } = input;

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

    return this.prisma.settingPaymentProvider.update({
      where: { id },
      data: filteredUpdateData,
    });
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

    return this.prisma.settingPaymentProvider.delete({
      where: { id },
    });
  }
}
