import { PrismaClient } from '@prisma/client';
import { InvoiceDataloader } from '../invoice/invoice.dataloader';
import { SubscriptionPeriodResolver } from './subscription-period.resolver';

const makeResolver = (prisma: unknown) => {
  const dataloader = new InvoiceDataloader(prisma as PrismaClient);

  return new SubscriptionPeriodResolver(dataloader);
};

describe('SubscriptionPeriodResolver', () => {
  describe('isPaid', () => {
    it('reports whether the period invoice is paid', async () => {
      const prisma = {
        invoice: {
          findMany: jest.fn(async () => [
            { id: 'paid-invoice', paidAt: new Date() },
            { id: 'open-invoice', paidAt: null },
          ]),
        },
      };
      const resolver = makeResolver(prisma);

      const [paid, open] = await Promise.all([
        resolver.isPaid({ invoiceID: 'paid-invoice' } as any),
        resolver.isPaid({ invoiceID: 'open-invoice' } as any),
      ]);

      expect(paid).toBe(true);
      expect(open).toBe(false);
    });

    // Regression: `isPaid` resolves once per period, so a subscription with a
    // long history used to issue one invoice query per period. The user detail
    // view resolves this for every period of every subscription at once.
    it('batches the invoice lookups across periods', async () => {
      const periods = Array.from({ length: 30 }, (_unused, index) => ({
        invoiceID: `invoice-${index}`,
      }));
      const prisma = {
        invoice: {
          findMany: jest.fn(async () =>
            periods.map(period => ({
              id: period.invoiceID,
              paidAt: new Date(),
            }))
          ),
        },
      };
      const resolver = makeResolver(prisma);

      const results = await Promise.all(
        periods.map(period => resolver.isPaid(period as any))
      );

      expect(results).toHaveLength(30);
      expect(results.every(Boolean)).toBe(true);
      expect(prisma.invoice.findMany).toHaveBeenCalledTimes(1);
    });

    it('reports false when the period has no invoice', async () => {
      const prisma = {
        invoice: { findMany: jest.fn(async () => []) },
      };

      const result = await makeResolver(prisma).isPaid({
        invoiceID: 'missing-invoice',
      } as any);

      expect(result).toBe(false);
    });
  });
});
