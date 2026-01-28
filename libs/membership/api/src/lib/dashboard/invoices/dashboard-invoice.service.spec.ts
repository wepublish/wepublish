import { Test, TestingModule } from '@nestjs/testing';
import { DashboardInvoiceService } from './dashboard-invoice.service';
import { PrismaModule } from '@wepublish/nest-modules';
import { PrismaClient } from '@prisma/client';

describe('DashboardInvoiceService', () => {
  let service: DashboardInvoiceService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [DashboardInvoiceService],
    }).compile();

    prisma = module.get<PrismaClient>(PrismaClient);
    service = module.get<DashboardInvoiceService>(DashboardInvoiceService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('should get the revenue of a month', async () => {
    const mockValue = Promise.resolve([
      {
        id: 'cld33096g0486tnpxz8espm6e',
        createdAt: '2023-01-19T12:41:05.656Z',
        modifiedAt: '2023-01-19T12:48:13.261Z',
        dueAt: '2023-01-19T12:41:05.640Z',
        paidAt: '2023-01-19T12:48:13.188Z',
        canceledAt: null,
        subscriptionID: 'cld33094l0464tnpx010w5lt6',
        items: [
          {
            quantity: 1,
            amount: 50,
          },
          {
            quantity: 2,
            amount: 50,
          },
        ],
        subscription: { memberPlan: { name: 'Foo Subscription' } },
      },
      {
        id: 'cld32r1kb0225qppx8ptpwukz',
        createdAt: '2023-01-19T12:33:55.883Z',
        modifiedAt: '2023-01-19T12:34:02.015Z',
        dueAt: '2023-01-19T12:33:55.859Z',
        paidAt: '2023-01-19T12:34:01.944Z',
        canceledAt: null,
        manuallySetAsPaidByUserId: 'cld2zv5hl0096hkpx2hayynif',
        items: [
          {
            quantity: 1,
            amount: 100,
          },
          {
            quantity: 2,
            amount: 50,
          },
        ],
        subscription: { memberPlan: { name: 'Foo Subscription' } },
      },
    ]);
    const start = new Date('2023-01-01');
    const end = new Date('2023-02-01');
    const mockFunction = jest
      .spyOn(prisma.invoice, 'findMany')
      .mockReturnValue(mockValue as any);

    const result = await service.revenue(start, end);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });

  test('should get the expected revenue of a month', async () => {
    const mockValue = Promise.resolve([
      {
        dueAt: '2023-01-19T12:27:23.265Z',
        paidAt: null,
        canceledAt: '2023-01-19T12:27:46.690Z',
        items: [
          {
            quantity: 1,
            amount: 50,
          },
          {
            quantity: 2,
            amount: 50,
          },
        ],
        subscription: { memberPlan: { name: 'Foo Subscription' } },
      },
      {
        dueAt: '2023-01-19T12:33:55.859Z',
        paidAt: '2023-01-19T12:34:01.944Z',
        canceledAt: null,
        items: [
          {
            quantity: 1,
            amount: 100,
          },
          {
            quantity: 2,
            amount: 50,
          },
        ],
        subscription: { memberPlan: { name: 'Foo Subscription' } },
      },
      {
        id: 'cld33096g0486tnpxz8espm6e',
        createdAt: '2023-01-19T12:41:05.656Z',
        modifiedAt: '2023-01-19T12:48:13.261Z',
        mail: 'foo@wepublish.ch',
        dueAt: '2023-01-19T12:41:05.640Z',
        description: 'Membership from 2023-01-19T12:41:05.640Z for Merkli',
        paidAt: '2023-01-19T12:48:13.188Z',
        canceledAt: null,
        manuallySetAsPaidByUserId: 'cld2zv5hl0096hkpx2hayynif',
        items: [
          {
            quantity: 1,
            amount: 500,
          },
          {
            quantity: 2,
            amount: 250,
          },
        ],
        subscription: { memberPlan: { name: 'Foo Subscription' } },
      },
    ]);
    const start = new Date('2023-01-01');
    const end = new Date('2023-02-01');
    const mockFunction = jest
      .spyOn(prisma.invoice, 'findMany')
      .mockReturnValue(mockValue as any);

    const result = await service.expectedRevenue(start, end);
    expect(result).toMatchSnapshot();
    expect(mockFunction.mock.calls[0][0]).toMatchSnapshot();
  });
});
