import { LazyQueryExecFunction } from '@apollo/client';
import {
  DailySubscriptionStatsQuery,
  Exact,
  InputMaybe,
  LocalStorageKey,
  Scalars,
} from '@wepublish/editor/api';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
  AudienceApiFilter,
  AudienceClientFilter,
  AudienceComponentFilter,
  AudienceFilterState,
  DateRangePresetKey,
  dateRangeForPreset,
  decodeAudienceFilter,
  DEFAULT_AUDIENCE_CLIENT_FILTER,
  DEFAULT_AUDIENCE_COMPONENT_FILTER,
  encodeAudienceFilter,
  hasAudienceFilterParams,
  mergeAudienceFilterParams,
  TimeResolution,
} from './audience-filter-params';

interface UseAudienceFilterProps {
  fetchStats: LazyQueryExecFunction<
    DailySubscriptionStatsQuery,
    Exact<{
      start: Scalars['DateTime'];
      end?: InputMaybe<Scalars['DateTime']>;
      memberPlanIds?: InputMaybe<Array<Scalars['String']> | Scalars['String']>;
    }>
  >;
  /** Which one-click range to start from when there is nothing to restore. */
  initialDateRange?: DateRangePresetKey;
  /**
   * Mirror the selection into the URL and into this browser's storage, so it
   * can be bookmarked, shared and comes back on the next visit. Off for the
   * summary on the start page, which would otherwise hijack its address.
   */
  persist?: boolean;
}

const readStoredParams = () => {
  try {
    return new URLSearchParams(
      window.localStorage.getItem(LocalStorageKey.AudienceDashboardFilter) ?? ''
    );
  } catch {
    return new URLSearchParams();
  }
};

const storeParams = (params: URLSearchParams) => {
  try {
    window.localStorage.setItem(
      LocalStorageKey.AudienceDashboardFilter,
      params.toString()
    );
  } catch {
    // A browser that refuses storage still gets the selection in the URL.
  }
};

export function useAudienceFilter({
  fetchStats,
  initialDateRange = 'lastMonth',
  persist = false,
}: UseAudienceFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();

  // Computed once: a shared link wins over what this browser remembers, and
  // both win over the defaults.
  const [initialState] = useState<AudienceFilterState>(() => {
    const defaults: AudienceFilterState = {
      resolution: 'daily',
      dateRange: dateRangeForPreset(initialDateRange),
      memberPlanIds: [],
      clientFilter: DEFAULT_AUDIENCE_CLIENT_FILTER,
      componentFilter: DEFAULT_AUDIENCE_COMPONENT_FILTER,
    };

    if (!persist) {
      return defaults;
    }

    const params =
      hasAudienceFilterParams(searchParams) ? searchParams : readStoredParams();

    return decodeAudienceFilter(params, defaults);
  });

  const [resolution, setResolution] = useState<TimeResolution>(
    initialState.resolution
  );
  const [audienceClientFilter, setAudienceClientFilter] =
    useState<AudienceClientFilter>(initialState.clientFilter);
  const [audienceComponentFilter, setAudienceComponentFilter] =
    useState<AudienceComponentFilter>(initialState.componentFilter);

  const [audienceApiFilter, setAudienceApiFilter] = useReducer(
    (state: AudienceApiFilter, action: AudienceApiFilter) => {
      const dateRange = action.dateRange || state.dateRange;
      const memberPlanIds = action.memberPlanIds || state.memberPlanIds;

      if (!dateRange || dateRange.length < 2) {
        return action;
      }

      fetchStats({
        variables: {
          start: dateRange[0].toISOString(),
          end: dateRange[1].toISOString(),
          memberPlanIds,
        },
        fetchPolicy: 'cache-first',
      });
      return {
        dateRange,
        memberPlanIds,
      };
    },
    {
      dateRange: initialState.dateRange,
      memberPlanIds: initialState.memberPlanIds,
    }
  );

  // Triggers the initial data load; every later change fetches through the reducer.
  useEffect(() => {
    setAudienceApiFilter({});
  }, [setAudienceApiFilter]);

  const filterState = useMemo<AudienceFilterState>(
    () => ({
      resolution,
      dateRange: audienceApiFilter.dateRange ?? null,
      memberPlanIds: audienceApiFilter.memberPlanIds ?? [],
      clientFilter: audienceClientFilter,
      componentFilter: audienceComponentFilter,
    }),
    [
      resolution,
      audienceApiFilter,
      audienceClientFilter,
      audienceComponentFilter,
    ]
  );

  useEffect(() => {
    if (!persist) {
      return;
    }

    const params = encodeAudienceFilter(filterState);
    storeParams(params);

    const next = mergeAudienceFilterParams(searchParams, params);

    // Comparing before navigating keeps the effect from re-triggering itself.
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [persist, filterState, searchParams, setSearchParams]);

  /** The current view as a link whose date range stays put instead of rolling along. */
  const buildPermalink = useCallback(() => {
    const params = mergeAudienceFilterParams(
      searchParams,
      encodeAudienceFilter(filterState, { absoluteDates: true })
    );

    return `${window.location.origin}${pathname}?${params}`;
  }, [filterState, pathname, searchParams]);

  return {
    audienceApiFilter,
    setAudienceApiFilter,
    resolution,
    setResolution,
    audienceClientFilter,
    setAudienceClientFilter,
    audienceComponentFilter,
    setAudienceComponentFilter,
    buildPermalink,
  };
}
