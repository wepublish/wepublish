import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {FlexboxGrid} from 'rsuite'
import {useMeQuery, useNewSubscribersPastYearQuery} from '../api'
import {BarChart, Bar, Tooltip, CartesianGrid, XAxis, YAxis} from 'recharts'

export function Dashboard() {
  const {t} = useTranslation()

  const {data} = useNewSubscribersPastYearQuery()
  const {data: me} = useMeQuery()

  console.log('me', me?.me?.preferredName ?? me?.me?.firstName ?? me?.me?.name)
  const pastYearSubscriptions = useMemo(() => data?.newSubscribersPastYear ?? [], [data])
  const hasSubscriptions = useMemo(
    () =>
      data?.newSubscribersPastYear?.some(sub => {
        return sub?.subscriberCount ? sub?.subscriberCount > 0 : null
      }) ?? false,
    [data]
  )
  const name = useMemo(() => me?.me?.preferredName ?? me?.me?.firstName ?? me?.me?.name ?? 'User', [
    me
  ])

  return (
    <FlexboxGrid>
      <FlexboxGrid.Item colspan={24}>
        <h2>{t('dashboard.dashboard')}</h2>
        <h3>Hello, {name}!</h3>
      </FlexboxGrid.Item>

      <FlexboxGrid.Item colspan={12} style={{textAlign: 'center', alignContent: 'center'}}>
        {/* New Subscribers past year */}
        <h4>new subscribers over past year</h4>
        <BarChart
          width={500}
          height={300}
          data={pastYearSubscriptions}
          margin={{
            top: 5,
            right: 20,
            left: 20,
            bottom: 5
          }}>
          {!hasSubscriptions && (
            <text
              x="50%"
              y="50%"
              style={{fontSize: 16, fontWeight: 'bold', fill: '#777'}}
              width={200}
              textAnchor="middle">
              No current subscriber data
            </text>
          )}
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Bar radius={[5, 5, 0, 0]} dataKey="subscriberCount" fill="#3498FF" />
        </BarChart>
      </FlexboxGrid.Item>

      {/* Active subscribers per month */}
      <FlexboxGrid.Item colspan={12} style={{textAlign: 'center'}}>
        <h4>active subscribers per month</h4>
        <BarChart
          width={500}
          height={300}
          data={[]}
          margin={{
            top: 5,
            right: 20,
            left: 20,
            bottom: 5
          }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />

          <Bar dataKey="amount" fill="#8884d8" />
        </BarChart>
      </FlexboxGrid.Item>
      <h4>Latest activity</h4>
    </FlexboxGrid>
  )
}

// const CheckedPermissionComponent = createCheckedPermissionComponent([

// ])(Dashboard)
// export {CheckedPermissionComponent as Dashboard}
