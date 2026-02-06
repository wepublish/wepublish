import styled from '@emotion/styled';
import ListIcon from '@rsuite/icons/List';
import { DailySubscriptionStats } from '@wepublish/editor/api-v2';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdInfo } from 'react-icons/md';
import { Button, Table, Tooltip, Whisper } from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { AudienceDetailDrawer } from './audience-detail-drawer';
import { AudienceStatsComputed } from './useAudience';
import { AudienceClientFilter, TimeResolution } from './useAudienceFilter';

const { Column, HeaderCell, Cell } = Table;

const Info = styled.div`
  margin-left: ${({ theme }) => theme.spacing(1)};
  position: relative;
  display: inline-block;
`;

const HeaderInfo = ({ text }: { text: string }) => (
  <Whisper
    trigger="hover"
    speaker={<Tooltip>{text}</Tooltip>}
    placement="top"
  >
    <Info>
      <MdInfo size={24} />
    </Info>
  </Whisper>
);

interface AudienceTableProps {
  audienceStats: AudienceStatsComputed[];
  clientFilter: AudienceClientFilter;
  timeResolution: TimeResolution;
  loading?: boolean;
}

export function AudienceTable({
  audienceStats,
  clientFilter,
  timeResolution,
  loading,
}: AudienceTableProps) {
  const {
    t,
    i18n: { language },
  } = useTranslation();

  const {
    totalActiveSubscriptionCount,
    createdSubscriptionCount,
    renewedSubscriptionCount,
    overdueSubscriptionCount,
    replacedSubscriptionCount,
    deactivatedSubscriptionCount,
    predictedSubscriptionRenewalCount,
    endingSubscriptionCount,
  } = clientFilter;

  const [selectedAudienceStats, setSelectedAudienceStats] = useState<
    Omit<AudienceStatsComputed, 'predictedSubscriptionRenewalCount'> | undefined
  >(undefined);

  return (
    <>
      <Table
        data={audienceStats}
        style={{ width: '100%' }}
        virtualized
        height={800}
        loading={loading}
      >
        <Column
          resizable
          width={140}
        >
          <HeaderCell>{t('audienceTable.header.date')}</HeaderCell>
          <Cell dataKey="date">
            {(rowData: RowDataType<DailySubscriptionStats>) => (
              <>
                {timeResolution === 'monthly' && (
                  <span>{t('audienceTable.byDate')}</span>
                )}{' '}
                {new Date(rowData.date).toLocaleDateString(language, {
                  dateStyle: 'medium',
                })}
              </>
            )}
          </Cell>
        </Column>

        {replacedSubscriptionCount && (
          <Column resizable>
            <HeaderCell>
              {t('audience.legend.replacedSubscriptionCount')}
            </HeaderCell>
            <Cell dataKey="replacedSubscriptionCount" />
          </Column>
        )}

        {createdSubscriptionCount && (
          <Column
            resizable
            width={100}
          >
            <HeaderCell>
              {t('audience.legend.createdSubscriptionCount')}
            </HeaderCell>
            <Cell dataKey="createdSubscriptionCount" />
          </Column>
        )}

        {renewedSubscriptionCount && (
          <Column
            resizable
            width={120}
          >
            <HeaderCell>
              {t('audience.legend.renewedSubscriptionCount')}
            </HeaderCell>
            <Cell dataKey="renewedSubscriptionCount" />
          </Column>
        )}

        {predictedSubscriptionRenewalCount && (
          <>
            <Column
              resizable
              width={150}
            >
              <HeaderCell>
                <HeaderInfo
                  text={t(
                    'audienceTable.predictedSubscriptionRenewalCountPerDay.highProbability'
                  )}
                />
                {t(
                  'audience.legend.predictedSubscriptionRenewalCountPerDay.highProbability'
                )}
              </HeaderCell>
              <Cell dataKey="predictedSubscriptionRenewalCount.perDayHighProbability" />
            </Column>
            <Column
              resizable
              width={150}
            >
              <HeaderCell>
                <HeaderInfo
                  text={t(
                    'audienceTable.predictedSubscriptionRenewalCountPerDay.lowProbability'
                  )}
                />
                {t(
                  'audience.legend.predictedSubscriptionRenewalCountPerDay.lowProbability'
                )}
              </HeaderCell>
              <Cell dataKey="predictedSubscriptionRenewalCount.perDayLowProbability" />
            </Column>
          </>
        )}

        {endingSubscriptionCount && (
          <Column
            resizable
            width={150}
          >
            <HeaderCell>
              {t('audience.legend.endingSubscriptionCount')}
            </HeaderCell>
            <Cell dataKey="endingSubscriptionCount" />
          </Column>
        )}

        <Column
          resizable
          width={150}
        >
          <HeaderCell>
            {t('audience.legend.totalNewSubscriptions')}{' '}
            <HeaderInfo text={t('audienceTable.totalNewSubscriptionsInfo')} />
          </HeaderCell>
          <Cell dataKey="totalNewSubscriptions">
            {(rowData: RowDataType<AudienceStatsComputed>) => (
              <b>{rowData.totalNewSubscriptions}</b>
            )}
          </Cell>
        </Column>

        {overdueSubscriptionCount && (
          <Column
            resizable
            width={150}
          >
            <HeaderCell>
              {t('audience.legend.overdueSubscriptionCount')}
            </HeaderCell>
            <Cell dataKey="overdueSubscriptionCount" />
          </Column>
        )}

        {deactivatedSubscriptionCount && (
          <Column
            resizable
            width={120}
          >
            <HeaderCell>
              {t('audience.legend.deactivatedSubscriptionCount')}
            </HeaderCell>
            <Cell dataKey="deactivatedSubscriptionCount" />
          </Column>
        )}

        {totalActiveSubscriptionCount && (
          <Column resizable>
            <HeaderCell>
              {t('audience.legend.totalActiveSubscriptionCount')}
            </HeaderCell>
            <Cell dataKey="totalActiveSubscriptionCount" />
          </Column>
        )}
        <Column
          resizable
          width={150}
        >
          <HeaderCell>
            {t('audience.legend.renewalRate')}{' '}
            <HeaderInfo text={t('audienceTable.renewalRateInfo')} />
          </HeaderCell>
          <Cell dataKey="renewalRate">
            {(rowData: RowDataType<AudienceStatsComputed>) => (
              <>
                <span>
                  ({rowData.renewedAndReplaced} / {rowData.totalToBeRenewed})
                </span>{' '}
                <b>{rowData.renewalRate}%</b>
              </>
            )}
          </Cell>
        </Column>
        <Column
          resizable
          width={150}
        >
          <HeaderCell>
            {t('audience.legend.cancellationRate')}{' '}
            <HeaderInfo text={t('audienceTable.cancellationRateInfo')} />
          </HeaderCell>
          <Cell dataKey="cancellationRate">
            {(rowData: RowDataType<AudienceStatsComputed>) => (
              <>
                <span>
                  (
                  {rowData.deactivatedSubscriptionCount * -1 +
                    rowData.overdueSubscriptionCount * -1}{' '}
                  / {rowData.totalToBeRenewed})
                </span>{' '}
                <b>{rowData.cancellationRate}%</b>
              </>
            )}
          </Cell>
        </Column>
        <Column width={180}>
          <HeaderCell>{t('audienceTable.header.actions')}</HeaderCell>
          <Cell dataKey="action">
            {(rowData: RowDataType<AudienceStatsComputed>) => (
              <Button
                size="xs"
                appearance="primary"
                startIcon={<ListIcon />}
                onClick={() =>
                  setSelectedAudienceStats(rowData as AudienceStatsComputed)
                }
              >
                {t('audienceTable.showUsers')}
              </Button>
            )}
          </Cell>
        </Column>
      </Table>

      <AudienceDetailDrawer
        audienceStats={selectedAudienceStats}
        setOpen={setSelectedAudienceStats}
        timeResolution={timeResolution}
      />
    </>
  );
}
