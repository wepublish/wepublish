import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { Currency, Invoice, PrismaClient } from '@prisma/client';
import { PrismaModule } from '@wepublish/nest-modules';
import { DashboardInvoiceResolver } from './dashboard-invoice.resolver';
import { DashboardInvoiceService } from './dashboard-invoice.service';

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
  providers: [DashboardInvoiceResolver, DashboardInvoiceService],
})
export class AppModule {}

const revenueQuery = `
  query Dashboard($end:DateTime!, $start:DateTime!) {
    revenue(start:$start, end:$end) {
      amount
      dueAt
      memberPlan
      paidAt
    }
  }
`;

const expectedRevenueQuery = `
  query Dashboard($end:DateTime!, $start:DateTime!) {
    expectedRevenue(start:$start, end:$end) {
      amount
      dueAt
      memberPlan
      paidAt
    }
  }
`;

describe('DashboardInvoiceResolver', () => {
  let invoicesToDelete: Invoice[] = [];
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
    invoicesToDelete = [];
  });

  afterEach(async () => {
    const ids = invoicesToDelete.map(invoice => invoice.id);

    await prisma.invoice.deleteMany({
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

  test('revenue', async () => {
    const mockData = [
      {
        currency: Currency.CHF,
        dueAt: new Date('2023-01-01 12:00:00'),
        paidAt: new Date('2023-01-01 12:00:00'),
        scheduledDeactivationAt: new Date('2023-01-07 12:00:00'),
        mail: 'foo@wepublish.ch',
        items: {
          createMany: {
            data: [
              {
                amount: 50,
                name: '',
                quantity: 1,
              },
              {
                amount: 500,
                name: '',
                quantity: 2,
              },
            ],
          },
        },
      },
      {
        currency: Currency.CHF,
        dueAt: new Date('2023-01-01 12:00:00'),
        paidAt: new Date('2023-01-02 12:00:00'),
        scheduledDeactivationAt: new Date('2023-01-07 12:00:00'),
        mail: 'foo@wepublish.ch',
        items: {
          createMany: {
            data: [
              {
                amount: 50,
                name: '',
                quantity: 1,
              },
            ],
          },
        },
      },
      {
        currency: Currency.CHF,
        dueAt: new Date('2023-01-01 12:00:00'),
        paidAt: new Date('2023-02-01 12:00:00'),
        scheduledDeactivationAt: new Date('2023-01-07 12:00:00'),
        mail: 'foo@wepublish.ch',
        items: {
          createMany: {
            data: [
              {
                amount: 50,
                name: '',
                quantity: 1,
              },
            ],
          },
        },
      },
      {
        currency: Currency.CHF,
        dueAt: new Date('2023-01-01 12:00:00'),
        paidAt: new Date('2023-01-01 12:00:00'),
        scheduledDeactivationAt: new Date('2023-01-07 12:00:00'),
        mail: 'foo@wepublish.ch',
        manuallySetAsPaidByUserId: '123',
        items: {
          createMany: {
            data: [
              {
                amount: 50,
                name: '',
                quantity: 1,
              },
            ],
          },
        },
      },
      {
        currency: Currency.CHF,
        dueAt: new Date('2023-01-01 12:00:00'),
        scheduledDeactivationAt: new Date('2023-01-07 12:00:00'),
        mail: 'foo@wepublish.ch',
        items: {
          createMany: {
            data: [
              {
                amount: 50,
                name: '',
                quantity: 1,
              },
            ],
          },
        },
      },
    ];

    for (const data of mockData) {
      invoicesToDelete.push(await prisma.invoice.create({ data }));
    }

    await request(app.getHttpServer())
      .post('')
      .send({
        query: revenueQuery,
        variables: {
          start: new Date('2023-01-01').toISOString(),
          end: new Date('2023-02-01').toISOString(),
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.revenue).toMatchSnapshot();
      });
  });

  test('expectedRevenue', async () => {
    const mockData = [
      {
        currency: Currency.CHF,
        dueAt: new Date('2023-01-01 12:00:00'),
        paidAt: new Date('2023-01-01 12:00:00'),
        scheduledDeactivationAt: new Date('2023-01-07 12:00:00'),
        mail: 'foo@wepublish.ch',
        items: {
          createMany: {
            data: [
              {
                amount: 50,
                name: '',
                quantity: 1,
              },
              {
                amount: 500,
                name: '',
                quantity: 2,
              },
            ],
          },
        },
      },
      {
        currency: Currency.CHF,
        dueAt: new Date('2023-01-02 12:00:00'),
        scheduledDeactivationAt: new Date('2023-01-07 12:00:00'),
        mail: 'foo@wepublish.ch',
        items: {
          createMany: {
            data: [
              {
                amount: 50,
                name: '',
                quantity: 1,
              },
            ],
          },
        },
      },
      {
        currency: Currency.CHF,
        dueAt: new Date('2023-02-01 12:00:00'),
        scheduledDeactivationAt: new Date('2023-01-07 12:00:00'),
        mail: 'foo@wepublish.ch',
        items: {
          createMany: {
            data: [
              {
                amount: 50,
                name: '',
                quantity: 1,
              },
            ],
          },
        },
      },
      {
        currency: Currency.CHF,
        dueAt: new Date('2023-01-01 12:00:00'),
        scheduledDeactivationAt: new Date('2023-01-07 12:00:00'),
        mail: 'foo@wepublish.ch',
        manuallySetAsPaidByUserId: '123',
        items: {
          createMany: {
            data: [
              {
                amount: 50,
                name: '',
                quantity: 1,
              },
            ],
          },
        },
      },
      {
        currency: Currency.CHF,
        dueAt: new Date('2023-01-01 12:00:00'),
        mail: 'foo@wepublish.ch',
        canceledAt: new Date('2023-01-01 11:00:00'),
        scheduledDeactivationAt: new Date('2023-01-07 12:00:00'),
        items: {
          createMany: {
            data: [
              {
                amount: 50,
                name: '',
                quantity: 1,
              },
            ],
          },
        },
      },
    ];

    for (const data of mockData) {
      invoicesToDelete.push(await prisma.invoice.create({ data }));
    }

    await request(app.getHttpServer())
      .post('')
      .send({
        query: expectedRevenueQuery,
        variables: {
          start: new Date('2023-01-01').toISOString(),
          end: new Date('2023-02-01').toISOString(),
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.expectedRevenue).toMatchSnapshot();
      });
  });
});
