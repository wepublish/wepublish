import {ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts'

import {AudienceStat} from './audience-data-mocker'

interface AudienceChartProps {
  audienceStats: AudienceStat[]
}

export function AudienceChart({audienceStats}: AudienceChartProps) {
  return (
    <ResponsiveContainer>
      <ComposedChart data={audienceStats}>
        <XAxis dataKey={'date'} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type={'monotone'} dataKey={'ongoingSubscriptions'} strokeWidth={2} stroke="#f3cf02" />
        <Line type={'monotone'} dataKey={'renewedSubscriptions'} strokeWidth={2} stroke="#00f365" />
        <Line
          type={'monotone'}
          dataKey={'cancelledSubscriptions'}
          stroke="#ce1515"
          strokeWidth={2}
        />
        <Line type={'monotone'} dataKey={'newSubscriptions'} stroke="#7b15ce" strokeWidth={2} />
        <Line
          type={'monotone'}
          dataKey={'totalActiveSubscriptions'}
          stroke="#0d42f0"
          strokeWidth={2}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
