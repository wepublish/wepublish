import { PaymentMethodService } from './payment-method.service';

describe('PaymentMethodService cache', () => {
  const publicContentCache = { invalidate: jest.fn() };
  const paymentMethod = { id: 'method-1' };
  const service = Object.assign(
    new PaymentMethodService(
      {
        paymentMethod: {
          create: jest.fn().mockResolvedValue(paymentMethod),
          update: jest.fn().mockResolvedValue(paymentMethod),
          delete: jest.fn().mockResolvedValue(paymentMethod),
        },
      } as any,
      publicContentCache as any
    ),
    { __DATALOADER__PaymentMethodDataloader: { prime: jest.fn() } }
  );

  beforeEach(() => {
    publicContentCache.invalidate.mockReset().mockResolvedValue(undefined);
  });

  it.each<[string, () => Promise<unknown>]>([
    ['creating', () => service.createPaymentMethod({ name: 'Card' } as any)],
    ['updating', () => service.updatePaymentMethod({ id: 'method-1' } as any)],
    ['deleting', () => service.deletePaymentMethod('method-1')],
  ])(
    'clears cached answers after %s a payment method, member plans show them',
    async (_, change) => {
      await change();

      expect(publicContentCache.invalidate).toHaveBeenCalled();
    }
  );
});
