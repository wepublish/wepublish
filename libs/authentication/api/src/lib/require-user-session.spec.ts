import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

import { AuthSession, AuthSessionType, UserSession } from './auth-session';
import { requireUserSession } from './require-user-session';

const creator = { id: 'user-1', email: 'editor@example.com' } as User;

const userSession: UserSession = {
  type: AuthSessionType.User,
  id: 'session-1',
  token: 'token',
  createdAt: new Date(),
  expiresAt: new Date(),
  user: creator,
  roles: [],
  organizationIds: [],
};

const apiKeySession: AuthSession = {
  type: AuthSessionType.ApiToken,
  id: 'key-1',
  name: 'Print Import',
  token: 'wep_secret',
  permissions: [],
  organizationId: null,
  user: creator,
};

describe('requireUserSession', () => {
  it('hands back a signed-in user session', () => {
    expect(requireUserSession(userSession)).toBe(userSession);
  });

  it('refuses an api key, even though it acts as its creator', () => {
    expect(() => requireUserSession(apiKeySession)).toThrow(ForbiddenException);
  });

  it('refuses a peer token session', () => {
    expect(() =>
      requireUserSession({
        type: AuthSessionType.Token,
        id: 'peer-1',
        name: 'Peer',
        token: 'token',
        roles: [],
      })
    ).toThrow(ForbiddenException);
  });

  it('refuses nobody', () => {
    expect(() => requireUserSession(null)).toThrow(ForbiddenException);
    expect(() => requireUserSession(undefined)).toThrow(ForbiddenException);
  });
});
