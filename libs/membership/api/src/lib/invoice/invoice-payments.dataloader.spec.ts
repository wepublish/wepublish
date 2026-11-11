import { PrismaClient } from '@prisma/client';
import { InvoicePaymentsDataloader } from './invoice-payments.dataloader';

describe('InvoicePaymentsDataloader', () => {
  const payment = (id: string, invoiceID: string, createdAt: string) => ({
    id,
    invoiceID,
    createdAt: new Date(createdAt),
  });

  it("loads each invoice's payments in one query, oldest first", async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([
        payment('p1', 'inv-1', '2026-10-01'),
        payment('p3', 'inv-2', '2026-10-05'),
        payment('p2', 'inv-1', '2026-10-03'),
      ]);
    const loader = new InvoicePaymentsDataloader({
      payment: { findMany },
    } as unknown as PrismaClient);

    const [first, second] = await Promise.all([
      loader.load('inv-1'),
      loader.load('inv-2'),
    ]);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { invoiceID: { in: ['inv-1', 'inv-2'] } },
      orderBy: { createdAt: 'asc' },
    });
    expect(first?.map(p => p.id)).toEqual(['p1', 'p2']);
    expect(second?.map(p => p.id)).toEqual(['p3']);
  });

  // invoices imported from another system were paid there, without a payment
  it('gives an invoice without payments an empty list', async () => {
    const loader = new InvoicePaymentsDataloader({
      payment: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as PrismaClient);

    await expect(loader.load('imported')).resolves.toEqual([]);
  });
});
