import {
  type BexioKind,
  inPeriod,
  matchKind,
  parsePeriod,
  readIssueOrder,
} from './parse';

const KINDS: BexioKind[] = [
  {
    id: 'gift',
    label: 'Geschenkabo',
    word: 'NW Geschenkabo',
    refersTo: 'period',
  },
  {
    id: 'broker',
    label: 'Broker-Abo',
    word: 'NW Abo Endkund:in',
    refersTo: 'period',
  },
  {
    id: 'single',
    label: 'Einzelheft',
    word: 'Einzelausgabe',
    refersTo: 'issue',
  },
];

describe('parsePeriod', () => {
  it('reads a year as the calendar year', () => {
    expect(parsePeriod('Jahresabos 2027')).toEqual({
      from: '2027-01-01',
      to: '2027-12-31',
    });
  });

  it.each([
    'Jahresabos 15.03.2026–14.03.2027',
    'Jahresabos 15.03.2026 - 14.03.2027',
    'Jahresabos 15.3.2026 bis 14.3.2027',
  ])('reads a date range in any of its spellings (%s)', title => {
    expect(parsePeriod(title)).toEqual({
      from: '2026-03-15',
      to: '2027-03-14',
    });
  });

  it.each([
    ['only a start', 'Jahresabos 15.03.2026'],
    ['no year in the dates', 'Jahresabos 15.03.–14.03.'],
    ['months only', 'Jahresabos 03.2026–02.2027'],
    ['an end before the start', 'Jahresabos 15.03.2027–14.03.2026'],
    ['a day that does not exist', 'Jahresabos 31.02.2026–14.03.2027'],
    ['a two-digit year', 'Jahresabos 26'],
    ['nothing', 'Jahresabos'],
  ])('finds no period in %s', (_case, title) => {
    expect(parsePeriod(title)).toBeNull();
  });

  it('tells whether a ship day lies in a period, both ends included', () => {
    const period = { from: '2026-01-15', to: '2027-01-15' };

    expect(inPeriod('2027-01-15', period)).toBe(true);
    expect(inPeriod('2026-01-15', period)).toBe(true);
    expect(inPeriod('2027-01-16', period)).toBe(false);
    expect(inPeriod('2026-01-14', period)).toBe(false);
  });
});

describe('matchKind', () => {
  it('finds the kind whose word starts the text, ignoring case', () => {
    expect(matchKind('nw geschenkabo', KINDS)).toMatchObject({
      kind: { id: 'gift' },
      copies: null,
    });
    expect(
      matchKind('NW Abo Endkund:in, Abo 117049', KINDS, 'period')
    ).toMatchObject({ kind: { id: 'broker' }, rest: ', Abo 117049' });
  });

  it('reads an optional copies prefix', () => {
    expect(matchKind('3× Einzelausgabe 6.26', KINDS)).toMatchObject({
      kind: { id: 'single' },
      copies: 3,
      rest: ' 6.26',
    });
    expect(matchKind('2x Einzelausgabe 6.26', KINDS)?.copies).toBe(2);
  });

  it('wants the word at the start and as a whole word', () => {
    expect(matchKind('Rechnung: Einzelausgabe 6.26', KINDS)).toBeNull();
    expect(matchKind('Einzelausgaben 6.26', KINDS)).toBeNull();
    expect(matchKind('6.26', KINDS)).toBeNull();
  });

  it('looks only at kinds of the asked reference', () => {
    expect(matchKind('Einzelausgabe 6.26', KINDS, 'period')).toBeNull();
    expect(matchKind('NW Geschenkabo', KINDS, 'issue')).toBeNull();
  });

  it('prefers the longest word when one word starts another', () => {
    const kinds: BexioKind[] = [
      { id: 'a', label: 'Abo', word: 'NW Abo', refersTo: 'period' },
      ...KINDS,
    ];

    expect(matchKind('NW Abo Endkund:in', kinds)?.kind.id).toBe('broker');
  });
});

describe('readIssueOrder', () => {
  it.each(['Einzelausgabe 6.26', 'Einzelausgabe 06.26', 'Einzelausgabe 6/26'])(
    'reads the issue of a single-copy line (%s)',
    text => {
      expect(readIssueOrder(text, KINDS)).toEqual({
        kind: KINDS[2],
        copies: null,
        issue: '6.26',
      });
    }
  );

  it.each(['Einzelausgabe 26', 'Einzelausgabe 6', 'Einzelausgabe 2026'])(
    'marks a single-copy line without a valid issue (%s)',
    text => {
      expect(readIssueOrder(text, KINDS)).toEqual({
        kind: KINDS[2],
        copies: null,
        issue: null,
      });
    }
  );

  it('is no order at all without a trigger word', () => {
    expect(readIssueOrder('6.26', KINDS)).toBeNull();
    expect(readIssueOrder('6', KINDS)).toBeNull();
    expect(readIssueOrder('Porto', KINDS)).toBeNull();
  });
});
