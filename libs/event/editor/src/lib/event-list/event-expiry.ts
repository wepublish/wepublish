import {
  EditorEventListItemFragment,
  EventScheduleType,
} from '@wepublish/editor/api';
import { instantToZurichWallClock } from '@wepublish/event/schedule';

export const EXPIRY_WARNING_DAYS = 30;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type EventExpiry = { daysLeft: number };

const zurichDay = (instant: Date) => {
  const { year, month, day } = instantToZurichWallClock(instant);

  return Date.UTC(year, month - 1, day) / DAY_IN_MS;
};

export const eventExpiry = (
  event: Pick<EditorEventListItemFragment, 'scheduleType' | 'lastDateAt'>,
  now: Date
): EventExpiry | null => {
  if (event.scheduleType !== EventScheduleType.Weekly || !event.lastDateAt) {
    return null;
  }

  const lastDate = new Date(event.lastDateAt);

  if (lastDate.getTime() <= now.getTime()) {
    return null;
  }

  const daysLeft = zurichDay(lastDate) - zurichDay(now);

  return daysLeft > EXPIRY_WARNING_DAYS ? null : { daysLeft };
};
