import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { Event, EventScheduleType, EventStatus } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { ImageDataloaderService } from '@wepublish/image/api';
import { URLAdapter } from '@wepublish/nest-modules';
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanGetEvent,
  CanGetEvents,
  CanPublishEvent,
  CanUpdateEvent,
} from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { EventTagDataloader } from '@wepublish/tag/api';
import { createMock, PartialMocked } from '@wepublish/testing';
import request from 'supertest';
import {
  EventDatesDataloader,
  EventRatesDataloader,
  EventRevisionImagesDataloader,
} from './event-details.dataloader';
import { EventRevisionDataloaderService } from './event-revisions.dataloader';
import { EventResolver } from './event.resolver';
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

const sessions: Record<string, AuthSession | undefined> = { editor };

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

  beforeAll(async () => {
    service = createMock(EventService);
    revisions = { load: vi.fn() };
    images = { load: vi.fn() };
    imageLoader = { load: vi.fn(async (id: string) => ({ id })) };
    places = { load: vi.fn(async () => ({ name: 'Dampfzentrale' })) };

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
        { provide: EventService, useValue: service },
        { provide: EventRevisionDataloaderService, useValue: revisions },
        { provide: EventRevisionImagesDataloader, useValue: images },
        { provide: ImageDataloaderService, useValue: imageLoader },
        { provide: PlaceDataloaderService, useValue: places },
        { provide: EventTagDataloader, useValue: { load: vi.fn(() => []) } },
        { provide: EventDatesDataloader, useValue: { load: vi.fn(() => []) } },
        { provide: EventRatesDataloader, useValue: { load: vi.fn(() => []) } },
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

  it.each(['duplicateEvent', 'requestEventReview'] as const)(
    '%s passes the id and the session on',
    async mutation => {
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
    }
  );

  it.each([
    ['createEvent', [CanCreateEvent]],
    ['updateEvent', [CanUpdateEvent]],
    ['updateEventContent', [CanUpdateEvent]],
    ['publishEvent', [CanPublishEvent]],
    ['unpublishEvent', [CanPublishEvent]],
    ['deleteEvent', [CanDeleteEvent]],
    ['duplicateEvent', [CanCreateEvent]],
    ['requestEventReview', [CanUpdateEvent]],
    ['draft', [CanGetEvent]],
    ['pending', [CanGetEvent]],
    ['ownerId', [CanGetEvent]],
    ['reviewRequestedAt', [CanGetEvent]],
    ['reviewRequestedById', [CanGetEvent]],
    ['legacyId', [CanGetEvent]],
  ] as const)('guards %s', (handler, permissions) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_METADATA_KEY,
        EventResolver.prototype[handler as keyof EventResolver]
      )
    ).toEqual(permissions);
  });
});
