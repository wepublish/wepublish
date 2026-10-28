import { CanCreateUser } from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { PaymentsResolver } from './payments.resolver';
import { PaymentsService } from './payments.service';

describe('PaymentsResolver', () => {
  describe('setPaymentProviderCustomers', () => {
    const args = {
      paymentProviderId: 'bexio',
      customers: [{ userId: 'user-1', customerId: '542' }],
    };

    it('stores the customers with the service', async () => {
      const service = {
        setPaymentProviderCustomers: vi.fn().mockResolvedValue(1),
      };
      const resolver = new PaymentsResolver(
        service as unknown as PaymentsService
      );

      await expect(resolver.setPaymentProviderCustomers(args)).resolves.toBe(1);
      expect(service.setPaymentProviderCustomers).toHaveBeenCalledWith(args);
    });

    // it changes how a user's renewals are charged or invoiced
    it('needs the permission to edit users', () => {
      expect(
        Reflect.getMetadata(
          PERMISSIONS_METADATA_KEY,
          PaymentsResolver.prototype.setPaymentProviderCustomers
        )
      ).toEqual([CanCreateUser]);
    });
  });
});
