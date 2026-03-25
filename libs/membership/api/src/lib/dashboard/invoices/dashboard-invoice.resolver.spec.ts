import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { DashboardInvoiceResolver } from './dashboard-invoice.resolver';
import { DashboardInvoiceService } from './dashboard-invoice.service';

describe('DashboardInvoiceResolver', () => {
  let app: INestApplication;
  let dashboardInvoiceService: jest.Mocked<
    Pick<DashboardInvoiceService, 'revenue' | 'expectedRevenue'>
  >;

  beforeEach(async () => {
    dashboardInvoiceService = {
      revenue: jest.fn(),
      expectedRevenue: jest.fn(),
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
        DashboardInvoiceResolver,
        {
          provide: DashboardInvoiceService,
          useValue: dashboardInvoiceService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  test('revenue', async () => {
    const mockRevenue = [
      {
        amount: 1050,
        dueAt: new Date('2023-01-01T12:00:00.000Z'),
        paidAt: new Date('2023-01-01T12:00:00.000Z'),
        memberPlan: 'Foo',
      },
      {
        amount: 50,
        dueAt: new Date('2023-01-01T12:00:00.000Z'),
        paidAt: new Date('2023-01-02T12:00:00.000Z'),
        memberPlan: 'Bar',
      },
    ];

    dashboardInvoiceService.revenue.mockResolvedValue(mockRevenue);

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `
          query Dashboard($end:DateTime!, $start:DateTime!) {
            revenue(start:$start, end:$end) {
              amount
              dueAt
              memberPlan
              paidAt
            }
          }
        `,
        variables: {
          start: new Date('2023-01-01').toISOString(),
          end: new Date('2023-02-01').toISOString(),
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.revenue).toMatchSnapshot();
        expect(dashboardInvoiceService.revenue).toHaveBeenCalled();
      });
  });

  test('expectedRevenue', async () => {
    const mockExpectedRevenue = [
      {
        amount: 1050,
        dueAt: new Date('2023-01-01T12:00:00.000Z'),
        paidAt: new Date('2023-01-01T12:00:00.000Z'),
        memberPlan: 'Foo',
      },
      {
        amount: 50,
        dueAt: new Date('2023-01-02T12:00:00.000Z'),
        paidAt: undefined,
        memberPlan: 'Bar',
      },
    ];

    dashboardInvoiceService.expectedRevenue.mockResolvedValue(
      mockExpectedRevenue
    );

    await request(app.getHttpServer())
      .post('')
      .send({
        query: `
          query Dashboard($end:DateTime!, $start:DateTime!) {
            expectedRevenue(start:$start, end:$end) {
              amount
              dueAt
              memberPlan
              paidAt
            }
          }
        `,
        variables: {
          start: new Date('2023-01-01').toISOString(),
          end: new Date('2023-02-01').toISOString(),
        },
      })
      .expect(200)
      .expect(res => {
        expect(res.body.data.expectedRevenue).toMatchSnapshot();
        expect(dashboardInvoiceService.expectedRevenue).toHaveBeenCalled();
      });
  });
});
