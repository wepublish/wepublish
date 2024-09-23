import styled from '@emotion/styled'
import {useMeQuery} from '@wepublish/editor/api'
import {PeriodicJobsLog} from '@wepublish/membership/editor'
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
`

const Item = styled(FlexboxGrid.Item)`
  display: grid;
  gap: 20px;
`

export function Dashboard() {
  const {t} = useTranslation()

  const {data: me} = useMeQuery()
  const name = me?.me?.firstName ?? me?.me?.name ?? t('dashboard.user')

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

        <Item colspan={9}>
          <PermissionControl qualifyingPermissions={['CAN_GET_PERIODIC_JOB_LOG']}>
            <Item colspan={24}>
              <RPanel header={t('periodicJobsLog.title')} bordered>
                <PeriodicJobsLog />
              </RPanel>
            </Item>
          </PermissionControl>

          <PermissionControl qualifyingPermissions={['CAN_GET_SUBSCRIPTIONS']}>
            <RPanel header={t('dashboard.yearlySubscribers')} bordered>
              <SubscriberChart />
            </RPanel>
          </PermissionControl>
        </Item>
      </Wrapper>
    </>
  )
}
