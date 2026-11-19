import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { PaymentMethodChangeResolver } from './payment-method-change.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('PaymentMethodChangeResolver called with an api key', () => {
  const resolver = new PaymentMethodChangeResolver({} as any);

  it('has no subscriptions of its own to move', async () => {
    await expect(async () =>
      resolver.changeSubscriptionPaymentMethod({} as any, apiKey)
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.checkSubscriptionPaymentMethodChange('change-1', apiKey)
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.cancelSubscriptionPaymentMethodChange('change-1', apiKey)
    ).rejects.toThrow(ForbiddenException);
  });
});
