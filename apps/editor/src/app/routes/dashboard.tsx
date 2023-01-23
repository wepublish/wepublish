import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {ActivityFeed} from '../atoms/dashboard/activityFeed'
import {SubscriberChart} from '../atoms/dashboard/subscriberChart'
import {FlexboxGrid, Panel} from 'rsuite'
import {PermissionControl} from '../atoms/permissionControl'
import styled from '@emotion/styled'
import {useMeQuery} from '@wepublish/editor/api'
import {
  ListViewActions,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader
} from '../ui/listView'

export function Dashboard() {
  const {t} = useTranslation()

  const {data: me} = useMeQuery()
  const name = useMemo(
    () => me?.me?.preferredName ?? me?.me?.firstName ?? me?.me?.name ?? 'User',
    [me]
  )

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('dashboard.dashboard')}</h2>
        </ListViewHeader>
      </ListViewContainer>
      <h4>{t('dashboard.greeting', {name})}</h4>
      <FlexboxGrid justify="space-around">
        <FlexboxGrid.Item colspan={14}>
          <Panel bodyFill header={t('dashboard.activity')} bordered shaded>
            <ActivityFeed />
          </Panel>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={9}>
          <PermissionControl qualifyingPermissions={['CAN_GET_SUBSCRIPTIONS']}>
            <Panel shaded header={t('dashboard.yearlySubscribers')} bordered>
              <SubscriberChart />
            </Panel>
          </PermissionControl>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </>
  )
}
