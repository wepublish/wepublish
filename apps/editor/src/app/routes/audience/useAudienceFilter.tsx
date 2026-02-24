import { LazyQueryExecFunction } from '@apollo/client';
import {
  DailySubscriptionStats,
  DailySubscriptionStatsQuery,
  Exact,
  InputMaybe,
  Scalars,
} from '@wepublish/editor/api';
import { useReducer, useState } from 'react';
import { DateRange } from 'rsuite/esm/DateRangePicker';

export interface AudienceApiFilter {
  dateRange?: DateRange | null;
  memberPlanIds?: string[];
}

export type TimeResolution = 'daily' | 'monthly';

export type AudienceClientFilter = Pick<
  {
    [K in keyof DailySubscriptionStats]: boolean;
  },
  | 'totalActiveSubscriptionCount'
  | 'createdSubscriptionCount'
  | 'overdueSubscriptionCount'
  | 'deactivatedSubscriptionCount'
  | 'renewedSubscriptionCount'
  | 'replacedSubscriptionCount'
  | 'predictedSubscriptionRenewalCount'
  | 'endingSubscriptionCount'
>;

export interface AudienceComponentFilter {
  filter: boolean;
  chart: boolean;
  table: boolean;
}

interface UseAudienceFilterProps {
  fetchStats: LazyQueryExecFunction<
    DailySubscriptionStatsQuery,
    Exact<{
      start: Scalars['DateTime'];
      end?: InputMaybe<Scalars['DateTime']>;
      memberPlanIds?: InputMaybe<Array<Scalars['String']> | Scalars['String']>;
    }>
  >;
}

export function useAudienceFilter({ fetchStats }: UseAudienceFilterProps) {
  const [resolution, setResolution] = useState<TimeResolution>('daily');
  const [audienceClientFilter, setAudienceClientFilter] =
    useState<AudienceClientFilter>({
      totalActiveSubscriptionCount: false,
      createdSubscriptionCount: true,
      overdueSubscriptionCount: true,
      deactivatedSubscriptionCount: true,
      renewedSubscriptionCount: true,
      replacedSubscriptionCount: true,
      predictedSubscriptionRenewalCount: false,
      endingSubscriptionCount: false,
    });
  const [audienceComponentFilter, setAudienceComponentFilter] =
    useState<AudienceComponentFilter>({
      chart: true,
      table: false,
      filter: true,
    });

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
    {}
  );

  return {
    audienceApiFilter,
    setAudienceApiFilter,
    resolution,
    setResolution,
    audienceClientFilter,
    setAudienceClientFilter,
    audienceComponentFilter,
    setAudienceComponentFilter,
  };
}

export interface PreDefinedDates {
  today: Date;
  lastWeek: Date;
  lastMonth: Date;
  lastQuarter: Date;
  lastYear: Date;
  nextWeek: Date;
  nextMonth: Date;
  nextQuarter: Date;
  nextYear: Date;
}

export function preDefinedDates(): PreDefinedDates {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const lastWeek = new Date(new Date().setDate(today.getDate() - 7));
  const lastMonth = new Date(new Date().setMonth(today.getMonth() - 1));
  const lastQuarter = new Date(new Date().setMonth(today.getMonth() - 3));
  const lastYear = new Date(new Date().setFullYear(today.getFullYear() - 1));

  const nextWeek = new Date(new Date().setDate(today.getDate() + 7));
  const nextMonth = new Date(new Date().setMonth(today.getMonth() + 1));
  const nextQuarter = new Date(new Date().setMonth(today.getMonth() + 3));
  const nextYear = new Date(new Date().setFullYear(today.getFullYear() + 1));
  return {
    today,
    lastWeek,
    lastMonth,
    lastQuarter,
    lastYear,
    nextWeek,
    nextMonth,
    nextQuarter,
    nextYear,
  };
}
