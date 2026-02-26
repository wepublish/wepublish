import { useTranslation } from 'react-i18next';
import {
  Bar,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Placeholder } from 'rsuite';

import { AudienceStatsComputed } from './useAudience';
import { AudienceClientFilter } from './useAudienceFilter';

export const chartColors: {
  [K in keyof AudienceClientFilter]: string | string[];
} = {
  createdSubscriptionCount: 'var(--rs-green-900)',
  overdueSubscriptionCount: 'var(--rs-violet-900)',
  deactivatedSubscriptionCount: 'var(--rs-orange-900)',
  renewedSubscriptionCount: 'var(--rs-blue-900)',
  replacedSubscriptionCount: 'var(--rs-cyan-900)',
  totalActiveSubscriptionCount: 'var(--rs-red-900)',
  predictedSubscriptionRenewalCount: [
    'var(--rs-cyan-500)',
    'var(--rs-orange-300)',
    'var(--rs-blue-900)',
  ],
  endingSubscriptionCount: 'var(--rs-red-300)',
};

interface AudienceChartProps {
  audienceStats: AudienceStatsComputed[];
  clientFilter: AudienceClientFilter;
  loading?: boolean;
}

export function AudienceChart({
  clientFilter,
  audienceStats,
  loading,
}: AudienceChartProps) {
  const {
    t,
    i18n: { language },
  } = useTranslation();

  const {
    totalActiveSubscriptionCount,
    createdSubscriptionCount,
    renewedSubscriptionCount,
    overdueSubscriptionCount,
    replacedSubscriptionCount,
    deactivatedSubscriptionCount,
    predictedSubscriptionRenewalCount,
    endingSubscriptionCount,
  } = clientFilter;

  // Ensure the ResponsiveContainer does not render outside the viewport during initial load.
  const readyRenderChart = !!audienceStats.length;

  return (
    readyRenderChart && (
      <ResponsiveContainer
        width="100%"
        height={400}
      >
        {loading ?
          <Placeholder.Graph active />
        : <ComposedChart data={audienceStats}>
            <XAxis
              dataKey={'date'}
              tick={({ x, y, payload }) => (
                <text
                  x={x}
                  y={y + 15}
                  textAnchor="middle"
                >
                  {new Date(payload.value).toLocaleDateString(language, {
                    dateStyle: 'short',
                  })}
                </text>
              )}
            />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip
              formatter={(value, name, item) => [
                value,
                t([
                  `audience.legend.${name}`,
                  `audience.legend.${(name as string).split('.').join('_variants.')}`,
                ]),
              ]}
              labelFormatter={label =>
                new Date(label).toLocaleDateString(language, {
                  dateStyle: 'medium',
                })
              }
            />
            <Legend
              formatter={value =>
                t([
                  `audience.legend.${value}`,
                  `audience.legend.${value.split('.').join('_variants.')}`,
                ])
              }
              verticalAlign={'bottom'}
              align="center"
              layout="horizontal"
            />

            <ReferenceLine y={0} />

            {totalActiveSubscriptionCount && (
              <Line
                type={'monotone'}
                dataKey={'totalActiveSubscriptionCount'}
                stroke={chartColors.totalActiveSubscriptionCount as string}
                strokeWidth={1}
                fill={chartColors.totalActiveSubscriptionCount as string}
                dot={false}
                activeDot={1 > 0}
              />
            )}
            {renewedSubscriptionCount && (
              <Bar
                stackId="created"
                dataKey={'renewedSubscriptionCount'}
                fill={chartColors.renewedSubscriptionCount as string}
              />
            )}
            {replacedSubscriptionCount && (
              <Bar
                stackId="created"
                dataKey={'replacedSubscriptionCount'}
                fill={chartColors.replacedSubscriptionCount as string}
              />
            )}
            {createdSubscriptionCount && (
              <Bar
                stackId="created"
                dataKey={'createdSubscriptionCount'}
                fill={chartColors.createdSubscriptionCount as string}
              />
            )}
            {overdueSubscriptionCount && (
              <Bar
                stackId="deactivated"
                dataKey={'overdueSubscriptionCount'}
                fill={chartColors.overdueSubscriptionCount as string}
              />
            )}
            {deactivatedSubscriptionCount && (
              <Bar
                stackId="deactivated"
                dataKey={'deactivatedSubscriptionCount'}
                fill={chartColors.deactivatedSubscriptionCount as string}
              />
            )}
            {predictedSubscriptionRenewalCount && (
              <>
                <Bar
                  stackId={'renewal'}
                  dataKey={
                    'predictedSubscriptionRenewalCount.perDayHighProbability'
                  }
                  fill={chartColors.predictedSubscriptionRenewalCount[0]}
                />
                <Bar
                  stackId={'renewal'}
                  dataKey={
                    'predictedSubscriptionRenewalCount.perDayLowProbability'
                  }
                  fill={chartColors.predictedSubscriptionRenewalCount[1]}
                />
              </>
            )}
            {endingSubscriptionCount && (
              <Bar
                stackId="deactivated"
                dataKey={'endingSubscriptionCount'}
                fill={chartColors.endingSubscriptionCount as string}
              />
            )}
          </ComposedChart>
        }
      </ResponsiveContainer>
    )
  );
}
