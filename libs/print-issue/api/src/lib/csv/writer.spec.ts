import { emptyRow } from './row';
import { COLUMNS, toCsv } from './writer';

describe('toCsv', () => {
  it('writes the columns in the fixed order the mailing house gets', () => {
    expect(COLUMNS).toEqual([
      'Quelle',
      'Adressnummer',
      'Anrede',
      'Firma',
      'Vorname',
      'Name',
      'Zusatz',
      'Strasse',
      'Hausnummer',
      'PLZ',
      'Ort',
      'Land',
      'Anzahl',
      'Abo-Typ',
      'Zahlungsstatus',
      'Beginn',
      'E-Mail',
      'Bemerkungen',
      'Hinweis',
    ]);
  });

  it('starts with a BOM, quotes every field, separates with ; and ends lines with CRLF', () => {
    const csv = toCsv([
      { ...emptyRow(), quelle: 'wepublish', name: 'Muster', anzahl: 1 },
    ]);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe(COLUMNS.map(column => `"${column}"`).join(';'));
    expect(lines[1]).toBe(
      '"wepublish";"";"";"";"";"Muster";"";"";"";"";"";"";"1";"";"";"";"";"";""'
    );
    expect(lines[2]).toBe('');
    // no bare LF anywhere
    expect(
      csv.split('\n').every(line => line === '' || line.endsWith('\r'))
    ).toBe(true);
  });

  it('doubles quotes and keeps semicolons and newlines inside a field', () => {
    const csv = toCsv([{ ...emptyRow(), bemerkungen: 'say "hi"; two\nlines' }]);

    expect(csv).toContain('"say ""hi""; two\nlines"');
  });

  it('writes only the header when there are no rows', () => {
    const lines = toCsv([]).slice(1).split('\r\n');

    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('');
  });
});
