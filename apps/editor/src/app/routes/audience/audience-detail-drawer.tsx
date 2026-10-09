import { Button, Drawer, Grid } from '@mui/material';
import { DailySubscriptionStatsUser } from '@wepublish/editor/api';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '@wepublish/ui/editor';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAutorenew,
  MdCancel,
  MdCreditCardOff,
  MdLibraryAdd,
  MdOpenInNew,
  MdRefresh,
  MdSpaceBar,
  MdStopCircle,
} from 'react-icons/md';
import { Nav, Sidenav, Table } from 'rsuite';

import { AudienceCsvBtn } from './audience-csv-btn';
import { TimeResolution } from './audience-filter-params';
import { AggregatedUsers, AudienceStatsComputed } from './useAudience';

const { Cell, Column, HeaderCell } = Table;
const { Body, Header } = Sidenav;

const availableStats: AggregatedUsers[] = [
  'createdSubscriptionUsers',
  'overdueSubscriptionUsers',
  'deactivatedSubscriptionUsers',
  'renewedSubscriptionUsers',
  'replacedSubscriptionUsers',
  'predictedSubscriptionRenewalUsersHighProbability',
  'predictedSubscriptionRenewalUsersLowProbability',
  'endingSubscriptionUsers',
];

function getIconByUserFilter(filterProp: AggregatedUsers) {
  switch (filterProp) {
    case 'createdSubscriptionUsers':
      return <MdLibraryAdd />;
    case 'overdueSubscriptionUsers':
      return <MdCreditCardOff />;
    case 'deactivatedSubscriptionUsers':
      return <MdCancel />;
    case 'renewedSubscriptionUsers':
      return <MdRefresh />;
    case 'replacedSubscriptionUsers':
      return <MdSpaceBar />;
    case 'predictedSubscriptionRenewalUsersHighProbability':
      return <MdAutorenew />;
    case 'predictedSubscriptionRenewalUsersLowProbability':
      return <MdAutorenew />;
    case 'endingSubscriptionUsers':
      return <MdStopCircle />;
    default:
      break;
  }
}

interface AudienceDetailDrawerProps {
  audienceStats:
    | Omit<AudienceStatsComputed, 'predictedSubscriptionRenewalCount'>
    | undefined;
  setOpen: Dispatch<
    SetStateAction<
      | Omit<AudienceStatsComputed, 'predictedSubscriptionRenewalCount'>
      | undefined
    >
  >;
  timeResolution: TimeResolution;
}

export function AudienceDetailDrawer({
  audienceStats,
  setOpen,
  timeResolution,
}: AudienceDetailDrawerProps) {
  const {
    t,
    i18n: { language },
  } = useTranslation();

  const [selectedStat, setSelectedStat] = useState<AggregatedUsers>(
    'deactivatedSubscriptionUsers'
  );

  const date = useMemo<string>(() => {
    let dateTimeFormat: Intl.DateTimeFormatOptions = { dateStyle: 'long' };
    if (timeResolution === 'monthly') {
      dateTimeFormat = { month: 'long', year: 'numeric' };
    }

    return audienceStats?.date ?
        new Date(audienceStats.date).toLocaleDateString(
          language,
          dateTimeFormat
        )
      : t('audienceDetailDrawer.noDateAvailable');
  }, [audienceStats, timeResolution, t, language]);

  return (
    <Drawer
      anchor="bottom"
      slotProps={{
        paper: {
          sx: { display: 'flex', flexDirection: 'column', height: '80vh' },
        },
      }}
      open={!!audienceStats?.date}
      onClose={() => setOpen(undefined)}
    >
      <DrawerHeader>
        <DrawerTitle>{date}</DrawerTitle>
        <DrawerActions>
          <AudienceCsvBtn
            audienceStats={audienceStats}
            selectedStatKey={selectedStat}
            fileNameDate={date}
          />
          <Button
            variant="contained"
            onClick={() => setOpen(undefined)}
          >
            {t('audienceDetailDrawer.close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>
      <DrawerBody>
        <Grid
          container
          spacing={2}
        >
          <Grid size={{ xs: 2 }}>
            <Sidenav appearance="subtle">
              <Header>{t('audienceDetailDrawer.selectStat')}</Header>
              <Body>
                <Nav>
                  {availableStats.map((availableStat, index) => (
                    <Nav.Item
                      key={index}
                      onClick={() => setSelectedStat(availableStat)}
                      icon={getIconByUserFilter(availableStat)}
                    >
                      {`${t(`audience.legend.${availableStat}`)} (${
                        audienceStats?.[availableStat]?.length
                      })`}
                    </Nav.Item>
                  ))}
                </Nav>
              </Body>
            </Sidenav>
          </Grid>
          <Grid size={{ xs: 10 }}>
            <Table
              data={audienceStats?.[selectedStat] || []}
              style={{ width: '100%' }}
              height={700}
              virtualized
            >
              <Column
                resizable
                width={250}
              >
                <HeaderCell>{t('audienceDetailDrawer.id')}</HeaderCell>
                <Cell dataKey="id" />
              </Column>
              <Column
                resizable
                width={200}
              >
                <HeaderCell>{t('audienceDetailDrawer.firstName')}</HeaderCell>
                <Cell dataKey="firstName" />
              </Column>
              <Column
                resizable
                width={200}
              >
                <HeaderCell>{t('audienceDetailDrawer.name')}</HeaderCell>
                <Cell dataKey="name" />
              </Column>
              <Column
                resizable
                width={300}
              >
                <HeaderCell>{t('audienceDetailDrawer.email')}</HeaderCell>
                <Cell dataKey="email" />
              </Column>
              <Column
                resizable
                width={300}
              >
                <HeaderCell>{t('audienceDetailDrawer.goToUser')}</HeaderCell>
                <Cell>
                  {(entry: DailySubscriptionStatsUser) => (
                    <Button
                      variant="outlined"
                      href={`/users/edit/${entry.id}`}
                      size="small"
                      target={'__blank'}
                      endIcon={<MdOpenInNew />}
                    >
                      {t('audienceDetailDrawer.userBtn')}
                    </Button>
                  )}
                </Cell>
              </Column>
            </Table>
          </Grid>
        </Grid>
      </DrawerBody>
    </Drawer>
  );
}
