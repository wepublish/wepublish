import { normaliseChannelUrl } from './one.tokens';

describe('normaliseChannelUrl', () => {
  it('leaves a clean url untouched', () => {
    expect(normaliseChannelUrl('https://one-admin.wepublish.cloud')).toBe(
      'https://one-admin.wepublish.cloud'
    );
  });

  it('strips a trailing slash so iss and aud match the other side', () => {
    expect(normaliseChannelUrl('https://one-admin.wepublish.cloud/')).toBe(
      'https://one-admin.wepublish.cloud'
    );
  });

  it('strips several trailing slashes', () => {
    expect(normaliseChannelUrl('https://one-admin.wepublish.cloud///')).toBe(
      'https://one-admin.wepublish.cloud'
    );
  });

  it('trims surrounding whitespace from a pasted value', () => {
    expect(normaliseChannelUrl('  https://one-admin.wepublish.cloud/  ')).toBe(
      'https://one-admin.wepublish.cloud'
    );
  });

  it('keeps an empty value empty so the module stays inert', () => {
    expect(normaliseChannelUrl('')).toBe('');
    expect(normaliseChannelUrl(undefined)).toBe('');
    expect(normaliseChannelUrl(null)).toBe('');
  });

  it('does not touch a path that is not a trailing slash', () => {
    expect(normaliseChannelUrl('https://one-admin.wepublish.cloud/v1')).toBe(
      'https://one-admin.wepublish.cloud/v1'
    );
  });
});
