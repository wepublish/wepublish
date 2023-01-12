import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {BarChart, Bar, XAxis, YAxis, ResponsiveContainer} from 'recharts'
import {useNewSubscribersPastYearQuery} from '../../api'

export function SubscriberChart() {
  const {t} = useTranslation()
  const {data, loading} = useNewSubscribersPastYearQuery()

  const pastYearSubscriptions = useMemo(() => data?.newSubscribersPastYear ?? [], [data])
  const hasSubscriptions = useMemo(
    () =>
      data?.newSubscribersPastYear?.some(sub => {
        return sub?.subscriberCount ? sub?.subscriberCount > 0 : null
      }) ?? false,
    [data]
  )

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        height={300}
        data={pastYearSubscriptions}
        margin={{
          top: 5,
          right: 20,
          left: 20,
          bottom: 5
        }}>
        {!hasSubscriptions ||
          (loading && (
            <text
              x="50%"
              y="50%"
              style={{fontSize: 16, fontWeight: 'bold', fill: '#777'}}
              width={200}
              textAnchor="middle">
              {t('dashboard.noData')}
            </text>
          ))}
        <XAxis dataKey="month" />
        <YAxis allowDecimals={false} />
        <Bar radius={[5, 5, 0, 0]} dataKey="subscriberCount" fill="#3498FF" />
      </BarChart>
    </ResponsiveContainer>
  )
}
