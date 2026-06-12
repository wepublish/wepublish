import { getEditorRateLimitOptions } from './server-rate-limit';

describe('getEditorRateLimitOptions', () => {
  const originalMax = process.env.EDITOR_RATE_LIMIT_MAX;
  const originalWindow = process.env.EDITOR_RATE_LIMIT_WINDOW_MS;

  afterEach(() => {
    process.env.EDITOR_RATE_LIMIT_MAX = originalMax;
    process.env.EDITOR_RATE_LIMIT_WINDOW_MS = originalWindow;
  });

  it('uses conservative defaults for the editor SSR fallback', () => {
    delete process.env.EDITOR_RATE_LIMIT_MAX;
    delete process.env.EDITOR_RATE_LIMIT_WINDOW_MS;

    expect(getEditorRateLimitOptions()).toEqual(
      expect.objectContaining({
        limit: 600,
        windowMs: 60_000,
        legacyHeaders: false,
      })
    );
  });

  it('allows deployments to tune the limit without code changes', () => {
    process.env.EDITOR_RATE_LIMIT_MAX = '1200';
    process.env.EDITOR_RATE_LIMIT_WINDOW_MS = '120000';

    expect(getEditorRateLimitOptions()).toEqual(
      expect.objectContaining({
        limit: 1200,
        windowMs: 120_000,
      })
    );
  });
});
