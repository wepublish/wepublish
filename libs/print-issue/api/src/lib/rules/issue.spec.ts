import { issueLabel, issueYear, normalizeIssue } from './issue';

describe('normalizeIssue', () => {
  it.each([
    ['6.26', '6.26'],
    ['06.26', '6.26'],
    ['6/26', '6.26'],
    [' 12.27 ', '12.27'],
  ])('reads %s as %s', (input, expected) => {
    expect(normalizeIssue(input)).toBe(expected);
  });

  it.each(['6.2026', 'abc', '', '6', '6.2', '0.26', '2026'])(
    'rejects %s',
    input => {
      expect(normalizeIssue(input)).toBeNull();
    }
  );
});

describe('issueYear', () => {
  it('expands the two-digit year of an issue', () => {
    expect(issueYear('6.26')).toBe(2026);
    expect(issueYear('1.30')).toBe(2030);
  });
});

describe('issueLabel', () => {
  it('writes number and two-digit year', () => {
    expect(issueLabel({ number: 1, year: 2027 })).toBe('1.27');
    expect(issueLabel({ number: 12, year: 2030 })).toBe('12.30');
    expect(issueLabel({ number: 3, year: 2105 })).toBe('3.05');
  });
});
