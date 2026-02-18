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
import { Button, Col, Grid, Panel as RPanel, Row } from 'rsuite';

import { AudienceDashboard } from '../audience/audience-dashboard';

const StyledGrid = styled(Grid)`
  width: 100%;
`;

export function Dashboard() {
  const { t } = useTranslation();

  return (
    <StyledGrid fluid>
      <Row gutter={20}>
        <Col xs={12}>
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
        </Col>

        <Col xs={12}>
          <PermissionControl
            qualifyingPermissions={['CAN_GET_PERIODIC_JOB_LOG']}
          >
            <RPanel
              header={<h2>{t('periodicJobsLog.title')}</h2>}
              bordered
            >
              <PeriodicJobsLog />
            </RPanel>
          </PermissionControl>
        </Col>

        <Col xs={12}>
          <RPanel
            header={<h2>{t('dashboard.activity')}</h2>}
            bordered
          >
            <ActivityFeed />
          </RPanel>
        </Col>
      </Row>
    </StyledGrid>
  );
}
