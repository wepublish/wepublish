import styled from '@emotion/styled';
import { useZettelkastenEnabledQuery } from '@wepublish/editor/api';
import { PeriodicJobsLog } from '@wepublish/membership/editor';
import {
  ActivityFeed,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { DailyReportCard } from '@wepublish/zettelkasten/editor';
import { useTranslation } from 'react-i18next';
import { MdChevronRight } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, Col, Grid, Panel as RPanel, Row } from 'rsuite';

import { AudienceDashboard } from '../audience/audience-dashboard';
import NetworkContentDashboard from '../networkContent/networkContentDashboard';
import { ExternalAppsDashboard } from './externalAppsDashboard';

const StyledGrid = styled(Grid)`
  width: 100%;
`;

/**
 * The knowledge base card. Its two queries need CAN_CREATE_ARTICLE, so they
 * live here and not in the dashboard itself: PermissionControl renders nothing
 * for a person without that permission, and then neither query ever runs.
 */
function ZettelkastenDashboardPanel() {
  const { t } = useTranslation();
  const { data } = useZettelkastenEnabledQuery({
    fetchPolicy: 'cache-first',
  });

  if (!data?.zettelkastenEnabled) {
    return null;
  }

  return (
    <Col xs={24}>
      <RPanel
        header={<h2>{t('dashboard.zettelkasten')}</h2>}
        bordered
      >
        <DailyReportCard />
      </RPanel>
    </Col>
  );
}

export function Dashboard() {
  const { t } = useTranslation();

  return (
    <StyledGrid fluid>
      <Row>
        {/* left column stack */}
        <Col xs={12}>
          <Row gutter={12}>
            <Col xs={24}>
              <RPanel
                header={<h2>{t('dashboard.externalApps')}</h2>}
                bordered
              >
                <ExternalAppsDashboard />
              </RPanel>
            </Col>

            <PermissionControl qualifyingPermissions={['CAN_CREATE_ARTICLE']}>
              <ZettelkastenDashboardPanel />
            </PermissionControl>

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
          </Row>
        </Col>
      </Row>
    </StyledGrid>
  );
}
