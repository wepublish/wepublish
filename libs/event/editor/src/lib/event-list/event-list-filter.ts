import { EventFilter, EventSort, EventStatus } from '@wepublish/editor/api';
import { zurichWallClockToInstant } from '@wepublish/event/schedule';

export const EXPIRY_WINDOW_DAYS = 30;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type EventPublicationState = 'draft' | 'pending' | 'published';

export type EventEnding = 'soon' | 'ended';

export type NamedOption = { id: string; name: string };

export type EventListFilterState = {
  search?: string | null;
  organization?: NamedOption | null;
  place?: NamedOption | null;
  tagIds?: string[] | null;
  status?: EventStatus[] | null;
  publication?: EventPublicationState[] | null;
  reviewRequested?: boolean | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  ending?: EventEnding | null;
};

export const REVIEW_QUEUE_FILTER: EventListFilterState = {
  reviewRequested: true,
};

export const REVIEW_QUEUE_SORT = {
  sortField: 'reviewRequestedAt',
  sortOrder: 'asc',
} as const;

const zurichMidnight = (date: string, addDays = 0) => {
  const [year, month, day] = date.split('-').map(Number);

  return zurichWallClockToInstant({
    year,
    month,
    day: day + addDays,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  }).toISOString();
};

const hasItems = <T>(list?: T[] | null): list is T[] => !!list?.length;

export const toEventFilter = (
  state: EventListFilterState,
  now: Date
): EventFilter => {
  const filter: EventFilter = {};
  const search = state.search?.trim();

  if (search) {
    filter.search = search;
  }

  if (state.organization) {
    filter.organizationIds = [state.organization.id];
  }

  if (state.place) {
    filter.placeIds = [state.place.id];
  }

  if (hasItems(state.tagIds)) {
    filter.tagIds = state.tagIds;
  }

  if (hasItems(state.status)) {
    filter.eventStatus = state.status;
  }

  for (const publication of state.publication ?? []) {
    filter[publication] = true;
  }

  if (state.reviewRequested) {
    filter.reviewRequested = true;
  }

  if (state.dateFrom) {
    filter.from = zurichMidnight(state.dateFrom);
  }

  if (state.dateTo) {
    filter.to = zurichMidnight(state.dateTo, 1);
  }

  if (state.ending === 'soon') {
    filter.endsAfter = now.toISOString();
    filter.endsBefore = new Date(
      now.getTime() + EXPIRY_WINDOW_DAYS * DAY_IN_MS
    ).toISOString();
  }

  if (state.ending === 'ended') {
    filter.endsBefore = now.toISOString();
  }

  return filter;
};

const activeFields = (state: EventListFilterState) =>
  [
    !!state.search?.trim(),
    !!state.organization,
    !!state.place,
    hasItems(state.tagIds),
    hasItems(state.status),
    hasItems(state.publication),
    !!state.reviewRequested,
    !!(state.dateFrom || state.dateTo),
    !!state.ending,
  ].filter(Boolean).length;

export const activeEventFilterCount = (state: EventListFilterState) =>
  activeFields(state);

export const isOnlyReviewQueue = (state: EventListFilterState) =>
  !!state.reviewRequested && activeFields(state) === 1;

export const mapEventSort = (field: string): EventSort => {
  switch (field) {
    case 'createdAt':
      return EventSort.CreatedAt;
    case 'lastDateAt':
      return EventSort.EndsAt;
    case 'reviewRequestedAt':
      return EventSort.ReviewRequestedAt;
    default:
      return EventSort.ModifiedAt;
  }
};
