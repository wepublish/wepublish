import { LetterAddress } from './letter-provider/letter-provider.interface';
import {
  composeLetter,
  extractLetterBody,
  formatAddressLines,
} from './letter-renderer';

const recipient: LetterAddress = {
  name: 'Jane Doe',
  street: 'Musterstrasse',
  number: '7',
  zip: '8000',
  city: 'Zürich',
  country: 'CH',
};

describe('formatAddressLines', () => {
  it('joins street and number and drops empty lines', () => {
    expect(formatAddressLines(recipient)).toEqual([
      'Jane Doe',
      'Musterstrasse 7',
      '8000 Zürich',
      'CH',
    ]);
  });
});

describe('composeLetter', () => {
  const base = {
    template: { htmlContent: '<p>Hallo {{user_firstName}}</p>' },
    data: { user: { firstName: 'Jane' } },
    recipient,
    addressPosition: 'left' as const,
  };

  it('renders placeholders with the shared template engine', () => {
    expect(composeLetter(base)).toContain('<p>Hallo Jane</p>');
  });

  it('puts the address window on the left by default', () => {
    expect(composeLetter(base)).toContain('left: 20mm');
  });

  it('moves the address window for a right window envelope', () => {
    expect(composeLetter({ ...base, addressPosition: 'right' })).toContain(
      'left: 120mm'
    );
  });

  it('prints the recipient into the address window', () => {
    expect(composeLetter(base)).toContain('8000 Zürich');
  });

  it('escapes the address so a name cannot inject markup', () => {
    const html = composeLetter({
      ...base,
      recipient: { ...recipient, name: '<script>alert(1)</script>' },
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('extractLetterBody', () => {
  it('takes over only what the author wrote', () => {
    expect(
      extractLetterBody(
        '<!DOCTYPE html><html><head><style>p{}</style></head><body><div class="mail-body"><p>Hallo</p></div></body></html>'
      )
    ).toBe('<div class="mail-body"><p>Hallo</p></div>');
  });

  it('passes a fragment through untouched', () => {
    expect(extractLetterBody('<p>Hallo</p>')).toBe('<p>Hallo</p>');
  });

  it('does not nest a document inside the print sheet', () => {
    const html = composeLetter({
      template: {
        htmlContent: '<!DOCTYPE html><html><body><p>Hallo</p></body></html>',
      },
      data: {},
      recipient,
      addressPosition: 'left',
    });

    expect(html.match(/<!doctype html>/gi)).toHaveLength(1);
    expect(html).toContain('<p>Hallo</p>');
  });
});
