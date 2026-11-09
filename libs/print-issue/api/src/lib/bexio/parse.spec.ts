import { parseBexioText } from './parse';

describe('parseBexioText', () => {
  it('reads a yearly category without a copies prefix as one copy', () => {
    expect(parseBexioText('Geschenkabo 2026')).toEqual({
      copies: 1,
      kind: 'Geschenkabo',
      year: 2026,
    });
    expect(parseBexioText('Institutionelles Abo 2026')).toEqual({
      copies: 1,
      kind: 'Institutionelles Abo',
      year: 2026,
    });
    expect(parseBexioText('Buchhandel 2026')).toEqual({
      copies: 1,
      kind: 'Buchhandel',
      year: 2026,
    });
  });

  it('reads the copies prefix and ignores the invoice reference the importer appends', () => {
    expect(parseBexioText('3× Geschenkabo 2026 (Rg 4711)')).toEqual({
      copies: 3,
      kind: 'Geschenkabo',
      year: 2026,
    });
  });

  it.each([
    '12x Einzelheft 6.26',
    '12 × Einzelheft 06.26',
    '12* Einzelheft 6/26',
  ])('reads an issue number for single issues (%s)', text => {
    expect(parseBexioText(text)).toEqual({
      copies: 12,
      kind: 'Einzelheft',
      issue: '6.26',
    });
  });

  it('reads imported single-issue history as a year without an issue', () => {
    expect(parseBexioText('Einzelheft 2025')).toEqual({
      copies: 1,
      kind: 'Einzelheft',
      year: 2025,
    });
  });

  it('ignores case', () => {
    expect(parseBexioText('institutionelles abo 2026')?.kind).toBe(
      'Institutionelles Abo'
    );
  });

  it('keeps a zero copies prefix so the caller can count it', () => {
    expect(parseBexioText('0× Geschenkabo 2026')?.copies).toBe(0);
  });

  it.each([
    'Einzelabo 2026',
    'Spende 2026',
    'Geschenkabo',
    '',
    undefined,
    null,
  ])('returns null for anything else (%s)', text => {
    expect(parseBexioText(text)).toBeNull();
  });
});
