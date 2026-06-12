import { getPrismaPgAdapterOptions } from './prisma-adapter-options';

describe('getPrismaPgAdapterOptions', () => {
  const originalDatabaseUrl = process.env['DATABASE_URL'];
  const originalPoolSize = process.env['DATABASE_POOL_SIZE'];

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env['DATABASE_URL'];
    } else {
      process.env['DATABASE_URL'] = originalDatabaseUrl;
    }

    if (originalPoolSize === undefined) {
      delete process.env['DATABASE_POOL_SIZE'];
    } else {
      process.env['DATABASE_POOL_SIZE'] = originalPoolSize;
    }
  });

  it('uses safe defaults when database env vars are missing', () => {
    delete process.env['DATABASE_URL'];
    delete process.env['DATABASE_POOL_SIZE'];

    expect(getPrismaPgAdapterOptions()).toEqual({
      connectionString: 'postgresql://',
      max: 2,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
    });
  });

  it('uses the configured connection string and pool size', () => {
    process.env['DATABASE_URL'] = 'postgresql://user:pass@example/db';
    process.env['DATABASE_POOL_SIZE'] = '7';

    expect(getPrismaPgAdapterOptions()).toMatchObject({
      connectionString: 'postgresql://user:pass@example/db',
      max: 7,
    });
  });

  it('falls back to the default pool size when the configured pool size is invalid', () => {
    process.env['DATABASE_POOL_SIZE'] = 'not-a-number';

    expect(getPrismaPgAdapterOptions().max).toBe(2);
  });
});
