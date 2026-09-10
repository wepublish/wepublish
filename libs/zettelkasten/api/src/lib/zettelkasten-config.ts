import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';

export type ZettelkastenSettings = {
  enabled: boolean;
  url: string | null;
  tenant: string | null;
  token: string | null;
};

/** The id of the single knowledge provider row, created by the migration. */
export const ZETTELKASTEN_SETTING_ID = 'zettelkasten';
/** Reset by the settings service on every update. */
const CACHE_NAMESPACE = 'settings:knowledge-provider';
const TTL_SECONDS = 21600; // 6h, like V0Config

/**
 * Loads the knowledge provider setting of this editor, decrypts the token and
 * caches the result. The tenant comes from here and never from a request.
 */
@Injectable()
export class ZettelkastenConfig {
  private readonly crypto = new SecretCrypto();

  constructor(
    @Inject(PrismaClient) private readonly prisma: PrismaClient,
    @Inject(KvTtlCacheService) private readonly kv: KvTtlCacheService
  ) {}

  private async loadFromDatabase(): Promise<ZettelkastenSettings> {
    const setting = await this.prisma.settingKnowledgeProvider.update({
      where: { id: ZETTELKASTEN_SETTING_ID },
      data: { lastLoadedAt: new Date() },
      select: { enabled: true, url: true, tenant: true, token: true },
    });

    return {
      enabled: setting.enabled,
      url: setting.url,
      tenant: setting.tenant,
      token: setting.token ? this.crypto.decrypt(setting.token) : null,
    };
  }

  load(): Promise<ZettelkastenSettings> {
    return this.kv.getOrLoadNs<ZettelkastenSettings>(
      CACHE_NAMESPACE,
      ZETTELKASTEN_SETTING_ID,
      () => this.loadFromDatabase(),
      TTL_SECONDS
    );
  }
}
