import { ForbiddenException } from '@nestjs/common';
import { User } from '@prisma/client';

import {
  ApiTokenSession,
  AuthSessionType,
  TokenSession,
  UserSession,
} from './auth-session';
import {
  actorOf,
  actorUserIdOf,
  requireSessionUser,
  requireUserSession,
  userSessionOf,
} from './session-user';

const user = { id: 'user-1', email: 'editor@example.test' } as User;

const userSession: UserSession = {
  type: AuthSessionType.User,
  id: 'session-1',
  token: 'secret',
  createdAt: new Date(),
  expiresAt: new Date(),
  user,
  roles: [],
};

const apiTokenSession: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Print Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

const peerSession: TokenSession = {
  type: AuthSessionType.Token,
  id: 'peer-1',
  name: 'Peer',
  token: 'secret',
  roles: [],
};

describe('actorOf', () => {
  it('is the signed-in user', () => {
    expect(actorOf(userSession)).toEqual({
      userId: 'user-1',
      apiTokenId: null,
    });
  });

  it('is the creator of an api key, together with the key', () => {
    expect(actorOf(apiTokenSession)).toEqual({
      userId: 'creator-1',
      apiTokenId: 'api-token-1',
    });
  });

  it('refuses a peering token, which nobody answers for', () => {
    expect(() => actorOf(peerSession)).toThrow(ForbiddenException);
  });
});

describe('requireSessionUser', () => {
  it('returns the signed-in user', () => {
    expect(requireSessionUser(userSession)).toBe(user);
  });

  it.each([
    ['an api key', apiTokenSession],
    ['a peering token', peerSession],
  ])('refuses %s, even one created by a user', (_, session) => {
    expect(() => requireSessionUser(session)).toThrow(ForbiddenException);
  });
});

describe('requireUserSession', () => {
  it('returns the session of the signed-in user', () => {
    expect(requireUserSession(userSession)).toBe(userSession);
  });

  it.each([
    ['an api key', apiTokenSession],
    ['a peering token', peerSession],
  ])('refuses %s', (_, session) => {
    expect(() => requireUserSession(session)).toThrow(ForbiddenException);
  });
});

describe('userSessionOf', () => {
  it('is the session of the signed-in user', () => {
    expect(userSessionOf(userSession)).toBe(userSession);
  });

  it.each([
    ['an api key', apiTokenSession],
    ['a peering token', peerSession],
    ['no session', undefined],
  ])('is nothing for %s', (_, session) => {
    expect(userSessionOf(session)).toBeUndefined();
  });
});

describe('actorUserIdOf', () => {
  it('is the signed-in user', () => {
    expect(actorUserIdOf(userSession)).toBe('user-1');
  });

  it('is the creator of an api key', () => {
    expect(actorUserIdOf(apiTokenSession)).toBe('creator-1');
  });

  it.each([
    ['a peering token', peerSession],
    ['no session', undefined],
  ])('is nobody for %s', (_, session) => {
    expect(actorUserIdOf(session)).toBeUndefined();
  });
});
