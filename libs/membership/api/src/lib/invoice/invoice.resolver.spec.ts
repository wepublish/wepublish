import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { CanGetInvoice } from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { InvoicePaymentsDataloader } from './invoice-payments.dataloader';
import { InvoiceResolver } from './invoice.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'e2e',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('InvoiceResolver', () => {
  describe('called with an api key', () => {
    const setup = () => {
      const service = {
        markInvoiceAsPaid: vi.fn(async () => ({ id: 'inv-1' })),
        getUserInvoices: vi.fn(),
        checkInvoiceStatus: vi.fn(),
      };
      const resolver = new InvoiceResolver(
        service as any,
        null as any,
        null as any,
        null as any,
        null as any
      );

      return { resolver, service };
    };

    it('marks an invoice as paid on behalf of the key‘s creator', async () => {
      const { resolver, service } = setup();

      await resolver.markInvoiceAsPaid('inv-1', apiKey, false);

      expect(service.markInvoiceAsPaid).toHaveBeenCalledWith(
        'inv-1',
        { userId: 'creator-1', apiTokenId: 'key-1' },
        false
      );
    });

    it('has no invoices of its own', async () => {
      const { resolver, service } = setup();

      await expect(resolver.userInvoices(apiKey)).rejects.toThrow(
        ForbiddenException
      );
      await expect(
        resolver.checkInvoiceStatus('inv-1', apiKey)
      ).rejects.toThrow(ForbiddenException);
      expect(service.getUserInvoices).not.toHaveBeenCalled();
    });
  });

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
