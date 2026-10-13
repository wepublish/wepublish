import {
  AudienceFilterState,
  dateRangeForPreset,
  decodeAudienceFilter,
  DEFAULT_AUDIENCE_CLIENT_FILTER,
  DEFAULT_AUDIENCE_COMPONENT_FILTER,
  encodeAudienceFilter,
  hasAudienceFilterParams,
  matchDateRangePreset,
  mergeAudienceFilterParams,
  preDefinedDates,
} from './audience-filter-params';

const NOW = new Date(2026, 8, 2, 13, 45, 30);

const day = (date: Date) =>
  `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;

const defaults = (
  overrides: Partial<AudienceFilterState> = {}
): AudienceFilterState => {
  const { today, lastMonth } = preDefinedDates(NOW);

  return {
    resolution: 'daily',
    dateRange: [lastMonth, today],
    memberPlanIds: [],
    clientFilter: DEFAULT_AUDIENCE_CLIENT_FILTER,
    componentFilter: DEFAULT_AUDIENCE_COMPONENT_FILTER,
    ...overrides,
  };
};

describe('preDefinedDates', () => {
  it('normalises every date to local midnight', () => {
    const dates = preDefinedDates(NOW);

    Object.values(dates).forEach(date => {
      expect([
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds(),
      ]).toEqual([0, 0, 0, 0]);
    });
  });

  it('derives the ranges from the given date', () => {
    const { today, lastWeek, lastMonth, nextYear } = preDefinedDates(NOW);

    expect(day(today)).toBe('2026-09-02');
    expect(day(lastWeek)).toBe('2026-08-26');
    expect(day(lastMonth)).toBe('2026-08-02');
    expect(day(nextYear)).toBe('2027-09-02');
  });
});

describe('dateRangeForPreset', () => {
  it('ends a backward looking range at today', () => {
    expect(dateRangeForPreset('lastQuarter', NOW).map(day)).toEqual([
      '2026-06-02',
      '2026-09-02',
    ]);
  });

  it('starts a forward looking range at today', () => {
    expect(dateRangeForPreset('nextWeek', NOW).map(day)).toEqual([
      '2026-09-02',
      '2026-09-09',
    ]);
  });
});

describe('hasAudienceFilterParams', () => {
  it('detects a filter parameter', () => {
    expect(
      hasAudienceFilterParams(new URLSearchParams('tab=jobs&range=lastWeek'))
    ).toBe(true);
  });

  it('ignores parameters that belong to someone else', () => {
    expect(hasAudienceFilterParams(new URLSearchParams('tab=jobs'))).toBe(
      false
    );
  });

  it('is false for an empty query string', () => {
    expect(hasAudienceFilterParams(new URLSearchParams())).toBe(false);
  });
});

describe('matchDateRangePreset', () => {
  it('recognises a range that matches a one-click preset', () => {
    const { today, lastQuarter } = preDefinedDates(NOW);

    expect(matchDateRangePreset([lastQuarter, today], NOW)).toBe('lastQuarter');
  });

  it('recognises a forward looking preset', () => {
    const { today, nextMonth } = preDefinedDates(NOW);

    expect(matchDateRangePreset([today, nextMonth], NOW)).toBe('nextMonth');
  });

  it('matches by day, ignoring the time of day', () => {
    const { today } = preDefinedDates(NOW);
    const lastWeekAtNoon = new Date(2026, 7, 26, 12, 0, 0);

    expect(matchDateRangePreset([lastWeekAtNoon, today], NOW)).toBe('lastWeek');
  });

  it('returns null for a hand picked range', () => {
    expect(
      matchDateRangePreset([new Date(2026, 2, 3), new Date(2026, 3, 17)], NOW)
    ).toBeNull();
  });
});

describe('encodeAudienceFilter', () => {
  it('writes a rolling range when the selection matches a preset', () => {
    const params = encodeAudienceFilter(defaults(), { now: NOW });

    expect(params.get('range')).toBe('lastMonth');
    expect(params.get('from')).toBeNull();
    expect(params.get('to')).toBeNull();
  });

  it('writes absolute dates for a hand picked range', () => {
    const params = encodeAudienceFilter(
      defaults({ dateRange: [new Date(2026, 2, 3), new Date(2026, 3, 17)] }),
      { now: NOW }
    );

    expect(params.get('from')).toBe('2026-03-03');
    expect(params.get('to')).toBe('2026-04-17');
    expect(params.get('range')).toBeNull();
  });

  it('writes absolute dates for a preset range when asked for a permalink', () => {
    const params = encodeAudienceFilter(defaults(), {
      now: NOW,
      absoluteDates: true,
    });

    expect(params.get('from')).toBe('2026-08-02');
    expect(params.get('to')).toBe('2026-09-02');
    expect(params.get('range')).toBeNull();
  });

  it('lists the enabled metrics and omits the disabled ones', () => {
    const params = encodeAudienceFilter(
      defaults({
        clientFilter: {
          ...DEFAULT_AUDIENCE_CLIENT_FILTER,
          totalActiveSubscriptionCount: true,
          createdSubscriptionCount: false,
        },
      }),
      { now: NOW }
    );

    const metrics = params.get('metrics')?.split(',');

    expect(metrics).toContain('totalActiveSubscriptionCount');
    expect(metrics).not.toContain('createdSubscriptionCount');
  });

  it('keeps an empty metric selection representable', () => {
    const cleared = Object.fromEntries(
      Object.keys(DEFAULT_AUDIENCE_CLIENT_FILTER).map(key => [key, false])
    ) as typeof DEFAULT_AUDIENCE_CLIENT_FILTER;

    const params = encodeAudienceFilter(defaults({ clientFilter: cleared }), {
      now: NOW,
    });

    expect(params.get('metrics')).toBe('');
  });

  it('omits the member plans when nothing is filtered', () => {
    const params = encodeAudienceFilter(defaults(), { now: NOW });

    expect(params.get('plans')).toBeNull();
  });

  it('writes the selected member plans', () => {
    const params = encodeAudienceFilter(
      defaults({ memberPlanIds: ['abc', 'def'] }),
      { now: NOW }
    );

    expect(params.get('plans')).toBe('abc,def');
  });

  it('writes the visible components', () => {
    const params = encodeAudienceFilter(
      defaults({
        componentFilter: { filter: true, chart: false, table: true },
      }),
      { now: NOW }
    );

    expect(params.get('show')).toBe('table');
  });
});

describe('decodeAudienceFilter', () => {
  it('falls back to the defaults when no parameter is present', () => {
    const fallback = defaults();

    expect(decodeAudienceFilter(new URLSearchParams(), fallback, NOW)).toEqual(
      fallback
    );
  });

  it('resolves a rolling range against the current date', () => {
    const decoded = decodeAudienceFilter(
      new URLSearchParams('range=lastWeek'),
      defaults(),
      NOW
    );

    expect(decoded.dateRange?.map(day)).toEqual(['2026-08-26', '2026-09-02']);
  });

  it('resolves the same rolling range differently at a later date', () => {
    const later = new Date(2026, 8, 23, 8, 0, 0);
    const decoded = decodeAudienceFilter(
      new URLSearchParams('range=lastWeek'),
      defaults(),
      later
    );

    expect(decoded.dateRange?.map(day)).toEqual(['2026-09-16', '2026-09-23']);
  });

  it('reads absolute dates', () => {
    const decoded = decodeAudienceFilter(
      new URLSearchParams('from=2026-03-03&to=2026-04-17'),
      defaults(),
      NOW
    );

    expect(decoded.dateRange?.map(day)).toEqual(['2026-03-03', '2026-04-17']);
  });

  it('sorts a reversed date range', () => {
    const decoded = decodeAudienceFilter(
      new URLSearchParams('from=2026-04-17&to=2026-03-03'),
      defaults(),
      NOW
    );

    expect(decoded.dateRange?.map(day)).toEqual(['2026-03-03', '2026-04-17']);
  });

  it('ignores an unknown range name', () => {
    const fallback = defaults();
    const decoded = decodeAudienceFilter(
      new URLSearchParams('range=lastDecade'),
      fallback,
      NOW
    );

    expect(decoded.dateRange).toEqual(fallback.dateRange);
  });

  it('ignores an unparseable date', () => {
    const fallback = defaults();
    const decoded = decodeAudienceFilter(
      new URLSearchParams('from=yesterday&to=2026-04-17'),
      fallback,
      NOW
    );

    expect(decoded.dateRange).toEqual(fallback.dateRange);
  });

  it('ignores a date that does not exist', () => {
    const fallback = defaults();
    const decoded = decodeAudienceFilter(
      new URLSearchParams('from=2026-02-31&to=2026-04-17'),
      fallback,
      NOW
    );

    expect(decoded.dateRange).toEqual(fallback.dateRange);
  });

  it('reads the resolution', () => {
    const decoded = decodeAudienceFilter(
      new URLSearchParams('resolution=monthly'),
      defaults(),
      NOW
    );

    expect(decoded.resolution).toBe('monthly');
  });

  it('ignores an unknown resolution', () => {
    const decoded = decodeAudienceFilter(
      new URLSearchParams('resolution=hourly'),
      defaults(),
      NOW
    );

    expect(decoded.resolution).toBe('daily');
  });

  it('enables exactly the listed metrics', () => {
    const decoded = decodeAudienceFilter(
      new URLSearchParams('metrics=endingSubscriptionCount'),
      defaults(),
      NOW
    );

    expect(decoded.clientFilter.endingSubscriptionCount).toBe(true);
    expect(decoded.clientFilter.createdSubscriptionCount).toBe(false);
  });

  it('drops metric names it does not know', () => {
    const decoded = decodeAudienceFilter(
      new URLSearchParams('metrics=endingSubscriptionCount,fantasyCount'),
      defaults(),
      NOW
    );

    expect(Object.keys(decoded.clientFilter)).toEqual(
      Object.keys(DEFAULT_AUDIENCE_CLIENT_FILTER)
    );
    expect(decoded.clientFilter.endingSubscriptionCount).toBe(true);
  });

  it('distinguishes an empty metric list from a missing one', () => {
    const cleared = decodeAudienceFilter(
      new URLSearchParams('metrics='),
      defaults(),
      NOW
    );
    const missing = decodeAudienceFilter(
      new URLSearchParams(),
      defaults(),
      NOW
    );

    expect(Object.values(cleared.clientFilter).some(Boolean)).toBe(false);
    expect(missing.clientFilter).toEqual(DEFAULT_AUDIENCE_CLIENT_FILTER);
  });

  it('reads the member plans and treats an empty list as no filter', () => {
    expect(
      decodeAudienceFilter(
        new URLSearchParams('plans=abc,def'),
        defaults(),
        NOW
      ).memberPlanIds
    ).toEqual(['abc', 'def']);

    expect(
      decodeAudienceFilter(new URLSearchParams('plans='), defaults(), NOW)
        .memberPlanIds
    ).toEqual([]);
  });

  it('reads the visible components', () => {
    const decoded = decodeAudienceFilter(
      new URLSearchParams('show=table'),
      defaults(),
      NOW
    );

    expect(decoded.componentFilter.chart).toBe(false);
    expect(decoded.componentFilter.table).toBe(true);
  });

  it('survives a query string that is not a filter at all', () => {
    const fallback = defaults();

    expect(
      decodeAudienceFilter(new URLSearchParams('%%broken'), fallback, NOW)
    ).toEqual(fallback);
  });
});

describe('encode and decode round trip', () => {
  it('restores a hand picked selection', () => {
    const state = defaults({
      resolution: 'monthly',
      dateRange: [new Date(2026, 2, 3), new Date(2026, 3, 17)],
      memberPlanIds: ['abc'],
      clientFilter: {
        ...DEFAULT_AUDIENCE_CLIENT_FILTER,
        endingSubscriptionCount: true,
      },
      componentFilter: { filter: true, chart: false, table: true },
    });

    const restored = decodeAudienceFilter(
      encodeAudienceFilter(state, { now: NOW }),
      defaults(),
      NOW
    );

    expect(restored).toEqual(state);
  });

  it('restores a preset selection', () => {
    const { today, lastYear } = preDefinedDates(NOW);
    const state = defaults({ dateRange: [lastYear, today] });

    const restored = decodeAudienceFilter(
      encodeAudienceFilter(state, { now: NOW }),
      defaults(),
      NOW
    );

    expect(restored).toEqual(state);
  });
});

describe('mergeAudienceFilterParams', () => {
  it('replaces the filter parameters and keeps the foreign ones', () => {
    const merged = mergeAudienceFilterParams(
      new URLSearchParams('tab=jobs&range=lastYear&metrics=a'),
      new URLSearchParams('range=lastWeek&show=chart')
    );

    expect(merged.get('tab')).toBe('jobs');
    expect(merged.get('range')).toBe('lastWeek');
    expect(merged.get('show')).toBe('chart');
    expect(merged.get('metrics')).toBeNull();
  });

  it('does not mutate the given parameters', () => {
    const current = new URLSearchParams('range=lastYear');

    mergeAudienceFilterParams(current, new URLSearchParams('range=lastWeek'));

    expect(current.get('range')).toBe('lastYear');
  });
});
