import {useLayoutEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
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
import {Placeholder} from 'rsuite'

import {AudienceStatsComputed} from './useAudience'
import {AudienceClientFilter} from './useAudienceFilter'

export const chartColors: {[K in keyof AudienceClientFilter]: string} = {
  createdSubscriptionCount: 'var(--rs-green-900)',
  createdUnpaidSubscriptionCount: 'var(--rs-violet-900)',
  deactivatedSubscriptionCount: 'var(--rs-orange-900)',
  renewedSubscriptionCount: 'var(--rs-blue-900)',
  replacedSubscriptionCount: 'var(--rs-cyan-900)',
  totalActiveSubscriptionCount: 'var(--rs-red-900)'
}

interface AudienceChartProps {
  audienceStats: AudienceStatsComputed[]
  clientFilter: AudienceClientFilter
  loading?: boolean
}

export function AudienceChart({clientFilter, audienceStats, loading}: AudienceChartProps) {
  const {
    t,
    i18n: {language}
  } = useTranslation()

  const {
    totalActiveSubscriptionCount,
    createdSubscriptionCount,
    renewedSubscriptionCount,
    createdUnpaidSubscriptionCount,
    replacedSubscriptionCount,
    deactivatedSubscriptionCount
  } = clientFilter

  // Ensure the ResponsiveContainer does not render outside the viewport during initial load.
  const readyRenderChart = !!audienceStats.length

  return (
    readyRenderChart && (
      <ResponsiveContainer width="100%" height={400}>
        {loading ? (
          <Placeholder.Graph active />
        ) : (
          <ComposedChart data={audienceStats} reverseStackOrder>
            <XAxis
              dataKey={'date'}
              tick={({x, y, payload}) => (
                <text x={x} y={y + 15} textAnchor="middle">
                  {new Date(payload.value).toLocaleDateString(language, {dateStyle: 'short'})}
                </text>
              )}
            />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip
              formatter={(value, name, item) => [value, t(`audience.legend.${name}`)]}
              labelFormatter={label =>
                new Date(label).toLocaleDateString(language, {dateStyle: 'medium'})
              }
            />
            <Legend
              formatter={value => t(`audience.legend.${value}`)}
              verticalAlign={'bottom'}
              align="center"
              layout="horizontal"
            />

            <ReferenceLine y={0} />

            {totalActiveSubscriptionCount && (
              <Line
                type={'monotone'}
                dataKey={'totalActiveSubscriptionCount'}
                stroke={chartColors.totalActiveSubscriptionCount}
                strokeWidth={2}
                fill={chartColors.totalActiveSubscriptionCount}
              />
            )}

            {createdSubscriptionCount && (
              <Bar
                stackId="created"
                dataKey={'createdSubscriptionCount'}
                fill={chartColors.createdSubscriptionCount}
              />
            )}
            {renewedSubscriptionCount && (
              <Bar
                stackId="created"
                dataKey={'renewedSubscriptionCount'}
                fill={chartColors.renewedSubscriptionCount}
              />
            )}
            {createdUnpaidSubscriptionCount && (
              <Bar
                stackId="created"
                dataKey={'createdUnpaidSubscriptionCount'}
                fill={chartColors.createdUnpaidSubscriptionCount}
              />
            )}
            {replacedSubscriptionCount && (
              <Bar
                stackId="created"
                dataKey={'replacedSubscriptionCount'}
                fill={chartColors.replacedSubscriptionCount}
              />
            )}
            {deactivatedSubscriptionCount && (
              <Bar
                stackId="created"
                dataKey={'deactivatedSubscriptionCount'}
                fill={chartColors.deactivatedSubscriptionCount}
              />
            )}
          </ComposedChart>
        )}
      </ResponsiveContainer>
    )
  )
}
