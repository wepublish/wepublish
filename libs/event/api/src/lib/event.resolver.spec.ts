import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { Event, EventStatus, PrismaClient } from '@prisma/client';
import { ImageDataloaderService } from '@wepublish/image/api';
import { SortOrder } from '@wepublish/utils/api';
import request from 'supertest';
import { EventDataloaderService } from './event-dataloader.service';
import {
  CreateEventInput,
  EventListArgs,
  EventSort,
  UpdateEventInput,
} from './event.model';
import { EventResolver } from './event.resolver';
import { EventService } from './event.service';
import { createMock, PartialMocked } from '@wepublish/testing';
import { EventTagDataloader } from '@wepublish/tag/api';
import { URLAdapter } from '@wepublish/nest-modules';

const mockEvent = {
  id: '1234',
  createdAt: new Date('2023-01-01'),
  description: [],
  lead: '',
  startsAt: new Date('2023-01-01'),
  endsAt: new Date('2023-01-01'),
  imageId: '123',
  location: 'Foobar',
  name: 'Foo',
  status: EventStatus.Scheduled,
  externalSourceId: null,
  externalSourceName: null,
  modifiedAt: new Date('2023-01-01'),
} as Event;

const eventQuery = `
  query Event($id: String!) {
    event(id: $id) {
      id
      name
      imageId
      image {
        id
        filename
      }
    }
  }
`;

const eventListQuery = `
  query EventList(
    $filter: EventFilter
    $cursorId: String
    $take: Int
    $skip: Int
    $order: SortOrder
    $sort: EventSort
  ) {
    events(
      filter: $filter,
      cursorId: $cursorId,
      take: $take,
      skip: $skip,
      order: $order,
      sort: $sort
    ) {
      nodes {
        id
        name
        imageId
        image {
          id
          filename
        }
      }

      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }

      totalCount
    }
  }
`;

const createEventQuery = `
  mutation CreateEvent(
    $name: String!
    $description: RichText
    $location: String
    $startsAt: DateTime!
    $endsAt: DateTime
    $imageId: String
    $tagIds: [String!],
  ) {
    createEvent(
      name: $name
      description: $description
      location: $location
      startsAt: $startsAt
      endsAt: $endsAt
      imageId: $imageId
      tagIds: $tagIds
    ) {
      id
      name
      imageId
      image {
        id
        filename
      }
    }
  }
`;

const updateEventQuery = `
  mutation UpdateEvent(
    $id: String!,
    $name: String
    $description: RichText
    $location: String
    $startsAt: DateTime
    $endsAt: DateTime
    $imageId: String
    $tagIds: [String!],
  ) {
    updateEvent(
      id: $id
      name: $name
      description: $description
      location: $location
      startsAt: $startsAt
      endsAt: $endsAt
      imageId: $imageId
      tagIds: $tagIds
    ) {
      id
      name
      imageId
      image {
        id
        filename
      }
    }
  }
`;

const deleteEventQuery = `
  mutation DeleteEvent($id: String!) {
    deleteEvent(id: $id) {
      id
      name
      imageId
      image {
        id
        filename
      }
    }
  }
`;

describe('EventResolver', () => {
  let app: INestApplication;
  let eventServiceMock: { [method in keyof EventService]?: jest.Mock };
  let eventDataloaderServiceMock: {
    [method in keyof EventDataloaderService]?: jest.Mock;
  };
  let imageDataloaderServiceMock: {
    [method in keyof EventDataloaderService]?: jest.Mock;
  };
  let urlAdapter: PartialMocked<URLAdapter>;
  let tagServiceMock: PartialMocked<EventTagDataloader>;

  beforeEach(async () => {
    eventServiceMock = {
      getEvents: jest.fn(),
      createEvent: jest.fn(),
      deleteEvent: jest.fn(),
      updateEvent: jest.fn(),
    };

    eventDataloaderServiceMock = {
      load: jest.fn(),
    };

    imageDataloaderServiceMock = {
      load: jest.fn(),
    };
    urlAdapter = createMock(URLAdapter);
    tagServiceMock = createMock(EventTagDataloader);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
        }),
      ],
      providers: [
        EventResolver,
        {
          provide: EventService,
          useValue: eventServiceMock,
        },
        {
          provide: EventDataloaderService,
          useValue: eventDataloaderServiceMock,
        },
        {
          provide: ImageDataloaderService,
          useValue: imageDataloaderServiceMock,
        },
        {
          provide: EventTagDataloader,
          useValue: tagServiceMock,
        },
        {
          provide: URLAdapter,
          useValue: urlAdapter,
        },
        {
          provide: PrismaClient,
          useValue: jest.fn(), // not used due to mocks but needs to be provided
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('event', async () => {
    eventDataloaderServiceMock.load?.mockResolvedValue({
      id: '1234',
      name: 'name',
      imageId: '123',
    });

    imageDataloaderServiceMock.load?.mockResolvedValue({
      id: '123',
      filename: '123.webp',
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: eventQuery,
        variables: {
          id: '1234',
        },
      })
      .expect(200)
      .expect(res => {
        expect(imageDataloaderServiceMock.load?.mock.calls).toMatchSnapshot();
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).toMatchSnapshot();
      });
  });

  test('events', async () => {
    eventServiceMock.getEvents?.mockResolvedValue({
      nodes: [{ ...mockEvent, imageId: null }],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        endCursor: '1234',
        startCursor: '123',
      },
      totalCount: 100,
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: eventListQuery,
        variables: {
          filter: {
            from: new Date('2023-01-01'),
            to: new Date('2023-01-01'),
            location: 'Foobar',
            name: 'Foo',
            tags: ['123'],
            upcomingOnly: true,
          },
          order: SortOrder.Ascending,
          skip: 1,
          sort: EventSort.EndsAt,
          take: 5,
        } as EventListArgs,
      })
      .expect(res => {
        expect(eventServiceMock.getEvents?.mock.calls).toMatchSnapshot();
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).toMatchSnapshot();
      })
      .expect(200);
  });

  test('create', async () => {
    eventServiceMock.createEvent?.mockResolvedValue(mockEvent);

    imageDataloaderServiceMock.load?.mockResolvedValue({
      id: '123',
      filename: '123.webp',
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: createEventQuery,
        variables: {
          description: [],
          startsAt: new Date('2023-01-01'),
          endsAt: new Date('2023-01-01'),
          imageId: '123',
          location: 'Foobar',
          name: 'Foo',
          status: EventStatus.Scheduled,
          tagIds: ['1234'],
        } as CreateEventInput,
      })
      .expect(res => {
        expect(eventServiceMock.createEvent?.mock.calls).toMatchSnapshot();
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).toMatchSnapshot();
      })
      .expect(200);
  });

  test('update', async () => {
    eventServiceMock.updateEvent?.mockResolvedValue({
      ...mockEvent,
      name: 'Bar',
    });

    imageDataloaderServiceMock.load?.mockResolvedValue({
      id: '123',
      filename: '123.webp',
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: updateEventQuery,
        variables: {
          id: mockEvent.id,
          name: 'Bar',
        } as UpdateEventInput,
      })
      .expect(res => {
        expect(eventServiceMock.updateEvent?.mock.calls).toMatchSnapshot();
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data).toMatchSnapshot();
      })
      .expect(200);
  });

  test('delete', async () => {
    eventServiceMock.deleteEvent?.mockResolvedValue(mockEvent);

    imageDataloaderServiceMock.load?.mockResolvedValue({
      id: '123',
      filename: '123.webp',
    });

    await request(app.getHttpServer())
      .post('')
      .send({
        query: deleteEventQuery,
        variables: {
          id: '1234',
        },
      })
      .expect(res => {
        expect(eventServiceMock.deleteEvent?.mock.calls[0]).toMatchSnapshot();
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.deleteEvent).toMatchSnapshot();
      })
      .expect(200);
  });
});
