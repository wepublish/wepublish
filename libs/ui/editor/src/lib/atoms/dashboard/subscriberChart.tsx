import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {BarChart, Bar, XAxis, YAxis, ResponsiveContainer} from 'recharts'
import styled from '@emotion/styled'
import {useNewSubscribersPerMonthQuery} from '@wepublish/editor/api'
import {Loader} from 'rsuite'

const BarChartErrorText = styled.p`
  font-size: 1rem;
  font-style: italic;
  text-align: center;
  margin-top: 2rem;
`

export function SubscriberChart() {
  const {t} = useTranslation()
  const {data, loading} = useNewSubscribersPerMonthQuery({variables: {months: 12}})

  const pastYearSubscriptions = data?.newSubscribersPerMonth ?? []
  const hasSubscriptions = useMemo(
    () =>
      data?.newSubscribersPerMonth?.some(sub => {
        return sub?.subscriberCount ? sub?.subscriberCount > 0 : null
      }) ?? false,
    [data?.newSubscribersPerMonth]
  )

  const barChart = hasSubscriptions ? (
    <BarChart height={300} data={pastYearSubscriptions} margin={{left: -40}}>
      <XAxis minTickGap={0} fontSize={10} width={10} dataKey="month" />
      <YAxis allowDecimals={false} />
      <Bar radius={[5, 5, 0, 0]} dataKey="subscriberCount" fill="#3498ff" />
    </BarChart>
  ) : (
    <BarChartErrorText>{t('dashboard.noData')}</BarChartErrorText>
  )

  return (
    <ResponsiveContainer width="100%" height={300}>
      {loading ? <Loader center /> : barChart}
    </ResponsiveContainer>
  )
}
