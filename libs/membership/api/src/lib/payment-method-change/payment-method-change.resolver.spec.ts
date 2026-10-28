import { UserSession } from '@wepublish/authentication/api';
import { PaymentMethodChangeResolver } from './payment-method-change.resolver';
import { PaymentMethodChangeService } from './payment-method-change.service';

const session = { user: { id: 'user-1' } } as UserSession;

describe('PaymentMethodChangeResolver', () => {
  let service: {
    start: ReturnType<typeof vi.fn>;
    check: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
  };
  let resolver: PaymentMethodChangeResolver;

  beforeEach(() => {
    service = {
      start: vi.fn().mockResolvedValue({ change: { id: 'change-1' } }),
      check: vi.fn().mockResolvedValue({ id: 'change-1' }),
      cancel: vi.fn().mockResolvedValue({ id: 'change-1' }),
    };
    resolver = new PaymentMethodChangeResolver(
      service as unknown as PaymentMethodChangeService
    );
  });

  it('starts a change for the signed-in user', async () => {
    const args = {
      subscriptionId: 'sub-1',
      paymentMethodId: 'pm-1',
      successURL: 'https://site.example.com/profile',
      failureURL: 'https://site.example.com/profile',
    };

    await expect(
      resolver.changeSubscriptionPaymentMethod(args, session)
    ).resolves.toEqual({ change: { id: 'change-1' } });
    expect(service.start).toHaveBeenCalledWith('user-1', args);
  });

  it('checks a change of the signed-in user', async () => {
    await expect(
      resolver.checkSubscriptionPaymentMethodChange('change-1', session)
    ).resolves.toEqual({ id: 'change-1' });
    expect(service.check).toHaveBeenCalledWith('user-1', 'change-1');
  });

  it('cancels a change of the signed-in user', async () => {
    await expect(
      resolver.cancelSubscriptionPaymentMethodChange('change-1', session)
    ).resolves.toEqual({ id: 'change-1' });
    expect(service.cancel).toHaveBeenCalledWith('user-1', 'change-1');
  });
});
