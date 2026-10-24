import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  EVENT_SEARCH_EXPRESSION,
  escapeLikePattern,
  eventSearchSql,
  searchEventIds,
} from './event-search';

const MIGRATIONS = join(__dirname, '../../../../api/prisma/migrations');

const searchMigration = () => {
  const folder = readdirSync(MIGRATIONS).find(name =>
    name.endsWith('_replace_events_with_agenda')
  );

  return readFileSync(join(MIGRATIONS, folder ?? '', 'migration.sql'), 'utf8');
};

describe('EVENT_SEARCH_EXPRESSION', () => {
  it('is the expression the trigram index of the migration is built on', () => {
    expect(searchMigration()).toContain(
      `USING GIN (${EVENT_SEARCH_EXPRESSION} gin_trgm_ops)`
    );
  });
});

describe('escapeLikePattern', () => {
  it('escapes the like wildcards and the escape character', () => {
    expect(escapeLikePattern('50%_off')).toBe('50\\%\\_off');
    expect(escapeLikePattern('a\\b')).toBe('a\\\\b');
  });

  it('leaves other text alone', () => {
    expect(escapeLikePattern('Théâtre de la Ville')).toBe(
      'Théâtre de la Ville'
    );
  });
});

describe('eventSearchSql', () => {
  it('matches the indexed expression against the unaccented term', () => {
    const query = eventSearchSql('theatre', 'public');

    expect(query.sql).toContain(
      `${EVENT_SEARCH_EXPRESSION} ILIKE '%' || events_unaccent(`
    );
    expect(query.values).toEqual(['theatre']);
  });

  it('searches the published revision for the public', () => {
    const query = eventSearchSql('theatre', 'public');

    expect(query.sql).toContain('JOIN "events.events.revisions.published"');
    expect(query.sql).not.toContain('"archivedAt" IS NULL');
  });

  it('searches every revision that is not archived for editors', () => {
    const query = eventSearchSql('theatre', 'editor');

    expect(query.sql).not.toContain('"events.events.revisions.published"');
    expect(query.sql).toContain('"archivedAt" IS NULL');
  });

  it('passes the term as an escaped parameter', () => {
    const query = eventSearchSql(`50%_off'; DROP TABLE x; --`, 'public');

    expect(query.values).toEqual([`50\\%\\_off'; DROP TABLE x; --`]);
    expect(query.sql).not.toContain('DROP TABLE');
  });

  it('trims the term', () => {
    expect(eventSearchSql('  theatre ', 'public').values).toEqual(['theatre']);
  });
});

describe('searchEventIds', () => {
  it('adds no clause for a blank search', async () => {
    const prisma = { $queryRaw: vi.fn() };

    await expect(searchEventIds(prisma, '  ', 'public')).resolves.toBeNull();
    await expect(searchEventIds(prisma, null, 'public')).resolves.toBeNull();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('returns the matching event ids', async () => {
    const prisma = {
      $queryRaw: vi
        .fn()
        .mockResolvedValue([{ eventId: 'e1' }, { eventId: 'e2' }]),
    };

    await expect(searchEventIds(prisma, 'theatre', 'editor')).resolves.toEqual([
      'e1',
      'e2',
    ]);
    expect(prisma.$queryRaw.mock.calls[0][0].sql).toEqual(
      eventSearchSql('theatre', 'editor').sql
    );
  });
});
