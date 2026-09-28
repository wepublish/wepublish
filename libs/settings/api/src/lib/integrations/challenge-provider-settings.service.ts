import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, SettingChallengeProvider } from '@prisma/client';
import {
  CreateSettingChallengeProviderInput,
  UpdateSettingChallengeProviderInput,
  SettingChallengeProviderFilter,
} from './challenge-provider-settings.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { ChallengeProviderSettingsDataloaderService } from './challenge-provider-settings-dataloader.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from './secrets-crypto';
import { ProviderSettingsChanged } from './provider-settings-changed';
import { clearProviderConfig } from './clear-provider-config';

@Injectable()
export class ChallengeProviderSettingsService {
  private readonly crypto = new SecretCrypto();
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService,
    private providerSettingsChanged: ProviderSettingsChanged
  ) {}

  private encryptSecretsIfPresent<T extends { secret?: string | null }>(
    data: T
  ): T {
    if (typeof data.secret === 'string' && data.secret.length > 0) {
      return {
        ...data,
        secret: this.crypto.encrypt(data.secret),
      };
    }
    return data;
  }

  @PrimeDataLoader(ChallengeProviderSettingsDataloaderService, 'id')
  async challengeProviderSettingsList(
    filter?: SettingChallengeProviderFilter
  ): Promise<SettingChallengeProvider[]> {
    const data = await this.prisma.settingChallengeProvider.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return data;
  }

  @PrimeDataLoader(ChallengeProviderSettingsDataloaderService, 'id')
  async challengeProviderSetting(
    id: string
  ): Promise<SettingChallengeProvider> {
    const data = await this.prisma.settingChallengeProvider.findUnique({
      where: { id },
    });

    if (!data) {
      throw new NotFoundException(
        `Challenge Provider Setting with id ${id} not found`
      );
    }

    return data;
  }

  @PrimeDataLoader(ChallengeProviderSettingsDataloaderService, 'id')
  async createChallengeProviderSetting(
    input: CreateSettingChallengeProviderInput
  ): Promise<SettingChallengeProvider> {
    const data = this.encryptSecretsIfPresent(input);
    const returnValue = await this.prisma.settingChallengeProvider.create({
      data,
    });

    await this.kv.resetNamespace('settings:challenge');
    await this.providerSettingsChanged.notify('Challenge provider');
    return returnValue;
  }

  @PrimeDataLoader(ChallengeProviderSettingsDataloaderService, 'id')
  async updateChallengeProviderSetting(
    input: UpdateSettingChallengeProviderInput
  ): Promise<SettingChallengeProvider> {
    const data = this.encryptSecretsIfPresent(input);
    const { id, ...updateData } = data;

    const existingSetting =
      await this.prisma.settingChallengeProvider.findUnique({
        where: { id },
      });

    if (!existingSetting) {
      throw new NotFoundException(
        `Challenge Provider Setting with id ${id} not found`
      );
    }

    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const typeChanged =
      filteredUpdateData['type'] !== undefined &&
      filteredUpdateData['type'] !== existingSetting.type;

    const updatePayload =
      typeChanged ?
        {
          ...clearProviderConfig('SettingChallengeProvider'),
          type: filteredUpdateData['type'],
          ...('name' in filteredUpdateData ?
            { name: filteredUpdateData['name'] }
          : {}),
        }
      : filteredUpdateData;

    const returnValue = await this.prisma.settingChallengeProvider.update({
      where: { id },
      data: updatePayload,
    });

    await this.kv.resetNamespace('settings:challenge');
    await this.providerSettingsChanged.notify('Challenge provider');
    return returnValue;
  }

  @PrimeDataLoader(ChallengeProviderSettingsDataloaderService, 'id')
  async deleteChallengeProviderSetting(
    id: string
  ): Promise<SettingChallengeProvider> {
    const existingSetting =
      await this.prisma.settingChallengeProvider.findUnique({
        where: { id },
      });

    if (!existingSetting) {
      throw new NotFoundException(
        `Challenge Provider Setting with id ${id} not found`
      );
    }

    if ((await this.prisma.settingChallengeProvider.count()) === 1) {
      throw new BadRequestException(
        `Challenge provider ${id} is the only one configured and cannot be ` +
          `deleted: signup and comment forms would lose their captcha. ` +
          `Create a replacement first, or change its type instead.`
      );
    }

    const returnValue = await this.prisma.settingChallengeProvider.delete({
      where: { id },
    });

    await this.kv.resetNamespace('settings:challenge');
    await this.providerSettingsChanged.notify('Challenge provider');
    return returnValue;
  }
}
