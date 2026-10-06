import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { TokenService } from './token.service';

describe('TokenService session cache', () => {
  it('clears cached sessions after a peer token is deleted', async () => {
    const sessionCache = { invalidate: jest.fn().mockResolvedValue(undefined) };
    const prisma = {
      token: { delete: jest.fn().mockResolvedValue({ id: 'token-1' }) },
    };

    await new TokenService(
      prisma as unknown as PrismaClient,
      sessionCache as unknown as SessionCacheInvalidator
    ).deleteToken('token-1');

    expect(sessionCache.invalidate).toHaveBeenCalled();
  });
});
