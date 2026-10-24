import { Prisma } from '@prisma/client';
import { geoBoundingBoxWhere } from './geo-bounding-box';
import { EventFilter } from './event.model';

type Filter = EventFilter | null | undefined;

const placeWhere = (where: Prisma.PlaceWhereInput): Prisma.EventWhereInput => ({
  place: { is: where },
});

const flagWhere = (
  value: boolean,
  where: Prisma.EventWhereInput
): Prisma.EventWhereInput => (value ? where : { NOT: where });

const revisionWhere = (
  relation: 'draft' | 'pending' | 'published',
  present: boolean
): Prisma.EventWhereInput => ({
  [relation]: present ? { isNot: null } : { is: null },
});

export const eventAttributeClauses = (
  filter: Filter
): Prisma.EventWhereInput[] => {
  if (!filter) {
    return [];
  }

  const clauses: Prisma.EventWhereInput[] = [];

  if (filter.ids?.length) {
    clauses.push({ id: { in: filter.ids } });
  }

  if (filter.tagIds?.length) {
    clauses.push({ tags: { some: { tagId: { in: filter.tagIds } } } });
  }

  if (filter.audienceId) {
    clauses.push({ audienceId: filter.audienceId });
  }

  if (filter.regionId) {
    clauses.push(placeWhere({ regionId: filter.regionId }));
  }

  if (filter.organizationIds?.length) {
    clauses.push({ organizationId: { in: filter.organizationIds } });
  }

  if (filter.placeIds?.length) {
    clauses.push({ placeId: { in: filter.placeIds } });
  }

  if (filter.geoBoundingBox) {
    clauses.push(placeWhere(geoBoundingBoxWhere(filter.geoBoundingBox)));
  }

  if (filter.wheelchairAccessible != null) {
    clauses.push(
      flagWhere(
        filter.wheelchairAccessible,
        placeWhere({ wheelchairAccessible: true })
      )
    );
  }

  if (filter.accessibilityProInfirmis?.length) {
    clauses.push(
      placeWhere({
        OR: filter.accessibilityProInfirmis.map(id => ({
          proInfirmisPictograms: { array_contains: [{ Id: id }] },
        })),
      })
    );
  }

  if (filter.partner != null) {
    clauses.push(
      flagWhere(filter.partner, { organization: { is: { partner: true } } })
    );
  }

  if (filter.showInPrint != null) {
    clauses.push({ showInPrint: filter.showInPrint });
  }

  if (filter.eventStatus?.length) {
    clauses.push({ status: { in: filter.eventStatus } });
  }

  if (filter.draft != null) {
    clauses.push(revisionWhere('draft', filter.draft));
  }

  if (filter.pending != null) {
    clauses.push(revisionWhere('pending', filter.pending));
  }

  if (filter.published != null) {
    clauses.push(revisionWhere('published', filter.published));
  }

  if (filter.reviewRequested != null) {
    clauses.push({
      reviewRequestedAt: filter.reviewRequested ? { not: null } : null,
    });
  }

  if (filter.endsBefore) {
    clauses.push({ lastDateAt: { lt: filter.endsBefore } });
  }

  if (filter.endsAfter) {
    clauses.push({ lastDateAt: { gte: filter.endsAfter } });
  }

  return clauses;
};

export const occurrenceTimeWhere = (
  filter: Filter,
  now: Date
): Prisma.OccurrenceWhereInput => {
  const lowerBound = [filter?.upcoming ? now : null, filter?.from ?? null]
    .filter((date): date is Date => date != null)
    .reduce<Date | null>(
      (latest, date) => (latest && latest > date ? latest : date),
      null
    );

  return {
    ...(lowerBound ? { dateTo: { gte: lowerBound } } : {}),
    ...(filter?.to ? { dateFrom: { lte: filter.to } } : {}),
  };
};

export const createEventWhere = (
  filter: Filter,
  now: Date
): Prisma.EventWhereInput => {
  const time = occurrenceTimeWhere(filter, now);

  return {
    AND: [
      ...eventAttributeClauses(filter),
      ...(Object.keys(time).length ? [{ occurrences: { some: time } }] : []),
    ],
  };
};

export const createOccurrenceWhere = (
  filter: Filter,
  now: Date,
  eventScope: Prisma.EventWhereInput
): Prisma.OccurrenceWhereInput => {
  const time = occurrenceTimeWhere(filter, now);

  return {
    AND: [
      ...(Object.keys(time).length ? [time] : []),
      {
        event: {
          is: { AND: [eventScope, ...eventAttributeClauses(filter)] },
        },
      },
    ],
  };
};
