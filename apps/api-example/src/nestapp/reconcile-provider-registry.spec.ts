import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  PROVIDER_REGISTRY_RECONCILED,
  reconcileProviderRegistry,
} from './reconcile-provider-registry';

vi.mock('@wepublish/settings/api', () => ({
  SettingName: { SESSION_TTL_DAYS: 'sessionTtlDays' },
}));

type Row = { [field: string]: unknown };
type Where = { [field: string]: unknown };

const matches = (row: Row, where: Where = {}) =>
  Object.entries(where).every(([field, condition]) => {
    const value = row[field];

    if (condition === null) {
      return value == null;
    }

    if (typeof condition === 'object' && 'notIn' in condition) {
      return !(condition as { notIn: unknown[] }).notIn.includes(value);
    }

    if (typeof condition === 'object' && 'not' in condition) {
      return value !== (condition as { not: unknown }).not;
    }

    return value === condition;
  });

const uniqueViolation = () =>
  Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });

const table = (key: string, initial: Row[] = []) => {
  const data = new Map<unknown, Row>(
    initial.map(row => [row[key], { deletedAt: null, ...row }])
  );

  return {
    rows: () => [...data.values()],
    get: (id: string) => data.get(id),
    findUnique: async ({ where }: { where: Where }) =>
      data.get(where[key]) ?? null,
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: Where;
      create: Row;
      update: Row;
    }) => {
      const existing = data.get(where[key]);
      await Promise.resolve();

      if (!existing && data.has(where[key])) {
        throw uniqueViolation();
      }

      const next =
        existing ? { ...existing, ...update } : { deletedAt: null, ...create };

      data.set(where[key], next);
      return next;
    },
    createMany: async ({
      data: rows,
      skipDuplicates,
    }: {
      data: Row[];
      skipDuplicates?: boolean;
    }) => {
      let count = 0;

      for (const row of rows) {
        if (data.has(row[key])) {
          if (!skipDuplicates) {
            throw uniqueViolation();
          }

          continue;
        }

        data.set(row[key], { deletedAt: null, ...row });
        count++;
      }

      return { count };
    },
    update: async ({ where, data: patch }: { where: Where; data: Row }) => {
      const existing = data.get(where[key]);

      if (!existing) {
        throw Object.assign(new Error('Record to update not found'), {
          code: 'P2025',
        });
      }

      Object.assign(existing, patch);
      return existing;
    },
    updateMany: async ({ where, data: patch }: { where: Where; data: Row }) => {
      const hits = [...data.values()].filter(row => matches(row, where));
      hits.forEach(row => Object.assign(row, patch));
      return { count: hits.length };
    },
  };
};

const createDb = (
  initial: {
    setting?: Row[];
    payment?: Row[];
    trackingPixel?: Row[];
    sync?: Row[];
    mail?: Row[];
    challenge?: Row[];
  } = {}
) => ({
  setting: table('name', initial.setting),
  settingPaymentProvider: table('id', initial.payment),
  settingTrackingPixel: table('id', initial.trackingPixel),
  settingSyncProvider: table('id', initial.sync),
  settingMailProvider: table('id', initial.mail),
  settingChallengeProvider: table('id', initial.challenge),
});

type Db = ReturnType<typeof createDb>;

const reconcile = (db: Db, configFilePath: string | undefined) =>
  reconcileProviderRegistry(db as unknown as PrismaClient, configFilePath);

const writeConfig = (yaml: string) => {
  const path = join(mkdtempSync(join(tmpdir(), 'reconcile-')), 'config.yaml');
  writeFileSync(path, yaml);
  return path;
};

const config = (sections = '') =>
  writeConfig(`general:
  apolloPlayground: true
  apolloIntrospection: true
  urlAdapter: default
mediaServer:
  quality: 1
${sections}`);

const active = (rows: Row[]) =>
  rows
    .filter(row => row['deletedAt'] == null)
    .map(row => row['id'])
    .sort();

describe('reconcileProviderRegistry', () => {
  beforeAll(() => Logger.overrideLogger(false));

  it('does nothing once the registry was reconciled', async () => {
    const db = createDb({
      setting: [{ name: PROVIDER_REGISTRY_RECONCILED, value: true }],
      payment: [
        { id: 'mollie', type: 'MOLLIE' },
        { id: 'stripe', type: 'STRIPE' },
      ],
    });

    await reconcile(
      db,
      config(`paymentProviders:
  - type: stripe
    id: stripe
`)
    );

    expect(active(db.settingPaymentProvider.rows())).toEqual([
      'mollie',
      'stripe',
    ]);
  });

  it('reconciles once when several replicas start at the same time', async () => {
    const db = createDb();
    const path = writeConfig(`general:
  apolloPlayground: true
  apolloIntrospection: true
  urlAdapter: default
  sessionTTLDays: 30
mediaServer:
  quality: 1
paymentProviders:
  - type: stripe
    id: stripe
  - type: mollie
    id: mollie
syncProviders:
  - type: mailchimp
    id: mailchimp
`);

    await expect(
      Promise.all([
        reconcile(db, path),
        reconcile(db, path),
        reconcile(db, path),
      ])
    ).resolves.toBeDefined();

    expect(active(db.settingPaymentProvider.rows())).toEqual([
      'mollie',
      'stripe',
    ]);
    expect(active(db.settingSyncProvider.rows())).toEqual(['mailchimp']);
    expect(db.setting.get('sessionTtlDays')).toMatchObject({ value: 30 });
    expect(db.setting.get(PROVIDER_REGISTRY_RECONCILED)).toMatchObject({
      value: true,
    });
  });

  it('marks a fresh install reconciled when several replicas start without a config file', async () => {
    const db = createDb();

    await expect(
      Promise.all([
        reconcile(db, undefined),
        reconcile(db, undefined),
        reconcile(db, undefined),
      ])
    ).resolves.toBeDefined();

    expect(db.setting.get(PROVIDER_REGISTRY_RECONCILED)).toMatchObject({
      value: true,
    });
  });

  it('marks the registry reconciled when there is no config file', async () => {
    const db = createDb();

    await reconcile(db, undefined);

    expect(db.setting.get(PROVIDER_REGISTRY_RECONCILED)).toMatchObject({
      value: true,
    });
  });

  it('keeps every provider when the config file cannot be read', async () => {
    const db = createDb({
      payment: [{ id: 'mollie', type: 'MOLLIE' }],
      mail: [
        { id: 'mailgun', type: 'MAILGUN' },
        { id: 'smtp', type: 'SMTP' },
      ],
    });

    await reconcile(db, join(tmpdir(), 'does-not-exist', 'config.yaml'));

    expect(active(db.settingPaymentProvider.rows())).toEqual(['mollie']);
    expect(active(db.settingMailProvider.rows())).toEqual(['mailgun', 'smtp']);
    expect(db.setting.get(PROVIDER_REGISTRY_RECONCILED)).toMatchObject({
      value: true,
    });
  });

  describe('payment providers', () => {
    it('retires those missing from the config and adds the new ones', async () => {
      const db = createDb({
        payment: [
          { id: 'mollie', type: 'MOLLIE' },
          { id: 'stripe', type: 'STRIPE', apiKey: 'encrypted-key' },
        ],
      });

      await reconcile(
        db,
        config(`paymentProviders:
  - type: stripe
    id: stripe
  - type: no-charge
    id: gratis
`)
      );

      expect(active(db.settingPaymentProvider.rows())).toEqual([
        'gratis',
        'stripe',
      ]);
      expect(db.settingPaymentProvider.get('mollie')?.['deletedAt']).toEqual(
        expect.any(Date)
      );
      expect(db.settingPaymentProvider.get('stripe')).toMatchObject({
        apiKey: 'encrypted-key',
      });
      expect(db.settingPaymentProvider.get('gratis')).toMatchObject({
        type: 'NO_CHARGE',
        name: 'gratis',
      });
    });

    it('are left alone when the config lists none', async () => {
      const db = createDb({ payment: [{ id: 'mollie', type: 'MOLLIE' }] });

      await reconcile(db, config());

      expect(active(db.settingPaymentProvider.rows())).toEqual(['mollie']);
    });
  });

  it('retires tracking pixel providers missing from the config', async () => {
    const db = createDb({
      trackingPixel: [
        { id: 'prolitteris', type: 'prolitteris' },
        { id: 'prolitteris-old', type: 'prolitteris' },
      ],
    });

    await reconcile(
      db,
      config(`trackingPixelProviders:
  - type: prolitteris
    id: prolitteris
`)
    );

    expect(active(db.settingTrackingPixel.rows())).toEqual(['prolitteris']);
  });

  it('takes the session lifetime over from the config', async () => {
    const db = createDb({ setting: [{ name: 'sessionTtlDays', value: 7 }] });

    await reconcile(
      db,
      writeConfig(`general:
  apolloPlayground: true
  apolloIntrospection: true
  urlAdapter: default
  sessionTTLDays: 30
mediaServer:
  quality: 1
`)
    );

    expect(db.setting.get('sessionTtlDays')).toMatchObject({ value: 30 });
  });

  it('adds the sync providers of the config', async () => {
    const db = createDb();

    await reconcile(
      db,
      config(`syncProviders:
  - type: mailchimp
    id: mailchimp-sync
`)
    );

    expect(db.settingSyncProvider.get('mailchimp-sync')).toMatchObject({
      type: 'MAILCHIMP',
    });
  });

  describe('mail provider', () => {
    it('keeps only the one the config names active', async () => {
      const db = createDb({
        mail: [
          { id: 'mailgun', type: 'MAILGUN' },
          { id: 'smtp', type: 'SMTP', smtp_host: 'mail.example.com' },
        ],
      });

      await reconcile(
        db,
        config(`mailProvider:
  id: smtp
  type: smtp
`)
      );

      expect(active(db.settingMailProvider.rows())).toEqual(['smtp']);
      expect(db.settingMailProvider.get('smtp')).toMatchObject({
        smtp_host: 'mail.example.com',
      });
    });

    it('keeps every one when the configured one does not exist', async () => {
      const db = createDb({
        mail: [
          { id: 'mailgun', type: 'MAILGUN' },
          { id: 'smtp', type: 'SMTP' },
        ],
      });

      await reconcile(
        db,
        config(`mailProvider:
  id: mandrill
  type: mailchimp
`)
      );

      expect(active(db.settingMailProvider.rows())).toEqual([
        'mailgun',
        'smtp',
      ]);
    });

    it('keeps every one when the config names none', async () => {
      const db = createDb({
        mail: [
          { id: 'mailgun', type: 'MAILGUN' },
          { id: 'smtp', type: 'SMTP' },
        ],
      });

      await reconcile(db, config());

      expect(active(db.settingMailProvider.rows())).toEqual([
        'mailgun',
        'smtp',
      ]);
    });
  });

  describe('challenge provider', () => {
    it('keeps only the one the config names active', async () => {
      const db = createDb({
        challenge: [
          { id: 'default-turnstile', type: 'TURNSTILE' },
          { id: 'hcaptcha', type: 'HCAPTCHA', siteKey: 'site-key' },
        ],
      });

      await reconcile(
        db,
        config(`challenge:
  type: hcaptcha
  id: hcaptcha
`)
      );

      expect(active(db.settingChallengeProvider.rows())).toEqual(['hcaptcha']);
      expect(db.settingChallengeProvider.get('hcaptcha')).toMatchObject({
        siteKey: 'site-key',
      });
    });

    it('falls back to the default the old config used when it names none', async () => {
      const db = createDb({
        challenge: [
          { id: 'default-turnstile', type: 'TURNSTILE', siteKey: 'site-key' },
          { id: 'turnstile', type: 'TURNSTILE' },
        ],
      });

      await reconcile(db, config());

      expect(active(db.settingChallengeProvider.rows())).toEqual([
        'default-turnstile',
      ]);
    });

    it('keeps the seeded one of a fresh install', async () => {
      const db = createDb({
        challenge: [{ id: 'turnstile', type: 'TURNSTILE' }],
      });

      await reconcile(db, config());

      expect(active(db.settingChallengeProvider.rows())).toEqual(['turnstile']);
    });
  });
});
