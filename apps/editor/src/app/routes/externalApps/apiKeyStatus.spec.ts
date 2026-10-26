import { apiKeyStatus } from './apiKeyStatus';

const NOW = new Date('2026-10-23T10:00:00.000Z');

const key = (overrides: Record<string, unknown> = {}) => ({
  expiresAt: '2027-10-23T00:00:00.000Z',
  revokedAt: null,
  ...overrides,
});

describe('apiKeyStatus', () => {
  it('is null without a linked key', () => {
    expect(apiKeyStatus(null, NOW)).toBeNull();
    expect(apiKeyStatus(undefined, NOW)).toBeNull();
  });

  it('is ok for a key valid for longer than 30 days', () => {
    expect(apiKeyStatus(key(), NOW)).toBe('ok');
  });

  it('warns 30 days before the key expires', () => {
    expect(
      apiKeyStatus(key({ expiresAt: '2026-11-21T10:00:00.000Z' }), NOW)
    ).toBe('expiresSoon');
    expect(
      apiKeyStatus(key({ expiresAt: '2026-11-23T10:00:00.000Z' }), NOW)
    ).toBe('ok');
  });

  it('reports an expired key', () => {
    expect(
      apiKeyStatus(key({ expiresAt: '2026-10-01T00:00:00.000Z' }), NOW)
    ).toBe('expired');
  });

  it('reports a revoked key, even once it has also expired', () => {
    expect(
      apiKeyStatus(
        key({
          revokedAt: '2026-09-01T00:00:00.000Z',
          expiresAt: '2026-10-01T00:00:00.000Z',
        }),
        NOW
      )
    ).toBe('revoked');
  });
});
