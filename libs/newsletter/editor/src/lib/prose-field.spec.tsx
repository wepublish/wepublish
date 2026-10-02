import { linesFrom, toHtml } from './prose-field';

const roundTrip = (value: string) => {
  const root = document.createElement('div');
  root.innerHTML = toHtml(value);

  return linesFrom(root);
};

const read = (html: string) => {
  const root = document.createElement('div');
  root.innerHTML = html;

  return linesFrom(root);
};

describe('prose field', () => {
  it('keeps bold, links and bullets through the editable', () => {
    const value = [
      '**Liebe Freundin**, lieber Freund',
      'Siehe [energy-charts](https://www.energy-charts.info)',
      '- Deutschland',
      '- Österreich',
    ].join('\n');

    expect(roundTrip(value)).toBe(value);
  });

  it('leaves adjacent merge tags alone', () => {
    const value = '*|IFNOT:ARCHIVE_PAGE|**|LIST:ADDRESSLINE|**|END:IF|*';

    expect(toHtml(value)).not.toContain('<b>');
    expect(roundTrip(value)).toBe(value);
  });

  it('escapes markup typed as text', () => {
    expect(toHtml('<script>')).toBe('<p>&lt;script&gt;</p>');
  });

  it('reads what browsers produce for a line break', () => {
    expect(read('<div>eins</div><div>zwei<br>drei</div>')).toBe(
      'eins\nzwei\ndrei'
    );
  });

  it('turns a styled bold span into bold, outside its whitespace', () => {
    expect(
      read('<p>ein<span style="font-weight: 700"> fettes</span> Wort</p>')
    ).toBe('ein **fettes** Wort');
  });

  it('keeps a bold link a link rather than a bold run of brackets', () => {
    expect(read('<p><b><a href="https://example.com">Mehr</a></b></p>')).toBe(
      '[Mehr](https://example.com)'
    );
  });

  it('joins two bold runs that meet into one', () => {
    expect(read('<p><b>ein</b><b>fach</b></p>')).toBe('**einfach**');
  });

  it('makes numbered lists bullets', () => {
    expect(read('<ol><li>eins</li><li>zwei</li></ol>')).toBe('- eins\n- zwei');
  });

  it('starts an empty field as one empty paragraph', () => {
    expect(toHtml('')).toBe('<p><br></p>');
  });
});
