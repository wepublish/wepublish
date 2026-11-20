import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { SessionService } from './session.service';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('SessionService called with an api key', () => {
  it('has no session to revoke', async () => {
    const prisma = { session: { delete: vi.fn() } };
    const sessionCache = { invalidate: vi.fn() };
    const service = new SessionService(
      prisma as any,
      0,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      sessionCache as any
    );

    await expect(service.revokeSession(apiKey)).resolves.toBe(false);
    expect(prisma.session.delete).not.toHaveBeenCalled();
  });
});
