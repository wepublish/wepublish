import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {BarChart, Bar, XAxis, YAxis, ResponsiveContainer} from 'recharts'
import {useNewSubscribersPastYearQuery} from '../../api'
import styled from '@emotion/styled'

const BarChartErrorText = styled.p`
  font-size: 1rem;
  font-style: italic;
  text-align: center;
  margin-top: 2rem;
`

export function SubscriberChart() {
  const {t} = useTranslation()
  const {data, loading} = useNewSubscribersPastYearQuery()
  // @ts-ignore
  const fillColor = '#3498ff'

  const pastYearSubscriptions = useMemo(() => data?.newSubscribersPastYear ?? [], [data])
  const hasSubscriptions = useMemo(
    () =>
      data?.newSubscribersPastYear?.some(sub => {
        return sub?.subscriberCount ? sub?.subscriberCount > 0 : null
      }) ?? false,
    [data?.newSubscribersPastYear]
  )

  return (
    <ResponsiveContainer width="100%" height={300}>
      {hasSubscriptions && !loading ? (
        <BarChart
          height={300}
          data={pastYearSubscriptions}
          margin={{
            top: 5,
            right: 20,
            left: 20,
            bottom: 5
          }}>
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Bar radius={[5, 5, 0, 0]} dataKey="subscriberCount" fill={fillColor} />
        </BarChart>
      ) : (
        <BarChartErrorText>{t('dashboard.noData')}</BarChartErrorText>
      )}
    </ResponsiveContainer>
  )
}
