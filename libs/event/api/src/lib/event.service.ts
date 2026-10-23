import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, Prisma, PrismaClient, TagType } from '@prisma/client';
import { AuthSession } from '@wepublish/authentication/api';
import { mapBlockUnionMap } from '@wepublish/block-content/api';
import {
  blocksPlainText,
  EVENT_NAME_MAX_LENGTH,
  EventSchedule,
  scheduleBounds,
} from '@wepublish/event/schedule';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { uniqBy } from 'ramda';
import { EventDataloaderService } from './event-dataloader.service';
import {
  assertValidContent,
  assertValidFacts,
  assertValidSchedule,
  assertWithinHorizon,
} from './event-input';
import { eventSchedule, syncOccurrences } from './event-occurrences';
import {
  boundOrganizationIdOf,
  canDeleteEvent,
  canModifyEvent,
  canPublishEvent,
  editorEventsWhere,
  mayAssignEventOrganization,
  mayAssignEventOwner,
  mayMoveEventToOrganization,
  mayReassignEventOwner,
  publicEventsWhere,
  reachableEventsWhere,
  selectablePlacesWhere,
  userIdOf,
} from './event-scope';
import {
  EventArgs,
  EventContentInput,
  EventDateInput,
  EventFilter,
  EventInput,
  EventListArgs,
  EventRateInput,
  EventSort,
  UpdateEventInput,
} from './event.model';

type Session = AuthSession | null | undefined;

export type EventBlockSelection = {
  tags?: string[] | null;
  events?: string[] | null;
};

const SCHEDULE_FIELDS = [
  'scheduleType',
  'dateFrom',
  'dateTo',
  'weekDays',
  'openingTime',
  'dates',
] as const;

const datesData = (dates: EventDateInput[]) =>
  dates.map(({ dateFrom, dateTo, openingTime }, sortOrder) => ({
    dateFrom,
    dateTo,
    openingTime: openingTime ?? null,
    sortOrder,
  }));

const ratesData = (rates: EventRateInput[]) =>
  rates.map(({ price, designation }, sortOrder) => ({
    price,
    designation: designation ?? null,
    sortOrder,
  }));

const tagsData = (tagIds: string[]) => tagIds.map(tagId => ({ tagId }));

const copyName = (name: string) =>
  Array.from(`Kopie von ${name}`).slice(0, EVENT_NAME_MAX_LENGTH).join('');

const scheduleOfInput = (
  input: Pick<
    EventInput,
    'scheduleType' | 'dateFrom' | 'dateTo' | 'weekDays' | 'openingTime'
  >,
  dates: EventDateInput[]
): EventSchedule =>
  eventSchedule(
    {
      scheduleType: input.scheduleType,
      dateFrom: input.dateFrom ?? null,
      dateTo: input.dateTo ?? null,
      weekDays: input.weekDays ?? [],
      openingTime: input.openingTime ?? null,
    },
    datesData(dates).map(date => ({ ...date, legacyEventId: null }))
  );

const contentRevision = (content: EventContentInput) => {
  const blocks = content.blocks.map(mapBlockUnionMap);

  assertValidContent({
    name: content.name,
    printDescription: content.printDescription,
    blocks,
    images: content.images,
  });

  return {
    name: content.name.trim(),
    printDescription: content.printDescription ?? null,
    blocks: blocks as unknown as Prisma.InputJsonValue[],
    descriptionText: blocksPlainText(blocks),
    images: {
      createMany: {
        data: (content.images ?? []).map(
          ({ imageId, caption, isMain }, sortOrder) => ({
            imageId,
            caption: caption ?? null,
            isMain: !!isMain,
            sortOrder,
          })
        ),
      },
    },
  };
};

export const createEventOrder = (
  sort: EventSort,
  order: SortOrder
): Prisma.EventOrderByWithRelationInput[] => {
  const direction = graphQLSortOrderToPrisma(order);
  const column = {
    [EventSort.CreatedAt]: 'createdAt',
    [EventSort.ModifiedAt]: 'modifiedAt',
    [EventSort.StartsAt]: 'firstDateAt',
    [EventSort.EndsAt]: 'lastDateAt',
    [EventSort.PublishedAt]: 'publishedAt',
  }[sort];

  return [{ [column]: direction }, { id: direction }];
};

export const createEventFilter = (
  filter: EventFilter | null | undefined,
  now: Date
): Prisma.EventWhereInput => {
  const lowerBound = [filter?.upcoming ? now : null, filter?.from ?? null]
    .filter((date): date is Date => date != null)
    .reduce<Date | null>(
      (latest, date) => (latest && latest > date ? latest : date),
      null
    );
  const occurrence: Prisma.OccurrenceWhereInput = {
    ...(lowerBound ? { dateTo: { gte: lowerBound } } : {}),
    ...(filter?.to ? { dateFrom: { lte: filter.to } } : {}),
  };

  return {
    AND: [
      filter?.ids?.length ? { id: { in: filter.ids } } : {},
      filter?.tagIds?.length ?
        { tags: { some: { tagId: { in: filter.tagIds } } } }
      : {},
      Object.keys(occurrence).length ?
        { occurrences: { some: occurrence } }
      : {},
    ].filter(clause => Object.keys(clause).length),
  };
};

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaClient,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  @PrimeDataLoader(EventDataloaderService)
  async getEvent(
    { id, slug }: EventArgs,
    session: Session,
    editorMode: boolean
  ) {
    const lookup: Prisma.EventWhereInput | null =
      id != null ? { id }
      : slug != null ? { slug }
      : null;

    if (!lookup) {
      throw new BadRequestException('Event id or slug required.');
    }

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [
          lookup,
          editorMode ? reachableEventsWhere(session) : publicEventsWhere(),
        ],
      },
      orderBy: [{ publishedAt: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
    });

    if (!event) {
      throw new NotFoundException(`Event ${id ?? slug} was not found.`);
    }

    return event;
  }

  @PrimeDataLoader(EventDataloaderService)
  async getEvents(
    {
      filter,
      cursorId,
      sort = EventSort.StartsAt,
      order = SortOrder.Ascending,
      take = 10,
      skip,
    }: EventListArgs,
    session: Session,
    editorMode: boolean
  ) {
    const where: Prisma.EventWhereInput = {
      AND: [
        editorMode ? editorEventsWhere(session) : publicEventsWhere(),
        createEventFilter(filter, new Date()),
      ],
    };
    const orderBy = createEventOrder(sort, order);

    const [totalCount, events] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = events.slice(0, getMaxTake(take));
    const firstEvent = nodes[0];
    const lastEvent = nodes[nodes.length - 1];

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: events.length > nodes.length,
        startCursor: firstEvent?.id,
        endCursor: lastEvent?.id,
      },
    };
  }

  getPublicEvents(args: EventListArgs) {
    return this.getEvents(args, null, false);
  }

  @PrimeDataLoader(EventDataloaderService)
  async getPublicEventsForBlock({ tags, events }: EventBlockSelection) {
    const ids = events ?? [];
    const tagIds = tags ?? [];

    const [picked, tagged]: [Event[], Event[]] = await Promise.all([
      ids.length ?
        this.prisma.event.findMany({
          where: { AND: [publicEventsWhere(), { id: { in: ids } }] },
        })
      : [],
      tagIds.length ?
        this.prisma.event.findMany({
          where: {
            AND: [
              publicEventsWhere(),
              { tags: { some: { tagId: { in: tagIds } } } },
            ],
          },
          orderBy: [{ firstDateAt: 'asc' }, { id: 'asc' }],
          take: getMaxTake(Infinity),
        })
      : [],
    ]);

    const pickedById = new Map(picked.map(event => [event.id, event]));
    const inEditorOrder = ids
      .map(id => pickedById.get(id))
      .filter((event): event is Event => !!event);

    return uniqBy(({ id }) => id, [...inEditorOrder, ...tagged]);
  }

  @PrimeDataLoader(EventDataloaderService)
  async createEvent(
    input: EventInput,
    content: EventContentInput,
    session: Session
  ) {
    const organizationId =
      input.organizationId ?? boundOrganizationIdOf(session);
    const ownerId =
      input.ownerId !== undefined ? input.ownerId : userIdOf(session);

    if (!mayAssignEventOrganization(session, organizationId)) {
      throw new ForbiddenException(
        'You may only file events under an organisation you belong to.'
      );
    }

    if (
      ownerId !== userIdOf(session) &&
      !mayAssignEventOwner(session, ownerId)
    ) {
      throw new ForbiddenException(
        'You may not hand the event to another owner.'
      );
    }

    const now = new Date();
    const dates = input.dates ?? [];
    const schedule = scheduleOfInput(input, dates);

    assertValidFacts(input);
    assertValidSchedule(schedule, now);
    const revision = contentRevision(content);
    await this.assertEventTags(input.tagIds);
    await this.assertSlugAvailable(input.slug);
    await this.assertPlaceSelectable(input.placeId, session);

    const event = await this.prisma.$transaction(async tx => {
      const created = await tx.event.create({
        data: {
          ...this.factColumns(input),
          slug: input.slug ?? null,
          status: input.status ?? undefined,
          scheduleType: input.scheduleType,
          dateFrom: input.dateFrom ?? null,
          dateTo: input.dateTo ?? null,
          weekDays: input.weekDays ?? [],
          openingTime: input.openingTime ?? null,
          organizationId,
          ownerId,
          showInPrint: input.showInPrint ?? undefined,
          ...scheduleBounds(schedule),
          dates: { createMany: { data: datesData(dates) } },
          rates: { createMany: { data: ratesData(input.rates ?? []) } },
          tags: { createMany: { data: tagsData(input.tagIds) } },
          revisions: {
            create: { ...revision, userId: userIdOf(session) },
          },
        },
      });

      await syncOccurrences(tx, created.id, schedule);

      return created;
    });

    await this.publicContentCache.invalidateDraft('events');

    return event;
  }

  @PrimeDataLoader(EventDataloaderService)
  async updateEvent(id: string, input: UpdateEventInput, session: Session) {
    const existing = await this.findEventOrFail(id);

    if (!canModifyEvent(session, existing)) {
      throw new ForbiddenException('You may not modify this event.');
    }

    if (
      input.organizationId !== undefined &&
      input.organizationId !== existing.organizationId &&
      !mayMoveEventToOrganization(session, existing, input.organizationId)
    ) {
      throw new ForbiddenException(
        'You may only move events between organisations you belong to.'
      );
    }

    if (
      input.ownerId !== undefined &&
      input.ownerId !== existing.ownerId &&
      !mayReassignEventOwner(session)
    ) {
      throw new ForbiddenException(
        'You may not hand the event to another owner.'
      );
    }

    const scheduleChanged = SCHEDULE_FIELDS.some(
      field => input[field] !== undefined
    );
    const scheduleFields = {
      scheduleType: input.scheduleType ?? existing.scheduleType,
      dateFrom:
        input.dateFrom !== undefined ? input.dateFrom : existing.dateFrom,
      dateTo: input.dateTo !== undefined ? input.dateTo : existing.dateTo,
      weekDays: input.weekDays ?? existing.weekDays,
      openingTime:
        input.openingTime !== undefined ?
          input.openingTime
        : existing.openingTime,
    };
    const schedule =
      input.dates ?
        scheduleOfInput(scheduleFields, input.dates)
      : eventSchedule(scheduleFields, existing.dates);

    assertValidFacts(input);

    if (scheduleChanged) {
      assertValidSchedule(schedule, new Date());
    }

    if (input.tagIds) {
      await this.assertEventTags(input.tagIds);
    }

    if (input.slug != null && input.slug !== existing.slug) {
      await this.assertSlugAvailable(input.slug, id);
    }

    if (input.placeId !== existing.placeId) {
      await this.assertPlaceSelectable(input.placeId, session);
    }

    const event = await this.prisma.$transaction(async tx => {
      const updated = await tx.event.update({
        where: { id },
        data: {
          ...this.factColumns(input),
          slug: input.slug,
          status: input.status ?? undefined,
          showInPrint: input.showInPrint ?? undefined,
          organizationId: input.organizationId,
          ownerId: input.ownerId,
          ...(scheduleChanged ?
            {
              ...scheduleFields,
              ...scheduleBounds(schedule),
            }
          : {}),
          dates:
            input.dates ?
              { deleteMany: {}, createMany: { data: datesData(input.dates) } }
            : undefined,
          rates:
            input.rates ?
              { deleteMany: {}, createMany: { data: ratesData(input.rates) } }
            : undefined,
          tags:
            input.tagIds ?
              { deleteMany: {}, createMany: { data: tagsData(input.tagIds) } }
            : undefined,
        },
      });

      if (scheduleChanged) {
        await syncOccurrences(tx, id, schedule);
      }

      return updated;
    });

    await this.invalidateFor(existing);

    return event;
  }

  @PrimeDataLoader(EventDataloaderService)
  async updateEventContent(
    id: string,
    content: EventContentInput,
    session: Session
  ) {
    const existing = await this.findEventOrFail(id);

    if (!canModifyEvent(session, existing)) {
      throw new ForbiddenException('You may not modify this event.');
    }

    const revision = contentRevision(content);
    const now = new Date();

    await this.prisma.$transaction(async tx => {
      await tx.eventRevision.updateMany({
        where: { eventId: id, archivedAt: null, publishedAt: null },
        data: { archivedAt: now },
      });
      await tx.eventRevision.create({
        data: { ...revision, eventId: id, userId: userIdOf(session) },
      });
    });

    await this.publicContentCache.invalidateDraft('events');

    return withoutRelations(existing);
  }

  @PrimeDataLoader(EventDataloaderService)
  async publishEvent(
    id: string,
    publishAt: Date | null | undefined,
    session: Session
  ) {
    const existing = await this.findEventOrFail(id);

    if (!canPublishEvent(session, existing)) {
      throw new ForbiddenException(
        'You may only publish events of your own organisation.'
      );
    }

    const now = new Date();
    const revision = await this.prisma.eventRevision.findFirst({
      where: { eventId: id, archivedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    if (!revision || (revision.publishedAt && revision.publishedAt <= now)) {
      throw new BadRequestException('The event has no draft to publish.');
    }

    const schedule = eventSchedule(existing, existing.dates);
    assertWithinHorizon(schedule, now);

    if (existing.slug) {
      await this.assertSlugAvailable(existing.slug, id);
    }

    const publishedAt = publishAt ?? now;
    const eventPublishedAt =
      (
        (existing.publishedAt && existing.publishedAt > now) ||
        (existing.publishedAt && existing.publishedAt > publishedAt)
      ) ?
        publishedAt
      : (existing.publishedAt ?? publishedAt);

    const event = await this.prisma.$transaction(async tx => {
      await tx.eventRevision.updateMany({
        where: {
          eventId: id,
          id: { not: revision.id },
          publishedAt: { gt: now },
        },
        data: { publishedAt: null, archivedAt: now },
      });
      await tx.eventRevision.update({
        where: { id: revision.id },
        data: { publishedAt, archivedAt: null },
      });
      const updated = await tx.event.update({
        where: { id },
        data: {
          publishedAt: eventPublishedAt,
          reviewRequestedAt: null,
          reviewRequestedById: null,
        },
      });

      await syncOccurrences(tx, id, schedule);

      return updated;
    });

    await this.publicContentCache.invalidate('events');
    this.publicContentCache.invalidateAt(publishedAt, 'events');

    return event;
  }

  @PrimeDataLoader(EventDataloaderService)
  async unpublishEvent(id: string, session: Session) {
    const existing = await this.findEventOrFail(id);

    if (!canPublishEvent(session, existing)) {
      throw new ForbiddenException(
        'You may only unpublish events of your own organisation.'
      );
    }

    const now = new Date();

    const event = await this.prisma.$transaction(async tx => {
      await tx.eventRevision.updateMany({
        where: { eventId: id, publishedAt: { not: null } },
        data: { publishedAt: null, archivedAt: now },
      });

      const latest = await tx.eventRevision.findFirst({
        where: { eventId: id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });

      if (latest) {
        await tx.eventRevision.update({
          where: { id: latest.id },
          data: { archivedAt: null },
        });
      }

      return tx.event.update({
        where: { id },
        data: { publishedAt: null },
      });
    });

    await this.publicContentCache.invalidate('events');

    return event;
  }

  @PrimeDataLoader(EventDataloaderService)
  async duplicateEvent(id: string, session: Session) {
    const source = await this.prisma.event.findUnique({
      where: { id },
      include: {
        dates: { orderBy: { sortOrder: 'asc' } },
        rates: { orderBy: { sortOrder: 'asc' } },
        tags: { select: { tagId: true } },
        place: { select: { organizationId: true } },
      },
    });

    if (!source) {
      throw new NotFoundException(`Event ${id} was not found.`);
    }

    if (
      !canModifyEvent(session, source) ||
      !mayAssignEventOrganization(session, source.organizationId)
    ) {
      throw new ForbiddenException(
        'You may only copy events you may file under their organisation.'
      );
    }

    const revision = await this.prisma.eventRevision.findFirst({
      where: { eventId: id, archivedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!revision) {
      throw new BadRequestException('The event has no content to copy.');
    }

    const dates = source.dates.map(
      ({ dateFrom, dateTo, openingTime, sortOrder }) => ({
        dateFrom,
        dateTo,
        openingTime,
        sortOrder,
      })
    );
    const schedule = eventSchedule(
      source,
      dates.map(date => ({ ...date, legacyEventId: null }))
    );

    assertValidSchedule(schedule, new Date());

    const event = await this.prisma.$transaction(async tx => {
      const created = await tx.event.create({
        data: {
          status: source.status,
          organizationId: source.organizationId,
          placeId: source.placeId,
          audienceId: source.audienceId,
          ticketingUrl: source.ticketingUrl,
          showInPrint: source.showInPrint,
          scheduleType: source.scheduleType,
          dateFrom: source.dateFrom,
          dateTo: source.dateTo,
          weekDays: source.weekDays,
          openingTime: source.openingTime,
          ownerId: userIdOf(session),
          slug: null,
          publishedAt: null,
          reviewRequestedAt: null,
          reviewRequestedById: null,
          ...scheduleBounds(schedule),
          dates: { createMany: { data: dates } },
          rates: {
            createMany: {
              data: source.rates.map(({ price, designation, sortOrder }) => ({
                price,
                designation,
                sortOrder,
              })),
            },
          },
          tags: {
            createMany: { data: source.tags.map(({ tagId }) => ({ tagId })) },
          },
          revisions: {
            create: {
              name: copyName(revision.name),
              printDescription: revision.printDescription,
              blocks: revision.blocks as Prisma.InputJsonValue,
              descriptionText: revision.descriptionText,
              userId: userIdOf(session),
              images: {
                createMany: {
                  data: revision.images.map(
                    ({ imageId, caption, sortOrder, isMain }) => ({
                      imageId,
                      caption,
                      sortOrder,
                      isMain,
                    })
                  ),
                },
              },
            },
          },
        },
      });

      await syncOccurrences(tx, created.id, schedule);

      return created;
    });

    await this.publicContentCache.invalidateDraft('events');

    return event;
  }

  @PrimeDataLoader(EventDataloaderService)
  async requestEventReview(id: string, session: Session) {
    const existing = await this.findEventOrFail(id);

    if (!canModifyEvent(session, existing)) {
      throw new ForbiddenException('You may not modify this event.');
    }

    if (canPublishEvent(session, existing)) {
      throw new BadRequestException(
        'You may publish this event yourself; publish it instead of requesting a review.'
      );
    }

    const draft = await this.prisma.eventRevision.findFirst({
      where: { eventId: id, archivedAt: null, publishedAt: null },
    });

    if (!draft) {
      throw new BadRequestException('The event has no draft to review.');
    }

    if (existing.reviewRequestedAt) {
      return withoutRelations(existing);
    }

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        reviewRequestedAt: new Date(),
        reviewRequestedById: userIdOf(session),
      },
    });

    await this.publicContentCache.invalidateDraft('events');

    return event;
  }

  async deleteEvent(id: string, session: Session) {
    const existing = await this.findEventOrFail(id);

    if (!canDeleteEvent(session, existing)) {
      throw new ForbiddenException(
        'You may only delete events of your own organisation.'
      );
    }

    const event = await this.prisma.event.delete({ where: { id } });

    await this.invalidateFor(existing);

    return event;
  }

  private factColumns(input: UpdateEventInput) {
    return {
      placeId: input.placeId,
      audienceId: input.audienceId,
      ticketingUrl: input.ticketingUrl,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      socialMediaTitle: input.socialMediaTitle,
      socialMediaDescription: input.socialMediaDescription,
      socialMediaImageID: input.socialMediaImageID,
    };
  }

  private async findEventOrFail(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        dates: { orderBy: { sortOrder: 'asc' } },
        place: { select: { organizationId: true } },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event ${id} was not found.`);
    }

    return event;
  }

  private async assertEventTags(tagIds: string[]) {
    const found = await this.prisma.tag.count({
      where: { id: { in: tagIds }, type: TagType.Event },
    });

    if (found !== new Set(tagIds).size) {
      throw new BadRequestException('Every tag must be an existing event tag.');
    }
  }

  private async assertPlaceSelectable(
    placeId: string | null | undefined,
    session: Session
  ) {
    if (!placeId) {
      return;
    }

    const selectable = await this.prisma.place.count({
      where: { AND: [{ id: placeId }, selectablePlacesWhere(session)] },
    });

    if (!selectable) {
      throw new BadRequestException(
        `Place ${placeId} does not exist, is disabled or is private to another organisation.`
      );
    }
  }

  private async assertSlugAvailable(
    slug: string | null | undefined,
    exceptId?: string
  ) {
    if (!slug) {
      return;
    }

    const taken = await this.prisma.event.findFirst({
      where: {
        AND: [
          publicEventsWhere(),
          { slug },
          exceptId ? { id: { not: exceptId } } : {},
        ],
      },
    });

    if (taken) {
      throw new BadRequestException(
        `The slug ${slug} is already used by a published event.`
      );
    }
  }

  private async invalidateFor(event: Pick<Event, 'publishedAt'>) {
    if (event.publishedAt) {
      await this.publicContentCache.invalidate('events');
    } else {
      await this.publicContentCache.invalidateDraft('events');
    }
  }
}

const withoutRelations = <T extends Event>({
  dates: _dates,
  place: _place,
  ...event
}: T & { dates?: unknown; place?: unknown }): Event => event as Event;
