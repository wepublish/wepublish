import { validateURL } from './utility';

const scriptScheme = 'javascript';

describe('validateURL', () => {
  it.each([
    'example.com/news',
    'example.com:8080/news',
    'https://example.com/news?topic=local#lead',
    'http://192.168.1.1:8080/path',
  ])('accepts %s', url => {
    expect(validateURL(url)).toBe(true);
  });

  it.each([
    '',
    'ftp://example.com/file',
    `${scriptScheme}://example.com/%0Aalert(1)`,
    `${scriptScheme}:alert(1)`,
    'http://999.999.999.999',
    'https://example.com/e vil',
    'https://user:pass@example.com',
    '-bad.example.com',
  ])('rejects %s', url => {
    expect(validateURL(url)).toBe(false);
  });
});
