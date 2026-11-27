import { parseIssueLabel } from '@wepublish/utils';
import { issueFileLabel, issueLabel, issueNumbers, namesIssue } from './issue';

const ZWOELF = { counting: 'continuous', format: '#{range}' } as const;

describe('issueLabel', () => {
  it('writes number and two-digit year by default', () => {
    expect(issueLabel({ number: 1, year: 2027 })).toBe('1.27');
    expect(issueLabel({ number: 12, year: 2030 })).toBe('12.30');
    expect(issueLabel({ number: 3, year: 2105 })).toBe('3.05');
  });

  it('writes a double issue as its first and last number', () => {
    expect(issueLabel({ number: 3, numberTo: 4, year: 2026 })).toBe('3/4.26');
    expect(issueLabel({ number: 3, numberTo: null, year: 2026 })).toBe('3.26');
  });

  it("writes the medium's template", () => {
    expect(issueLabel({ number: 117, year: 2026 }, ZWOELF)).toBe('#117');
    expect(issueLabel({ number: 117, numberTo: 118, year: 2026 }, ZWOELF)).toBe(
      '#117/118'
    );
  });
});

describe('issueFileLabel', () => {
  it('is the label without a slash or sign, for file names', () => {
    expect(issueFileLabel({ number: 3, numberTo: 4, year: 2026 })).toBe(
      '3-4.26'
    );
    expect(issueFileLabel({ number: 6, year: 2026 })).toBe('6.26');
    expect(issueFileLabel({ number: 117, year: 2026 }, ZWOELF)).toBe('117');
  });
});

describe('issueNumbers', () => {
  it('counts the numbers an issue covers', () => {
    expect(issueNumbers({ number: 6 })).toBe(1);
    expect(issueNumbers({ number: 6, numberTo: null })).toBe(1);
    expect(issueNumbers({ number: 3, numberTo: 4 })).toBe(2);
  });
});

describe('namesIssue', () => {
  const perYear = (text: string, issue: Parameters<typeof namesIssue>[1]) =>
    namesIssue(parseIssueLabel(text)!, issue, 'perYear');

  it.each([
    ['6.26', { number: 6, year: 2026 }],
    ['3.26', { number: 3, numberTo: 4, year: 2026 }],
    ['4.26', { number: 3, numberTo: 4, year: 2026 }],
    ['3/4.26', { number: 3, numberTo: 4, year: 2026 }],
    ['3/4.26', { number: 3, year: 2026 }],
  ])('per year, %s names %o', (text, issue) => {
    expect(perYear(text, issue)).toBe(true);
  });

  it.each([
    ['6.27', { number: 6, year: 2026 }],
    ['5.26', { number: 3, numberTo: 4, year: 2026 }],
    ['2.26', { number: 3, numberTo: 4, year: 2026 }],
    ['3.27', { number: 3, numberTo: 4, year: 2026 }],
  ])('per year, %s does not name %o', (text, issue) => {
    expect(perYear(text, issue)).toBe(false);
  });

  it('counting on, matches the number whatever the year', () => {
    const read = (text: string) => parseIssueLabel(text, '#{range}')!;

    expect(
      namesIssue(read('#117'), { number: 117, year: 2027 }, 'continuous')
    ).toBe(true);
    expect(
      namesIssue(
        read('118'),
        { number: 117, numberTo: 118, year: 2026 },
        'continuous'
      )
    ).toBe(true);
    expect(
      namesIssue(read('#119'), { number: 117, year: 2026 }, 'continuous')
    ).toBe(false);
  });

  it('per year, refuses a label without a year', () => {
    expect(
      namesIssue(
        { from: 6, to: 6, year: null },
        { number: 6, year: 2026 },
        'perYear'
      )
    ).toBe(false);
  });
});
