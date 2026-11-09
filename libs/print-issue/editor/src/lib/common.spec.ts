import { nextIssue } from './common';

describe('nextIssue', () => {
  it('suggests the next number of the latest year, whatever the order and status', () => {
    expect(
      nextIssue([
        { number: 6, year: 2026 },
        { number: 3, year: 2027 },
        { number: 1, year: 2027 },
        { number: 4, year: 2026 },
      ])
    ).toEqual({ number: 4, year: 2027 });
  });

  it('starts a medium without issues at 1 of the current year', () => {
    expect(nextIssue([])).toEqual({
      number: 1,
      year: new Date().getFullYear(),
    });
  });
});
