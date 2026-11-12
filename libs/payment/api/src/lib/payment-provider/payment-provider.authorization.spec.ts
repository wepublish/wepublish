import { Currency, PrismaClient } from '@prisma/client';
import {
  type NamespacedCache,
  type NamespaceResets,
} from '@wepublish/kv-ttl-cache/api';
import {
  BasePaymentProvider,
  PaymentProviderProps,
  WebhookResponse,
} from './payment-provider';

/** A provider that keeps every default of the base class. */
class PlainPaymentProvider extends BasePaymentProvider {
  constructor(props: PaymentProviderProps) {
    super(props);
  }

  async webhookForPaymentIntent(): Promise<WebhookResponse> {
    return { status: 200 };
  }

  async createIntent(): Promise<never> {
    throw new Error('not used');
  }

  async checkIntentStatus() {
    return null;
  }
}

describe('BasePaymentProvider authorization defaults', () => {
  const user = {
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  const resets = { reset: vi.fn() } satisfies Pick<NamespaceResets, 'reset'>;
  const provider = new PlainPaymentProvider({
    id: 'plain',
    prisma: { user } as unknown as PrismaClient,
    kv: {} as NamespacedCache,
    resets,
  });

  it('does not support authorizing without a charge', () => {
    expect(provider.supportsAuthorization()).toBe(false);
  });

  it('refuses to create an authorization', async () => {
    await expect(
      provider.createAuthorizationIntent({
        changeID: 'change-1',
        currency: Currency.CHF,
      })
    ).rejects.toThrow('PaymentProvider plain cannot authorize');
  });

  it('has no authorization status to report', async () => {
    await expect(
      provider.checkAuthorizationStatus({
        intentID: 'intent-1',
        changeID: 'change-1',
      })
    ).resolves.toBeNull();
  });

  it('has no hold to release', async () => {
    await expect(
      provider.releaseAuthorization({ intentID: 'intent-1' })
    ).resolves.toBeUndefined();
  });

  describe('saveCustomer', () => {
    it("replaces the user's customer of this provider", async () => {
      user.findUnique.mockResolvedValue({
        id: 'user-1',
        paymentProviderCustomers: [
          { paymentProviderID: 'plain', customerID: 'cus-0' },
        ],
      });

      await provider.saveCustomer('user-1', 'cus-1');

      expect(user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          paymentProviderCustomers: {
            deleteMany: { paymentProviderID: 'plain' },
            create: { paymentProviderID: 'plain', customerID: 'cus-1' },
          },
        },
      });
    });

    it('fails for an unknown user', async () => {
      user.findUnique.mockResolvedValue(null);

      await expect(provider.saveCustomer('missing', 'cus-1')).rejects.toThrow(
        'User with ID missing does not exist'
      );
      expect(user.update).not.toHaveBeenCalled();
    });
  });
});
