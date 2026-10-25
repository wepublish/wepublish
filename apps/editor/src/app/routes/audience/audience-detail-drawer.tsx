import {
  Button,
  Drawer,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@mui/material';
import { DailySubscriptionStatsUser } from '@wepublish/editor/api';
import {
  DataTable,
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

import { AudienceCsvBtn } from './audience-csv-btn';
import { TimeResolution } from './audience-filter-params';
import { AggregatedUsers, AudienceStatsComputed } from './useAudience';

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
          <Grid size={{ xs: 12, md: 3, lg: 2 }}>
            <List
              component="nav"
              subheader={
                <ListSubheader>
                  {t('audienceDetailDrawer.selectStat')}
                </ListSubheader>
              }
            >
              {availableStats.map((availableStat, index) => (
                <ListItemButton
                  key={index}
                  selected={availableStat === selectedStat}
                  aria-pressed={availableStat === selectedStat}
                  onClick={() => setSelectedStat(availableStat)}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {getIconByUserFilter(availableStat)}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${t(`audience.legend.${availableStat}`)} (${
                      audienceStats?.[availableStat]?.length
                    })`}
                    slotProps={{ primary: { variant: 'body2' } }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Grid>
          <Grid size={{ xs: 12, md: 9, lg: 10 }}>
            <DataTable
              data={audienceStats?.[selectedStat] || []}
              columns={[
                {
                  id: 'id',
                  label: t('audienceDetailDrawer.id'),
                  width: 250,
                  sortKey: 'id',
                  render: row => row.id,
                },
                {
                  id: 'firstname',
                  label: t('audienceDetailDrawer.firstName'),
                  width: 200,
                  sortKey: 'firstName',
                  render: row => row.firstName,
                },
                {
                  id: 'name',
                  label: t('audienceDetailDrawer.name'),
                  width: 200,
                  sortKey: 'name',
                  render: row => row.name,
                },
                {
                  id: 'email',
                  label: t('audienceDetailDrawer.email'),
                  width: 300,
                  sortKey: 'email',
                  render: row => row.email,
                },
                {
                  id: 'gotouser',
                  label: t('audienceDetailDrawer.goToUser'),
                  width: 300,
                  render: (entry: DailySubscriptionStatsUser) => (
                    <Button
                      variant="outlined"
                      href={`/users/edit/${entry.id}`}
                      size="small"
                      target={'__blank'}
                      endIcon={<MdOpenInNew />}
                    >
                      {t('audienceDetailDrawer.userBtn')}
                    </Button>
                  ),
                },
              ]}
            />
          </Grid>
        </Grid>
      </DrawerBody>
    </Drawer>
  );
}
