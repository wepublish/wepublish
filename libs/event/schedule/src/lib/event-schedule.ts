export type EventScheduleType = 'Continuous' | 'Weekly' | 'Explicit';

export type EventScheduleDate = Readonly<{
  dateFrom: Date;
  dateTo: Date;
  openingTime: string | null;
  sortOrder: number;
  legacyEventId: bigint | null;
}>;

export type EventSchedule = Readonly<{
  scheduleType: EventScheduleType;
  dateFrom: Date | null;
  dateTo: Date | null;
  weekDays: readonly number[];
  openingTime: string | null;
  dates: readonly EventScheduleDate[];
}>;

export type ExpandedOccurrence = {
  dateFrom: Date;
  dateTo: Date;
  openingTime: string | null;
  legacyEventId: bigint | null;
};
