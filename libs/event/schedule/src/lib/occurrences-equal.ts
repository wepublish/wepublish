import { ExpandedOccurrence } from './event-schedule';

const sameOccurrence = (a: ExpandedOccurrence, b: ExpandedOccurrence) =>
  a.dateFrom.getTime() === b.dateFrom.getTime() &&
  a.dateTo.getTime() === b.dateTo.getTime() &&
  a.openingTime === b.openingTime &&
  a.legacyEventId === b.legacyEventId;

export const sameOccurrences = (
  stored: readonly ExpandedOccurrence[],
  expanded: readonly ExpandedOccurrence[]
): boolean =>
  stored.length === expanded.length &&
  stored.every((occurrence, index) =>
    sameOccurrence(occurrence, expanded[index])
  );
