import { DailySubscriptionStatsUser } from '@wepublish/editor/api';
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
import { Button, Col, Drawer, Nav, Row, Sidenav, Table } from 'rsuite';

import { AudienceCsvBtn } from './audience-csv-btn';
import { AggregatedUsers, AudienceStatsComputed } from './useAudience';
import { TimeResolution } from './useAudienceFilter';

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
      placement="bottom"
      size="full"
      open={!!audienceStats?.date}
      onClose={() => setOpen(undefined)}
    >
      <Drawer.Header>
        <Drawer.Title>{date}</Drawer.Title>
        <Drawer.Actions>
          <AudienceCsvBtn
            audienceStats={audienceStats}
            selectedStatKey={selectedStat}
            fileNameDate={date}
          />
          <Button
            onClick={() => setOpen(undefined)}
            appearance="primary"
          >
            {t('audienceDetailDrawer.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>
      <Drawer.Body>
        <Row gutter={8}>
          <Col xs={4}>
            <Sidenav appearance="subtle">
              <Header>{t('audienceDetailDrawer.selectStat')}</Header>
              <Body>
                <Nav>
                  {availableStats.map((availableStat, index) => (
                    <Nav.Item
                      key={index}
                      active={selectedStat === availableStat}
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
          </Col>
          <Col xs={20}>
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
                      href={`/users/edit/${entry.id}`}
                      size="xs"
                      appearance={'ghost'}
                      target={'__blank'}
                      endIcon={<MdOpenInNew />}
                    >
                      {t('audienceDetailDrawer.userBtn')}
                    </Button>
                  )}
                </Cell>
              </Column>
            </Table>
          </Col>
        </Row>
      </Drawer.Body>
    </Drawer>
  );
}
