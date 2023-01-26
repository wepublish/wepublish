import styled from '@emotion/styled'
import {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {ActivityFeed} from '../atoms/dashboard/activityFeed'
import {SubscriberChart} from '../atoms/dashboard/subscriberChart'
import {FlexboxGrid, Panel as RPanel} from 'rsuite'
import {PermissionControl} from '../atoms/permissionControl'
import {useMeQuery} from '@wepublish/editor/api'
import {ListViewContainer, ListViewHeader} from '../ui/listView'

const Wrapper = styled(FlexboxGrid)`
  height: 100%;
  margin-top: 20px;
  overflow-y: scroll;
`

const Item = styled(FlexboxGrid.Item)`
  height: 100%;
`

const Panel = styled(RPanel)`
  min-height: 100%;
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
          <Panel bodyFill header={t('dashboard.activity')} bordered shaded>
            <ActivityFeed />
          </Panel>
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
