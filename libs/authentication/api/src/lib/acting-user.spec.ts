import { User } from '@prisma/client';

import { AuthSessionType } from './auth-session';
import { actingUserOf } from './acting-user';

const creator = { id: 'user-1' } as User;

describe('actingUserOf', () => {
  it('is the signed-in user', () => {
    expect(
      actingUserOf({
        type: AuthSessionType.User,
        id: 'session-1',
        token: 'token',
        createdAt: new Date(),
        expiresAt: new Date(),
        user: creator,
        roles: [],
        organizationIds: [],
      })
    ).toBe(creator);
  });

  it('is the creator of an api key', () => {
    expect(
      actingUserOf({
        type: AuthSessionType.ApiToken,
        id: 'key-1',
        name: 'Print Import',
        token: 'wep_secret',
        permissions: [],
        organizationId: null,
        user: creator,
      })
    ).toBe(creator);
  });

  it('is nobody for a key whose creator was deleted', () => {
    expect(
      actingUserOf({
        type: AuthSessionType.ApiToken,
        id: 'key-1',
        name: 'Print Import',
        token: 'wep_secret',
        permissions: [],
        organizationId: null,
        user: null,
      })
    ).toBeNull();
  });

  it('is nobody for a peer token or no session', () => {
    expect(
      actingUserOf({
        type: AuthSessionType.Token,
        id: 'peer-1',
        name: 'Peer',
        token: 'token',
        roles: [],
      })
    ).toBeNull();
    expect(actingUserOf(null)).toBeNull();
    expect(actingUserOf(undefined)).toBeNull();
  });
});
