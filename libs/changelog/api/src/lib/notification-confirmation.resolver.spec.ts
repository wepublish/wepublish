import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { NotificationConfirmationResolver } from './notification-confirmation.resolver';
import { NotificationConfirmationService } from './notification-confirmation.service';

const notificationConfirmationsQuery = `
  query notificationConfirmations {
    notificationConfirmations {
      id
      source
      itemId
      confirmedByUserId
      createdAt
    }
  }
`;

const confirmNotificationMutation = `
  mutation confirmNotification($source: NotificationSource!, $itemId: String!) {
    confirmNotification(source: $source, itemId: $itemId) {
      id
      source
      itemId
      confirmedByUserId
    }
  }
`;

const mockConfirmation = {
  id: 'confirmation-1',
  createdAt: new Date('2026-08-25T12:00:00Z'),
  source: 'PERIODIC_JOB',
  itemId: 'job-1',
  confirmedByUserId: 'user-1',
};

const mockSession = {
  user: {
    id: 'user-1',
  },
};

describe('NotificationConfirmationResolver', () => {
  let app: INestApplication;

  const notificationConfirmationService = {
    getNotificationConfirmations: jest.fn(),
    confirmNotification: jest.fn(),
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
        NotificationConfirmationResolver,
        {
          provide: NotificationConfirmationService,
          useValue: notificationConfirmationService,
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

  test('notificationConfirmations query returns the instance-wide confirmations', async () => {
    notificationConfirmationService.getNotificationConfirmations.mockResolvedValue(
      [mockConfirmation]
    );

    const response = await request(app.getHttpServer())
      .post('')
      .send({ query: notificationConfirmationsQuery })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.notificationConfirmations).toEqual([
      {
        id: 'confirmation-1',
        source: 'PERIODIC_JOB',
        itemId: 'job-1',
        confirmedByUserId: 'user-1',
        createdAt: '2026-08-25T12:00:00.000Z',
      },
    ]);
  });

  test('confirmNotification mutation records the current user', async () => {
    notificationConfirmationService.confirmNotification.mockResolvedValue(
      mockConfirmation
    );

    const response = await request(app.getHttpServer())
      .post('')
      .send({
        query: confirmNotificationMutation,
        variables: {
          source: 'PERIODIC_JOB',
          itemId: 'job-1',
        },
      })
      .expect(200);

    expect(response.body.errors).toBeUndefined();
    expect(
      notificationConfirmationService.confirmNotification
    ).toHaveBeenCalledWith('user-1', 'PERIODIC_JOB', 'job-1');
  });
});
