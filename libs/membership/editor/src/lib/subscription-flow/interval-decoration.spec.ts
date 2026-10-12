import { SubscriptionEvent } from '@wepublish/editor/api';

import { droppedInterval, withMovedIntervals } from './interval-decoration';

const interval = (id: string, daysAwayFromEnding: number) => ({
  __typename: 'SubscriptionInterval' as const,
  id,
  event: SubscriptionEvent.InvoiceCreation,
  daysAwayFromEnding,
  mailTemplate: null,
});

const dragEnd = (id: string, from: number, to?: number) =>
  ({
    active: {
      data: {
        current: {
          decoratedSubscriptionInterval: { object: interval(id, from) },
        },
      },
    },
    over: to === undefined ? null : { data: { current: { dayIndex: to } } },
  }) as never;

describe('droppedInterval', () => {
  it('returns the interval and the day it was dropped on', () => {
    expect(droppedInterval(dragEnd('i-1', -10, -5))).toEqual({
      interval: interval('i-1', -10),
      day: -5,
    });
  });

  it('ignores drops outside of a day', () => {
    expect(droppedInterval(dragEnd('i-1', -10))).toBeUndefined();
  });

  it('ignores drops on the same day', () => {
    expect(droppedInterval(dragEnd('i-1', -10, -10))).toBeUndefined();
  });
});

describe('withMovedIntervals', () => {
  it('places moved intervals on their new day right away', () => {
    expect(
      withMovedIntervals([interval('i-1', -10), interval('i-2', 0)], {
        'i-1': -5,
      })
    ).toEqual([interval('i-1', -5), interval('i-2', 0)]);
  });
});
