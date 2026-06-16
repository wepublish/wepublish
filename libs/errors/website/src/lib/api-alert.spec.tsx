import { createLoginLink } from './api-alert';

describe('createLoginLink', () => {
  it('adds the intended route query with the correct spelling', () => {
    expect(createLoginLink('/mitmachen', '')).toBe(
      '/login?intended=%2Fmitmachen'
    );
  });

  it('keeps the full current route encoded as one intended route value', () => {
    expect(createLoginLink('/mitmachen', '?mail=user@example.com')).toBe(
      '/login?intended=%2Fmitmachen%3Fmail%3Duser%40example.com'
    );
  });
});
