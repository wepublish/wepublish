import { PrismaClient } from '@prisma/client';
import { seedProviders, seedRoles } from './seed';

type Row = { id: string };

const table = (initial: Row[] = []) => {
  const rows = [...initial];

  return {
    ids: () => rows.map(row => row.id).sort(),
    count: async () => rows.length,
    create: async ({ data }: { data: Row }) => {
      rows.push(data);
      return data;
    },
    createMany: async ({ data }: { data: Row[] }) => {
      rows.push(...data);
      return { count: data.length };
    },
  };
};

const createDb = (
  initial: {
    payment?: Row[];
    mail?: Row[];
    challenge?: Row[];
    trackingPixel?: Row[];
    sync?: Row[];
  } = {}
) => ({
  settingPaymentProvider: table(initial.payment),
  settingMailProvider: table(initial.mail),
  settingChallengeProvider: table(initial.challenge),
  settingTrackingPixel: table(initial.trackingPixel),
  settingSyncProvider: table(initial.sync),
});

const seed = (db: ReturnType<typeof createDb>) =>
  seedProviders(db as unknown as PrismaClient);

describe('seedProviders', () => {
  it('sets up the default providers on a fresh database', async () => {
    const db = createDb();

    await seed(db);

    expect(db.settingPaymentProvider.ids()).toEqual([
      'bexio',
      'mollie',
      'no-charge',
      'payrexx',
      'payrexx-subscription',
      'stripe',
      'stripe-checkout',
    ]);
    expect(db.settingMailProvider.ids()).toEqual(['smtp']);
    expect(db.settingChallengeProvider.ids()).toEqual(['turnstile']);
    expect(db.settingTrackingPixel.ids()).toEqual(['prolitteris']);
    expect(db.settingSyncProvider.ids()).toEqual(['mailchimp-sync']);
  });

  it('adds nothing to an installation that already has providers', async () => {
    const db = createDb({
      mail: [{ id: 'mailgun' }],
      challenge: [{ id: 'default-turnstile' }],
    });

    await seed(db);

    expect(db.settingPaymentProvider.ids()).toEqual([]);
    expect(db.settingMailProvider.ids()).toEqual(['mailgun']);
    expect(db.settingChallengeProvider.ids()).toEqual(['default-turnstile']);
    expect(db.settingTrackingPixel.ids()).toEqual([]);
    expect(db.settingSyncProvider.ids()).toEqual([]);
  });
});

describe('seedRoles', () => {
  it('seeds admin, editor, peer and agenda-admin, in the order callers destructure', () => {
    const upsert = vi.fn(args => args);
    const roles = seedRoles({
      userRole: { upsert },
    } as unknown as PrismaClient);

    expect(roles.map(({ create }: any) => create.id)).toEqual([
      'admin',
      'editor',
      'peer',
      'agenda-admin',
    ]);
  });

  it('seeds the agenda admin as a system role whose permissions come from code', () => {
    const upsert = vi.fn(args => args);
    const [, , , agendaAdmin] = seedRoles({
      userRole: { upsert },
    } as unknown as PrismaClient) as unknown as any[];

    expect(agendaAdmin).toEqual({
      where: { id: 'agenda-admin' },
      update: {},
      create: {
        id: 'agenda-admin',
        systemRole: true,
        name: 'Agenda-Admin',
        description: 'Agenda Administrator Role',
        permissionIDs: [],
      },
    });
  });
});
