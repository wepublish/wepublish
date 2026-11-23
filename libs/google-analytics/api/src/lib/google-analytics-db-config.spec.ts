import { PrismaClient } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { GoogleAnalyticsDbConfig } from './google-analytics-db-config';

type Row = { id: string } & Record<string, unknown>;

class AnalyticsProviderTable {
  rows = new Map<string, Row>();

  findUnique = vi.fn(
    async ({ where }: { where: { id: string } }) =>
      this.rows.get(where.id) ?? null
  );

  // Like Prisma: update fails for a row that does not exist, updateMany does not.
  update = vi.fn(
    async ({ where, data }: { where: { id: string }; data: object }) => {
      const row = this.rows.get(where.id);

      if (!row) {
        throw Object.assign(new Error('Record to update not found.'), {
          code: 'P2025',
        });
      }

      Object.assign(row, data);
      return row;
    }
  );

  updateMany = vi.fn(
    async ({ where, data }: { where: { id: string }; data: object }) => {
      const row = this.rows.get(where.id);

      if (row) {
        Object.assign(row, data);
      }

      return { count: row ? 1 : 0 };
    }
  );
}

describe('GoogleAnalyticsDbConfig', () => {
  let table: AnalyticsProviderTable;
  let testing: NamespacedCacheTesting;
  const config = () =>
    new GoogleAnalyticsDbConfig(
      { settingAnalyticsProvider: table } as unknown as PrismaClient,
      testing.cache,
      'google-analytics'
    );

  beforeEach(async () => {
    table = new AnalyticsProviderTable();
    testing = await createNamespacedCacheTesting();
  });

  afterEach(() => testing.close());

  it('works without a stored configuration', async () => {
    await expect(config().getGoogleAnalytics()).resolves.toEqual({
      credentials: undefined,
      property: undefined,
      articlePrefix: '/a',
    });
    expect(table.rows.size).toBe(0);
  });

  it('reads the stored configuration and notes when it was loaded', async () => {
    table.rows.set('google-analytics', {
      id: 'google-analytics',
      credentials: null,
      property: '123',
      articlePrefix: '/article/',
    });

    await expect(config().getGoogleAnalytics()).resolves.toEqual({
      credentials: undefined,
      property: '123',
      articlePrefix: '/article/',
    });
    expect(table.rows.get('google-analytics')?.['lastLoadedAt']).toBeInstanceOf(
      Date
    );
  });
});
