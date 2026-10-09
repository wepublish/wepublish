import styled from '@emotion/styled';
import { Button, Card, CardContent, CardHeader } from '@mui/material';
import {
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { MdChevronRight } from 'react-icons/md';
import { Link } from 'react-router-dom';

import { AudienceDashboard } from '../audience/audience-dashboard';
import NetworkContentDashboard from '../networkContent/networkContentDashboard';
import { DashboardNotifications } from './dashboardNotifications';
import { ExternalAppsDashboard } from './externalAppsDashboard';

const DashboardColumns = styled.div`
  column-count: 2;
  column-gap: 20px;

  > * {
    break-inside: avoid;
    margin: 0 0 20px;
  }

  @media (max-width: 1199px) {
    column-count: 1;
  }
`;

export function Dashboard() {
  const { t } = useTranslation();

  return (
    <DashboardColumns>
      {/* renders its own panel and hides it while there is nothing to show */}
      <DashboardNotifications />

      <Card variant="outlined">
        <CardHeader
          title={
            <h2>
              {t('dashboard.externalApps')}{' '}
              <InfoTooltip text={t('dashboard.externalAppsInfo')} />
            </h2>
          }
        />

        <CardContent>
          <ExternalAppsDashboard />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          title={
            <ListViewContainer>
              <ListViewHeader>
                <h2>{t('dashboard.audience')}</h2>
              </ListViewHeader>

              <ListViewActions>
                <Link to="/audience/dashboard">
                  <Button
                    variant="contained"
                    endIcon={<MdChevronRight />}
                  >
                    {t('dashboard.goToAudienceDashboard')}
                  </Button>
                </Link>
              </ListViewActions>
            </ListViewContainer>
          }
        />

        <CardContent>
          <AudienceDashboard
            hideHeader
            hideFilter
            initialDateRange="lastWeek"
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader
          title={
            <ListViewContainer>
              <ListViewHeader>
                <h2>
                  {t('dashboard.networkContent')}{' '}
                  <InfoTooltip text={t('dashboard.networkContentInfo')} />
                </h2>
              </ListViewHeader>

              <ListViewActions>
                <Link to="/network">
                  <Button
                    variant="contained"
                    endIcon={<MdChevronRight />}
                  >
                    {t('dashboard.goToNetwork')}
                  </Button>
                </Link>
              </ListViewActions>
            </ListViewContainer>
          }
        />

        <CardContent>
          <NetworkContentDashboard />
        </CardContent>
      </Card>
    </DashboardColumns>
  );
}
