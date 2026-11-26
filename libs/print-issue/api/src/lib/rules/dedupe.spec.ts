import { emptyRow } from '../csv/row';
import { markDuplicates } from './dedupe';

const row = (overrides: Partial<ReturnType<typeof emptyRow>>) => ({
  ...emptyRow(),
  name: 'Muster',
  vorname: 'Max',
  strasse: 'Bahnhofstrasse',
  hausnummer: '1',
  plz: '8001',
  ...overrides,
});

describe('markDuplicates', () => {
  it('flags the same address from both sources and keeps both rows', () => {
    const marked = markDuplicates([
      row({ quelle: 'wepublish' }),
      row({ quelle: 'bexio', name: 'MUSTER ', strasse: 'Bahnhofstraße' }),
    ]);

    expect(marked).toHaveLength(2);
    expect(marked[0]?.hinweis).toBe('Doppelt (2×)');
    expect(marked[1]?.hinweis).toBe('Doppelt (2×)');
  });

  it('appends to an existing Hinweis', () => {
    const marked = markDuplicates([
      row({ hinweis: 'Empfänger unbekannt' }),
      row({}),
    ]);

    expect(marked[0]?.hinweis).toBe('Empfänger unbekannt; Doppelt (2×)');
  });

  it('does not flag a different house number', () => {
    const marked = markDuplicates([row({}), row({ hausnummer: '2' })]);

    expect(marked.map(r => r.hinweis)).toEqual(['', '']);
  });

  it('never flags rows without an address', () => {
    const marked = markDuplicates([
      row({ strasse: '', hausnummer: '', plz: '' }),
      row({ strasse: '', hausnummer: '', plz: '' }),
    ]);

    expect(marked.map(r => r.hinweis)).toEqual(['', '']);
  });
});
