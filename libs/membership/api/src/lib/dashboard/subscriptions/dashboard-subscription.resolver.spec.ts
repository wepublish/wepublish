import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { PrismaClient, Prisma, Subscription, Currency } from '@prisma/client';
import { PrismaModule } from '@wepublish/nest-modules';
import { DashboardSubscriptionResolver } from './dashboard-subscription.resolver';
import { DashboardSubscriptionService } from './dashboard-subscription.service';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
      cache: 'bounded',
    }),
    PrismaModule,
  ],
  providers: [DashboardSubscriptionResolver, DashboardSubscriptionService],
})
export class AppModule {}

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
  let subscriptionsToDelete: Subscription[] = [];
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    subscriptionsToDelete = [];
  });

  afterEach(async () => {
    const ids = subscriptionsToDelete.map(sub => sub.id);

    await prisma.subscription.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  test('newSubscribers', async () => {
    const paymentMethod = {
      active: true,
      description: '',
      name: '',
      paymentProviderID: '',
      slug: '',
    };

    const mockData: Prisma.SubscriptionCreateInput[] = [
      {
        currency: Currency.CHF,
        autoRenew: true,
        monthlyAmount: 50,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-01'),
        paidUntil: new Date('2023-02-01'),
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connectOrCreate: {
            where: {
              slug: 'foo',
            },
            create: {
              active: true,
              amountPerMonthMin: 10,
              name: 'Foo',
              slug: 'foo',
              description: [],
              currency: Currency.CHF,
            },
          },
        },
        user: {
          connectOrCreate: {
            where: { email: 'foo@wepublish.ch' },
            create: {
              active: true,
              email: 'foo@wepublish.ch',
              name: 'Foo',
              password: '',
            },
          },
        },
      },
      {
        currency: Currency.CHF,
        autoRenew: false,
        monthlyAmount: 50,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-02'),
        paidUntil: new Date('2023-02-01'),
        deactivation: {
          create: {
            date: new Date('2023-02-02'),
            reason: 'invoiceNotPaid',
          },
        },
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connectOrCreate: {
            where: {
              slug: 'bar',
            },
            create: {
              active: true,
              amountPerMonthMin: 10,
              name: 'Bar',
              slug: 'bar',
              description: [],
              currency: Currency.CHF,
            },
          },
        },
        user: {
          connect: {
            email: 'foo@wepublish.ch',
          },
        },
      },
      {
        currency: Currency.CHF,
        autoRenew: false,
        monthlyAmount: 500,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-02-01'),
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connect: {
            slug: 'foo',
          },
        },
        user: {
          connect: {
            email: 'foo@wepublish.ch',
          },
        },
      },
    ];

    for (const data of mockData) {
      subscriptionsToDelete.push(await prisma.subscription.create({ data }));
    }

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
      });
  });

  test('activeSubscribers', async () => {
    const paymentMethod = {
      active: true,
      description: '',
      name: '',
      paymentProviderID: '',
      slug: '',
    };

    const mockData: Prisma.SubscriptionCreateInput[] = [
      {
        currency: Currency.CHF,
        autoRenew: true,
        monthlyAmount: 50,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-01'),
        paidUntil: new Date('2043-02-01'),
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connectOrCreate: {
            where: {
              slug: 'foo',
            },
            create: {
              active: true,
              amountPerMonthMin: 10,
              name: 'Foo',
              slug: 'foo',
              description: [],
              currency: Currency.CHF,
            },
          },
        },
        user: {
          connectOrCreate: {
            where: { email: 'foo@wepublish.ch' },
            create: {
              active: true,
              email: 'foo@wepublish.ch',
              name: 'Foo',
              password: '',
            },
          },
        },
      },
      {
        currency: Currency.CHF,
        autoRenew: true,
        monthlyAmount: 50,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-01'),
        paidUntil: new Date('2023-02-01'),
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connect: {
            slug: 'foo',
          },
        },
        user: {
          connect: {
            email: 'foo@wepublish.ch',
          },
        },
      },
      {
        currency: Currency.CHF,
        autoRenew: false,
        monthlyAmount: 50,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-01'),
        paidUntil: new Date('2023-02-02'),
        deactivation: {
          create: {
            date: new Date('2023-02-03'),
            reason: 'invoiceNotPaid',
          },
        },
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connectOrCreate: {
            where: {
              slug: 'bar',
            },
            create: {
              active: true,
              amountPerMonthMin: 10,
              name: 'Bar',
              slug: 'bar',
              description: [],
              currency: Currency.CHF,
            },
          },
        },
        user: {
          connect: {
            email: 'foo@wepublish.ch',
          },
        },
      },
      {
        currency: Currency.CHF,
        autoRenew: false,
        monthlyAmount: 500,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-02-03'),
        paidUntil: new Date('2043-02-01'),
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connect: {
            slug: 'foo',
          },
        },
        user: {
          connect: {
            email: 'foo@wepublish.ch',
          },
        },
      },
    ];

    for (const data of mockData) {
      subscriptionsToDelete.push(await prisma.subscription.create({ data }));
    }

    await request(app.getHttpServer())
      .post('')
      .send({
        query: activeSubscribersQuery,
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.activeSubscribers).toMatchSnapshot();
      });
  });

  test('renewingSubscribers', async () => {
    const paymentMethod = {
      active: true,
      description: '',
      name: '',
      paymentProviderID: '',
      slug: '',
    };

    const mockData: Prisma.SubscriptionCreateInput[] = [
      {
        currency: Currency.CHF,
        autoRenew: true,
        monthlyAmount: 50,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-01'),
        paidUntil: new Date('2023-01-29'),
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connectOrCreate: {
            where: {
              slug: 'foo',
            },
            create: {
              active: true,
              amountPerMonthMin: 10,
              name: 'Foo',
              slug: 'foo',
              description: [],
              currency: Currency.CHF,
            },
          },
        },
        user: {
          connectOrCreate: {
            where: { email: 'foo@wepublish.ch' },
            create: {
              active: true,
              email: 'foo@wepublish.ch',
              name: 'Foo',
              password: '',
            },
          },
        },
      },
      {
        currency: Currency.CHF,
        autoRenew: true,
        monthlyAmount: 50,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-01'),
        paidUntil: new Date('2023-02-01'),
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connect: {
            slug: 'foo',
          },
        },
        user: {
          connect: {
            email: 'foo@wepublish.ch',
          },
        },
      },
      {
        currency: Currency.CHF,
        autoRenew: true,
        monthlyAmount: 50,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-01'),
        paidUntil: new Date('2023-01-02'),
        deactivation: {
          create: {
            date: new Date('2023-02-03'),
            reason: 'invoiceNotPaid',
          },
        },
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connectOrCreate: {
            where: {
              slug: 'bar',
            },
            create: {
              active: true,
              amountPerMonthMin: 10,
              name: 'Bar',
              slug: 'bar',
              description: [],
              currency: Currency.CHF,
            },
          },
        },
        user: {
          connect: {
            email: 'foo@wepublish.ch',
          },
        },
      },
      {
        currency: Currency.CHF,
        autoRenew: false,
        monthlyAmount: 500,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-01'),
        paidUntil: new Date('2023-01-28'),
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connect: {
            slug: 'foo',
          },
        },
        user: {
          connect: {
            email: 'foo@wepublish.ch',
          },
        },
      },
    ];

    for (const data of mockData) {
      subscriptionsToDelete.push(await prisma.subscription.create({ data }));
    }

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
      });
  });

  test('newDeactivations', async () => {
    const paymentMethod = {
      active: true,
      description: '',
      name: '',
      paymentProviderID: '',
      slug: '',
    };

    const mockData: Prisma.SubscriptionCreateInput[] = [
      {
        currency: Currency.CHF,
        autoRenew: true,
        monthlyAmount: 50,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-01'),
        paidUntil: new Date('2023-02-01'),
        deactivation: {
          create: {
            createdAt: new Date('2023-01-01'),
            date: new Date('2023-02-03'),
            reason: 'invoiceNotPaid',
          },
        },
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connectOrCreate: {
            where: {
              slug: 'foo',
            },
            create: {
              active: true,
              amountPerMonthMin: 10,
              name: 'Foo',
              slug: 'foo',
              description: [],
              currency: Currency.CHF,
            },
          },
        },
        user: {
          connectOrCreate: {
            where: { email: 'foo@wepublish.ch' },
            create: {
              active: true,
              email: 'foo@wepublish.ch',
              name: 'Foo',
              password: '',
            },
          },
        },
      },
      {
        currency: Currency.CHF,
        autoRenew: true,
        monthlyAmount: 50,
        paymentPeriodicity: 'monthly',
        startsAt: new Date('2023-01-01'),
        paidUntil: new Date('2023-02-01'),
        deactivation: {
          create: {
            createdAt: new Date('2023-02-01'),
            date: new Date('2023-02-03'),
            reason: 'invoiceNotPaid',
          },
        },
        paymentMethod: {
          create: paymentMethod,
        },
        memberPlan: {
          connect: {
            slug: 'foo',
          },
        },
        user: {
          connect: {
            email: 'foo@wepublish.ch',
          },
        },
      },
    ];

    for (const data of mockData) {
      subscriptionsToDelete.push(await prisma.subscription.create({ data }));
    }

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
      });
  });
});
