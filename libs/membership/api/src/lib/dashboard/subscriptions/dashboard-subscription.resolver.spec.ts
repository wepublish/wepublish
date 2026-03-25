import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import {
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
} from '@prisma/client';
import { DashboardSubscriptionResolver } from './dashboard-subscription.resolver';
import { DashboardSubscriptionService } from './dashboard-subscription.service';

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
  let dashboardSubscriptionService: jest.Mocked<
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
      newSubscribers: jest.fn(),
      activeSubscribers: jest.fn(),
      renewingSubscribers: jest.fn(),
      newDeactivations: jest.fn(),
    };

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
        DashboardSubscriptionResolver,
        {
          provide: DashboardSubscriptionService,
          useValue: dashboardSubscriptionService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
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
