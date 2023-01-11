import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {useMeQuery} from '../api'
import {ActivityFeed} from '../atoms/dashboard/activityFeed'
import {SubscriberChart} from '../atoms/dashboard/subscriberChart'
import {FlexboxGrid} from 'rsuite'
import {PermissionControl} from '../atoms/permissionControl'

export function Dashboard() {
  const {t} = useTranslation()

  const {data: me} = useMeQuery()
  const name = useMemo(() => me?.me?.preferredName ?? me?.me?.firstName ?? me?.me?.name ?? 'User', [
    me
  ])

  return (
    <>
      <h2>{t('dashboard.dashboard')}</h2>
      <h4>{t('dashboard.greeting', {name})}</h4>
      <FlexboxGrid style={{marginTop: 12}}>
        <FlexboxGrid.Item colspan={12}>
          <h4 style={{textAlign: 'center'}}>{t('dashboard.activity')}</h4>
          <ActivityFeed />
        </FlexboxGrid.Item>
        <PermissionControl qualifyingPermissions={['CAN_GET_SUBSCRIPTIONS']}>
          <FlexboxGrid.Item colspan={12}>
            <h4 style={{textAlign: 'center'}}>{t('dashboard.newSubscribers')}</h4>
            <SubscriberChart />
          </FlexboxGrid.Item>
        </PermissionControl>
      </FlexboxGrid>
    </>
  )
}
