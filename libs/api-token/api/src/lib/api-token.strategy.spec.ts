import { UnauthorizedException } from '@nestjs/common';
import {
  AuthSessionType,
  EXPIRED_API_TOKEN,
} from '@wepublish/authentication/api';

import {
  API_KEY_EXPIRATION_HEADER,
  apiTokenSession,
  ApiTokenStrategy,
} from './api-token.strategy';

const apiToken = {
  id: 'tok-1',
  createdAt: new Date(),
  modifiedAt: new Date(),
  name: 'Print Import',
  tokenHash: 'h',
  prefix: 'wep_abc',
  scopes: ['CAN_GET_EVENT'],
  expiresAt: new Date(Date.now() + 86_400_000),
  revokedAt: null,
  lastUsedAt: null,
  createdById: null,
  organizationId: null,
  createdBy: null,
} as any;

const creator = { id: 'user-1', email: 'editor@example.com' } as any;

describe('apiTokenSession', () => {
  it('is its own session type, not a user or peer token session', () => {
    expect(apiTokenSession(apiToken, 'wep_secret').type).toBe(
      AuthSessionType.ApiToken
    );
  });

  it('carries permissions directly rather than through a synthetic role', () => {
    const session = apiTokenSession(apiToken, 'wep_secret');

    expect(session.permissions).toEqual(['CAN_GET_EVENT']);
    expect(session).not.toHaveProperty('roles');
  });

  it('names the key, so the audit log can attribute actions to it', () => {
    expect(apiTokenSession(apiToken, 'wep_secret').name).toBe('Print Import');
  });

  it('carries the organisation the key is bound to', () => {
    expect(
      apiTokenSession({ ...apiToken, organizationId: 'org-a' }, 'wep_secret')
        .organizationId
    ).toBe('org-a');
  });

  it('carries no organisation for a platform key', () => {
    expect(apiTokenSession(apiToken, 'wep_secret').organizationId).toBeNull();
  });

  it('acts as the user who created the key', () => {
    expect(
      apiTokenSession(
        { ...apiToken, createdById: 'user-1', createdBy: creator },
        'wep_secret'
      ).user
    ).toBe(creator);
  });

  it('acts as nobody once its creator is deleted', () => {
    expect(apiTokenSession(apiToken, 'wep_secret').user).toBeNull();
  });

  it('keeps the key scopes as its permissions, never the creator roles', () => {
    const session = apiTokenSession(
      {
        ...apiToken,
        createdById: 'user-1',
        createdBy: { ...creator, roleIDs: ['admin'] },
      },
      'wep_secret'
    );

    expect(session.permissions).toEqual(['CAN_GET_EVENT']);
    expect(session).not.toHaveProperty('roles');
  });
});

describe('ApiTokenStrategy', () => {
  const request = () => ({ res: { setHeader: vi.fn() } }) as any;

  const strategy = (resolveToken: () => Promise<unknown>) =>
    new ApiTokenStrategy({ resolveToken: vi.fn(resolveToken) } as any);

  it('tells the integrator when the key expires on every response', async () => {
    const req = request();

    await strategy(async () => apiToken).validate(req, 'wep_secret');

    expect(req.res.setHeader).toHaveBeenCalledWith(
      API_KEY_EXPIRATION_HEADER,
      apiToken.expiresAt.toUTCString()
    );
  });

  it('answers an expired key with a bearer challenge naming the cause', async () => {
    const req = request();
    const expired = new UnauthorizedException('expired', {
      cause: EXPIRED_API_TOKEN,
    });

    await expect(
      strategy(async () => {
        throw expired;
      }).validate(req, 'wep_secret')
    ).rejects.toBe(expired);

    expect(req.res.setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Bearer error="invalid_token", error_description="The API key has expired"'
    );
  });

  it('builds a session that acts as the creator', async () => {
    const session = await strategy(async () => ({
      ...apiToken,
      createdById: 'user-1',
      createdBy: creator,
    })).validate(request(), 'wep_secret');

    expect(session).toMatchObject({ id: 'tok-1', user: creator });
  });

  it('leaves tokens that are not api keys to the other strategies', async () => {
    const req = request();

    expect(
      await strategy(async () => apiToken).validate(req, 'session-token')
    ).toBe(false);
    expect(req.res.setHeader).not.toHaveBeenCalled();
  });
});
