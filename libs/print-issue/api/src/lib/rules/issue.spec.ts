import {
  issueFileLabel,
  issueLabel,
  issueNumbers,
  issueYear,
  normalizeIssue,
  sameIssue,
} from './issue';

describe('normalizeIssue', () => {
  it.each([
    ['6.26', '6.26'],
    ['06.26', '6.26'],
    ['6/26', '6.26'],
    [' 12.27 ', '12.27'],
    ['3/4.26', '3/4.26'],
    ['03/04.26', '3/4.26'],
    ['3-4.26', '3/4.26'],
    ['3/4/26', '3/4.26'],
  ])('reads %s as %s', (input, expected) => {
    expect(normalizeIssue(input)).toBe(expected);
  });

  it.each([
    '6.2026',
    'abc',
    '',
    '6',
    '6.2',
    '0.26',
    '2026',
    '4/3.26',
    '3/3.26',
    '0/1.26',
  ])('rejects %s', input => {
    expect(normalizeIssue(input)).toBeNull();
  });
});

describe('issueYear', () => {
  it('expands the two-digit year of an issue', () => {
    expect(issueYear('6.26')).toBe(2026);
    expect(issueYear('1.30')).toBe(2030);
    expect(issueYear('3/4.26')).toBe(2026);
  });
});

describe('issueLabel', () => {
  it('writes number and two-digit year', () => {
    expect(issueLabel({ number: 1, year: 2027 })).toBe('1.27');
    expect(issueLabel({ number: 12, year: 2030 })).toBe('12.30');
    expect(issueLabel({ number: 3, year: 2105 })).toBe('3.05');
  });

  it('writes a double issue as its first and last number', () => {
    expect(issueLabel({ number: 3, numberTo: 4, year: 2026 })).toBe('3/4.26');
    expect(issueLabel({ number: 3, numberTo: null, year: 2026 })).toBe('3.26');
  });
});

describe('issueFileLabel', () => {
  it('is the label without a slash, for file names', () => {
    expect(issueFileLabel({ number: 3, numberTo: 4, year: 2026 })).toBe(
      '3-4.26'
    );
    expect(issueFileLabel({ number: 6, year: 2026 })).toBe('6.26');
  });
});

describe('issueNumbers', () => {
  it('counts the numbers an issue covers', () => {
    expect(issueNumbers({ number: 6 })).toBe(1);
    expect(issueNumbers({ number: 6, numberTo: null })).toBe(1);
    expect(issueNumbers({ number: 3, numberTo: 4 })).toBe(2);
  });
});

describe('sameIssue', () => {
  it.each([
    ['6.26', '6.26'],
    ['3/4.26', '3.26'],
    ['3/4.26', '4.26'],
    ['3/4.26', '3/4.26'],
    ['3.26', '3/4.26'],
  ])('%s is %s', (a, b) => {
    expect(sameIssue(a, b)).toBe(true);
  });

  it.each([
    ['6.26', '6.27'],
    ['3/4.26', '5.26'],
    ['3/4.26', '2.26'],
    ['3/4.26', '3.27'],
    ['6.26', 'nonsense'],
  ])('%s is not %s', (a, b) => {
    expect(sameIssue(a, b)).toBe(false);
  });
});
