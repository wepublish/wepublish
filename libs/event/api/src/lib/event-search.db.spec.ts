import { Prisma, PrismaClient } from '@prisma/client';
import { createPrismaClient } from '@wepublish/testing/prisma';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { eventSearchSql } from './event-search';

type Transaction = Prisma.TransactionClient;

const MIGRATIONS = join(__dirname, '../../../../api/prisma/migrations');

const migration = (() => {
  const folder = readdirSync(MIGRATIONS).find(name =>
    name.endsWith('_replace_events_with_agenda')
  );

  return readFileSync(join(MIGRATIONS, folder ?? '', 'migration.sql'), 'utf8');
})();

const statement = (pattern: RegExp) => {
  const found = migration.match(pattern)?.[0];

  if (!found) {
    throw new Error(`The migration has no statement matching ${pattern}`);
  }

  return found;
};

class Rollback {
  constructor(public result: unknown) {}
}

const prepareSearchSchema = async (tx: Transaction) => {
  await tx.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  await tx.$executeRawUnsafe(
    'CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public'
  );
  await tx.$executeRawUnsafe(
    statement(/CREATE OR REPLACE FUNCTION events_unaccent[\s\S]*?STRICT;/)
  );
  await tx.$executeRawUnsafe(`
    CREATE TEMP TABLE "events.events.revisions" (
      id text PRIMARY KEY,
      "eventId" text NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      name text NOT NULL,
      "descriptionText" text,
      "publishedAt" timestamptz,
      "archivedAt" timestamptz
    ) ON COMMIT DROP
  `);
  await tx.$executeRawUnsafe(
    statement(
      /CREATE VIEW "events\.events\.revisions\.published" AS[\s\S]*?;/
    ).replace('CREATE VIEW', 'CREATE TEMP VIEW')
  );
  await tx.$executeRawUnsafe(
    statement(/CREATE INDEX event_revisions_search_trgm_idx[\s\S]*?;/)
  );
};

type Revision = {
  id: string;
  eventId: string;
  name: string;
  descriptionText?: string | null;
  publishedAt?: 'past' | 'future' | null;
  archived?: boolean;
};

const insertRevisions = async (tx: Transaction, revisions: Revision[]) => {
  for (const revision of revisions) {
    await tx.$executeRaw`
      INSERT INTO "events.events.revisions"
        (id, "eventId", name, "descriptionText", "publishedAt", "archivedAt")
      VALUES (
        ${revision.id},
        ${revision.eventId},
        ${revision.name},
        ${revision.descriptionText ?? null},
        CASE ${revision.publishedAt ?? 'none'}
          WHEN 'past' THEN now() - interval '1 hour'
          WHEN 'future' THEN now() + interval '1 day'
        END,
        CASE WHEN ${!!revision.archived} THEN now() END
      )
    `;
  }
};

const ids = async (tx: Transaction, query: Prisma.Sql) =>
  (await tx.$queryRaw<{ eventId: string }[]>(query))
    .map(({ eventId }) => eventId)
    .sort();

describe('event search on PostgreSQL', () => {
  let prisma: PrismaClient | undefined;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const client = createPrismaClient();

    try {
      await client.$queryRaw`SELECT 1`;
      prisma = client;
    } catch {
      await client.$disconnect().catch(() => undefined);
    }
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  const inRolledBackTransaction = async <T>(
    context: { skip: () => void },
    run: (tx: Transaction) => Promise<T>
  ): Promise<T | undefined> => {
    if (!prisma) {
      if (process.env['CI']) {
        throw new Error('CI provides a database for the event search spec.');
      }

      context.skip();

      return undefined;
    }

    try {
      await prisma.$transaction(
        async tx => {
          await prepareSearchSchema(tx);
          throw new Rollback(await run(tx));
        },
        { timeout: 20_000 }
      );
    } catch (error) {
      if (error instanceof Rollback) {
        return error.result as T;
      }

      throw error;
    }

    throw new Error('The search spec transaction was not rolled back.');
  };

  it('finds an accented event for an unaccented term, in any case', async context => {
    const found = await inRolledBackTransaction(context, async tx => {
      await insertRevisions(tx, [
        {
          id: 'r1',
          eventId: 'theatre',
          name: 'Théâtre de la Ville',
          publishedAt: 'past',
        },
        { id: 'r2', eventId: 'other', name: 'Konzert', publishedAt: 'past' },
      ]);

      return [
        await ids(tx, eventSearchSql('theatre', 'public')),
        await ids(tx, eventSearchSql('THEATRE', 'public')),
        await ids(tx, eventSearchSql('Théâtre', 'public')),
      ];
    });

    expect(found).toEqual([['theatre'], ['theatre'], ['theatre']]);
  });

  it('searches the plain text of the description too', async context => {
    const found = await inRolledBackTransaction(context, async tx => {
      await insertRevisions(tx, [
        {
          id: 'r1',
          eventId: 'e1',
          name: 'Abend',
          descriptionText: 'Mit dem Ensemble für Café-Musik',
          publishedAt: 'past',
        },
      ]);

      return ids(tx, eventSearchSql('cafe-musik', 'public'));
    });

    expect(found).toEqual(['e1']);
  });

  it('shows the public only published content and editors every open revision', async context => {
    const found = await inRolledBackTransaction(context, async tx => {
      await insertRevisions(tx, [
        { id: 'r1', eventId: 'draft', name: 'Théâtre draft' },
        {
          id: 'r2',
          eventId: 'pending',
          name: 'Théâtre pending',
          publishedAt: 'future',
        },
        {
          id: 'r3',
          eventId: 'archived',
          name: 'Théâtre archived',
          archived: true,
        },
        {
          id: 'r4',
          eventId: 'published',
          name: 'Théâtre published',
          publishedAt: 'past',
        },
      ]);

      return {
        public: await ids(tx, eventSearchSql('theatre', 'public')),
        editor: await ids(tx, eventSearchSql('theatre', 'editor')),
      };
    });

    expect(found).toEqual({
      public: ['published'],
      editor: ['draft', 'pending', 'published'],
    });
  });

  it('reads % and _ in the term literally', async context => {
    const found = await inRolledBackTransaction(context, async tx => {
      await insertRevisions(tx, [
        {
          id: 'r1',
          eventId: 'percent',
          name: '50% Rabatt',
          publishedAt: 'past',
        },
        { id: 'r2', eventId: 'plain', name: '500 Rabatt', publishedAt: 'past' },
      ]);

      return [
        await ids(tx, eventSearchSql('50%', 'public')),
        await ids(tx, eventSearchSql('5_0', 'public')),
      ];
    });

    expect(found).toEqual([['percent'], []]);
  });

  it('can answer the search from the trigram index', async context => {
    const plan = await inRolledBackTransaction(context, async tx => {
      await tx.$executeRawUnsafe('SET LOCAL enable_seqscan = off');

      const rows = await tx.$queryRaw<{ 'QUERY PLAN': string }[]>(
        Prisma.sql`EXPLAIN ${eventSearchSql('theatre', 'editor')}`
      );

      return rows.map(row => row['QUERY PLAN']).join('\n');
    });

    expect(plan).toContain('event_revisions_search_trgm_idx');
  });
});
