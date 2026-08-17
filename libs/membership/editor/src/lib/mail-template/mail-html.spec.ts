import { appendJwtParam, hasJwtParam, jwtInsertionFor } from './mail-html';

describe('appendJwtParam', () => {
  it('starts a query string when the url has none', () => {
    expect(appendJwtParam('https://example.com/login')).toBe(
      'https://example.com/login?jwt={{jwt}}'
    );
  });

  it('extends an existing query string', () => {
    expect(appendJwtParam('https://example.com/login?from=mail')).toBe(
      'https://example.com/login?from=mail&jwt={{jwt}}'
    );
  });

  it('keeps the fragment at the end', () => {
    expect(appendJwtParam('https://example.com/page#section')).toBe(
      'https://example.com/page?jwt={{jwt}}#section'
    );
    expect(appendJwtParam('https://example.com/page?a=1#section')).toBe(
      'https://example.com/page?a=1&jwt={{jwt}}#section'
    );
  });

  it('leaves a url that already carries the token untouched', () => {
    const url = 'https://example.com/login?jwt={{jwt}}';
    expect(appendJwtParam(url)).toBe(url);

    const second = 'https://example.com/login?a=1&jwt={{jwt}}';
    expect(appendJwtParam(second)).toBe(second);
  });

  it('trims surrounding whitespace', () => {
    expect(appendJwtParam('  https://example.com  ')).toBe(
      'https://example.com?jwt={{jwt}}'
    );
  });

  it('does nothing for an empty url', () => {
    expect(appendJwtParam('')).toBe('');
    expect(appendJwtParam('   ')).toBe('');
  });
});

describe('hasJwtParam', () => {
  it('detects the token as first or later parameter', () => {
    expect(hasJwtParam('https://example.com?jwt={{jwt}}')).toBe(true);
    expect(hasJwtParam('https://example.com?a=1&jwt={{jwt}}')).toBe(true);
  });

  it('does not confuse similar text with the parameter', () => {
    expect(hasJwtParam('https://example.com/jwt')).toBe(false);
    expect(hasJwtParam('https://example.com?token=jwt')).toBe(false);
  });
});

describe('jwtInsertionFor', () => {
  it('writes the full parameter right after a url', () => {
    expect(jwtInsertionFor('Jetzt anmelden: https://example.com/login')).toBe(
      '?jwt={{jwt}}'
    );
    expect(jwtInsertionFor('<a href="https://example.com/login')).toBe(
      '?jwt={{jwt}}'
    );
  });

  it('switches to & when the url already has a query string', () => {
    expect(
      jwtInsertionFor('<a href="https://example.com/login?from=mail')
    ).toBe('&jwt={{jwt}}');
  });

  it('handles root-relative and www urls', () => {
    expect(jwtInsertionFor('<a href="/abo')).toBe('?jwt={{jwt}}');
    expect(jwtInsertionFor('Besuche www.example.com')).toBe('?jwt={{jwt}}');
  });

  it('inserts the bare placeholder outside a url', () => {
    expect(jwtInsertionFor('Hallo Jane, ')).toBe('{{jwt}}');
    expect(jwtInsertionFor('')).toBe('{{jwt}}');
  });

  it('does not treat a closing html tag as a url', () => {
    expect(jwtInsertionFor('<p>Willkommen</p>')).toBe('{{jwt}}');
    expect(jwtInsertionFor('<a href="https://example.com">Text</a>')).toBe(
      '{{jwt}}'
    );
  });

  it('inserts nothing when the url already carries the token', () => {
    expect(jwtInsertionFor('<a href="https://example.com?jwt={{jwt}}')).toBe(
      ''
    );
  });
});
