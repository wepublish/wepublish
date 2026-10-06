import { AnalyticsProviderType, PrismaClient } from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { GoogleAnalyticsDbConfig } from './google-analytics-db-config';

type Row = { id: string } & Record<string, unknown>;

const uniqueViolation = () =>
  Object.assign(new Error('Unique constraint failed on the fields: (`id`)'), {
    code: 'P2002',
  });

class AnalyticsProviderTable {
  rows = new Map<string, Row>();

  findUnique = jest.fn(
    async ({ where }: { where: { id: string } }) =>
      this.rows.get(where.id) ?? null
  );

  create = jest.fn(async ({ data }: { data: Row }) => {
    if (this.rows.has(data.id)) {
      throw uniqueViolation();
    }

    this.rows.set(data.id, data);

    return data;
  });

  createMany = jest.fn(
    async ({
      data,
      skipDuplicates,
    }: {
      data: Row[];
      skipDuplicates?: boolean;
    }) => {
      let count = 0;

      for (const row of data) {
        if (this.rows.has(row.id)) {
          if (!skipDuplicates) {
            throw uniqueViolation();
          }

          continue;
        }

        this.rows.set(row.id, row);
        count++;
      }

      return { count };
    }
  );
}

describe('GoogleAnalyticsDbConfig', () => {
  let table: AnalyticsProviderTable;
  const replica = () =>
    new GoogleAnalyticsDbConfig(
      { settingAnalyticsProvider: table } as unknown as PrismaClient,
      {} as KvTtlCacheService,
      'google-analytics'
    );

  beforeEach(() => {
    table = new AnalyticsProviderTable();
  });

  it('creates the configuration once when several replicas start at the same time', async () => {
    await expect(
      Promise.all([
        replica().initDatabaseConfiguration(),
        replica().initDatabaseConfiguration(),
        replica().initDatabaseConfiguration(),
      ])
    ).resolves.toBeDefined();

    expect(table.rows.size).toBe(1);
    expect(table.rows.get('google-analytics')).toMatchObject({
      type: AnalyticsProviderType.GOOGLE,
      name: 'Google Analytics',
    });
  });

  it('leaves an existing configuration untouched', async () => {
    table.rows.set('google-analytics', {
      id: 'google-analytics',
      name: 'Our analytics',
      property: '123',
    });

    await replica().initDatabaseConfiguration();

    expect(table.rows.get('google-analytics')).toEqual({
      id: 'google-analytics',
      name: 'Our analytics',
      property: '123',
    });
  });
});
