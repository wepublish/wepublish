import styled from '@emotion/styled'
import {useMeQuery} from '@wepublish/editor/api'
import {
  ActivityFeed,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  SubscriberChart
} from '@wepublish/ui/editor'
import {useTranslation} from 'react-i18next'
import {FlexboxGrid, Panel as RPanel} from 'rsuite'

const Wrapper = styled(FlexboxGrid)`
  margin-top: 20px;
  height: calc(100vh - 220px);
`

const Item = styled(FlexboxGrid.Item)`
  max-height: 100%;
`

export function Dashboard() {
  const {t} = useTranslation()

  const {data: me} = useMeQuery()
  const name = me?.me?.preferredName ?? me?.me?.firstName ?? me?.me?.name ?? t('dashboard.user')

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('dashboard.dashboard')}</h2>
          <h4>{t('dashboard.greeting', {name})}</h4>
        </ListViewHeader>
      </ListViewContainer>
      <Wrapper justify="space-between">
        <Item colspan={14}>
          <RPanel header={t('dashboard.activity')} bordered>
            <ActivityFeed />
          </RPanel>
        </Item>
        <FlexboxGrid.Item colspan={9}>
          <PermissionControl qualifyingPermissions={['CAN_GET_SUBSCRIPTIONS']}>
            <RPanel header={t('dashboard.yearlySubscribers')} bordered>
              <SubscriberChart />
            </RPanel>
          </PermissionControl>
        </FlexboxGrid.Item>
      </Wrapper>
    </>
  )
}
