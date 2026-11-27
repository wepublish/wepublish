import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { NodeAdapter } from '@nestjs/platform-node';
import { NodeApolloDriver } from '@wepublish/utils/api';
import {
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
} from '@prisma/client';
import { APP_GUARD } from '@nestjs/core';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { OneOfGuard } from '@wepublish/nest-modules';
import {
  CanGetActiveSubscriberFirstNames,
  CanGetSubscription,
  CanGetSubscriptions,
  CanGetUsers,
} from '@wepublish/permissions';
import { PermissionsGuard } from '@wepublish/permissions/api';
import { DashboardSubscriptionResolver } from './dashboard-subscription.resolver';
import { DashboardSubscriptionService } from './dashboard-subscription.service';
import type { Mocked } from 'vitest';

const newSubscribersQuery = `
  query Dashboard($end:DateTime!, $start:DateTime!) {
    newSubscribers(start:$start, end:$end) {
      endsAt
      memberPlan
      monthlyAmount
      renewsAt
      startsAt
      paymentPeriodicity
      reasonForDeactivation
    }
  }
`;

const activeSubscribersQuery = `
  query Dashboard {
    activeSubscribers {
      endsAt
      memberPlan
      monthlyAmount
      renewsAt
      startsAt
      paymentPeriodicity
      reasonForDeactivation
    }
  }
`;

const renewingSubscribersQuery = `
  query Dashboard($end:DateTime!, $start:DateTime!) {
    renewingSubscribers(start:$start, end:$end) {
      memberPlan
      monthlyAmount
      renewsAt
      startsAt
      paymentPeriodicity
      reasonForDeactivation
    }
  }
`;

const newDeactivationsQuery = `
  query Dashboard($end:DateTime!, $start:DateTime!) {
    newDeactivations(start:$start, end:$end) {
      endsAt
      memberPlan
      monthlyAmount
      startsAt
      paymentPeriodicity
      reasonForDeactivation
    }
  }
`;

describe('DashboardSubscriptionResolver', () => {
  let app: INestApplication;
  let dashboardSubscriptionService: Mocked<
    Pick<
      DashboardSubscriptionService,
      | 'newSubscribers'
      | 'activeSubscribers'
      | 'renewingSubscribers'
      | 'newDeactivations'
    >
  >;

  beforeEach(async () => {
    dashboardSubscriptionService = {
      newSubscribers: vi.fn(),
      activeSubscribers: vi.fn(),
      renewingSubscribers: vi.fn(),
      newDeactivations: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: NodeApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
        }),
      ],
      providers: [
        DashboardSubscriptionResolver,
        {
          provide: DashboardSubscriptionService,
          useValue: dashboardSubscriptionService,
        },
      ],
    }).compile();

    app = module.createNestApplication(new NodeAdapter());
    await app.listen(0, '127.0.0.1');
  });

  afterEach(async () => {
    await app.close();
  });

  test('newSubscribers', async () => {
    const mockData = [
      {
        startsAt: new Date('2023-01-01'),
        endsAt: undefined,
        renewsAt: new Date('2023-02-01'),
        monthlyAmount: 50,
        paymentPeriodicity: PaymentPeriodicity.monthly,
        reasonForDeactivation: undefined,
        memberPlan: 'Foo',
      },
      {
        startsAt: new Date('2023-01-02'),
        endsAt: new Date('2023-02-02'),
        renewsAt: undefined,
        monthlyAmount: 50,
        paymentPeriodicity: PaymentPeriodicity.monthly,
        reasonForDeactivation: SubscriptionDeactivationReason.invoiceNotPaid,
        memberPlan: 'Bar',
      },
    ];

    dashboardSubscriptionService.newSubscribers.mockResolvedValue(mockData);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: newSubscribersQuery,
        variables: {
          start: new Date('2023-01-01').toISOString(),
          end: new Date('2023-02-01').toISOString(),
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.newSubscribers).toMatchSnapshot();
        expect(dashboardSubscriptionService.newSubscribers).toHaveBeenCalled();
      });
  });

  test('activeSubscribers', async () => {
    const mockData = [
      {
        startsAt: new Date('2023-01-01'),
        endsAt: undefined,
        renewsAt: new Date('2043-02-01'),
        monthlyAmount: 50,
        paymentPeriodicity: PaymentPeriodicity.monthly,
        reasonForDeactivation: undefined,
        memberPlan: 'Foo',
      },
      {
        startsAt: new Date('2023-02-03'),
        endsAt: undefined,
        renewsAt: undefined,
        monthlyAmount: 500,
        paymentPeriodicity: PaymentPeriodicity.monthly,
        reasonForDeactivation: undefined,
        memberPlan: 'Foo',
      },
    ];

    dashboardSubscriptionService.activeSubscribers.mockResolvedValue(mockData);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: activeSubscribersQuery,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.activeSubscribers).toMatchSnapshot();
        expect(
          dashboardSubscriptionService.activeSubscribers
        ).toHaveBeenCalled();
      });
  });

  test('renewingSubscribers', async () => {
    const mockData = [
      {
        startsAt: new Date('2023-01-01'),
        renewsAt: new Date('2023-01-29'),
        monthlyAmount: 50,
        paymentPeriodicity: PaymentPeriodicity.monthly,
        memberPlan: 'Foo',
      },
      {
        startsAt: new Date('2023-01-01'),
        renewsAt: new Date('2023-02-01'),
        monthlyAmount: 50,
        paymentPeriodicity: PaymentPeriodicity.monthly,
        memberPlan: 'Foo',
      },
    ];

    dashboardSubscriptionService.renewingSubscribers.mockResolvedValue(
      mockData
    );

    await request(app.getHttpServer())
      .post('')
      .send({
        query: renewingSubscribersQuery,
        variables: {
          start: new Date('2023-01-01').toISOString(),
          end: new Date('2023-02-01').toISOString(),
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.renewingSubscribers).toMatchSnapshot();
        expect(
          dashboardSubscriptionService.renewingSubscribers
        ).toHaveBeenCalled();
      });
  });

  test('newDeactivations', async () => {
    const mockData = [
      {
        startsAt: new Date('2023-01-01'),
        endsAt: new Date('2023-02-03'),
        monthlyAmount: 50,
        paymentPeriodicity: PaymentPeriodicity.monthly,
        reasonForDeactivation: SubscriptionDeactivationReason.invoiceNotPaid,
        memberPlan: 'Foo',
      },
    ];

    dashboardSubscriptionService.newDeactivations.mockResolvedValue(mockData);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: newDeactivationsQuery,
        variables: {
          start: new Date('2023-01-01').toISOString(),
          end: new Date('2023-02-01').toISOString(),
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.newDeactivations).toMatchSnapshot();
        expect(
          dashboardSubscriptionService.newDeactivations
        ).toHaveBeenCalled();
      });
  });
});

const activeSubscriberFirstNamesQuery = `
  query ActiveSubscriberFirstNames {
    activeSubscriberFirstNames {
      firstName
      createdAt
    }
  }
`;

const anonymousSubscriberFieldsQuery = `
  query AnonymousSubscriberFields {
    __type(name: "AnonymousSubscriber") {
      fields {
        name
      }
    }
  }
`;

const userWith = (...permissionIDs: string[]) =>
  ({
    type: AuthSessionType.User,
    id: 'session-1',
    user: { id: 'user-1' },
    roles: [{ id: 'reader', permissionIDs }],
  }) as unknown as AuthSession;

const apiKeyWith = (...permissions: string[]): AuthSession => ({
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Supporter wall',
  token: 'secret',
  permissions,
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
});

describe('DashboardSubscriptionResolver.activeSubscriberFirstNames', () => {
  let app: INestApplication;
  let session: AuthSession | undefined;
  const activeSubscriberFirstNames = vi.fn();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: NodeApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: ({ req }: { req: { user?: AuthSession } }) => {
            req.user = session;
            return { req };
          },
        }),
      ],
      providers: [
        DashboardSubscriptionResolver,
        {
          provide: DashboardSubscriptionService,
          useValue: { activeSubscriberFirstNames },
        },
        // The guards as the API registers them: OneOfGuard runs globally and
        // calls whichever guards the operation declared.
        { provide: APP_GUARD, useClass: OneOfGuard },
        PermissionsGuard,
      ],
    }).compile();

    app = module.createNestApplication(new NodeAdapter());
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    session = undefined;
  });

  const expectForbidden = () =>
    request(app.getHttpServer())
      .post('/')
      .send({ query: activeSubscriberFirstNamesQuery })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toBeNull();
        expect(body.errors[0].message).toBe('Forbidden resource');
        expect(activeSubscriberFirstNames).not.toHaveBeenCalled();
      });

  test('is refused without a session', () => expectForbidden());

  test('is refused with the general subscription permissions', () => {
    session = userWith(
      CanGetSubscriptions.id,
      CanGetSubscription.id,
      CanGetUsers.id
    );

    return expectForbidden();
  });

  test.each([
    ['a user whose role', userWith(CanGetActiveSubscriberFirstNames.id)],
    ['an API key that', apiKeyWith(CanGetActiveSubscriberFirstNames.id)],
  ])(
    'serves first names and creation dates to %s has the permission',
    async (_, permittedSession) => {
      session = permittedSession;
      activeSubscriberFirstNames.mockResolvedValue([
        { firstName: 'Anna', createdAt: new Date('2022-12-24T08:00:00.000Z') },
        { firstName: null, createdAt: new Date('2022-11-01T08:00:00.000Z') },
      ]);

      await request(app.getHttpServer())
        .post('/')
        .send({ query: activeSubscriberFirstNamesQuery })
        .expect(200)
        .expect(({ body }) => {
          expect(body.errors).toBeUndefined();
          expect(body.data.activeSubscriberFirstNames).toEqual([
            { firstName: 'Anna', createdAt: '2022-12-24T08:00:00.000Z' },
            { firstName: null, createdAt: '2022-11-01T08:00:00.000Z' },
          ]);
        });
    }
  );

  test('exposes nothing but the first name and the creation date', () =>
    request(app.getHttpServer())
      .post('/')
      .send({ query: anonymousSubscriberFieldsQuery })
      .expect(200)
      .expect(({ body }) => {
        expect(
          body.data.__type.fields.map(({ name }: { name: string }) => name)
        ).toEqual(['firstName', 'createdAt']);
      }));
});
