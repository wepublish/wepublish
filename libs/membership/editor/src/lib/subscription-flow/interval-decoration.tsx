import type { DragEndEvent } from '@dnd-kit/core';
import {
  SubscriptionEvent,
  SubscriptionIntervalFragment,
} from '@wepublish/editor/api';
import { JSX } from 'react';
import { MdOutlineClose, MdOutlineNoteAdd } from 'react-icons/md';
import type {
  DecoratedSubscriptionInterval,
  IntervalColoring,
} from './subscription-flow-list';

const eventIcons: Record<string, JSX.Element> = {
  [SubscriptionEvent.InvoiceCreation]: <MdOutlineNoteAdd size={16} />,
  [SubscriptionEvent.DeactivationUnpaid]: <MdOutlineClose size={16} />,
};

const eventColors: Record<string, IntervalColoring> = {
  [SubscriptionEvent.InvoiceCreation]: { accent: 'var(--rs-green-500)' },
  [SubscriptionEvent.DeactivationUnpaid]: { accent: 'var(--rs-orange-500)' },
};

export function decorateInterval<T extends SubscriptionIntervalFragment>(
  interval: T,
  subscriptionFlowId: string,
  title: string
): DecoratedSubscriptionInterval<T> {
  return {
    title,
    subscriptionFlowId,
    object: interval,
    icon: eventIcons[interval.event],
    color: eventColors[interval.event],
  };
}

export function timelineDays(
  intervals: SubscriptionIntervalFragment[],
  newDay?: number
) {
  const days = intervals
    .map(interval => interval.daysAwayFromEnding)
    .concat([newDay ?? null, 0])
    .filter((day): day is number => day != null);

  return [...new Set(days)].sort((a, b) => a - b);
}

export function droppedInterval(dragEvent: DragEndEvent) {
  const interval: SubscriptionIntervalFragment | undefined =
    dragEvent.active.data.current?.decoratedSubscriptionInterval?.object;
  const day: number | undefined = dragEvent.over?.data.current?.dayIndex;

  if (!interval || day === undefined || day === interval.daysAwayFromEnding) {
    return undefined;
  }

  return { interval, day };
}

export function withMovedIntervals<T extends SubscriptionIntervalFragment>(
  intervals: T[],
  movedIntervals: Record<string, number>
): T[] {
  return intervals.map(interval =>
    interval.id in movedIntervals ?
      { ...interval, daysAwayFromEnding: movedIntervals[interval.id] }
    : interval
  );
}
