import type { PrismaClient } from '@prisma/client';
import type { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import type { Feature } from '@wepublish/features';
import type { Mock } from 'vitest';
import {
  FEATURES_CACHE_NAMESPACE,
  FeaturesService,
  parseFeatureList,
} from './features.service';

const registry: readonly Feature[] = [
  { key: 'newsletter', description: 'Newsletter editor', stage: 'alpha' },
  { key: 'print-export', description: 'Print run export', stage: 'beta' },
];

describe('parseFeatureList', () => {
  it('splits a comma separated list', () => {
    expect(parseFeatureList('newsletter,print-export')).toEqual([
      'newsletter',
      'print-export',
    ]);
  });

  it('tolerates whitespace and empty entries', () => {
    expect(parseFeatureList(' newsletter , ,print-export,')).toEqual([
      'newsletter',
      'print-export',
    ]);
  });

  it('returns nothing when the variable is unset', () => {
    expect(parseFeatureList(undefined)).toEqual([]);
    expect(parseFeatureList('')).toEqual([]);
  });
});

describe('FeaturesService', () => {
  let prisma: {
    mediumFeature: { findMany: Mock; upsert: Mock; updateMany: Mock };
    $transaction: Mock;
  };
  let kv: { getOrLoadNs: Mock; resetNamespace: Mock };

  const makeService = (envKeys: string[] = []) =>
    new FeaturesService(
      prisma as unknown as PrismaClient,
      kv as unknown as KvTtlCacheService,
      registry,
      envKeys
    );

  beforeEach(() => {
    prisma = {
      mediumFeature: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockImplementation(args => args),
        updateMany: vi.fn().mockImplementation(args => args),
      },
      $transaction: vi.fn().mockResolvedValue([]),
    };
    kv = {
      getOrLoadNs: vi.fn((_ns, _key, loader: () => unknown) => loader()),
      resetNamespace: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe('enabledKeys', () => {
    it('returns the features One switched on', async () => {
      prisma.mediumFeature.findMany.mockResolvedValue([{ key: 'newsletter' }]);

      await expect(makeService().enabledKeys()).resolves.toEqual([
        'newsletter',
      ]);
      expect(prisma.mediumFeature.findMany).toHaveBeenCalledWith({
        where: { enabled: true },
        select: { key: true },
      });
    });

    it('ignores switched on keys this version does not know', async () => {
      prisma.mediumFeature.findMany.mockResolvedValue([
        { key: 'newsletter' },
        { key: 'released-long-ago' },
      ]);

      await expect(makeService().enabledKeys()).resolves.toEqual([
        'newsletter',
      ]);
    });

    it('adds the features switched on through WEP_FEATURES', async () => {
      prisma.mediumFeature.findMany.mockResolvedValue([{ key: 'newsletter' }]);

      await expect(
        makeService(['print-export', 'newsletter']).enabledKeys()
      ).resolves.toEqual(['newsletter', 'print-export']);
    });

    it('ignores unknown keys from WEP_FEATURES', async () => {
      await expect(makeService(['typo']).enabledKeys()).resolves.toEqual([]);
    });

    it('is cached in its own namespace', async () => {
      await makeService().enabledKeys();

      expect(kv.getOrLoadNs).toHaveBeenCalledWith(
        FEATURES_CACHE_NAMESPACE,
        'enabled',
        expect.any(Function),
        expect.any(Number)
      );
    });
  });

  describe('isEnabled', () => {
    it('is true for an enabled feature', async () => {
      prisma.mediumFeature.findMany.mockResolvedValue([{ key: 'newsletter' }]);

      await expect(makeService().isEnabled('newsletter')).resolves.toBe(true);
    });

    it('is false for a feature that is off or unknown', async () => {
      await expect(makeService().isEnabled('newsletter')).resolves.toBe(false);
      await expect(makeService().isEnabled('typo')).resolves.toBe(false);
    });
  });

  describe('apply', () => {
    it('stores the state One sent and switches off whatever it left out', async () => {
      await makeService().apply({ newsletter: true, 'print-export': false });

      expect(prisma.mediumFeature.upsert).toHaveBeenCalledWith({
        where: { key: 'newsletter' },
        create: { key: 'newsletter', enabled: true },
        update: { enabled: true },
      });
      expect(prisma.mediumFeature.upsert).toHaveBeenCalledWith({
        where: { key: 'print-export' },
        create: { key: 'print-export', enabled: false },
        update: { enabled: false },
      });
      expect(prisma.mediumFeature.updateMany).toHaveBeenCalledWith({
        where: { key: { notIn: ['newsletter', 'print-export'] } },
        data: { enabled: false },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('keeps the state of keys this version does not know yet', async () => {
      await makeService().apply({ 'from-a-newer-version': true });

      expect(prisma.mediumFeature.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { key: 'from-a-newer-version' } })
      );
    });

    it('drops keys One would never send', async () => {
      await makeService().apply({
        newsletter: true,
        'Not A Key; DROP TABLE': true,
      });

      expect(prisma.mediumFeature.upsert).toHaveBeenCalledTimes(1);
      expect(prisma.mediumFeature.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { key: 'newsletter' } })
      );
    });

    it('drops values that are not booleans', async () => {
      await makeService().apply({
        newsletter: 'yes' as unknown as boolean,
      });

      expect(prisma.mediumFeature.upsert).not.toHaveBeenCalled();
    });

    it('resets the cache so the change applies at once', async () => {
      await makeService().apply({ newsletter: true });

      expect(kv.resetNamespace).toHaveBeenCalledWith(FEATURES_CACHE_NAMESPACE, {
        pages: false,
      });
    });
  });
});
