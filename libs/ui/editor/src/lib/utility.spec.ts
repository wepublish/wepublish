import { validateURL } from './utility';

describe('validateURL', () => {
  it.each([
    'example.com/news',
    'https://example.com/news?topic=local#lead',
    'http://192.168.1.1:8080/path',
  ])('accepts %s', url => {
    expect(validateURL(url)).toBe(true);
  });

  it.each([
    '',
    'ftp://example.com/file',
    'javascript://example.com/%0Aalert(1)',
    'http://999.999.999.999',
    'https://example.com/e vil',
    'https://user:pass@example.com',
  ])('rejects %s', url => {
    expect(validateURL(url)).toBe(false);
  });
});
