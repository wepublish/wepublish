import styled from '@emotion/styled';
import { PeriodicJobsLog } from '@wepublish/membership/editor';
import {
  ActivityFeed,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdChevronRight } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, FlexboxGrid, Panel as RPanel } from 'rsuite';

import { AudienceDashboard } from '../audience/audience-dashboard';

const Item = styled(FlexboxGrid.Item)`
  display: grid;
  margin-top: ${({ theme }) => theme.spacing(4)};
`;

export function Dashboard() {
  const { t } = useTranslation();

  return (
    <FlexboxGrid justify="space-between">
      <FlexboxGrid.Item colspan={24}>
        <RPanel
          header={
            <ListViewContainer>
              <ListViewHeader>
                <h2>{t('dashboard.audience')}</h2>
              </ListViewHeader>
              <ListViewActions>
                <Link to="/audience/dashboard">
                  <Button
                    appearance="primary"
                    endIcon={<MdChevronRight />}
                  >
                    {t('dashboard.goToAudienceDashboard')}
                  </Button>
                </Link>
              </ListViewActions>
            </ListViewContainer>
          }
          bordered
        >
          <AudienceDashboard
            hideHeader
            hideFilter
            initialDateRange="lastWeek"
          />
        </RPanel>
      </FlexboxGrid.Item>

      <Item colspan={14}>
        <RPanel
          header={<h2>{t('dashboard.activity')}</h2>}
          bordered
        >
          <ActivityFeed />
        </RPanel>
      </Item>

      <Item colspan={9}>
        <PermissionControl qualifyingPermissions={['CAN_GET_PERIODIC_JOB_LOG']}>
          <RPanel
            header={<h2>{t('periodicJobsLog.title')}</h2>}
            bordered
          >
            <PeriodicJobsLog />
          </RPanel>
        </PermissionControl>
      </Item>
    </FlexboxGrid>
  );
}
