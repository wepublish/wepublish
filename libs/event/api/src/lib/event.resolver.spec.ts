import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import {
  Event,
  EventScheduleType,
  EventSpecialRate,
  EventStatus,
} from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { ImageDataloaderService } from '@wepublish/image/api';
import { URLAdapter } from '@wepublish/nest-modules';
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanGetEvent,
  CanGetEvents,
  CanDeleteOtherOrganizationEvents,
  CanGetOtherOrganizationEvents,
  CanPublishEvent,
  CanUpdateEvent,
  CanUpdateOtherOrganizationEvents,
} from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { EventTagDataloader } from '@wepublish/tag/api';
import { createMock, PartialMocked } from '@wepublish/testing';
import { UserDataloaderService } from '@wepublish/user/api';
import request from 'supertest';
import {
  EventDatesDataloader,
  EventRatesDataloader,
  EventRevisionImagesDataloader,
} from './event-details.dataloader';
import { EventDataloaderService } from './event-dataloader.service';
import { EventOccurrenceSummaryDataloader } from './event-occurrence-summary.dataloader';
import { EventRevisionDataloaderService } from './event-revisions.dataloader';
import { EventResolver, OccurrenceResolver } from './event.resolver';
import { EventService } from './event.service';
import { PlaceDataloaderService } from './place/place-dataloader.service';

const NOW = new Date('2026-10-23T10:00:00.000Z');

const editor: AuthSession = {
  type: AuthSessionType.User,
  id: 'session-editor',
  token: 'token',
  user: { id: 'editor' },
  roles: [{ id: 'role', permissionIDs: [CanGetEvent.id, CanGetEvents.id] }],
  organizationIds: ['org-a'],
  createdAt: NOW,
  expiresAt: NOW,
} as unknown as AuthSession;

const foreignMember: AuthSession = {
  ...editor,
  id: 'session-foreign',
  user: { id: 'foreign' },
  organizationIds: ['org-b'],
} as unknown as AuthSession;

const foreignKey: AuthSession = {
  type: AuthSessionType.ApiToken,
  id: 'key-b',
  name: 'Venue app',
  token: 'token',
  permissions: [CanGetEvent.id, CanGetEvents.id],
  organizationId: 'org-b',
};

const venueMember: AuthSession = {
  ...foreignMember,
  id: 'session-venue',
  organizationIds: ['org-venue'],
} as unknown as AuthSession;

const scopedEventPermissions = [
  CanGetEvent.id,
  CanGetEvents.id,
  CanCreateEvent.id,
  CanUpdateEvent.id,
  CanDeleteEvent.id,
];

const withRole = (
  session: AuthSession,
  id: string,
  userId: string,
  organizationIds: string[],
  permissionIDs: string[]
) =>
  ({
    ...session,
    id,
    user: { id: userId },
    organizationIds,
    roles: [{ id: 'role', permissionIDs }],
  }) as unknown as AuthSession;

const organiser = withRole(
  editor,
  'session-organiser',
  'organiser',
  ['org-a'],
  scopedEventPermissions
);

const venueEditor = withRole(
  editor,
  'session-venue-editor',
  'venue-editor',
  ['org-venue'],
  [...scopedEventPermissions, CanPublishEvent.id]
);

const orphanOwner = withRole(
  editor,
  'session-owner',
  'owner-1',
  [],
  [...scopedEventPermissions, CanPublishEvent.id]
);

const agendaAdmin = withRole(
  editor,
  'session-agenda-admin',
  'agenda-admin',
  [],
  [
    ...scopedEventPermissions,
    CanPublishEvent.id,
    CanGetOtherOrganizationEvents.id,
    CanUpdateOtherOrganizationEvents.id,
    CanDeleteOtherOrganizationEvents.id,
  ]
);

const sessions: Record<string, AuthSession | undefined> = {
  editor,
  foreignMember,
  foreignKey,
  venueMember,
  organiser,
  venueEditor,
  orphanOwner,
  agendaAdmin,
};

const event: Event = {
  id: 'event-1',
  createdAt: NOW,
  modifiedAt: NOW,
  slug: 'konzert',
  status: EventStatus.SoldOut,
  organizationId: 'org-a',
  placeId: 'place-1',
  ownerId: 'owner-1',
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
  publishedAt: NOW,
  firstDateAt: new Date('2026-11-01T18:00:00.000Z'),
  lastDateAt: new Date('2026-11-03T21:00:00.000Z'),
  reviewRequestedAt: null,
  reviewRequestedById: null,
  legacyId: BigInt(42),
  legacyProposedBy: null,
  specialRate: null,
};

const doc = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

const revision = (id: string, name: string, text: string) => ({
  id,
  eventId: 'event-1',
  createdAt: NOW,
  name,
  printDescription: null,
  blocks: [
    { type: 'title', title: 'ignored' },
    { type: 'richText', richText: doc(text) },
    { type: 'richText', richText: doc('second') },
  ],
  descriptionText: text,
  publishedAt: null,
  archivedAt: null,
  userId: null,
});

const published = revision('rev-published', 'Published name', 'published');
const draft = revision('rev-draft', 'Draft name', 'draft');

const eventQuery = `
  query Event($id: String, $slug: Slug) {
    event(id: $id, slug: $slug) {
      id
      slug
      status
      scheduleType
      name
      description
      image { id }
      location
      startsAt
      endsAt
      url
      latest { id name }
      published { id }
      draft { id }
      pending { id }
      ownerId
      legacyId
    }
  }
`;

const listQuery = `
  query Events {
    events {
      nodes { id name latest { id } }
      totalCount
    }
  }
`;

describe('EventResolver', () => {
  let app: INestApplication;
  let service: PartialMocked<EventService>;
  let revisions: { load: ReturnType<typeof vi.fn> };
  let images: { load: ReturnType<typeof vi.fn> };
  let imageLoader: { load: ReturnType<typeof vi.fn> };
  let places: { load: ReturnType<typeof vi.fn> };
  let eventLoader: { load: ReturnType<typeof vi.fn> };
  let summaries: { load: ReturnType<typeof vi.fn> };
  let users: { load: ReturnType<typeof vi.fn> };

  beforeAll(async () => {
    service = createMock(EventService);
    revisions = { load: vi.fn() };
    images = { load: vi.fn() };
    imageLoader = { load: vi.fn(async (id: string) => ({ id })) };
    places = {
      load: vi.fn(async () => ({
        name: 'Dampfzentrale',
        organizationId: 'org-venue',
      })),
    };
    eventLoader = { load: vi.fn(async (id: string) => ({ ...event, id })) };
    summaries = { load: vi.fn() };
    users = { load: vi.fn(async (id: string) => ({ id, name: `User ${id}` })) };

    const module = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: ({ req }: { req: unknown }) => ({ req }),
        }),
      ],
      providers: [
        EventResolver,
        OccurrenceResolver,
        { provide: EventService, useValue: service },
        { provide: EventDataloaderService, useValue: eventLoader },
        { provide: EventRevisionDataloaderService, useValue: revisions },
        { provide: EventRevisionImagesDataloader, useValue: images },
        { provide: ImageDataloaderService, useValue: imageLoader },
        { provide: PlaceDataloaderService, useValue: places },
        { provide: EventTagDataloader, useValue: { load: vi.fn(() => []) } },
        { provide: EventDatesDataloader, useValue: { load: vi.fn(() => []) } },
        { provide: EventRatesDataloader, useValue: { load: vi.fn(() => []) } },
        { provide: EventOccurrenceSummaryDataloader, useValue: summaries },
        { provide: UserDataloaderService, useValue: users },
        {
          provide: URLAdapter,
          useValue: {
            getEventURL: vi.fn(async () => 'https://example.com/event/konzert'),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.use((req: any, _res: unknown, next: () => void) => {
      req.user = sessions[req.headers['x-session'] as string];
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    service.getEvent?.mockReset();
    service.getEvents?.mockReset();
    service.getAgenda?.mockReset();
    revisions.load.mockReset();
    images.load.mockReset();
    images.load.mockResolvedValue([]);
  });

  const send = (
    query: string,
    variables: Record<string, unknown> = {},
    headers: Record<string, string> = {}
  ) =>
    request(app.getHttpServer())
      .post('/')
      .set(headers)
      .send({ query, variables });

  it('resolves the flat fields from the published revision for the public', async () => {
    service.getEvent?.mockResolvedValue(event);
    revisions.load.mockResolvedValue({ draft, published });
    images.load.mockResolvedValue([
      {
        revisionId: 'rev-published',
        imageId: 'img-late',
        sortOrder: 1,
        isMain: false,
      },
      {
        revisionId: 'rev-published',
        imageId: 'img-first',
        sortOrder: 0,
        isMain: false,
      },
    ]);

    const res = await send(eventQuery, { id: 'event-1' }).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.event).toEqual({
      id: 'event-1',
      slug: 'konzert',
      status: 'SoldOut',
      scheduleType: 'Continuous',
      name: 'Published name',
      description: doc('published'),
      image: { id: 'img-first' },
      location: 'Dampfzentrale',
      startsAt: '2026-11-01T18:00:00.000Z',
      endsAt: '2026-11-03T21:00:00.000Z',
      url: 'https://example.com/event/konzert',
      latest: { id: 'rev-published', name: 'Published name' },
      published: { id: 'rev-published' },
      draft: null,
      pending: null,
      ownerId: null,
      legacyId: null,
    });
    expect(service.getEvent).toHaveBeenCalledWith(
      { id: 'event-1' },
      undefined,
      false
    );
    expect(images.load).toHaveBeenCalledWith('rev-published');
  });

  it('prefers the main image', async () => {
    service.getEvent?.mockResolvedValue(event);
    revisions.load.mockResolvedValue({ published });
    images.load.mockResolvedValue([
      { imageId: 'img-first', sortOrder: 0, isMain: false },
      { imageId: 'img-main', sortOrder: 3, isMain: true },
    ]);

    const res = await send(eventQuery, { id: 'event-1' }).expect(200);

    expect(res.body.data.event.image).toEqual({ id: 'img-main' });
  });

  it('resolves the draft and the editor-only fields for an editor previewing', async () => {
    service.getEvent?.mockResolvedValue(event);
    revisions.load.mockResolvedValue({ draft, published });

    const res = await send(
      eventQuery,
      { slug: 'konzert' },
      { preview: 'true', 'x-session': 'editor' }
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.event).toMatchObject({
      name: 'Draft name',
      description: doc('draft'),
      latest: { id: 'rev-draft', name: 'Draft name' },
      draft: { id: 'rev-draft' },
      ownerId: 'owner-1',
      legacyId: '42',
    });
    expect(service.getEvent).toHaveBeenCalledWith(
      { slug: 'konzert' },
      editor,
      true
    );
  });

  it.each(['foreignMember', 'foreignKey'])(
    'gives %s of another organisation only the published view of an event it cannot reach',
    async session => {
      service.getEvent?.mockResolvedValue(event);
      revisions.load.mockResolvedValue({
        draft,
        pending: revision('rev-pending', 'Pending name', 'pending'),
        published,
      });

      const res = await send(
        eventQuery,
        { slug: 'konzert' },
        { preview: 'true', 'x-session': session }
      ).expect(200);

      expect(res.body.data.event).toMatchObject({
        name: 'Published name',
        description: doc('published'),
        latest: { id: 'rev-published', name: 'Published name' },
        published: { id: 'rev-published' },
        draft: null,
        pending: null,
        ownerId: null,
        legacyId: null,
      });
      expect(images.load).not.toHaveBeenCalledWith('rev-draft');
    }
  );

  it("gives a member of the venue's organisation the editor view", async () => {
    service.getEvent?.mockResolvedValue(event);
    revisions.load.mockResolvedValue({ draft, published });

    const res = await send(
      eventQuery,
      { id: 'event-1' },
      { preview: 'true', 'x-session': 'venueMember' }
    ).expect(200);

    expect(res.body.data.event).toMatchObject({
      name: 'Draft name',
      draft: { id: 'rev-draft' },
      ownerId: 'owner-1',
    });
  });

  it('keeps the agenda of another organisation on the published view', async () => {
    service.getAgenda?.mockResolvedValue({
      nodes: [
        {
          id: 'occ-1',
          eventId: 'event-1',
          dateFrom: new Date('2026-11-02T18:00:00.000Z'),
          dateTo: null,
          openingTime: null,
        },
      ],
      totalCount: 1,
      pageInfo: { hasPreviousPage: false, hasNextPage: false },
    });
    revisions.load.mockResolvedValue({ draft, published });

    const res = await send(
      `query { agenda { nodes { event { name draft { id } } } } }`,
      {},
      { preview: 'true', 'x-session': 'foreignMember' }
    ).expect(200);

    expect(res.body.data.agenda.nodes).toEqual([
      { event: { name: 'Published name', draft: null } },
    ]);
  });

  it('stays public without the preview header, even for an editor', async () => {
    service.getEvent?.mockResolvedValue(event);
    revisions.load.mockResolvedValue({ draft, published });

    const res = await send(
      eventQuery,
      { id: 'event-1' },
      { 'x-session': 'editor' }
    ).expect(200);

    expect(res.body.data.event.name).toBe('Published name');
    expect(service.getEvent).toHaveBeenCalledWith(
      { id: 'event-1' },
      editor,
      false
    );
  });

  it('stays public with the preview header but no event permission', async () => {
    service.getEvent?.mockResolvedValue(event);
    revisions.load.mockResolvedValue({ draft, published });

    const res = await send(
      eventQuery,
      { id: 'event-1' },
      { preview: 'true' }
    ).expect(200);

    expect(res.body.data.event.name).toBe('Published name');
    expect(res.body.data.event.draft).toBeNull();
  });

  it('resolves a draft-only event to nulls in a public list without nulling the list', async () => {
    service.getEvents?.mockResolvedValue({
      nodes: [event, { ...event, id: 'event-2' }],
      totalCount: 2,
      pageInfo: {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: 'event-1',
        endCursor: 'event-2',
      },
    });
    revisions.load.mockImplementation(async (id: string) =>
      id === 'event-1' ? { draft } : { published }
    );

    const res = await send(listQuery).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.events).toEqual({
      nodes: [
        { id: 'event-1', name: null, latest: null },
        {
          id: 'event-2',
          name: 'Published name',
          latest: { id: 'rev-published' },
        },
      ],
      totalCount: 2,
    });
    expect(service.getEvents).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, skip: 0 }),
      undefined,
      false
    );
  });

  it('gives an event without place or revisions null flat fields', async () => {
    service.getEvent?.mockResolvedValue({
      ...event,
      placeId: null,
      firstDateAt: null,
      lastDateAt: null,
    });
    revisions.load.mockResolvedValue({});

    const res = await send(eventQuery, { id: 'event-1' }).expect(200);

    expect(res.body.data.event).toMatchObject({
      name: null,
      description: null,
      image: null,
      location: null,
      startsAt: null,
      endsAt: null,
    });
  });

  const agendaQuery = `
    query Agenda($filter: EventFilter, $take: Int) {
      agenda(filter: $filter, take: $take) {
        nodes {
          id
          dateFrom
          dateTo
          openingTime
          eventId
          event { id name }
        }
        totalCount
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const agendaPage = {
    nodes: [
      {
        id: 'occ-1',
        eventId: 'weekly',
        dateFrom: new Date('2026-11-02T18:00:00.000Z'),
        dateTo: new Date('2026-11-02T21:00:00.000Z'),
        openingTime: '19:30',
      },
      {
        id: 'occ-2',
        eventId: 'weekly',
        dateFrom: new Date('2026-11-09T18:00:00.000Z'),
        dateTo: new Date('2026-11-09T21:00:00.000Z'),
        openingTime: null,
      },
    ],
    totalCount: 2,
    pageInfo: {
      hasPreviousPage: false,
      hasNextPage: false,
      startCursor: 'occ-1',
      endCursor: 'occ-2',
    },
  };

  it('lists the agenda as one row per occurrence with its event', async () => {
    service.getAgenda?.mockResolvedValue(agendaPage);
    revisions.load.mockResolvedValue({ published });

    const res = await send(agendaQuery, {
      filter: { search: 'theatre', upcoming: true },
      take: 5,
    }).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.agenda).toEqual({
      nodes: [
        {
          id: 'occ-1',
          dateFrom: '2026-11-02T18:00:00.000Z',
          dateTo: '2026-11-02T21:00:00.000Z',
          openingTime: '19:30',
          eventId: 'weekly',
          event: { id: 'weekly', name: 'Published name' },
        },
        {
          id: 'occ-2',
          dateFrom: '2026-11-09T18:00:00.000Z',
          dateTo: '2026-11-09T21:00:00.000Z',
          openingTime: null,
          eventId: 'weekly',
          event: { id: 'weekly', name: 'Published name' },
        },
      ],
      totalCount: 2,
      pageInfo: { hasNextPage: false, endCursor: 'occ-2' },
    });
    expect(service.getAgenda).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ search: 'theatre', upcoming: true }),
        take: 5,
        skip: 0,
        order: 'Ascending',
      }),
      undefined,
      false
    );
    expect(eventLoader.load).toHaveBeenCalledWith('weekly');
  });

  it('lists the agenda in editor mode for an editor previewing', async () => {
    service.getAgenda?.mockResolvedValue({ ...agendaPage, nodes: [] });

    await send(
      agendaQuery,
      {},
      { 'x-session': 'editor', preview: 'true' }
    ).expect(200);

    expect(service.getAgenda).toHaveBeenCalledWith(
      expect.anything(),
      editor,
      true
    );
  });

  it('accepts the full event filter', async () => {
    service.getEvents?.mockResolvedValue({
      nodes: [],
      totalCount: 0,
      pageInfo: { hasPreviousPage: false, hasNextPage: false },
    });

    const res = await send(
      `query Events($filter: EventFilter) { events(filter: $filter) { totalCount } }`,
      {
        filter: {
          search: 'theatre',
          tagIds: ['t1'],
          audienceId: 'a1',
          regionId: 'r1',
          organizationIds: ['o1'],
          placeIds: ['p1'],
          geoBoundingBox: {
            southWest: { latitude: 46.9, longitude: 7.3 },
            northEast: { latitude: 47, longitude: 7.5 },
          },
          wheelchairAccessible: true,
          accessibilityProInfirmis: [8],
          partner: true,
          showInPrint: false,
          eventStatus: ['Cancelled'],
        },
      }
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(service.getEvents?.mock.calls[0][0].filter).toMatchObject({
      search: 'theatre',
      accessibilityProInfirmis: [8],
      eventStatus: ['Cancelled'],
      geoBoundingBox: { southWest: { latitude: 46.9, longitude: 7.3 } },
    });
  });

  it.each([
    'duplicateEvent',
    'requestEventReview',
    'withdrawEventReview',
  ] as const)('%s passes the id and the session on', async mutation => {
    service[mutation]?.mockResolvedValue(event);
    revisions.load.mockResolvedValue({ draft });

    const res = await send(
      `mutation { ${mutation}(id: "event-1") { id } }`,
      {},
      { 'x-session': 'editor' }
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data[mutation]).toEqual({ id: 'event-1' });
    expect(service[mutation]).toHaveBeenCalledWith('event-1', editor);
  });

  it.each([
    ['createEvent', [CanCreateEvent]],
    ['updateEvent', [CanUpdateEvent]],
    ['updateEventContent', [CanUpdateEvent]],
    ['publishEvent', [CanPublishEvent]],
    ['unpublishEvent', [CanPublishEvent]],
    ['deleteEvent', [CanDeleteEvent]],
    ['duplicateEvent', [CanCreateEvent]],
    ['requestEventReview', [CanUpdateEvent]],
    ['withdrawEventReview', [CanUpdateEvent]],
    ['draft', [CanGetEvent]],
    ['pending', [CanGetEvent]],
    ['ownerId', [CanGetEvent]],
    ['reviewRequestedAt', [CanGetEvent]],
    ['reviewRequestedById', [CanGetEvent]],
    ['owner', [CanGetEvent]],
    ['reviewRequestedBy', [CanGetEvent]],
    ['viewerCan', [CanGetEvent]],
    ['legacyId', [CanGetEvent]],
  ] as const)('guards %s', (handler, permissions) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_METADATA_KEY,
        EventResolver.prototype[handler as keyof EventResolver]
      )
    ).toEqual(permissions);
  });

  describe('owner and review requester', () => {
    const peopleQuery = `
      query Event($id: String) {
        event(id: $id) {
          owner { id name }
          reviewRequestedBy { id }
        }
      }
    `;

    const requested = {
      ...event,
      reviewRequestedAt: NOW,
      reviewRequestedById: 'requester',
    };

    it('resolves both users for someone who reaches the editor view', async () => {
      service.getEvent?.mockResolvedValue(requested);
      revisions.load.mockResolvedValue({ draft });

      const res = await send(
        peopleQuery,
        { id: 'event-1' },
        { preview: 'true', 'x-session': 'editor' }
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.event).toEqual({
        owner: { id: 'owner-1', name: 'User owner-1' },
        reviewRequestedBy: { id: 'requester' },
      });
    });

    it.each(['foreignMember', 'foreignKey', undefined])(
      'resolves neither for %s',
      async session => {
        service.getEvent?.mockResolvedValue(requested);
        revisions.load.mockResolvedValue({ published });
        users.load.mockClear();

        const res = await send(
          peopleQuery,
          { id: 'event-1' },
          session ? { preview: 'true', 'x-session': session } : {}
        ).expect(200);

        expect(res.body.data.event).toEqual({
          owner: null,
          reviewRequestedBy: null,
        });
        expect(users.load).not.toHaveBeenCalled();
      }
    );

    it('resolves null for an event without owner', async () => {
      service.getEvent?.mockResolvedValue({ ...event, ownerId: null });
      revisions.load.mockResolvedValue({ draft });

      const res = await send(
        peopleQuery,
        { id: 'event-1' },
        { preview: 'true', 'x-session': 'editor' }
      ).expect(200);

      expect(res.body.data.event.owner).toBeNull();
    });
  });

  describe('viewerCan', () => {
    const viewerQuery = `
      query Event($id: String) {
        event(id: $id) {
          viewerCan {
            update
            publish
            delete
            duplicate
            requestReview
            withdrawReview
            moveOrganization
            reassignOwner
          }
        }
      }
    `;

    const none = {
      update: false,
      publish: false,
      delete: false,
      duplicate: false,
      requestReview: false,
      withdrawReview: false,
      moveOrganization: false,
      reassignOwner: false,
    };

    const viewerCan = async (
      session: string | undefined,
      overrides: Partial<Event> = {},
      revisionState: Record<string, unknown> = { draft, published }
    ) => {
      service.getEvent?.mockResolvedValue({ ...event, ...overrides });
      revisions.load.mockResolvedValue(revisionState);

      const res = await send(
        viewerQuery,
        { id: 'event-1' },
        session ? { preview: 'true', 'x-session': session } : {}
      ).expect(200);

      expect(res.body.errors).toBeUndefined();

      return res.body.data.event.viewerCan;
    };

    it('lets a member who cannot publish edit and ask for a review', async () => {
      expect(await viewerCan('organiser')).toEqual({
        ...none,
        update: true,
        delete: true,
        duplicate: true,
        requestReview: true,
        moveOrganization: true,
      });
    });

    it('offers no review request without a draft', async () => {
      expect(
        (await viewerCan('organiser', {}, { published })).requestReview
      ).toBe(false);
    });

    it('offers withdrawing instead of asking once a review is requested', async () => {
      const can = await viewerCan('organiser', { reviewRequestedAt: NOW });

      expect(can.requestReview).toBe(false);
      expect(can.withdrawReview).toBe(true);
    });

    it("lets the venue's member edit and ask, but not publish, delete, copy or move", async () => {
      expect(await viewerCan('venueEditor')).toEqual({
        ...none,
        update: true,
        requestReview: true,
      });
    });

    it('lets the owner of an orphan event publish it but not delete it', async () => {
      expect(await viewerCan('orphanOwner', { organizationId: null })).toEqual({
        ...none,
        update: true,
        publish: true,
        duplicate: true,
        moveOrganization: true,
      });
    });

    it('lets a cross-organisation holder do everything but ask for a review', async () => {
      expect(
        await viewerCan('agendaAdmin', { reviewRequestedAt: NOW })
      ).toEqual({
        update: true,
        publish: true,
        delete: true,
        duplicate: true,
        requestReview: false,
        withdrawReview: true,
        moveOrganization: true,
        reassignOwner: true,
      });
    });

    it('gives a member holding only the read permissions nothing to do', async () => {
      expect(await viewerCan('editor')).toEqual(none);
    });

    it.each(['foreignMember', 'foreignKey', undefined])(
      'is null for %s, who does not reach the editor view',
      async session => {
        expect(await viewerCan(session)).toBeNull();
      }
    );
  });

  describe('next date', () => {
    const nextQuery = `
      query Event($id: String) {
        event(id: $id) {
          nextOccurrence { id dateFrom }
          upcomingOccurrenceCount
          specialRate
        }
      }
    `;

    it('resolves the next occurrence and the count of upcoming ones', async () => {
      service.getEvent?.mockResolvedValue({
        ...event,
        specialRate: EventSpecialRate.FreeEntry,
      });
      revisions.load.mockResolvedValue({ published });
      summaries.load.mockResolvedValue({
        next: {
          id: 'occ-1',
          eventId: 'event-1',
          dateFrom: new Date('2026-11-01T18:00:00.000Z'),
          dateTo: new Date('2026-11-01T21:00:00.000Z'),
          openingTime: null,
        },
        upcomingCount: 4,
      });

      const res = await send(nextQuery, { id: 'event-1' }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.event).toEqual({
        nextOccurrence: { id: 'occ-1', dateFrom: '2026-11-01T18:00:00.000Z' },
        upcomingOccurrenceCount: 4,
        specialRate: 'FreeEntry',
      });
      expect(summaries.load).toHaveBeenCalledWith('event-1');
    });

    it('resolves null and zero for an event that is over', async () => {
      service.getEvent?.mockResolvedValue(event);
      revisions.load.mockResolvedValue({ published });
      summaries.load.mockResolvedValue({ next: null, upcomingCount: 0 });

      const res = await send(nextQuery, { id: 'event-1' }).expect(200);

      expect(res.body.data.event).toEqual({
        nextOccurrence: null,
        upcomingOccurrenceCount: 0,
        specialRate: null,
      });
    });
  });
});
