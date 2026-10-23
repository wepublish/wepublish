import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  Event,
  EventScheduleType,
  EventStatus,
  PrismaClient,
  TagType,
} from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { BlockContentInput } from '@wepublish/block-content/api';
import { expandOccurrences } from '@wepublish/event/schedule';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import {
  CanDeleteOtherOrganizationEvents,
  CanPublishEvent,
  CanUpdateOtherOrganizationEvents,
} from '@wepublish/permissions';
import { SortOrder } from '@wepublish/utils/api';
import { EventDataloaderService } from './event-dataloader.service';
import { EventContentInput, EventInput, EventSort } from './event.model';
import { EventService } from './event.service';

const NOW = new Date('2026-10-23T10:00:00.000Z');

const user = (
  id: string,
  organizationIds: string[],
  ...permissionIDs: string[]
): AuthSession =>
  ({
    type: AuthSessionType.User,
    id: `session-${id}`,
    token: 'token',
    user: { id },
    roles: [{ id: 'role', permissionIDs }],
    organizationIds,
    createdAt: NOW,
    expiresAt: NOW,
  }) as AuthSession;

const organizationKey = (
  organizationId: string | null,
  ...permissions: string[]
): AuthSession => ({
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'Key',
  token: 'token',
  permissions,
  organizationId,
});

const member = user('member', ['org-a']);
const venueMember = user('venue', ['org-v']);
const owner = user('owner', []);
const validator = user(
  'validator',
  [],
  CanPublishEvent.id,
  CanUpdateOtherOrganizationEvents.id
);

const eventRow = (overrides: Partial<Event> = {}): Event => ({
  id: 'event-1',
  createdAt: NOW,
  modifiedAt: NOW,
  slug: null,
  status: EventStatus.Confirmed,
  organizationId: 'org-a',
  placeId: null,
  ownerId: 'owner',
  scheduleType: EventScheduleType.Continuous,
  dateFrom: new Date('2026-11-01T18:00:00.000Z'),
  dateTo: new Date('2026-11-01T21:00:00.000Z'),
  weekDays: [],
  openingTime: null,
  audienceId: null,
  ticketingUrl: null,
  showInPrint: false,
  seoTitle: null,
  seoDescription: null,
  socialMediaTitle: null,
  socialMediaDescription: null,
  socialMediaImageID: null,
  publishedAt: null,
  firstDateAt: new Date('2026-11-01T18:00:00.000Z'),
  lastDateAt: new Date('2026-11-01T21:00:00.000Z'),
  reviewRequestedAt: null,
  reviewRequestedById: null,
  legacyId: null,
  legacyProposedBy: null,
  ...overrides,
});

const richText = (text: string) =>
  ({
    richText: {
      richText: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
      },
    },
  }) as unknown as BlockContentInput;

const facts = (overrides: Partial<EventInput> = {}): EventInput =>
  ({
    scheduleType: EventScheduleType.Continuous,
    dateFrom: new Date('2026-11-01T18:00:00.000Z'),
    dateTo: new Date('2026-11-01T21:00:00.000Z'),
    weekDays: [],
    tagIds: ['tag-1'],
    organizationId: 'org-a',
    ...overrides,
  }) as EventInput;

const content = (
  overrides: Partial<EventContentInput> = {}
): EventContentInput =>
  ({
    name: 'Konzert',
    printDescription: 'Kurz',
    blocks: [richText('Ein Abend mit Musik')],
    images: [],
    ...overrides,
  }) as EventContentInput;

const setup = async () => {
  const prisma: any = {
    event: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(async ({ data }) => eventRow({ ...data, id: 'event-1' })),
      update: vi.fn(async ({ data }) => eventRow(data)),
      delete: vi.fn(async () => eventRow()),
    },
    eventRevision: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    tag: {
      count: vi.fn(async ({ where }) => where.id.in.length),
    },
    place: {
      count: vi.fn().mockResolvedValue(1),
    },
    occurrence: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  };
  prisma.$transaction = vi.fn(async (run: (tx: unknown) => unknown) =>
    run(prisma)
  );

  const cache = {
    invalidate: vi.fn(),
    invalidateDraft: vi.fn(),
    invalidateAt: vi.fn(),
  };

  const module = await Test.createTestingModule({
    providers: [
      EventService,
      { provide: PrismaClient, useValue: prisma },
      { provide: PublicContentCacheInvalidator, useValue: cache },
      { provide: EventDataloaderService, useValue: { prime: vi.fn() } },
    ],
  }).compile();

  return { service: module.get(EventService), prisma, cache };
};

const existing = (prisma: any, overrides: Partial<Event> = {}, extra = {}) =>
  prisma.event.findUnique.mockResolvedValue({
    ...eventRow(overrides),
    dates: [],
    place: null,
    ...extra,
  });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EventService.createEvent', () => {
  it('stores the bounds of the schedule and one draft revision with its text', async () => {
    const { service, prisma } = await setup();

    await service.createEvent(
      facts({
        scheduleType: EventScheduleType.Explicit,
        dateFrom: null,
        dateTo: null,
        dates: [
          {
            dateFrom: new Date('2026-12-05T18:00:00.000Z'),
            dateTo: new Date('2026-12-05T20:00:00.000Z'),
          },
          {
            dateFrom: new Date('2026-11-05T18:00:00.000Z'),
            dateTo: new Date('2026-11-05T20:00:00.000Z'),
          },
        ],
      }),
      content(),
      member
    );

    const { data } = prisma.event.create.mock.calls[0][0];

    expect(data.firstDateAt).toEqual(new Date('2026-11-05T18:00:00.000Z'));
    expect(data.lastDateAt).toEqual(new Date('2026-12-05T20:00:00.000Z'));
    expect(data.revisions.create).toMatchObject({
      name: 'Konzert',
      printDescription: 'Kurz',
      descriptionText: 'Ein Abend mit Musik',
      userId: 'member',
      blocks: [
        {
          type: 'richText',
          richText: expect.objectContaining({ type: 'doc' }),
        },
      ],
    });
    expect(data.revisions.create.publishedAt).toBeUndefined();
  });

  it('makes the creating user the owner', async () => {
    const { service, prisma } = await setup();

    await service.createEvent(facts(), content(), member);

    expect(prisma.event.create.mock.calls[0][0].data.ownerId).toBe('member');
  });

  it('gives an event created by an api key no owner', async () => {
    const { service, prisma } = await setup();

    await service.createEvent(
      facts({ organizationId: undefined }),
      content(),
      organizationKey('org-a')
    );

    expect(prisma.event.create.mock.calls[0][0].data.ownerId).toBeNull();
  });

  it('files the event of a bound api key under its organisation', async () => {
    const { service, prisma } = await setup();

    await service.createEvent(
      facts({ organizationId: undefined }),
      content(),
      organizationKey('org-a')
    );

    expect(prisma.event.create.mock.calls[0][0].data.organizationId).toBe(
      'org-a'
    );
  });

  it('refuses a bound api key filing an event under another organisation', async () => {
    const { service, prisma } = await setup();

    await expect(
      service.createEvent(
        facts({ organizationId: 'org-b' }),
        content(),
        organizationKey('org-a', CanUpdateOtherOrganizationEvents.id)
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('refuses a user filing an event under an organisation they are not in', async () => {
    const { service } = await setup();

    await expect(
      service.createEvent(facts({ organizationId: 'org-b' }), content(), member)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets CAN_UPDATE_OTHER_ORGANIZATION_EVENTS file it anywhere and pick the owner', async () => {
    const { service, prisma } = await setup();

    await service.createEvent(
      facts({ organizationId: 'org-b', ownerId: 'somebody' }),
      content(),
      validator
    );

    expect(prisma.event.create.mock.calls[0][0].data).toMatchObject({
      organizationId: 'org-b',
      ownerId: 'somebody',
    });
  });

  it('refuses handing the new event to another owner', async () => {
    const { service } = await setup();

    await expect(
      service.createEvent(facts({ ownerId: 'somebody' }), content(), member)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('writes exactly the expanded occurrences', async () => {
    const { service, prisma } = await setup();
    const schedule = facts({
      scheduleType: EventScheduleType.Weekly,
      dateFrom: new Date('2026-11-02T18:00:00.000Z'),
      dateTo: new Date('2026-11-30T21:00:00.000Z'),
      weekDays: [1, 4],
    });

    await service.createEvent(schedule, content(), member);

    expect(prisma.occurrence.createMany).toHaveBeenCalledWith({
      data: expandOccurrences({
        scheduleType: 'Weekly',
        dateFrom: schedule.dateFrom!,
        dateTo: schedule.dateTo!,
        weekDays: [1, 4],
        openingTime: null,
        dates: [],
      }).map(occurrence => ({ ...occurrence, eventId: 'event-1' })),
    });
  });

  it.each([
    ['MissingDateRange', facts({ dateTo: null })],
    [
      'DateToBeforeDateFrom',
      facts({ dateTo: new Date('2026-10-31T18:00:00.000Z') }),
    ],
    [
      'MissingDates',
      facts({
        scheduleType: EventScheduleType.Explicit,
        dates: [],
      }),
    ],
    ['InvalidOpeningTime', facts({ openingTime: '24:00' })],
    [
      'MissingWeekDays',
      facts({ scheduleType: EventScheduleType.Weekly, weekDays: [] }),
    ],
    [
      'InvalidWeekDays',
      facts({ scheduleType: EventScheduleType.Weekly, weekDays: [0, 8] }),
    ],
    [
      'BeyondScheduleHorizon',
      facts({ dateTo: new Date('2028-10-23T22:00:00.000Z') }),
    ],
  ])('rejects %s as a BadRequestException', async (code, input) => {
    const { service, prisma } = await setup();

    const error = await service
      .createEvent(input, content(), member)
      .catch(e => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.message).toContain(code);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('accepts the last minute of the two-year horizon', async () => {
    const { service, prisma } = await setup();

    await service.createEvent(
      facts({ dateTo: new Date('2028-10-23T21:59:00.000Z') }),
      content(),
      member
    );

    expect(prisma.event.create).toHaveBeenCalled();
  });

  it('rejects a tag that is not an event tag', async () => {
    const { service, prisma } = await setup();
    prisma.tag.count.mockResolvedValue(0);

    await expect(
      service.createEvent(facts({ tagIds: ['article-tag'] }), content(), member)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.tag.count).toHaveBeenCalledWith({
      where: { id: { in: ['article-tag'] }, type: TagType.Event },
    });
  });

  it('rejects zero and four tags', async () => {
    const { service } = await setup();

    await expect(
      service.createEvent(facts({ tagIds: [] }), content(), member)
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createEvent(
        facts({ tagIds: ['a', 'b', 'c', 'd'] }),
        content(),
        member
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a slug a published event already uses', async () => {
    const { service, prisma } = await setup();
    prisma.event.findFirst.mockResolvedValue(eventRow({ id: 'other' }));

    await expect(
      service.createEvent(facts({ slug: 'konzert' }), content(), member)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.event.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ published: { isNot: null } }, { slug: 'konzert' }, {}],
      },
    });
  });

  it('rejects invalid content', async () => {
    const { service } = await setup();

    await expect(
      service.createEvent(facts(), content({ name: 'n'.repeat(131) }), member)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('only resets the draft caches', async () => {
    const { service, cache } = await setup();

    await service.createEvent(facts(), content(), member);

    expect(cache.invalidateDraft).toHaveBeenCalledWith('events');
    expect(cache.invalidate).not.toHaveBeenCalled();
  });
});

describe('EventService.updateEvent', () => {
  it('refuses whoever may not modify the event', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await expect(
      service.updateEvent(
        'event-1',
        { status: EventStatus.Cancelled },
        user('x', ['org-x'])
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('is NotFound for a missing event', async () => {
    const { service, prisma } = await setup();
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(
      service.updateEvent('missing', {}, member)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lets the venue's organisation correct the facts", async () => {
    const { service, prisma } = await setup();
    existing(
      prisma,
      { placeId: 'place-1' },
      { place: { organizationId: 'org-v' } }
    );

    await service.updateEvent(
      'event-1',
      { status: EventStatus.Cancelled },
      venueMember
    );

    expect(prisma.event.update.mock.calls[0][0].data.status).toBe(
      EventStatus.Cancelled
    );
  });

  it('leaves the occurrences alone when the schedule did not change', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await service.updateEvent(
      'event-1',
      { status: EventStatus.SoldOut },
      member
    );

    expect(prisma.occurrence.deleteMany).not.toHaveBeenCalled();
    expect(prisma.occurrence.createMany).not.toHaveBeenCalled();
  });

  it('re-expands a changed schedule inside one transaction and moves the bounds', async () => {
    const { service, prisma } = await setup();
    existing(prisma);
    const dateTo = new Date('2026-11-03T21:00:00.000Z');

    await service.updateEvent('event-1', { dateTo }, member);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.occurrence.deleteMany).toHaveBeenCalledWith({
      where: { eventId: 'event-1' },
    });
    expect(prisma.occurrence.createMany).toHaveBeenCalledWith({
      data: [
        {
          dateFrom: new Date('2026-11-01T18:00:00.000Z'),
          dateTo,
          openingTime: null,
          legacyEventId: null,
          eventId: 'event-1',
        },
      ],
    });
    expect(prisma.event.update.mock.calls[0][0].data.lastDateAt).toEqual(
      dateTo
    );
  });

  it('gives identical rows when the same change is saved twice', async () => {
    const { service, prisma } = await setup();
    existing(prisma);
    const dateTo = new Date('2026-11-03T21:00:00.000Z');

    await service.updateEvent('event-1', { dateTo }, member);
    const written = prisma.occurrence.createMany.mock.calls[0][0].data;
    prisma.occurrence.findMany.mockResolvedValue(written);
    existing(prisma, { dateTo });
    prisma.occurrence.createMany.mockClear();
    prisma.occurrence.deleteMany.mockClear();

    await service.updateEvent('event-1', { dateTo }, member);

    expect(prisma.occurrence.deleteMany).not.toHaveBeenCalled();
    expect(prisma.occurrence.createMany).not.toHaveBeenCalled();
  });

  it('replaces the dates, rates and tags that are given and keeps the rest', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await service.updateEvent(
      'event-1',
      { rates: [{ price: '20.-' }], tagIds: ['tag-2'] },
      member
    );

    const { data } = prisma.event.update.mock.calls[0][0];

    expect(data.rates).toEqual({
      deleteMany: {},
      createMany: {
        data: [{ price: '20.-', designation: null, sortOrder: 0 }],
      },
    });
    expect(data.tags).toEqual({
      deleteMany: {},
      createMany: { data: [{ tagId: 'tag-2' }] },
    });
    expect(data.dates).toBeUndefined();
  });

  it('resets the public caches for a published event', async () => {
    const { service, prisma, cache } = await setup();
    existing(prisma, { publishedAt: new Date('2026-10-01T10:00:00.000Z') });

    await service.updateEvent(
      'event-1',
      { status: EventStatus.Cancelled },
      member
    );

    expect(cache.invalidate).toHaveBeenCalledWith('events');
  });

  it('only resets the draft caches for an unpublished event', async () => {
    const { service, prisma, cache } = await setup();
    existing(prisma);

    await service.updateEvent(
      'event-1',
      { status: EventStatus.Cancelled },
      member
    );

    expect(cache.invalidateDraft).toHaveBeenCalledWith('events');
    expect(cache.invalidate).not.toHaveBeenCalled();
  });

  it('rejects a slug another published event uses', async () => {
    const { service, prisma } = await setup();
    existing(prisma);
    prisma.event.findFirst.mockResolvedValue(eventRow({ id: 'other' }));

    await expect(
      service.updateEvent('event-1', { slug: 'taken' }, member)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.event.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { published: { isNot: null } },
          { slug: 'taken' },
          { id: { not: 'event-1' } },
        ],
      },
    });
  });

  it('refuses an owner without membership moving the event into an organisation', async () => {
    const { service, prisma } = await setup();
    existing(prisma, { organizationId: null, ownerId: 'owner' });

    await expect(
      service.updateEvent('event-1', { organizationId: 'org-a' }, owner)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("refuses the venue's organisation adopting the event", async () => {
    const { service, prisma } = await setup();
    existing(prisma, {}, { place: { organizationId: 'org-v' } });

    await expect(
      service.updateEvent('event-1', { organizationId: 'org-v' }, venueMember)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuses handing the event to another owner without CAN_UPDATE_OTHER_ORGANIZATION_EVENTS', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await expect(
      service.updateEvent('event-1', { ownerId: 'member' }, member)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('validates a changed schedule', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await expect(
      service.updateEvent(
        'event-1',
        { dateTo: new Date('2028-10-24T10:00:00.000Z') },
        member
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not re-validate a stored schedule it does not touch', async () => {
    const { service, prisma } = await setup();
    existing(prisma, { scheduleType: EventScheduleType.Weekly, weekDays: [] });

    await service.updateEvent(
      'event-1',
      { status: EventStatus.Cancelled },
      member
    );

    expect(prisma.event.update).toHaveBeenCalled();
  });
});

describe('EventService.updateEventContent', () => {
  it('archives the open draft and adds a new draft revision', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await service.updateEventContent(
      'event-1',
      content({
        images: [
          { imageId: 'img-1', caption: '© Foto' },
          { imageId: 'img-2', isMain: true },
        ],
      }),
      member
    );

    expect(prisma.eventRevision.updateMany).toHaveBeenCalledWith({
      where: { eventId: 'event-1', archivedAt: null, publishedAt: null },
      data: { archivedAt: NOW },
    });
    expect(prisma.eventRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventId: 'event-1',
        name: 'Konzert',
        descriptionText: 'Ein Abend mit Musik',
        userId: 'member',
        images: {
          createMany: {
            data: [
              {
                imageId: 'img-1',
                caption: '© Foto',
                isMain: false,
                sortOrder: 0,
              },
              { imageId: 'img-2', caption: null, isMain: true, sortOrder: 1 },
            ],
          },
        },
      }),
    });
  });

  it('never writes the event itself', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await service.updateEventContent('event-1', content(), member);

    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('refuses whoever may not modify the event', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await expect(
      service.updateEventContent('event-1', content(), user('x', []))
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.eventRevision.create).not.toHaveBeenCalled();
  });

  it('rejects a description over 6,400 characters of text', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await expect(
      service.updateEventContent(
        'event-1',
        content({ blocks: [richText('d'.repeat(6401))] }),
        member
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects two main images', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await expect(
      service.updateEventContent(
        'event-1',
        content({
          images: [
            { imageId: 'a', isMain: true },
            { imageId: 'b', isMain: true },
          ],
        }),
        member
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('EventService.publishEvent', () => {
  const publisher = user('member', ['org-a'], CanPublishEvent.id);
  const draft = {
    id: 'rev-2',
    eventId: 'event-1',
    publishedAt: null,
    archivedAt: null,
  };

  it('is a BadRequest without anything to publish', async () => {
    const { service, prisma } = await setup();
    existing(prisma);
    prisma.eventRevision.findFirst.mockResolvedValue({
      ...draft,
      publishedAt: new Date('2026-10-01T10:00:00.000Z'),
    });

    await expect(
      service.publishEvent('event-1', null, publisher)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('publishes the latest revision, archives pending ones and clears the review request', async () => {
    const { service, prisma } = await setup();
    existing(prisma, {
      reviewRequestedAt: new Date('2026-10-20T10:00:00.000Z'),
      reviewRequestedById: 'owner',
    });
    prisma.eventRevision.findFirst.mockResolvedValue(draft);

    await service.publishEvent('event-1', null, publisher);

    expect(prisma.eventRevision.updateMany).toHaveBeenCalledWith({
      where: {
        eventId: 'event-1',
        id: { not: 'rev-2' },
        publishedAt: { gt: NOW },
      },
      data: { publishedAt: null, archivedAt: NOW },
    });
    expect(prisma.eventRevision.update).toHaveBeenCalledWith({
      where: { id: 'rev-2' },
      data: { publishedAt: NOW, archivedAt: null },
    });
    expect(prisma.event.update.mock.calls[0][0].data).toMatchObject({
      publishedAt: NOW,
      reviewRequestedAt: null,
      reviewRequestedById: null,
    });
  });

  it('keeps the first publication date on a republish, and moves it to an earlier one', async () => {
    const { service, prisma } = await setup();
    const first = new Date('2026-10-01T10:00:00.000Z');
    existing(prisma, { publishedAt: first });
    prisma.eventRevision.findFirst.mockResolvedValue(draft);

    await service.publishEvent('event-1', null, publisher);
    expect(prisma.event.update.mock.calls[0][0].data.publishedAt).toEqual(
      first
    );

    const earlier = new Date('2026-09-01T10:00:00.000Z');
    await service.publishEvent('event-1', earlier, publisher);
    expect(prisma.event.update.mock.calls[1][0].data.publishedAt).toEqual(
      earlier
    );
  });

  it('keeps the occurrences in place for a scheduled publication and resets the caches when it goes live', async () => {
    const { service, prisma, cache } = await setup();
    existing(prisma);
    prisma.eventRevision.findFirst.mockResolvedValue(draft);
    const publishAt = new Date('2026-10-24T08:00:00.000Z');
    const stored = expandOccurrences({
      scheduleType: 'Continuous',
      dateFrom: new Date('2026-11-01T18:00:00.000Z'),
      dateTo: new Date('2026-11-01T21:00:00.000Z'),
      weekDays: [],
      openingTime: null,
      dates: [],
    });
    prisma.occurrence.findMany.mockResolvedValue(stored);

    await service.publishEvent('event-1', publishAt, publisher);

    expect(prisma.occurrence.findMany).toHaveBeenCalled();
    expect(prisma.occurrence.deleteMany).not.toHaveBeenCalled();
    expect(prisma.eventRevision.update).toHaveBeenCalledWith({
      where: { id: 'rev-2' },
      data: { publishedAt: publishAt, archivedAt: null },
    });
    expect(cache.invalidateAt).toHaveBeenCalledWith(publishAt, 'events');
    expect(cache.invalidate).toHaveBeenCalledWith('events');
  });

  it('re-checks the horizon', async () => {
    const { service, prisma } = await setup();
    existing(prisma, { dateTo: new Date('2028-10-24T10:00:00.000Z') });
    prisma.eventRevision.findFirst.mockResolvedValue(draft);

    const error = await service
      .publishEvent('event-1', null, publisher)
      .catch(e => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.message).toContain('BeyondScheduleHorizon');
  });

  it('rejects publishing a second event under a published slug', async () => {
    const { service, prisma } = await setup();
    existing(prisma, { slug: 'konzert' });
    prisma.eventRevision.findFirst.mockResolvedValue(draft);
    prisma.event.findFirst.mockResolvedValue(eventRow({ id: 'first' }));

    await expect(
      service.publishEvent('event-1', null, publisher)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.eventRevision.update).not.toHaveBeenCalled();
  });

  it.each([
    ['the owner without CAN_PUBLISH_EVENT', owner],
    ['a member without CAN_PUBLISH_EVENT', member],
    [
      'a venue member with CAN_PUBLISH_EVENT but no cross-organisation permission',
      user('venue', ['org-v'], CanPublishEvent.id),
    ],
    [
      "a key of the venue's organisation with every permission",
      organizationKey(
        'org-v',
        CanPublishEvent.id,
        CanUpdateOtherOrganizationEvents.id
      ),
    ],
  ])('refuses %s', async (_name, session) => {
    const { service, prisma } = await setup();
    existing(
      prisma,
      { ownerId: 'owner' },
      { place: { organizationId: 'org-v' } }
    );
    prisma.eventRevision.findFirst.mockResolvedValue(draft);

    await expect(
      service.publishEvent('event-1', null, session)
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.eventRevision.update).not.toHaveBeenCalled();
  });

  it('lets a validator publish a foreign event', async () => {
    const { service, prisma } = await setup();
    existing(prisma);
    prisma.eventRevision.findFirst.mockResolvedValue(draft);

    await service.publishEvent('event-1', null, validator);

    expect(prisma.eventRevision.update).toHaveBeenCalled();
  });
});

describe('EventService.unpublishEvent', () => {
  const publisher = user('member', ['org-a'], CanPublishEvent.id);

  it('archives the published revisions, keeps the latest as draft and keeps the occurrences', async () => {
    const { service, prisma, cache } = await setup();
    existing(prisma, { publishedAt: new Date('2026-10-01T10:00:00.000Z') });
    prisma.eventRevision.findFirst.mockResolvedValue({ id: 'rev-3' });

    await service.unpublishEvent('event-1', publisher);

    expect(prisma.eventRevision.updateMany).toHaveBeenCalledWith({
      where: { eventId: 'event-1', publishedAt: { not: null } },
      data: { publishedAt: null, archivedAt: NOW },
    });
    expect(prisma.eventRevision.update).toHaveBeenCalledWith({
      where: { id: 'rev-3' },
      data: { archivedAt: null },
    });
    expect(prisma.event.update.mock.calls[0][0].data).toEqual({
      publishedAt: null,
    });
    expect(prisma.occurrence.deleteMany).not.toHaveBeenCalled();
    expect(cache.invalidate).toHaveBeenCalledWith('events');
  });

  it('refuses whoever may not publish it', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await expect(
      service.unpublishEvent('event-1', member)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('EventService.deleteEvent', () => {
  it("refuses the venue's organisation", async () => {
    const { service, prisma } = await setup();
    existing(prisma, {}, { place: { organizationId: 'org-v' } });

    await expect(
      service.deleteEvent('event-1', venueMember)
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.event.delete).not.toHaveBeenCalled();
  });

  it('refuses an owner outside the organisation', async () => {
    const { service, prisma } = await setup();
    existing(prisma, { ownerId: 'owner' });

    await expect(service.deleteEvent('event-1', owner)).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it('lets a member and CAN_DELETE_OTHER_ORGANIZATION_EVENTS delete it', async () => {
    const { service, prisma } = await setup();
    existing(prisma);

    await service.deleteEvent('event-1', member);
    await service.deleteEvent(
      'event-1',
      user('deleter', [], CanDeleteOtherOrganizationEvents.id)
    );

    expect(prisma.event.delete).toHaveBeenCalledTimes(2);
  });
});

describe('EventService.getEvent', () => {
  it('only finds published events for the public', async () => {
    const { service, prisma } = await setup();
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(
      service.getEvent({ id: 'event-1' }, undefined, false)
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.event.findFirst.mock.calls[0][0].where).toEqual({
      AND: [{ id: 'event-1' }, { published: { isNot: null } }],
    });
  });

  it('prefers the published event for a slug', async () => {
    const { service, prisma } = await setup();
    prisma.event.findFirst.mockResolvedValue(eventRow());

    await service.getEvent({ slug: 'konzert' }, undefined, false);

    expect(prisma.event.findFirst.mock.calls[0][0]).toMatchObject({
      where: { AND: [{ slug: 'konzert' }, { published: { isNot: null } }] },
      orderBy: [{ publishedAt: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
    });
  });

  it("opens what the editor may reach, including a venue's event from a mail link", async () => {
    const { service, prisma } = await setup();
    prisma.event.findFirst.mockResolvedValue(eventRow());

    await service.getEvent({ id: 'event-1' }, venueMember, true);

    expect(prisma.event.findFirst.mock.calls[0][0].where).toEqual({
      AND: [
        { id: 'event-1' },
        {
          OR: [
            { organizationId: { in: ['org-v'] } },
            { place: { organizationId: { in: ['org-v'] } } },
            { ownerId: 'venue' },
          ],
        },
      ],
    });
  });

  it('is a BadRequest without id or slug', async () => {
    const { service } = await setup();

    await expect(service.getEvent({}, undefined, false)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });
});

describe('EventService.getEvents', () => {
  it('scopes public lists to published events', async () => {
    const { service, prisma } = await setup();

    await service.getEvents({}, undefined, false);

    expect(prisma.event.findMany.mock.calls[0][0].where.AND[0]).toEqual({
      published: { isNot: null },
    });
  });

  it('scopes editor lists to the editor scope', async () => {
    const { service, prisma } = await setup();

    await service.getEvents({}, member, true);

    expect(prisma.event.findMany.mock.calls[0][0].where.AND[0]).toEqual({
      OR: [{ organizationId: { in: ['org-a'] } }, { ownerId: 'member' }],
    });
  });

  it('matches ids and tags on the event and time on its occurrences', async () => {
    const { service, prisma } = await setup();
    const from = new Date('2026-11-01T00:00:00.000Z');
    const to = new Date('2026-11-30T00:00:00.000Z');

    await service.getEvents(
      { filter: { ids: ['e1'], tagIds: ['t1'], from, to } },
      undefined,
      false
    );

    expect(prisma.event.findMany.mock.calls[0][0].where.AND[1]).toEqual({
      AND: [
        { id: { in: ['e1'] } },
        { tags: { some: { tagId: { in: ['t1'] } } } },
        {
          occurrences: {
            some: { dateTo: { gte: from }, dateFrom: { lte: to } },
          },
        },
      ],
    });
  });

  it('reads upcoming as an occurrence that has not ended', async () => {
    const { service, prisma } = await setup();

    await service.getEvents({ filter: { upcoming: true } }, undefined, false);

    expect(
      prisma.event.findMany.mock.calls[0][0].where.AND[1].AND
    ).toContainEqual({
      occurrences: { some: { dateTo: { gte: NOW } } },
    });
  });

  it('sorts StartsAt by the first date with the id as tiebreak', async () => {
    const { service, prisma } = await setup();

    await service.getEvents(
      { sort: EventSort.StartsAt, order: SortOrder.Descending },
      undefined,
      false
    );

    expect(prisma.event.findMany.mock.calls[0][0].orderBy).toEqual([
      { firstDateAt: 'desc' },
      { id: 'desc' },
    ]);
  });

  it('paginates with five slots', async () => {
    const { service, prisma } = await setup();
    prisma.event.count.mockResolvedValue(3);
    prisma.event.findMany.mockResolvedValue([
      eventRow({ id: 'a' }),
      eventRow({ id: 'b' }),
      eventRow({ id: 'c' }),
    ]);

    const result = await service.getEvents(
      { take: 2, skip: 1, cursorId: 'x' },
      undefined,
      false
    );

    expect(prisma.event.findMany.mock.calls[0][0]).toMatchObject({
      take: 3,
      skip: 1,
      cursor: { id: 'x' },
    });
    expect(result).toEqual({
      nodes: [eventRow({ id: 'a' }), eventRow({ id: 'b' })],
      totalCount: 3,
      pageInfo: {
        hasPreviousPage: true,
        hasNextPage: true,
        startCursor: 'a',
        endCursor: 'b',
      },
    });
  });
});

describe('EventService.getPublicEventsForBlock', () => {
  it('keeps the picked events in the order the editor chose, behind the public scope', async () => {
    const { service, prisma } = await setup();
    prisma.event.findMany.mockResolvedValueOnce([
      eventRow({ id: 'b' }),
      eventRow({ id: 'a' }),
    ]);

    const events = await service.getPublicEventsForBlock({
      events: ['a', 'missing', 'b'],
      tags: [],
    });

    expect(events.map(({ id }) => id)).toEqual(['a', 'b']);
    expect(prisma.event.findMany.mock.calls[0][0].where).toEqual({
      AND: [
        { published: { isNot: null } },
        { id: { in: ['a', 'missing', 'b'] } },
      ],
    });
  });

  it('renders nothing for ids of deleted events', async () => {
    const { service, prisma } = await setup();
    prisma.event.findMany.mockResolvedValue([]);

    expect(
      await service.getPublicEventsForBlock({ events: ['old-id'], tags: [] })
    ).toEqual([]);
  });

  it('orders events by tag by their first date and caps them', async () => {
    const { service, prisma } = await setup();

    await service.getPublicEventsForBlock({ events: [], tags: ['t1'] });

    expect(prisma.event.findMany.mock.calls[0][0]).toEqual({
      where: {
        AND: [
          { published: { isNot: null } },
          { tags: { some: { tagId: { in: ['t1'] } } } },
        ],
      },
      orderBy: [{ firstDateAt: 'asc' }, { id: 'asc' }],
      take: 100,
    });
  });

  it('lists a picked event once even when its tag matches too', async () => {
    const { service, prisma } = await setup();
    prisma.event.findMany
      .mockResolvedValueOnce([eventRow({ id: 'a' })])
      .mockResolvedValueOnce([eventRow({ id: 'a' }), eventRow({ id: 'c' })]);

    const events = await service.getPublicEventsForBlock({
      events: ['a'],
      tags: ['t1'],
    });

    expect(events.map(({ id }) => id)).toEqual(['a', 'c']);
  });
});

describe('EventService place choice', () => {
  it('lets a member file an event at a place they may choose', async () => {
    const { service, prisma } = await setup();

    await service.createEvent(facts({ placeId: 'place-1' }), content(), member);

    expect(prisma.place.count).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: 'place-1' },
          {
            enabled: true,
            OR: [{ private: false }, { organizationId: { in: ['org-a'] } }],
          },
        ],
      },
    });
    expect(prisma.event.create.mock.calls[0][0].data.placeId).toBe('place-1');
  });

  it('refuses a place that is disabled, missing or private to another organisation', async () => {
    const { service, prisma } = await setup();
    prisma.place.count.mockResolvedValue(0);

    await expect(
      service.createEvent(facts({ placeId: 'place-x' }), content(), member)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('checks a place only when an update changes it', async () => {
    const { service, prisma } = await setup();
    existing(prisma, { placeId: 'place-1' });

    await service.updateEvent('event-1', { placeId: 'place-1' }, member);
    await service.updateEvent('event-1', { placeId: null }, member);

    expect(prisma.place.count).not.toHaveBeenCalled();

    prisma.place.count.mockResolvedValue(0);

    await expect(
      service.updateEvent('event-1', { placeId: 'place-2' }, member)
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('EventService.duplicateEvent', () => {
  const sourceRevision = {
    id: 'rev-1',
    eventId: 'event-1',
    createdAt: NOW,
    name: 'Konzert',
    printDescription: 'Kurz',
    blocks: [{ type: 'richText', richText: { type: 'doc', content: [] } }],
    descriptionText: 'Ein Abend mit Musik',
    publishedAt: NOW,
    archivedAt: null,
    userId: 'someone',
    images: [
      {
        revisionId: 'rev-1',
        imageId: 'img-1',
        caption: 'Bühne',
        sortOrder: 0,
        isMain: true,
        createdAt: NOW,
      },
    ],
  };

  const source = (prisma: any, overrides: Partial<Event> = {}) => {
    prisma.event.findUnique.mockResolvedValue({
      ...eventRow({
        slug: 'konzert',
        status: EventStatus.SoldOut,
        placeId: 'place-1',
        audienceId: 'audience-1',
        ticketingUrl: 'https://tickets.example.com',
        showInPrint: true,
        scheduleType: EventScheduleType.Explicit,
        dateFrom: null,
        dateTo: null,
        seoTitle: 'SEO',
        socialMediaImageID: 'img-social',
        publishedAt: NOW,
        reviewRequestedAt: NOW,
        reviewRequestedById: 'owner',
        legacyId: BigInt(5),
        legacyProposedBy: { email: 'x@example.com' },
        ...overrides,
      }),
      dates: [
        {
          id: 'date-1',
          dateFrom: new Date('2026-11-05T18:00:00.000Z'),
          dateTo: new Date('2026-11-05T20:00:00.000Z'),
          openingTime: '17:30',
          sortOrder: 0,
          legacyEventId: BigInt(77),
        },
      ],
      rates: [{ price: '25.-', designation: 'Normal', sortOrder: 0 }],
      tags: [{ tagId: 'tag-1' }, { tagId: 'tag-2' }],
      place: { organizationId: 'org-v' },
    });
    prisma.eventRevision.findFirst.mockResolvedValue(sourceRevision);
  };

  it('copies the facts, the dates, the rates and the tags into a fresh event', async () => {
    const { service, prisma } = await setup();
    source(prisma);

    await service.duplicateEvent('event-1', member);

    const { data } = prisma.event.create.mock.calls[0][0];

    expect(data).toMatchObject({
      status: EventStatus.SoldOut,
      organizationId: 'org-a',
      placeId: 'place-1',
      audienceId: 'audience-1',
      ticketingUrl: 'https://tickets.example.com',
      showInPrint: true,
      scheduleType: EventScheduleType.Explicit,
      dateFrom: null,
      dateTo: null,
      weekDays: [],
      openingTime: null,
      ownerId: 'member',
      slug: null,
      publishedAt: null,
      reviewRequestedAt: null,
      reviewRequestedById: null,
      firstDateAt: new Date('2026-11-05T18:00:00.000Z'),
      lastDateAt: new Date('2026-11-05T20:00:00.000Z'),
      dates: {
        createMany: {
          data: [
            {
              dateFrom: new Date('2026-11-05T18:00:00.000Z'),
              dateTo: new Date('2026-11-05T20:00:00.000Z'),
              openingTime: '17:30',
              sortOrder: 0,
            },
          ],
        },
      },
      rates: {
        createMany: {
          data: [{ price: '25.-', designation: 'Normal', sortOrder: 0 }],
        },
      },
      tags: { createMany: { data: [{ tagId: 'tag-1' }, { tagId: 'tag-2' }] } },
    });
    expect(data).not.toHaveProperty('legacyId');
    expect(data).not.toHaveProperty('legacyProposedBy');
    expect(data).not.toHaveProperty('socialMediaImageID');
    expect(data).not.toHaveProperty('seoTitle');
  });

  it('copies the latest revision as a new draft, named as a copy', async () => {
    const { service, prisma } = await setup();
    source(prisma);

    await service.duplicateEvent('event-1', member);

    expect(prisma.eventRevision.findFirst).toHaveBeenCalledWith({
      where: { eventId: 'event-1', archivedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    const revision = prisma.event.create.mock.calls[0][0].data.revisions.create;

    expect(revision).toEqual({
      name: 'Kopie von Konzert',
      printDescription: 'Kurz',
      blocks: sourceRevision.blocks,
      descriptionText: 'Ein Abend mit Musik',
      userId: 'member',
      images: {
        createMany: {
          data: [
            { imageId: 'img-1', caption: 'Bühne', sortOrder: 0, isMain: true },
          ],
        },
      },
    });
  });

  it('keeps the copied name within 130 characters', async () => {
    const { service, prisma } = await setup();
    source(prisma);
    prisma.eventRevision.findFirst.mockResolvedValue({
      ...sourceRevision,
      name: 'x'.repeat(130),
    });

    await service.duplicateEvent('event-1', member);

    const { name } = prisma.event.create.mock.calls[0][0].data.revisions.create;

    expect(name).toHaveLength(130);
    expect(name.startsWith('Kopie von x')).toBe(true);
  });

  it('expands the occurrences of the copy and resets the draft cache', async () => {
    const { service, prisma, cache } = await setup();
    source(prisma);

    await service.duplicateEvent('event-1', member);

    expect(prisma.occurrence.createMany).toHaveBeenCalledWith({
      data: expandOccurrences({
        scheduleType: EventScheduleType.Explicit,
        dateFrom: null,
        dateTo: null,
        weekDays: [],
        openingTime: null,
        dates: [
          {
            dateFrom: new Date('2026-11-05T18:00:00.000Z'),
            dateTo: new Date('2026-11-05T20:00:00.000Z'),
            openingTime: '17:30',
            sortOrder: 0,
            legacyEventId: null,
          },
        ],
      }).map(occurrence => ({ ...occurrence, eventId: 'event-1' })),
    });
    expect(cache.invalidateDraft).toHaveBeenCalledWith('events');
    expect(cache.invalidate).not.toHaveBeenCalled();
  });

  it('lets the owner copy an event without organisation', async () => {
    const { service, prisma } = await setup();
    source(prisma, { organizationId: null });

    await service.duplicateEvent('event-1', owner);

    expect(prisma.event.create.mock.calls[0][0].data).toMatchObject({
      organizationId: null,
      ownerId: 'owner',
    });
  });

  it('gives a copy made by an api key no owner', async () => {
    const { service, prisma } = await setup();
    source(prisma);

    await service.duplicateEvent('event-1', organizationKey('org-a'));

    expect(prisma.event.create.mock.calls[0][0].data.ownerId).toBeNull();
  });

  it.each([
    ['someone who may not modify the event', user('stranger', ['org-z'])],
    [
      "the venue's organisation, which may not file events under the organiser",
      venueMember,
    ],
  ])('refuses %s', async (_n, session) => {
    const { service, prisma } = await setup();
    source(prisma);

    await expect(
      service.duplicateEvent('event-1', session)
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('is NotFound for a missing event', async () => {
    const { service, prisma } = await setup();
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(
      service.duplicateEvent('missing', member)
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('EventService.requestEventReview', () => {
  const draftRevision = {
    id: 'rev-draft',
    publishedAt: null,
    archivedAt: null,
  };

  it('stamps the request on an event with a draft', async () => {
    const { service, prisma, cache } = await setup();
    existing(prisma);
    prisma.eventRevision.findFirst.mockResolvedValue(draftRevision);

    await service.requestEventReview('event-1', member);

    expect(prisma.eventRevision.findFirst).toHaveBeenCalledWith({
      where: { eventId: 'event-1', archivedAt: null, publishedAt: null },
    });
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { reviewRequestedAt: NOW, reviewRequestedById: 'member' },
    });
    expect(cache.invalidateDraft).toHaveBeenCalledWith('events');
  });

  it('is a BadRequest without a draft', async () => {
    const { service, prisma } = await setup();
    existing(prisma, { publishedAt: NOW });
    prisma.eventRevision.findFirst.mockResolvedValue(null);

    await expect(
      service.requestEventReview('event-1', member)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('tells someone who may publish the event to publish it instead', async () => {
    const { service, prisma } = await setup();
    existing(prisma);
    prisma.eventRevision.findFirst.mockResolvedValue(draftRevision);

    await expect(
      service.requestEventReview(
        'event-1',
        user('publisher', ['org-a'], CanPublishEvent.id)
      )
    ).rejects.toThrow('publish');
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it("lets the venue's organisation ask, even with CAN_PUBLISH_EVENT, since it may not publish this event", async () => {
    const { service, prisma } = await setup();
    existing(
      prisma,
      { placeId: 'place-1' },
      { place: { organizationId: 'org-v' } }
    );
    prisma.eventRevision.findFirst.mockResolvedValue(draftRevision);

    await service.requestEventReview(
      'event-1',
      user('venue', ['org-v'], CanPublishEvent.id)
    );

    expect(prisma.event.update).toHaveBeenCalled();
  });

  it('refuses someone who may not modify the event', async () => {
    const { service, prisma } = await setup();
    existing(prisma);
    prisma.eventRevision.findFirst.mockResolvedValue(draftRevision);

    await expect(
      service.requestEventReview('event-1', user('stranger', ['org-z']))
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('lets an owner without organisation ask (D35)', async () => {
    const { service, prisma } = await setup();
    existing(prisma, { organizationId: null });
    prisma.eventRevision.findFirst.mockResolvedValue(draftRevision);

    await service.requestEventReview('event-1', owner);

    expect(prisma.event.update.mock.calls[0][0].data).toEqual({
      reviewRequestedAt: NOW,
      reviewRequestedById: 'owner',
    });
  });

  it('records no requester for an api key', async () => {
    const { service, prisma } = await setup();
    existing(prisma);
    prisma.eventRevision.findFirst.mockResolvedValue(draftRevision);

    await service.requestEventReview('event-1', organizationKey('org-a'));

    expect(
      prisma.event.update.mock.calls[0][0].data.reviewRequestedById
    ).toBeNull();
  });

  it('keeps the first request, so the queue keeps its age', async () => {
    const { service, prisma } = await setup();
    const requestedAt = new Date('2026-10-01T10:00:00.000Z');
    existing(prisma, {
      reviewRequestedAt: requestedAt,
      reviewRequestedById: 'owner',
    });
    prisma.eventRevision.findFirst.mockResolvedValue(draftRevision);

    const event = await service.requestEventReview('event-1', member);

    expect(prisma.event.update).not.toHaveBeenCalled();
    expect(event.reviewRequestedAt).toEqual(requestedAt);
    expect(event).not.toHaveProperty('dates');
  });

  it('is NotFound for a missing event', async () => {
    const { service, prisma } = await setup();
    prisma.event.findUnique.mockResolvedValue(null);

    await expect(
      service.requestEventReview('missing', member)
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
