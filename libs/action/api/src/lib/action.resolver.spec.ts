import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import request from 'supertest';
import { ActionService } from './action.service';
import { ActionResolver } from './action.resolver';
import { UserSession } from '@wepublish/authentication/api';
import { ActionType } from './action.model';
import { Event } from '@wepublish/event/api';
import { EventStatus } from '@prisma/client';

jest.mock('@wepublish/authentication/api', () => ({
  ...jest.requireActual('@wepublish/authentication/api'),
  CurrentUser: jest.fn(() => {
    return (
      data: unknown,
      ctx: ExecutionContext
    ): Pick<UserSession, 'roles'> => {
      return {
        roles: [
          {
            id: '1',
            name: 'Admin',
            description: 'Admin role',
            systemRole: true,
            createdAt: new Date(),
            modifiedAt: new Date(),
            permissionIDs: ['permission-1', 'permission-2'],
          },
        ],
      };
    };
  }),
}));

const actionsQuery = `
  query Actions {
    actions {
      __typename


      ... on EventCreatedAction {
          date
          event {
              id
              name
              location
          }
      }
    }
  }
`;

describe('ActionResolver', () => {
  let app: INestApplication;
  let actionServiceMock: { [method in keyof ActionService]?: jest.Mock };

  beforeEach(async () => {
    actionServiceMock = {
      getActions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
        }),
      ],
      providers: [
        ActionResolver,
        { provide: ActionService, useValue: actionServiceMock },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('Query: actions', async () => {
    const mockResponse = [
      {
        id: '1',
        date: new Date('2023-01-02T00:00:00Z'),
        actionType: ActionType.EventCreated,
        event: {
          id: '1',
          name: 'Event name',
          modifiedAt: new Date('2023-01-02T00:00:00Z'),
          startsAt: new Date('2023-01-02T00:00:00Z'),
          status: EventStatus.Scheduled,
          createdAt: new Date('2023-01-02T00:00:00Z'),
        } as Event,
      },
    ];
    actionServiceMock.getActions?.mockResolvedValue(mockResponse);

    await request(app.getHttpServer())
      .post('/')
      .send({
        query: actionsQuery,
      })
      .expect(res => {
        expect(res.body).toMatchSnapshot();
      })
      .expect(200);
  });
});
