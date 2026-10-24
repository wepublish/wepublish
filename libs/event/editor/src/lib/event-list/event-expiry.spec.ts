import { EventScheduleType } from '@wepublish/editor/api';

import { eventExpiry } from './event-expiry';

const now = new Date('2026-10-23T10:00:00.000Z');
const daysFromNow = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

describe('eventExpiry', () => {
  it('warns about a weekly series whose last date is 12 days away', () => {
    expect(
      eventExpiry(
        { scheduleType: EventScheduleType.Weekly, lastDateAt: daysFromNow(12) },
        now
      )
    ).toEqual({ daysLeft: 12 });
  });

  it('counts Zurich calendar days, not periods of 24 hours', () => {
    expect(
      eventExpiry(
        {
          scheduleType: EventScheduleType.Weekly,
          lastDateAt: '2026-11-04T20:00:00.000Z',
        },
        new Date('2026-10-23T06:00:00.000Z')
      )
    ).toEqual({ daysLeft: 12 });
  });

  it('counts the day after the Zurich midnight as the next day', () => {
    expect(
      eventExpiry(
        {
          scheduleType: EventScheduleType.Weekly,
          lastDateAt: '2026-10-23T22:30:00.000Z',
        },
        new Date('2026-10-23T21:00:00.000Z')
      )
    ).toEqual({ daysLeft: 1 });
  });

  it('gives 0 days for a series whose last date is later today', () => {
    expect(
      eventExpiry(
        {
          scheduleType: EventScheduleType.Weekly,
          lastDateAt: daysFromNow(0.25),
        },
        now
      )
    ).toEqual({ daysLeft: 0 });
  });

  it('warns up to 30 days ahead', () => {
    expect(
      eventExpiry(
        { scheduleType: EventScheduleType.Weekly, lastDateAt: daysFromNow(30) },
        now
      )
    ).toEqual({ daysLeft: 30 });
  });

  it('says nothing about a series that still has 31 days to run', () => {
    expect(
      eventExpiry(
        { scheduleType: EventScheduleType.Weekly, lastDateAt: daysFromNow(31) },
        now
      )
    ).toBeNull();
  });

  it('says nothing about a series that has ended, which the Ended filter holds', () => {
    expect(
      eventExpiry(
        { scheduleType: EventScheduleType.Weekly, lastDateAt: daysFromNow(-1) },
        now
      )
    ).toBeNull();
  });

  it.each([EventScheduleType.Continuous, EventScheduleType.Explicit])(
    'says nothing about a %s event, which ends when it was meant to',
    scheduleType => {
      expect(
        eventExpiry({ scheduleType, lastDateAt: daysFromNow(12) }, now)
      ).toBeNull();
    }
  );

  it('says nothing without a last date', () => {
    expect(
      eventExpiry(
        { scheduleType: EventScheduleType.Weekly, lastDateAt: null },
        now
      )
    ).toBeNull();
  });
});
