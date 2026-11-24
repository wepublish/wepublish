import { PaymentPeriodicity } from '@prisma/client';
import { UserSession } from '@wepublish/authentication/api';
import { PeriodicitySwitchResolver } from './periodicity-switch.resolver';
import { PeriodicitySwitchService } from './periodicity-switch.service';

const session = { user: { id: 'user-1' } } as UserSession;

describe('PeriodicitySwitchResolver', () => {
  let service: {
    switchPeriodicity: ReturnType<typeof vi.fn>;
    switchablePeriodicities: ReturnType<typeof vi.fn>;
  };
  let resolver: PeriodicitySwitchResolver;

  beforeEach(() => {
    service = {
      switchPeriodicity: vi.fn().mockResolvedValue({ id: 'sub-1' }),
      switchablePeriodicities: vi
        .fn()
        .mockResolvedValue([PaymentPeriodicity.yearly]),
    };
    resolver = new PeriodicitySwitchResolver(
      service as unknown as PeriodicitySwitchService
    );
  });

  it('switches a subscription of the signed-in user', async () => {
    await expect(
      resolver.switchUserSubscriptionPeriodicity(
        'sub-1',
        PaymentPeriodicity.yearly,
        session
      )
    ).resolves.toEqual({ id: 'sub-1' });
    expect(service.switchPeriodicity).toHaveBeenCalledWith({
      userId: 'user-1',
      subscriptionId: 'sub-1',
      paymentPeriodicity: PaymentPeriodicity.yearly,
    });
  });

  it('resolves the periodicities a subscription can switch to', async () => {
    await expect(
      resolver.switchablePeriodicities({ id: 'sub-1' } as never)
    ).resolves.toEqual([PaymentPeriodicity.yearly]);
    expect(service.switchablePeriodicities).toHaveBeenCalledWith('sub-1');
  });
});
