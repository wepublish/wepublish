import { EventSort, EventStatus } from '@wepublish/editor/api';

import {
  activeEventFilterCount,
  EXPIRY_WINDOW_DAYS,
  isOnlyReviewQueue,
  mapEventSort,
  REVIEW_QUEUE_FILTER,
  toEventFilter,
} from './event-list-filter';

const now = new Date('2026-10-23T10:00:00.000Z');

describe('toEventFilter', () => {
  it('sends nothing for an empty filter', () => {
    expect(toEventFilter({}, now)).toEqual({});
  });

  it('maps search, organisation, venue, tags and status', () => {
    expect(
      toEventFilter(
        {
          search: 'jazz',
          organization: { id: 'org-1', name: 'Equilibre' },
          place: { id: 'place-1', name: 'Nuithonie' },
          tagIds: ['tag-1'],
          status: [EventStatus.SoldOut],
        },
        now
      )
    ).toEqual({
      search: 'jazz',
      organizationIds: ['org-1'],
      placeIds: ['place-1'],
      tagIds: ['tag-1'],
      eventStatus: [EventStatus.SoldOut],
    });
  });

  it('maps the publication states to the revision filters', () => {
    expect(toEventFilter({ publication: ['draft', 'pending'] }, now)).toEqual({
      draft: true,
      pending: true,
    });
  });

  it('maps the review queue to reviewRequested', () => {
    expect(toEventFilter(REVIEW_QUEUE_FILTER, now)).toEqual({
      reviewRequested: true,
    });
  });

  it('maps the date range to the occurrence window, whole Zurich days', () => {
    expect(
      toEventFilter({ dateFrom: '2026-11-01', dateTo: '2026-11-30' }, now)
    ).toEqual({
      from: '2026-10-31T23:00:00.000Z',
      to: '2026-11-30T23:00:00.000Z',
    });
  });

  it(`maps Ending soon to a last date within ${EXPIRY_WINDOW_DAYS} days`, () => {
    expect(toEventFilter({ ending: 'soon' }, now)).toEqual({
      endsAfter: '2026-10-23T10:00:00.000Z',
      endsBefore: '2026-11-22T10:00:00.000Z',
    });
  });

  it('maps Ended to a last date before now', () => {
    expect(toEventFilter({ ending: 'ended' }, now)).toEqual({
      endsBefore: '2026-10-23T10:00:00.000Z',
    });
  });

  it('ignores blank search and empty lists', () => {
    expect(
      toEventFilter({ search: '  ', tagIds: [], status: [] }, now)
    ).toEqual({});
  });
});

describe('activeEventFilterCount', () => {
  it('counts each filter once, the date range as one', () => {
    expect(
      activeEventFilterCount({
        search: 'jazz',
        dateFrom: '2026-11-01',
        dateTo: '2026-11-30',
        reviewRequested: true,
        tagIds: [],
      })
    ).toBe(3);
  });

  it('is 0 for an empty filter', () => {
    expect(activeEventFilterCount({})).toBe(0);
  });
});

describe('isOnlyReviewQueue', () => {
  it('is true for the queue filter alone', () => {
    expect(isOnlyReviewQueue(REVIEW_QUEUE_FILTER)).toBe(true);
  });

  it('is false when another filter narrows the queue', () => {
    expect(isOnlyReviewQueue({ ...REVIEW_QUEUE_FILTER, search: 'x' })).toBe(
      false
    );
  });
});

describe('mapEventSort', () => {
  it.each([
    ['modifiedAt', EventSort.ModifiedAt],
    ['createdAt', EventSort.CreatedAt],
    ['lastDateAt', EventSort.EndsAt],
    ['reviewRequestedAt', EventSort.ReviewRequestedAt],
  ])('maps %s', (field, sort) => {
    expect(mapEventSort(field)).toBe(sort);
  });

  it('falls back to ModifiedAt', () => {
    expect(mapEventSort('name')).toBe(EventSort.ModifiedAt);
  });
});
