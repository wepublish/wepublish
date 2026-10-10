import styled from '@emotion/styled';
import {
  ActivityFeed,
  InfoTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdChevronRight, MdTune } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Button, IconButton, Panel as RPanel } from 'rsuite';

import { AudienceDashboard } from '../audience/audience-dashboard';
import { ScrollContainer } from '../networkContent/networkContent.styles';
import NetworkContentDashboard from '../networkContent/networkContentDashboard';
import { DashboardConfig } from './dashboardConfig';
import { DashboardCardId, visibleDashboardCards } from './dashboardLayout';
import { DashboardNotifications } from './dashboardNotifications';
import { ExternalAppsDashboard } from './externalAppsDashboard';
import { useDashboardLayout } from './useDashboardLayout';

const DashboardToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
`;

// Row-major grid: card 1 → row 1 col 1, card 2 → row 1 col 2, … and one
// column on smaller screens, in the same order.
const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;

  @media (max-width: 1199px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const DashboardCard = styled.div`
  min-width: 0;

  &:empty {
    display: none;
  }

  /* The sticky first row shares one height, at least 480px on desktop.
     Longer Mitteilungen raise it; the network list never does - it scrolls
     inside its own list instead of stretching the row. */
  &[data-dashboard-card='notifications'],
  &[data-dashboard-card='network'] {
    align-self: stretch;
    display: flex;
    flex-direction: column;

    @media (min-width: 1200px) {
      min-height: 480px;
    }
  }

  &[data-dashboard-card='notifications'] > .rs-panel,
  &[data-dashboard-card='network'] > .rs-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &[data-dashboard-card='network'] .rs-panel-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 360px;
    overflow: hidden;
    contain: size;
  }

  &[data-dashboard-card='network'] ${ScrollContainer} {
    flex: 1;
    min-height: 0;
    max-height: none;
  }

  /* Up to 50 entries with full comment texts would make the row - and
     everything below it - several screens tall. */
  &[data-dashboard-card='activity'] .rs-panel-body {
    max-height: 640px;
    overflow: auto;
  }
`;

export function Dashboard() {
  const { t } = useTranslation();
  const [layout, setLayout] = useDashboardLayout();
  const [configOpen, setConfigOpen] = useState(false);

  const cards: Record<DashboardCardId, ReactNode> = {
    // renders its own panel and hides it while there is nothing to show
    notifications: <DashboardNotifications />,

    network: (
      <RPanel
        header={
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
    ),

    activity: (
      <RPanel
        header={
          <h2>
            {t('dashboard.activity')}{' '}
            <InfoTooltip text={t('dashboard.activityInfo')} />
          </h2>
        }
        bordered
      >
        <ActivityFeed />
      </RPanel>
    ),

    audience: (
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
    ),

    externalApps: (
      <RPanel
        header={
          <h2>
            {t('dashboard.externalApps')}{' '}
            <InfoTooltip text={t('dashboard.externalAppsInfo')} />
          </h2>
        }
        bordered
      >
        <ExternalAppsDashboard />
      </RPanel>
    ),
  };

  return (
    <>
      <DashboardToolbar>
        <IconButton
          icon={<MdTune />}
          aria-label={t('dashboard.configure')}
          title={t('dashboard.configure')}
          onClick={() => setConfigOpen(true)}
        >
          {t('dashboard.configure')}
        </IconButton>
      </DashboardToolbar>

      <DashboardGrid>
        {visibleDashboardCards(layout).map(id => (
          <DashboardCard
            key={id}
            data-dashboard-card={id}
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
