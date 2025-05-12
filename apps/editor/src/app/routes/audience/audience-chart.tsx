import {DailySubscriptionStatsQuery} from '@wepublish/editor/api-v2'
import {ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

import {ActiveAudienceFilters} from './audience-dashboard'

interface AudienceChartProps {
  audienceStats: DailySubscriptionStatsQuery | undefined
  activeFilters: ActiveAudienceFilters
}

export function AudienceChart({activeFilters, audienceStats}: AudienceChartProps) {
  const {totalActiveSubscriptionCount} = activeFilters

  return (
    <ResponsiveContainer>
      <ComposedChart data={audienceStats?.dailySubscriptionStats || []}>
        <XAxis dataKey={'date'} />
        <YAxis />
        <Tooltip />
        <Legend />

        {totalActiveSubscriptionCount && (
          <Line
            type={'monotone'}
            dataKey={'totalActiveSubscriptionCount'}
            stroke="#ce1515"
            strokeWidth={2}
            fill="#ce1515"
          />
        )}

        <Line
          type={'monotone'}
          dataKey={'renewedSubscriptionCount'}
          stroke="#7b15ce"
          strokeWidth={2}
        />
        <Line
          type={'monotone'}
          dataKey={'deactivatedSubscriptionCount'}
          stroke="#0d42f0"
          strokeWidth={2}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
