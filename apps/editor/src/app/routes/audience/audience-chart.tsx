import {DailySubscriptionStatsQuery} from '@wepublish/editor/api-v2'
import {useMemo} from 'react'
import {
  Bar,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import {AudienceClientFilter} from './audience-dashboard'

interface AudienceChartProps {
  audienceStats: DailySubscriptionStatsQuery | undefined
  activeFilters: AudienceClientFilter
}

export function AudienceChart({activeFilters, audienceStats}: AudienceChartProps) {
  const {
    totalActiveSubscriptionCount,
    createdSubscriptionCount,
    renewedSubscriptionCount,
    createdUnpaidSubscriptionCount,
    replacedSubscriptionCount,
    deactivatedSubscriptionCount
  } = activeFilters

  const chartColors = ['#ed4a8e', '#bf54b6', '#FF5A5F', '#7364cd', '#006dca', '#006db0']

  const dataWithNegativeDeactivated = useMemo(() => {
    return (
      audienceStats?.dailySubscriptionStats.map(stats => {
        return {
          ...stats,
          deactivatedSubscriptionCount: -stats.deactivatedSubscriptionCount
        }
      }) || []
    )
  }, [audienceStats?.dailySubscriptionStats])

  return (
    <ResponsiveContainer>
      <ComposedChart data={dataWithNegativeDeactivated}>
        <XAxis dataKey={'date'} />
        <YAxis stroke="#000" />
        <Tooltip />
        <Legend />

        <ReferenceLine y={0} stroke="#000" />

        {totalActiveSubscriptionCount && (
          <Line
            type={'monotone'}
            dataKey={'totalActiveSubscriptionCount'}
            stroke={chartColors[0]}
            strokeWidth={2}
            fill={chartColors[0]}
          />
        )}

        {deactivatedSubscriptionCount && (
          <Bar stackId="created" dataKey={'deactivatedSubscriptionCount'} fill={chartColors[5]} />
        )}

        {createdSubscriptionCount && (
          <Bar stackId="created" dataKey={'createdSubscriptionCount'} fill={chartColors[1]} />
        )}
        {renewedSubscriptionCount && (
          <Bar stackId="created" dataKey={'renewedSubscriptionCount'} fill={chartColors[2]} />
        )}
        {createdUnpaidSubscriptionCount && (
          <Bar stackId="created" dataKey={'createdUnpaidSubscriptionCount'} fill={chartColors[3]} />
        )}
        {replacedSubscriptionCount && (
          <Bar stackId="created" dataKey={'replacedSubscriptionCount'} fill={chartColors[4]} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
