import { PrismaClient } from '@prisma/client';
import { seed } from './seed';

const PROVIDER_TABLES = [
  'settingPaymentProvider',
  'settingMailProvider',
  'settingChallengeProvider',
  'settingTrackingPixel',
  'settingSyncProvider',
  'settingAIProvider',
  'settingAnalyticsProvider',
  'settingLetterProvider',
  'settingPdfRenderer',
] as const;

/** A fake client that records every write and answers reads with "nothing there yet". */
const createDb = () => {
  const writes: string[] = [];

  const table = (name: string) =>
    new Proxy(
      {},
      {
        get: (_target, method: string) => async () => {
          if (/^(create|upsert|update)/.test(method)) {
            writes.push(`${name}.${method}`);
          }

          return method.startsWith('count') ? 0 : null;
        },
      }
    );

  const db = new Proxy(
    {
      $transaction: async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
    } as Record<string, unknown>,
    {
      get: (target, name: string) => target[name] ?? table(name),
    }
  );

  return { db: db as unknown as PrismaClient, writes };
};

describe('seed', () => {
  it('leaves every integration for the admins to add themselves', async () => {
    const { db, writes } = createDb();

    await seed(db);

    const providerWrites = writes.filter(write =>
      PROVIDER_TABLES.some(table => write.startsWith(`${table}.`))
    );

    expect(providerWrites).toEqual([]);
    expect(writes).toContain('userRole.upsert');
    expect(writes).toContain('setting.upsert');
  });
});
