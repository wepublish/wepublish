import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { NotificationReadResolver } from './notification-read.resolver';
import { NotificationReadService } from './notification-read.service';

const notificationReadsQuery = `
  query notificationReads {
    notificationReads {
      id
      source
      itemId
      createdAt
    }
  }
`;

const markNotificationReadMutation = `
  mutation markNotificationRead($source: NotificationSource!, $itemId: String!) {
    markNotificationRead(source: $source, itemId: $itemId) {
      id
      source
      itemId
    }
  }
`;

const mockRead = {
  id: 'read-1',
  createdAt: new Date('2026-08-25T12:00:00Z'),
  source: 'CHANGELOG',
  itemId: 'entry-1',
};

const mockSession = {
  user: {
    id: 'user-1',
  },
};

describe('NotificationReadResolver', () => {
  let app: INestApplication;

  const notificationReadService = {
    getNotificationReads: jest.fn(),
    markNotificationRead: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: ({ req }: { req: { user?: unknown } }) => {
            req.user = mockSession;
            return { req };
          },
        }),
      ],
      providers: [
        NotificationReadResolver,
        {
          provide: NotificationReadService,
          useValue: notificationReadService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  test('notificationReads query returns the reads of the current user', async () => {
    notificationReadService.getNotificationReads.mockResolvedValue([mockRead]);

    const response = await request(app.getHttpServer())
      .post('')
      .send({ query: notificationReadsQuery })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.notificationReads).toEqual([
      {
        id: 'read-1',
        source: 'CHANGELOG',
        itemId: 'entry-1',
        createdAt: '2026-08-25T12:00:00.000Z',
      },
    ]);
    expect(notificationReadService.getNotificationReads).toHaveBeenCalledWith(
      'user-1'
    );
  });

  test('markNotificationRead mutation passes the current user', async () => {
    notificationReadService.markNotificationRead.mockResolvedValue(mockRead);

    const response = await request(app.getHttpServer())
      .post('')
      .send({
        query: markNotificationReadMutation,
        variables: {
          source: 'ONE_MESSAGE',
          itemId: '42',
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(notificationReadService.markNotificationRead).toHaveBeenCalledWith(
      'user-1',
      'ONE_MESSAGE',
      '42'
    );
  });

  test('markNotificationRead rejects unknown sources', async () => {
    const response = await request(app.getHttpServer())
      .post('')
      .send({
        query: markNotificationReadMutation,
        variables: {
          source: 'NOT_A_SOURCE',
          itemId: '42',
        },
      });

    expect(response.body.errors).toBeDefined();
    expect(response.body.data ?? null).toBeNull();
    expect(notificationReadService.markNotificationRead).not.toHaveBeenCalled();
  });
});
