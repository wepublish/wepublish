import { AuthSessionType } from '@wepublish/authentication/api';

import { apiTokenSession } from './api-token.strategy';

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
});
