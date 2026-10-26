import {
  MAX_METER_READS,
  countedReads,
  emptyMeter,
  hasRead,
  isMeter,
  mergeMeters,
  recordRead,
  referralReads,
  toMinute,
} from './meter';

const DAY_MINUTES = 24 * 60;
const now = new Date('2026-10-26T12:00:00Z');
const minutesAgo = (minutes: number) => toMinute(now) - minutes;

describe('meter', () => {
  it('records each article once', () => {
    let meter = emptyMeter();
    meter = recordRead(meter, 'a', now, { maxWindowDays: 30 });
    meter = recordRead(meter, 'b', now, { maxWindowDays: 30 });
    meter = recordRead(meter, 'a', now, { maxWindowDays: 30 });

    expect(meter.reads.map(([id]) => id)).toEqual(['a', 'b']);
    expect(countedReads(meter, 30, now)).toBe(2);
  });

  it('keeps the time of the first read when an article is read again', () => {
    const meter = recordRead({ reads: [['a', minutesAgo(60)]] }, 'a', now, {
      maxWindowDays: 30,
    });

    expect(meter.reads).toEqual([['a', minutesAgo(60)]]);
  });

  it('only counts reads within the window', () => {
    const meter = {
      reads: [
        ['old', minutesAgo(8 * DAY_MINUTES)],
        ['new', minutesAgo(DAY_MINUTES)],
      ] as [string, number][],
    };

    expect(countedReads(meter, 7, now)).toBe(1);
    expect(countedReads(meter, 30, now)).toBe(2);
    expect(hasRead(meter, 'old', 7, now)).toBe(false);
    expect(hasRead(meter, 'old', 30, now)).toBe(true);
  });

  it('counts an article that left the window as a new read', () => {
    const meter = recordRead(
      { reads: [['a', minutesAgo(8 * DAY_MINUTES)]] },
      'a',
      now,
      { maxWindowDays: 7 }
    );

    expect(meter.reads).toEqual([['a', toMinute(now)]]);
  });

  it('leaves out the current article and referral reads when counting', () => {
    const meter = {
      reads: [
        ['a', minutesAgo(5)],
        ['b', minutesAgo(4), 1],
        ['c', minutesAgo(3)],
      ] as Array<[string, number] | [string, number, 1]>,
    };

    expect(countedReads(meter, 30, now)).toBe(2);
    expect(countedReads(meter, 30, now, 'c')).toBe(1);
    expect(referralReads(meter, 30, now)).toBe(1);
  });

  it('marks referral reads', () => {
    const meter = recordRead(emptyMeter(), 'a', now, {
      maxWindowDays: 30,
      referral: true,
    });

    expect(meter.reads).toEqual([['a', toMinute(now), 1]]);
  });

  it('prunes reads older than the largest window', () => {
    const meter = recordRead(
      {
        reads: [
          ['old', minutesAgo(31 * DAY_MINUTES)],
          ['new', minutesAgo(DAY_MINUTES)],
        ],
      },
      'now',
      now,
      { maxWindowDays: 30 }
    );

    expect(meter.reads.map(([id]) => id)).toEqual(['new', 'now']);
  });

  it(`keeps at most ${MAX_METER_READS} reads, the newest`, () => {
    let meter = emptyMeter();

    for (let i = 0; i < MAX_METER_READS + 5; i++) {
      meter = recordRead(meter, `article-${i}`, now, { maxWindowDays: 30 });
    }

    expect(meter.reads).toHaveLength(MAX_METER_READS);
    expect(meter.reads[0][0]).toBe('article-5');
    expect(meter.reads.at(-1)?.[0]).toBe(`article-${MAX_METER_READS + 4}`);
  });

  it('merges two meters, keeping the first read of each article', () => {
    expect(
      mergeMeters(
        {
          reads: [
            ['a', 10],
            ['b', 30],
          ],
        },
        {
          reads: [
            ['a', 5],
            ['c', 20, 1],
          ],
        }
      )
    ).toEqual({
      reads: [
        ['a', 5],
        ['c', 20, 1],
        ['b', 30],
      ],
    });
  });

  it.each([
    [{ reads: [] }, true],
    [{ reads: [['a', 1]] }, true],
    [{ reads: [['a', 1, 1]] }, true],
    [{ reads: [['a', '1']] }, false],
    [{ reads: [[1, 1]] }, false],
    [{ reads: 'a' }, false],
    [null, false],
    [[], false],
  ])('tells whether %j is a meter', (value, expected) => {
    expect(isMeter(value)).toBe(expected);
  });
});
