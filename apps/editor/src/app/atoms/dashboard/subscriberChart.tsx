import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {BarChart, Bar, XAxis, YAxis, ResponsiveContainer} from 'recharts'
import styled from '@emotion/styled'
import {useNewSubscribersPerMonthQuery} from '@wepublish/editor/api'

const BarChartErrorText = styled.p`
  font-size: 1rem;
  font-style: italic;
  text-align: center;
  margin-top: 2rem;
`

export function SubscriberChart() {
  const {t} = useTranslation()
  const {data, loading} = useNewSubscribersPerMonthQuery({variables: {months: 12}})

  const pastYearSubscriptions = useMemo(() => data?.newSubscribersPerMonth ?? [], [data])
  const hasSubscriptions = useMemo(
    () =>
      data?.newSubscribersPerMonth?.some(sub => {
        return sub?.subscriberCount ? sub?.subscriberCount > 0 : null
      }) ?? false,
    [data?.newSubscribersPerMonth]
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
          <XAxis fontSize={10} width={12} dataKey="month" />
          <YAxis allowDecimals={false} />
          <Bar radius={[5, 5, 0, 0]} dataKey="subscriberCount" fill="#3498ff" />
        </BarChart>
      ) : (
        <BarChartErrorText>{t('dashboard.noData')}</BarChartErrorText>
      )}
    </ResponsiveContainer>
  )
}
