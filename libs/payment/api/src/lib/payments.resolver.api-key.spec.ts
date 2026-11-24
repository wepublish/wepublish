import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { PaymentsResolver } from './payments.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('PaymentsResolver called with an api key', () => {
  const resolver = new PaymentsResolver({} as any);

  it('has no invoices or subscriptions of its own to pay', async () => {
    await expect(async () =>
      resolver.createPaymentFromInvoice({} as any, apiKey)
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.createPaymentFromSubscription({} as any, apiKey)
    ).rejects.toThrow(ForbiddenException);
  });
});
