import {DailySubscriptionStatsQuery} from '@wepublish/editor/api-v2'
import {ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

interface AudienceChartProps {
  audienceStats: DailySubscriptionStatsQuery | undefined
}

export function AudienceChart({audienceStats}: AudienceChartProps) {
  return (
    <ResponsiveContainer>
      <ComposedChart data={audienceStats?.dailySubscriptionStats || []}>
        <XAxis dataKey={'date'} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type={'monotone'} dataKey={'ongoingSubscriptions'} strokeWidth={2} stroke="#f3cf02" />
        <Line type={'monotone'} dataKey={'renewedSubscriptions'} strokeWidth={2} stroke="#00f365" />
        <Line
          type={'monotone'}
          dataKey={'createdSubscriptionCount'}
          stroke="#ce1515"
          strokeWidth={2}
        />
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
