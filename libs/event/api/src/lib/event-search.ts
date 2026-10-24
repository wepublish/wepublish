import { Prisma } from '@prisma/client';

export type EventSearchScope = 'public' | 'editor';

type RawQueryClient = {
  $queryRaw: (query: Prisma.Sql) => Promise<unknown>;
};

export const EVENT_SEARCH_EXPRESSION = `events_unaccent(coalesce("name", '') || ' ' || coalesce("descriptionText", ''))`;

export const escapeLikePattern = (term: string) =>
  term.replace(/[\\%_]/g, character => `\\${character}`);

const matches = (term: string) =>
  Prisma.sql`${Prisma.raw(EVENT_SEARCH_EXPRESSION)} ILIKE '%' || events_unaccent(${escapeLikePattern(term.trim())}) || '%'`;

export const eventSearchSql = (term: string, scope: EventSearchScope) =>
  scope === 'public' ?
    Prisma.sql`
      SELECT DISTINCT "events.events.revisions"."eventId" AS "eventId"
      FROM "events.events.revisions"
      JOIN "events.events.revisions.published" AS published
        ON published.id = "events.events.revisions".id
      WHERE ${matches(term)}
    `
  : Prisma.sql`
      SELECT DISTINCT "eventId"
      FROM "events.events.revisions"
      WHERE "archivedAt" IS NULL AND ${matches(term)}
    `;

export const searchEventIds = async (
  prisma: RawQueryClient,
  term: string | null | undefined,
  scope: EventSearchScope
): Promise<string[] | null> => {
  if (!term?.trim()) {
    return null;
  }

  const rows = (await prisma.$queryRaw(eventSearchSql(term, scope))) as {
    eventId: string;
  }[];

  return rows.map(({ eventId }) => eventId);
};
