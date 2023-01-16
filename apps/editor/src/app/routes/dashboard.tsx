import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {useMeQuery} from '../api'
import {ActivityFeed} from '../atoms/dashboard/activityFeed'
import {SubscriberChart} from '../atoms/dashboard/subscriberChart'
import {FlexboxGrid} from 'rsuite'
import {PermissionControl} from '../atoms/permissionControl'
import styled from '@emotion/styled'

const FlexboxGridStyled = styled(FlexboxGrid)`
  margin-top: 1rem;
`

const GridItemCenterText = styled.h4`
  text-align: center;
`

export function Dashboard() {
  const {t} = useTranslation()

  const {data: me} = useMeQuery()
  const name = useMemo(
    () => me?.me?.preferredName ?? me?.me?.firstName ?? me?.me?.name ?? 'User',
    [me]
  )

  return (
    <>
      <h2>{t('dashboard.dashboard')}</h2>
      <h4>{t('dashboard.greeting', {name})}</h4>
      <FlexboxGridStyled>
        <FlexboxGrid.Item colspan={12}>
          <GridItemCenterText>{t('dashboard.activity')}</GridItemCenterText>
          <ActivityFeed />
        </FlexboxGrid.Item>
        <PermissionControl qualifyingPermissions={['CAN_GET_SUBSCRIPTIONS']}>
          <FlexboxGrid.Item colspan={12}>
            <GridItemCenterText>{t('dashboard.newSubscribers')}</GridItemCenterText>
            <SubscriberChart />
          </FlexboxGrid.Item>
        </PermissionControl>
      </FlexboxGridStyled>
    </>
  )
}
