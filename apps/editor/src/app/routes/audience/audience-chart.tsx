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

import {AudienceClientFilter, AudienceStatsComputed} from './audience-dashboard'

interface AudienceChartProps {
  audienceStats: AudienceStatsComputed[]
  clientFilter: AudienceClientFilter
}

export function AudienceChart({clientFilter, audienceStats}: AudienceChartProps) {
  const {
    totalActiveSubscriptionCount,
    createdSubscriptionCount,
    renewedSubscriptionCount,
    createdUnpaidSubscriptionCount,
    replacedSubscriptionCount,
    deactivatedSubscriptionCount
  } = clientFilter

  const chartColors = ['#ed4a8e', '#bf54b6', '#FF5A5F', '#7364cd', '#006dca', '#006db0']

  return (
    <ResponsiveContainer>
      <ComposedChart data={audienceStats}>
        <XAxis dataKey={'date'} />
        <YAxis domain={['auto', 'auto']} stroke="#000" />
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
