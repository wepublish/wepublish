import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { DiscountCodeUsageDataloader } from './discount-code-usage.dataloader';

type UsageRow = { discountCodeId: string; paid: boolean };

const usageRows: UsageRow[] = [
  { discountCodeId: 'code-a', paid: true },
  { discountCodeId: 'code-a', paid: true },
  { discountCodeId: 'code-a', paid: false },
  { discountCodeId: 'code-b', paid: false },
];

describe('DiscountCodeUsageDataloader', () => {
  let dataloader: DiscountCodeUsageDataloader;
  let groupBy: jest.Mock;

  beforeEach(async () => {
    groupBy = jest.fn(async ({ where }) => {
      const ids: string[] = where.discountCodeId.in;
      const paidOnly = Boolean(where.invoices);

      return ids
        .map(discountCodeId => ({
          discountCodeId,
          _count: usageRows.filter(
            row =>
              row.discountCodeId === discountCodeId && (!paidOnly || row.paid)
          ).length,
        }))
        .filter(({ _count }) => _count > 0);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountCodeUsageDataloader,
        {
          provide: PrismaClient,
          useValue: { invoiceItem: { groupBy } },
        },
      ],
    }).compile();

    dataloader = await module.resolve<DiscountCodeUsageDataloader>(
      DiscountCodeUsageDataloader
    );
  });

  it('counts all usages and paid usages separately', async () => {
    expect(await dataloader.load('code-a')).toEqual({ total: 3, paid: 2 });
  });

  it('returns zero counts for a code that was never used', async () => {
    expect(await dataloader.load('code-c')).toEqual({ total: 0, paid: 0 });
  });

  it('batches all codes of a request into two aggregations', async () => {
    expect(await dataloader.loadMany(['code-a', 'code-b', 'code-c'])).toEqual([
      { total: 3, paid: 2 },
      { total: 1, paid: 0 },
      { total: 0, paid: 0 },
    ]);

    expect(groupBy).toHaveBeenCalledTimes(2);
  });
});
