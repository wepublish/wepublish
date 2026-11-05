import { Logger } from '@nestjs/common';
import { MAX_SHARED_VALUE_CHARS, SharePolicy } from './share-policy';

describe('SharePolicy', () => {
  let error: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shares a plain value', () => {
    const value = { name: 'Main' };

    expect(
      new SharePolicy().check('shared', value, JSON.stringify(value))
    ).toBe('share');
  });

  it('keeps a value with a secret field local', () => {
    const value = { apiKey: 'sk_live_1' };

    expect(
      new SharePolicy().check('shared', value, JSON.stringify(value))
    ).toBe('secret');
    expect(error).toHaveBeenCalledWith(
      'Not storing shared in Dragonfly, it contains the field apiKey'
    );
  });

  it('keeps a value over 256 KB local', () => {
    const text = 'x'.repeat(MAX_SHARED_VALUE_CHARS + 1);

    expect(MAX_SHARED_VALUE_CHARS).toBe(262144);
    expect(new SharePolicy().check('shared', text, text)).toBe('oversize');
  });

  it('shares a value of exactly 256 KB', () => {
    const text = 'x'.repeat(MAX_SHARED_VALUE_CHARS);

    expect(new SharePolicy().check('shared', text, text)).toBe('share');
  });

  it('logs a secret field once per namespace and field', () => {
    const policy = new SharePolicy();
    const apiKey = { apiKey: 'a' };
    const password = { password: 'b' };

    policy.check('shared', apiKey, JSON.stringify(apiKey));
    policy.check('shared', apiKey, JSON.stringify(apiKey));
    policy.check('shared', password, JSON.stringify(password));
    policy.check('answers', apiKey, JSON.stringify(apiKey));

    expect(error).toHaveBeenCalledTimes(3);
  });
});
