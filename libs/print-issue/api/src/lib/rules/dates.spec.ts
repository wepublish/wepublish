import {
  addMonths,
  dbDateToYmd,
  formatDe,
  isYmd,
  todayZurich,
  ymdToDbDate,
  zurichDate,
} from './dates';

describe('zurichDate', () => {
  it('turns an instant into its calendar day in Zurich', () => {
    expect(zurichDate('2026-12-31T23:30:00.000Z')).toBe('2027-01-01');
    expect(zurichDate('2026-12-31T00:00:00.000Z')).toBe('2026-12-31');
    // summer time: 22:30 UTC is already the next day
    expect(zurichDate('2026-07-15T22:30:00.000Z')).toBe('2026-07-16');
  });

  it('accepts Date objects', () => {
    expect(zurichDate(new Date('2026-03-01T12:00:00.000Z'))).toBe('2026-03-01');
  });
});

describe('formatDe', () => {
  it('writes a calendar day the Swiss way', () => {
    expect(formatDe('2026-10-13')).toBe('13.10.2026');
  });
});

describe('todayZurich', () => {
  it('is the Zurich calendar day of now', () => {
    expect(todayZurich(new Date('2026-12-31T23:30:00.000Z'))).toBe(
      '2027-01-01'
    );
  });
});

describe('isYmd', () => {
  it('accepts only real calendar days', () => {
    expect(isYmd('2026-10-13')).toBe(true);
    expect(isYmd('2026-02-30')).toBe(false);
    expect(isYmd('13.10.2026')).toBe(false);
    expect(isYmd('')).toBe(false);
  });
});

describe('addMonths', () => {
  it('moves a calendar day by whole months, clamped to the month’s last day', () => {
    expect(addMonths('2026-09-30', 4)).toBe('2027-01-30');
    expect(addMonths('2026-12-31', 4)).toBe('2027-04-30');
    expect(addMonths('2027-01-15', -4)).toBe('2026-09-15');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
  });
});

describe('ymdToDbDate / dbDateToYmd', () => {
  it('round-trips a calendar day through a @db.Date column as UTC midnight', () => {
    expect(ymdToDbDate('2027-01-15').toISOString()).toBe(
      '2027-01-15T00:00:00.000Z'
    );
    expect(dbDateToYmd(new Date('2027-01-15T00:00:00.000Z'))).toBe(
      '2027-01-15'
    );
    expect(dbDateToYmd(ymdToDbDate('2026-12-31'))).toBe('2026-12-31');
  });
});
