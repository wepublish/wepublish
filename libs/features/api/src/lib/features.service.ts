import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  type Feature,
  FEATURE_KEY_PATTERN,
  isKnownFeature,
} from '@wepublish/features';
import { NamespacedCache, NamespaceResets } from '@wepublish/kv-ttl-cache/api';
import { FEATURE_ENV_KEYS, FEATURE_REGISTRY } from './features.tokens';

export const FEATURES_CACHE_NAMESPACE = 'features';
export const FEATURES_CACHE_TTL_SECONDS = 300;

export const parseFeatureList = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean);

@Injectable()
export class FeaturesService {
  constructor(
    private prisma: PrismaClient,
    private kv: NamespacedCache,
    private resets: NamespaceResets,
    @Inject(FEATURE_REGISTRY) private registry: readonly Feature[],
    @Inject(FEATURE_ENV_KEYS) private envKeys: string[]
  ) {}

  /** The features switched on for this medium, by One or by WEP_FEATURES. */
  async enabledKeys(): Promise<string[]> {
    const stored = await this.kv.getOrLoadNs(
      FEATURES_CACHE_NAMESPACE,
      'enabled',
      async () =>
        (
          await this.prisma.mediumFeature.findMany({
            where: { enabled: true },
            select: { key: true },
          })
        ).map(row => row.key),
      FEATURES_CACHE_TTL_SECONDS
    );

    return [...new Set([...stored, ...this.envKeys])].filter(key =>
      isKnownFeature(key, this.registry)
    );
  }

  async isEnabled(key: string): Promise<boolean> {
    return (await this.enabledKeys()).includes(key);
  }

  /**
   * Stores the complete state One holds for this medium: a key One no longer
   * sends is switched off. Keys this version does not know are kept, so the
   * state survives a rollback and the next deploy.
   */
  async apply(features: Record<string, boolean>): Promise<void> {
    const entries = Object.entries(features).filter(
      ([key, enabled]) =>
        FEATURE_KEY_PATTERN.test(key) && typeof enabled === 'boolean'
    );
    const keys = entries.map(([key]) => key);

    await this.prisma.$transaction([
      ...entries.map(([key, enabled]) =>
        this.prisma.mediumFeature.upsert({
          where: { key },
          create: { key, enabled },
          update: { enabled },
        })
      ),
      this.prisma.mediumFeature.updateMany({
        where: { key: { notIn: keys } },
        data: { enabled: false },
      }),
    ]);

    await this.resets.reset(FEATURES_CACHE_NAMESPACE);
  }
}
