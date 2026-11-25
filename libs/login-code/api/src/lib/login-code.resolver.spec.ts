import { ForbiddenException } from '@nestjs/common';
import { AuthSessionType } from '@wepublish/authentication/api';

import { LoginCodeResolver } from './login-code.resolver';

// Revoking and reissuing record who did it. An api key acts on behalf of the
// user who created it; a peering token has nobody behind it.
describe('LoginCodeResolver', () => {
  const service = {
    revoke: vi.fn().mockResolvedValue(1),
    reissue: vi.fn().mockResolvedValue({
      status: { id: 'code-1' },
      code: 'ABCDE-FGHJK',
      purl: 'https://example.com/code/ABCDEFGHJK',
    }),
  };
  const secondFactor = {
    getFactor: vi.fn().mockResolvedValue('none'),
    isAvailable: vi.fn().mockResolvedValue(false),
  };
  const prisma = { user: { findUnique: vi.fn().mockResolvedValue(null) } };
  const resolver = new LoginCodeResolver(
    service as never,
    secondFactor as never,
    prisma as never
  );

  const editor = { type: AuthSessionType.User, user: { id: 'editor-1' } };
  const apiKey = {
    type: AuthSessionType.ApiToken,
    id: 'key-1',
    createdBy: { id: 'creator-1' },
  };
  const peer = { type: AuthSessionType.Token, id: 'peer-1' };

  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['an editor', editor, 'editor:editor-1'],
    ['an api key, as its creator', apiKey, 'editor:creator-1'],
  ])('records %s', async (_name, session, by) => {
    await resolver.revokeUserLoginCode('user-1', session as never);
    await resolver.reissueUserLoginCode('user-1', session as never);

    expect(service.revoke).toHaveBeenCalledWith('user-1', by);
    expect(service.reissue).toHaveBeenCalledWith('user-1', by);
  });

  it('refuses a peering token, which has nobody to record', async () => {
    await expect(
      resolver.revokeUserLoginCode('user-1', peer as never)
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      resolver.reissueUserLoginCode('user-1', peer as never)
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.revoke).not.toHaveBeenCalled();
    expect(service.reissue).not.toHaveBeenCalled();
  });
});
