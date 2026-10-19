import {
  API_TOKEN_PREFIX,
  generateApiToken,
  hashApiToken,
  prefixOf,
} from './api-token.crypto';

describe('generateApiToken', () => {
  it('starts with a recognisable prefix so secret scanners can spot a leak', () => {
    expect(generateApiToken()).toMatch(new RegExp(`^${API_TOKEN_PREFIX}`));
  });

  it('carries at least 256 bits of entropy', () => {
    const secret = generateApiToken().slice(API_TOKEN_PREFIX.length);
    // base64url packs 6 bits per character
    expect(secret.length * 6).toBeGreaterThanOrEqual(256);
  });

  it('is url-safe, so it survives headers, logs and copy-paste', () => {
    expect(generateApiToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('never repeats', () => {
    const tokens = new Set(
      Array.from({ length: 1000 }, () => generateApiToken())
    );

    expect(tokens.size).toBe(1000);
  });
});

describe('hashApiToken', () => {
  it('is deterministic, so a token can be looked up by its hash', () => {
    const token = generateApiToken();

    expect(hashApiToken(token)).toBe(hashApiToken(token));
  });

  it('does not reveal the token', () => {
    const token = generateApiToken();
    const hash = hashApiToken(token);

    expect(hash).not.toContain(token.slice(API_TOKEN_PREFIX.length));
    expect(hash).toHaveLength(64);
  });

  it('gives different tokens different hashes', () => {
    expect(hashApiToken(generateApiToken())).not.toBe(
      hashApiToken(generateApiToken())
    );
  });
});

describe('prefixOf', () => {
  it('is short enough to be safe to store and show', () => {
    const token = generateApiToken();
    const prefix = prefixOf(token);

    expect(token.startsWith(prefix)).toBe(true);
    expect(prefix.length).toBeLessThan(API_TOKEN_PREFIX.length + 10);
  });

  it('does not expose enough of the secret to be guessable', () => {
    const token = generateApiToken();
    const revealed = prefixOf(token).slice(API_TOKEN_PREFIX.length);

    expect(revealed.length).toBeLessThanOrEqual(8);
  });
});
