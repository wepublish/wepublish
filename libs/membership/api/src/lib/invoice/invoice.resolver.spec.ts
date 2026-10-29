import { CanGetInvoice } from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { InvoicePaymentsDataloader } from './invoice-payments.dataloader';
import { InvoiceResolver } from './invoice.resolver';

describe('InvoiceResolver', () => {
  describe('payments', () => {
    it("resolves the invoice's payments through the dataloader", async () => {
      const paymentsDataloader = {
        load: vi.fn().mockResolvedValue([{ id: 'p1' }]),
      };
      const resolver = new InvoiceResolver(
        null as any,
        null as any,
        null as any,
        null as any,
        paymentsDataloader as unknown as InvoicePaymentsDataloader
      );

      await expect(resolver.payments({ id: 'inv-1' } as any)).resolves.toEqual([
        { id: 'p1' },
      ]);
      expect(paymentsDataloader.load).toHaveBeenCalledWith('inv-1');
    });

    // readers load their own invoices too; payments are for the editor
    it('needs the permission to read invoices', () => {
      expect(
        Reflect.getMetadata(
          PERMISSIONS_METADATA_KEY,
          InvoiceResolver.prototype.payments
        )
      ).toEqual([CanGetInvoice]);
    });
  });
});
