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
      'Schweiz',
    ]);
  });

  it('spells out the country pingen would not recognise as a code', () => {
    expect(formatAddressLines({ ...recipient, country: 'DE' })).toContain(
      'Deutschland'
    );
  });

  it('keeps an unknown country as given rather than dropping the line', () => {
    expect(formatAddressLines({ ...recipient, country: 'ZZ' })).toContain('ZZ');
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
    expect(composeLetter(base)).toContain('left: 22mm');
  });

  it('moves the address window for a right window envelope', () => {
    expect(composeLetter({ ...base, addressPosition: 'right' })).toContain(
      'left: 118mm'
    );
  });

  it('puts the address into the zone pingen reserves for it', () => {
    expect(composeLetter(base)).toContain('top: 60mm');
  });

  it('keeps the body out of the franking zone', () => {
    expect(composeLetter(base)).toContain('padding-top: 90mm');
  });

  it('reserves no space for stationery without a layout', () => {
    const html = composeLetter(base);

    expect(html).not.toContain('letter-header');
    expect(html).not.toContain('letter-footer');
    expect(html).toContain('height: 0mm');
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

describe('composeLetter with a layout', () => {
  const layout = {
    headerHtml: '<div class="logo">Zwölf</div>',
    footerHtml: '<div>Konto {{user_firstName}}</div>',
    headerHeightMm: 30,
    footerHeightMm: 20,
  };
  const base = {
    template: { htmlContent: '<p>Hallo</p>' },
    data: { user: { firstName: 'Jane' } },
    recipient,
    addressPosition: 'left' as const,
    layout,
  };

  it('prints the header and footer on every page as fixed bands', () => {
    const html = composeLetter(base);

    expect(html).toContain('<div class="logo">Zwölf</div>');
    expect(html).toMatch(/\.letter-header \{[^}]*position: fixed/);
    expect(html).toMatch(/\.letter-header \{[^}]*height: 30mm/);
    expect(html).toMatch(/\.letter-footer \{[^}]*position: fixed/);
    expect(html).toMatch(/\.letter-footer \{[^}]*height: 20mm/);
  });

  it('keeps the flowing text out of both bands on every page', () => {
    const html = composeLetter(base);

    // thead and tfoot repeat per page, so their spacers do the reserving.
    expect(html).toMatch(/<thead>[\s\S]*height: 35mm[\s\S]*<\/thead>/);
    expect(html).toMatch(/<tfoot>[\s\S]*height: 25mm[\s\S]*<\/tfoot>/);
  });

  it('leaves the address window and the first body line where pingen expects them', () => {
    const html = composeLetter(base);

    expect(html).toContain('top: 60mm');
    // 90mm from the sheet top, minus the 35mm the header spacer already takes.
    expect(html).toContain('padding-top: 55mm');
  });

  it('renders placeholders in the stationery with the same data as the body', () => {
    expect(composeLetter(base)).toContain('<div>Konto Jane</div>');
  });

  it('takes over only the body of a header pasted as a whole document', () => {
    const html = composeLetter({
      ...base,
      layout: {
        ...layout,
        headerHtml: '<!DOCTYPE html><html><body><b>Kopf</b></body></html>',
      },
    });

    expect(html).toContain('<b>Kopf</b>');
    expect(html.match(/<!doctype html>/gi)).toHaveLength(1);
  });

  it('caps a band at the height that keeps clear of the franking zone', () => {
    const html = composeLetter({
      ...base,
      layout: { ...layout, headerHeightMm: 80, footerHeightMm: 80 },
    });

    expect(html).toMatch(/\.letter-header \{[^}]*height: 40mm/);
    expect(html).toMatch(/\.letter-footer \{[^}]*height: 40mm/);
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
