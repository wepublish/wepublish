import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { DataTable, DataTableColumn, InfoTooltip } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdList } from 'react-icons/md';

import { AudienceDetailDrawer } from './audience-detail-drawer';
import { AudienceClientFilter, TimeResolution } from './audience-filter-params';
import { AudienceStatsComputed } from './useAudience';

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

  const countColumn = (
    id: keyof AudienceStatsComputed & string,
    label: string,
    info: string
  ): DataTableColumn<AudienceStatsComputed> => ({
    id,
    label: (
      <HeaderLabel
        label={label}
        info={info}
      />
    ),
    width: 150,
    render: row => String(row[id] ?? ''),
  });

  const columns: DataTableColumn<AudienceStatsComputed>[] = [
    {
      id: 'date',
      alwaysVisible: true,
      label: t('audienceTable.header.date'),
      width: 140,
      render: row => (
        <>
          {timeResolution === 'monthly' && (
            <span>{t('audienceTable.byDate')}</span>
          )}{' '}
          {new Date(row.date).toLocaleDateString(language, {
            dateStyle: 'medium',
          })}
        </>
      ),
    },
  ];

  if (replacedSubscriptionCount) {
    columns.push(
      countColumn(
        'replacedSubscriptionCount',
        t('audience.legend.replacedSubscriptionCount'),
        t('audience.legend.info.replacedSubscriptionCount')
      )
    );
  }

  if (createdSubscriptionCount) {
    columns.push(
      countColumn(
        'createdSubscriptionCount',
        t('audience.legend.createdSubscriptionCount'),
        t('audience.legend.info.createdSubscriptionCount')
      )
    );
  }

  if (renewedSubscriptionCount) {
    columns.push(
      countColumn(
        'renewedSubscriptionCount',
        t('audience.legend.renewedSubscriptionCount'),
        t('audience.legend.info.renewedSubscriptionCount')
      )
    );
  }

  if (predictedSubscriptionRenewalCount) {
    columns.push(
      {
        id: 'predictedRenewalHigh',
        label: (
          <HeaderLabel
            label={t(
              'audience.legend.predictedSubscriptionRenewalCountPerDay.highProbability'
            )}
            info={t(
              'audienceTable.predictedSubscriptionRenewalCountPerDay.highProbabilityInfo'
            )}
          />
        ),
        width: 150,
        render: row =>
          String(
            row.predictedSubscriptionRenewalCount?.perDayHighProbability ?? ''
          ),
      },
      {
        id: 'predictedRenewalLow',
        label: (
          <HeaderLabel
            label={t(
              'audience.legend.predictedSubscriptionRenewalCountPerDay.lowProbability'
            )}
            info={t(
              'audienceTable.predictedSubscriptionRenewalCountPerDay.lowProbabilityInfo'
            )}
          />
        ),
        width: 150,
        render: row =>
          String(
            row.predictedSubscriptionRenewalCount?.perDayLowProbability ?? ''
          ),
      }
    );
  }

  if (endingSubscriptionCount) {
    columns.push(
      countColumn(
        'endingSubscriptionCount',
        t('audience.legend.endingSubscriptionCount'),
        t('audience.legend.info.endingSubscriptionCount')
      )
    );
  }

  columns.push({
    id: 'totalNewSubscriptions',
    label: (
      <HeaderLabel
        label={t('audience.legend.totalNewSubscriptions')}
        info={t('audienceTable.totalNewSubscriptionsInfo')}
      />
    ),
    width: 150,
    render: row => <strong>{row.totalNewSubscriptions}</strong>,
  });

  if (overdueSubscriptionCount) {
    columns.push(
      countColumn(
        'overdueSubscriptionCount',
        t('audience.legend.overdueSubscriptionCount'),
        t('audience.legend.info.overdueSubscriptionCount')
      )
    );
  }

  if (deactivatedSubscriptionCount) {
    columns.push(
      countColumn(
        'deactivatedSubscriptionCount',
        t('audience.legend.deactivatedSubscriptionCount'),
        t('audience.legend.info.deactivatedSubscriptionCount')
      )
    );
  }

  if (totalActiveSubscriptionCount) {
    columns.push(
      countColumn(
        'totalActiveSubscriptionCount',
        t('audience.legend.totalActiveSubscriptionCount'),
        t('audience.legend.info.totalActiveSubscriptionCount')
      )
    );
  }

  columns.push(
    {
      id: 'renewalRate',
      label: (
        <HeaderLabel
          label={t('audience.legend.renewalRate')}
          info={t('audienceTable.renewalRateInfo')}
        />
      ),
      width: 150,
      render: row => (
        <>
          <span>
            ({row.renewedAndReplaced} / {row.totalToBeRenewed})
          </span>{' '}
          <strong>{row.renewalRate}%</strong>
        </>
      ),
    },
    {
      id: 'cancellationRate',
      label: (
        <HeaderLabel
          label={t('audience.legend.cancellationRate')}
          info={t('audienceTable.cancellationRateInfo')}
        />
      ),
      width: 150,
      render: row => (
        <>
          <span>
            (
            {row.deactivatedSubscriptionCount * -1 +
              row.overdueSubscriptionCount * -1}{' '}
            / {row.totalToBeRenewed})
          </span>{' '}
          <strong>{row.cancellationRate}%</strong>
        </>
      ),
    },
    {
      id: 'action',
      label: t('action'),
      width: 180,
      align: 'center',
      fixed: true,
      render: row => (
        <Button
          variant="contained"
          size="small"
          startIcon={<MdList />}
          onClick={() => setSelectedAudienceStats(row)}
        >
          {t('audienceTable.showUsers')}
        </Button>
      ),
    }
  );

  return (
    <>
      <DataTable
        storageKey="audience"
        data={audienceStats}
        columns={columns}
        loading={loading}
        getRowId={row => row.date}
        virtualize
        maxHeight={800}
      />

      <AudienceDetailDrawer
        audienceStats={selectedAudienceStats}
        setOpen={setSelectedAudienceStats}
        timeResolution={timeResolution}
      />
    </>
  );
}
