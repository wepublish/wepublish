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
} as any;

const resolved = {
  apiToken,
  creator: { id: 'u1', email: 'u1@example.test' },
  permissions: ['CAN_GET_EVENT'],
};

describe('apiTokenSession', () => {
  it('carries the creator the key acts on behalf of', () => {
    expect(apiTokenSession(resolved, 'wep_secret').createdBy).toEqual({
      id: 'u1',
      email: 'u1@example.test',
    });
  });

  it('takes the permissions its creator still holds, not the stored scopes', () => {
    expect(
      apiTokenSession({ ...resolved, permissions: [] }, 'wep_secret')
        .permissions
    ).toEqual([]);
  });

  it('is its own session type, not a user or peer token session', () => {
    expect(apiTokenSession(resolved, 'wep_secret').type).toBe(
      AuthSessionType.ApiToken
    );
  });

  it('carries permissions directly rather than through a synthetic role', () => {
    const session = apiTokenSession(resolved, 'wep_secret');

    expect(session.permissions).toEqual(['CAN_GET_EVENT']);
    expect(session).not.toHaveProperty('roles');
  });

  it('names the key, so the audit log can attribute actions to it', () => {
    expect(apiTokenSession(resolved, 'wep_secret').name).toBe('Print Import');
  });
});

describe('ApiTokenStrategy', () => {
  const request = () => ({ res: { setHeader: vi.fn() } }) as any;

  const strategy = (resolveToken: () => Promise<unknown>) =>
    new ApiTokenStrategy({ resolveToken: vi.fn(resolveToken) } as any);

  it('tells the integrator when the key expires on every response', async () => {
    const req = request();

    await strategy(async () => resolved).validate(req, 'wep_secret');

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

  it('leaves tokens that are not api keys to the other strategies', async () => {
    const req = request();

    expect(
      await strategy(async () => resolved).validate(req, 'session-token')
    ).toBe(false);
    expect(req.res.setHeader).not.toHaveBeenCalled();
  });
});
