import { stripQueryAndHash } from './url';

describe('stripQueryAndHash', () => {
  it.each([
    ['https://example.com/a/slug?articleId=abc', 'https://example.com/a/slug'],
    ['https://example.com/a/slug?a=1&b=2&preview', 'https://example.com/a/slug'],
    ['https://example.com/a/slug#comments', 'https://example.com/a/slug'],
    ['https://example.com/a/slug?a=1#comments', 'https://example.com/a/slug'],
    ['https://example.com/a/slug?', 'https://example.com/a/slug'],
    ['https://example.com/?page=2', 'https://example.com/'],
    ['/a/slug?articleId=abc', '/a/slug'],
  ])('strips %s to %s', (input, expected) => {
    expect(stripQueryAndHash(input)).toBe(expected);
  });

  it.each([
    'https://example.com',
    'https://example.com/',
    'https://example.com/a/slug',
  ])('leaves %s untouched', url => {
    expect(stripQueryAndHash(url)).toBe(url);
  });
});
