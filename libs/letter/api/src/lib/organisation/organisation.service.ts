import { Injectable } from '@nestjs/common';
import { PrismaClient, SettingOrganisation } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import { LetterAddress } from '../letter-provider/letter-provider.interface';

export const ORGANISATION_SETTINGS_NAMESPACE = 'settings:organisation';

export const ORGANISATION_SETTINGS_ID = 'default';

const TTL_SECONDS = 21600;

export class OrganisationSettingsError extends Error {}

@Injectable()
export class OrganisationService {
  private readonly crypto = new SecretCrypto();

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  async get(): Promise<SettingOrganisation | null> {
    return this.kv.getOrLoadNs<SettingOrganisation | null>(
      ORGANISATION_SETTINGS_NAMESPACE,
      ORGANISATION_SETTINGS_ID,
      () => this.load(),
      TTL_SECONDS
    );
  }

  async getOrThrow(): Promise<SettingOrganisation> {
    const settings = await this.get();

    if (!settings) {
      throw new OrganisationSettingsError(
        'No organisation settings configured. They are required to send letters.'
      );
    }

    return settings;
  }

  async update(
    input: Partial<
      Omit<
        SettingOrganisation,
        'id' | 'createdAt' | 'modifiedAt' | 'lastLoadedAt'
      >
    >
  ): Promise<SettingOrganisation> {
    const { iban, ...rest } = input;
    const data = {
      ...rest,
      ...(iban !== undefined ?
        { iban: iban ? this.crypto.encrypt(iban) : null }
      : {}),
    };

    const settings = await this.prisma.settingOrganisation.upsert({
      where: { id: ORGANISATION_SETTINGS_ID },
      create: { id: ORGANISATION_SETTINGS_ID, ...data },
      update: data,
    });

    await this.kv.delNs(
      ORGANISATION_SETTINGS_NAMESPACE,
      ORGANISATION_SETTINGS_ID
    );

    return { ...settings, iban: iban ?? null };
  }

  async getSenderAddress(): Promise<LetterAddress> {
    const settings = await this.getOrThrow();

    if (
      !settings.name ||
      !settings.zip ||
      !settings.city ||
      !settings.country
    ) {
      throw new OrganisationSettingsError(
        'The organisation settings are missing name, zip, city or country.'
      );
    }

    return {
      name: settings.name,
      street: settings.street ?? undefined,
      number: settings.number ?? undefined,
      zip: settings.zip,
      city: settings.city,
      country: settings.country,
    };
  }

  private async load(): Promise<SettingOrganisation | null> {
    const settings = await this.prisma.settingOrganisation.findUnique({
      where: { id: ORGANISATION_SETTINGS_ID },
    });

    if (!settings) {
      return null;
    }

    await this.prisma.settingOrganisation.update({
      where: { id: ORGANISATION_SETTINGS_ID },
      data: { lastLoadedAt: new Date() },
    });

    let iban: string | null = null;

    if (settings.iban) {
      try {
        iban = this.crypto.decrypt(settings.iban);
      } catch (e) {
        console.error(e);
        throw new OrganisationSettingsError(
          'Failed to decrypt the organisation iban'
        );
      }
    }

    return { ...settings, iban };
  }
}
