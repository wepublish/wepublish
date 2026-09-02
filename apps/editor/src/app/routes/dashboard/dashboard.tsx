import styled from '@emotion/styled';
import {
  ActivityFeed,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdChevronRight } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, Col, Grid, Panel as RPanel, Row } from 'rsuite';

import { AudienceDashboard } from '../audience/audience-dashboard';
import NetworkContentDashboard from '../networkContent/networkContentDashboard';
import { DashboardNotifications } from './dashboardNotifications';
import { ExternalAppsDashboard } from './externalAppsDashboard';

const StyledGrid = styled(Grid)`
  width: 100%;
`;

const NotificationsPanel = styled(RPanel)`
  margin-bottom: 12px;
`;

export function Dashboard() {
  const { t } = useTranslation();

  return (
    <StyledGrid fluid>
      <Row>
        {/* left column stack */}
        <Col xs={12}>
          <Row gutter={12}>
            <Col xs={24}>
              <NotificationsPanel
                header={
                  <ListViewContainer>
                    <ListViewHeader>
                      <h2>{t('dashboard.notifications')}</h2>
                    </ListViewHeader>

                    <ListViewActions>
                      <Link to="/notifications">
                        <Button
                          appearance="primary"
                          endIcon={<MdChevronRight />}
                        >
                          {t('dashboard.showAllNotifications')}
                        </Button>
                      </Link>
                    </ListViewActions>
                  </ListViewContainer>
                }
                bordered
              >
                <DashboardNotifications />
              </NotificationsPanel>
            </Col>

            <Col xs={24}>
              <RPanel
                header={<h2>{t('dashboard.externalApps')}</h2>}
                bordered
              >
                <ExternalAppsDashboard />
              </RPanel>
            </Col>

            <Col xs={24}>
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
          </Row>
        </Col>

        {/* right column stack */}
        <Col xs={12}>
          <Row gutter={12}>
            <Col xs={24}>
              <RPanel
                header={
                  <ListViewContainer>
                    <ListViewHeader>
                      <h2>{t('dashboard.networkContent')}</h2>
                    </ListViewHeader>

                    <ListViewActions>
                      <Link to="/network">
                        <Button
                          appearance="primary"
                          endIcon={<MdChevronRight />}
                        >
                          {t('dashboard.goToNetwork')}
                        </Button>
                      </Link>
                    </ListViewActions>
                  </ListViewContainer>
                }
                bordered
              >
                <NetworkContentDashboard />
              </RPanel>
            </Col>

            <Col xs={24}>
              <RPanel
                header={<h2>{t('dashboard.activity')}</h2>}
                bordered
              >
                <ActivityFeed />
              </RPanel>
            </Col>
          </Row>
        </Col>
      </Row>
    </StyledGrid>
  );
}
