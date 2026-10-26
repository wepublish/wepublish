import styled from '@emotion/styled';
import { Button, Card, CardContent, CardHeader } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { ActivityFeed, InfoTooltip, PageTitle } from '@wepublish/ui/editor';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdChevronRight, MdTune } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';

import { AudienceDashboard } from '../audience/audience-dashboard';
import { ScrollContainer } from '../networkContent/networkContent.styles';
import NetworkContentDashboard from '../networkContent/networkContentDashboard';
import { DashboardConfig } from './dashboardConfig';
import {
  DashboardCardId,
  isDashboardCardFullWidth,
  visibleDashboardCards,
} from './dashboardLayout';
import { DashboardNotifications } from './dashboardNotifications';
import { ExternalAppsDashboard } from './externalAppsDashboard';
import { useDashboardLayout } from './useDashboardLayout';

const DashboardToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing(1.5)};
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(240px, auto);
  gap: ${({ theme }) => theme.spacing(2.5)};

  @media (max-width: 1199px) {
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: auto;
  }
`;

const DashboardCard = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;

  &:empty {
    display: none;
  }

  &[data-full-width='true'] {
    grid-column: 1 / -1;
  }

  > .MuiCard-root {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  > .MuiCard-root[hidden] {
    display: none;
  }

  .MuiCardContent-root {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &[data-dashboard-card='network'] .MuiCardContent-root {
    min-height: 360px;
    overflow: hidden;
    contain: size;
  }

  &[data-dashboard-card='network'] ${ScrollContainer} {
    flex: 1;
    min-height: 0;
    max-height: none;
  }

  @media (min-width: 1200px) {
    &[data-dashboard-card='externalApps'] .MuiCardContent-root {
      overflow: auto;
      contain: size;
    }
  }
`;

export function Dashboard() {
  const { t } = useTranslation();
  const [layout, setLayout] = useDashboardLayout();
  const [configOpen, setConfigOpen] = useState(false);

  const cards: Record<DashboardCardId, ReactNode> = {
    notifications: <DashboardNotifications />,

    network: (
      <Card>
        <CardHeader
          title={
            <>
              {t('dashboard.networkContent')}{' '}
              <InfoTooltip text={t('dashboard.networkContentInfo')} />
            </>
          }
          slotProps={{ title: { variant: 'h2', component: 'h2' } }}
          action={
            <Button
              component={RouterLink}
              to="/network"
              variant="text"
              endIcon={<MdChevronRight />}
            >
              {t('dashboard.goToNetwork')}
            </Button>
          }
        />

        <CardContent>
          <NetworkContentDashboard />
        </CardContent>
      </Card>
    ),

    activity: (
      <Card>
        <CardHeader
          title={
            <>
              {t('dashboard.activity')}{' '}
              <InfoTooltip text={t('dashboard.activityInfo')} />
            </>
          }
          slotProps={{ title: { variant: 'h2', component: 'h2' } }}
        />

        <CardContent>
          <ActivityFeed />
        </CardContent>
      </Card>
    ),

    audience: (
      <Card>
        <CardHeader
          title={t('dashboard.audience')}
          slotProps={{ title: { variant: 'h2', component: 'h2' } }}
          action={
            <Button
              component={RouterLink}
              to="/audience/dashboard"
              variant="text"
              endIcon={<MdChevronRight />}
            >
              {t('dashboard.goToAudienceDashboard')}
            </Button>
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
    ),

    externalApps: (
      <Card>
        <CardHeader
          title={
            <>
              {t('dashboard.externalApps')}{' '}
              <InfoTooltip text={t('dashboard.externalAppsInfo')} />
            </>
          }
          slotProps={{ title: { variant: 'h2', component: 'h2' } }}
        />

        <CardContent>
          <ExternalAppsDashboard />
        </CardContent>
      </Card>
    ),
  };

  return (
    <>
      <PageTitle sx={visuallyHidden}>{t('navbar.dashboard')}</PageTitle>

      <DashboardToolbar>
        <Button
          variant="text"
          startIcon={<MdTune />}
          onClick={() => setConfigOpen(true)}
        >
          {t('dashboard.configure')}
        </Button>
      </DashboardToolbar>

      <DashboardGrid>
        {visibleDashboardCards(layout).map(id => (
          <DashboardCard
            key={id}
            data-dashboard-card={id}
            data-full-width={isDashboardCardFullWidth(layout, id)}
          >
            {cards[id]}
          </DashboardCard>
        ))}
      </DashboardGrid>

      <DashboardConfig
        open={configOpen}
        layout={layout}
        onChange={setLayout}
        onClose={() => setConfigOpen(false)}
      />
    </>
  );
}
