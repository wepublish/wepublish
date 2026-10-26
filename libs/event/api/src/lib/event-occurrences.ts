import { Event, EventDate, Prisma } from '@prisma/client';
import {
  EventSchedule,
  expandOccurrences,
  sameOccurrences,
} from '@wepublish/event/schedule';

type OccurrenceWriter = Pick<Prisma.TransactionClient, 'occurrence'>;

export type ScheduleFields = Pick<
  Event,
  'scheduleType' | 'dateFrom' | 'dateTo' | 'weekDays' | 'openingTime'
>;

export type ScheduleDate = Pick<
  EventDate,
  'dateFrom' | 'dateTo' | 'openingTime' | 'sortOrder' | 'legacyEventId'
>;

export const eventSchedule = (
  event: ScheduleFields,
  dates: readonly ScheduleDate[]
): EventSchedule => ({
  scheduleType: event.scheduleType,
  dateFrom: event.dateFrom,
  dateTo: event.dateTo,
  weekDays: event.weekDays,
  openingTime: event.openingTime,
  dates: dates.map(
    ({ dateFrom, dateTo, openingTime, sortOrder, legacyEventId }) => ({
      dateFrom,
      dateTo,
      openingTime,
      sortOrder,
      legacyEventId,
    })
  ),
});

export const syncOccurrences = async (
  tx: OccurrenceWriter,
  eventId: string,
  schedule: EventSchedule
): Promise<boolean> => {
  const expanded = expandOccurrences(schedule);
  const stored = await tx.occurrence.findMany({
    where: { eventId },
    orderBy: [{ dateFrom: 'asc' }, { id: 'asc' }],
    select: {
      dateFrom: true,
      dateTo: true,
      openingTime: true,
      legacyEventId: true,
    },
  });

  if (sameOccurrences(stored, expanded)) {
    return false;
  }

  await tx.occurrence.deleteMany({ where: { eventId } });

  if (expanded.length) {
    await tx.occurrence.createMany({
      data: expanded.map(occurrence => ({ ...occurrence, eventId })),
    });
  }

  return true;
};
