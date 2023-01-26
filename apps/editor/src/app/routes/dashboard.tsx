import styled from '@emotion/styled'
import {useMeQuery} from '@wepublish/editor/api'
import {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {FlexboxGrid, Panel as RPanel} from 'rsuite'

import {ActivityFeed} from '../atoms/dashboard/activityFeed'
import {SubscriberChart} from '../atoms/dashboard/subscriberChart'
import {PermissionControl} from '../atoms/permissionControl'
import {ListViewContainer, ListViewHeader} from '../ui/listView'

const Wrapper = styled(FlexboxGrid)`
  margin-top: 20px;
  height: calc(100vh - 220px);
`

const Item = styled(FlexboxGrid.Item)`
  max-height: 100%;
  overflow-y: scroll;
`

export function Dashboard() {
  const {t} = useTranslation()

  const {data: me} = useMeQuery()
  const name = useMemo(
    () => me?.me?.preferredName ?? me?.me?.firstName ?? me?.me?.name ?? t('dashboard.user'),
    [me]
  )

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('dashboard.dashboard')}</h2>
          <h4>{t('dashboard.greeting', {name})}</h4>
        </ListViewHeader>
      </ListViewContainer>
      <Wrapper justify="space-around">
        <Item colspan={14}>
          <RPanel header={t('dashboard.activity')} bordered shaded>
            <ActivityFeed />
          </RPanel>
        </Item>
        <FlexboxGrid.Item colspan={9}>
          <PermissionControl qualifyingPermissions={['CAN_GET_SUBSCRIPTIONS']}>
            <RPanel shaded header={t('dashboard.yearlySubscribers')} bordered>
              <SubscriberChart />
            </RPanel>
          </PermissionControl>
        </FlexboxGrid.Item>
      </Wrapper>
    </>
  )
}
