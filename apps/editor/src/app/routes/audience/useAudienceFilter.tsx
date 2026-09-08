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
  dateRangeForPreset,
  DateRangePresetKey,
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
  initialDateRange?: DateRangePresetKey;
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
    return;
  }
};

export function useAudienceFilter({
  fetchStats,
  initialDateRange = 'lastMonth',
  persist = false,
}: UseAudienceFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();

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

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [persist, filterState, searchParams, setSearchParams]);

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
