import styled from '@emotion/styled';
import ListIcon from '@rsuite/icons/List';
import { DailySubscriptionStats } from '@wepublish/editor/api';
import { InfoTooltip } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Table } from 'rsuite';
import { RowDataType } from 'rsuite-table';

import { AudienceDetailDrawer } from './audience-detail-drawer';
import { AudienceStatsComputed } from './useAudience';
import { AudienceClientFilter, TimeResolution } from './audience-filter-params';

const { Column, HeaderCell, Cell } = Table;

const HeaderText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Info = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  margin-left: 4px;
`;

const HeaderLabel = ({ label, info }: { label: string; info: string }) => (
  <>
    <HeaderText title={label}>{label}</HeaderText>
    <Info>
      <InfoTooltip text={info} />
    </Info>
  </>
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
          <Column
            resizable
            width={150}
          >
            <HeaderCell>
              <HeaderLabel
                label={t('audience.legend.replacedSubscriptionCount')}
                info={t('audience.legend.info.replacedSubscriptionCount')}
              />
            </HeaderCell>

            <Cell dataKey="replacedSubscriptionCount" />
          </Column>
        )}

        {createdSubscriptionCount && (
          <Column
            resizable
            width={150}
          >
            <HeaderCell>
              <HeaderLabel
                label={t('audience.legend.createdSubscriptionCount')}
                info={t('audience.legend.info.createdSubscriptionCount')}
              />
            </HeaderCell>
            <Cell dataKey="createdSubscriptionCount" />
          </Column>
        )}

        {renewedSubscriptionCount && (
          <Column
            resizable
            width={150}
          >
            <HeaderCell>
              <HeaderLabel
                label={t('audience.legend.renewedSubscriptionCount')}
                info={t('audience.legend.info.renewedSubscriptionCount')}
              />
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
                <HeaderLabel
                  label={t(
                    'audience.legend.predictedSubscriptionRenewalCountPerDay.highProbability'
                  )}
                  info={t(
                    'audienceTable.predictedSubscriptionRenewalCountPerDay.highProbabilityInfo'
                  )}
                />
              </HeaderCell>
              <Cell dataKey="predictedSubscriptionRenewalCount.perDayHighProbability" />
            </Column>
            <Column
              resizable
              width={150}
            >
              <HeaderCell>
                <HeaderLabel
                  label={t(
                    'audience.legend.predictedSubscriptionRenewalCountPerDay.lowProbability'
                  )}
                  info={t(
                    'audienceTable.predictedSubscriptionRenewalCountPerDay.lowProbabilityInfo'
                  )}
                />
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
              <HeaderLabel
                label={t('audience.legend.endingSubscriptionCount')}
                info={t('audience.legend.info.endingSubscriptionCount')}
              />
            </HeaderCell>
            <Cell dataKey="endingSubscriptionCount" />
          </Column>
        )}

        <Column
          resizable
          width={150}
        >
          <HeaderCell>
            <HeaderLabel
              label={t('audience.legend.totalNewSubscriptions')}
              info={t('audienceTable.totalNewSubscriptionsInfo')}
            />
          </HeaderCell>
          <Cell dataKey="totalNewSubscriptions">
            {(rowData: RowDataType<AudienceStatsComputed>) => (
              <strong>{rowData.totalNewSubscriptions}</strong>
            )}
          </Cell>
        </Column>

        {overdueSubscriptionCount && (
          <Column
            resizable
            width={150}
          >
            <HeaderCell>
              <HeaderLabel
                label={t('audience.legend.overdueSubscriptionCount')}
                info={t('audience.legend.info.overdueSubscriptionCount')}
              />
            </HeaderCell>
            <Cell dataKey="overdueSubscriptionCount" />
          </Column>
        )}

        {deactivatedSubscriptionCount && (
          <Column
            resizable
            width={150}
          >
            <HeaderCell>
              <HeaderLabel
                label={t('audience.legend.deactivatedSubscriptionCount')}
                info={t('audience.legend.info.deactivatedSubscriptionCount')}
              />
            </HeaderCell>
            <Cell dataKey="deactivatedSubscriptionCount" />
          </Column>
        )}

        {totalActiveSubscriptionCount && (
          <Column
            resizable
            width={150}
          >
            <HeaderCell>
              <HeaderLabel
                label={t('audience.legend.totalActiveSubscriptionCount')}
                info={t('audience.legend.info.totalActiveSubscriptionCount')}
              />
            </HeaderCell>

            <Cell dataKey="totalActiveSubscriptionCount" />
          </Column>
        )}
        <Column
          resizable
          width={150}
        >
          <HeaderCell>
            <HeaderLabel
              label={t('audience.legend.renewalRate')}
              info={t('audienceTable.renewalRateInfo')}
            />
          </HeaderCell>
          <Cell dataKey="renewalRate">
            {(rowData: RowDataType<AudienceStatsComputed>) => (
              <>
                <span>
                  ({rowData.renewedAndReplaced} / {rowData.totalToBeRenewed})
                </span>{' '}
                <strong>{rowData.renewalRate}%</strong>
              </>
            )}
          </Cell>
        </Column>
        <Column
          resizable
          width={150}
        >
          <HeaderCell>
            <HeaderLabel
              label={t('audience.legend.cancellationRate')}
              info={t('audienceTable.cancellationRateInfo')}
            />
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
                <strong>{rowData.cancellationRate}%</strong>
              </>
            )}
          </Cell>
        </Column>
        <Column
          width={180}
          align="center"
          fixed="right"
        >
          <HeaderCell align="center">{t('action')}</HeaderCell>
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
