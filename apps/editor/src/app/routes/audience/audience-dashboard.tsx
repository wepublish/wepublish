import styled from '@emotion/styled';
import { useDailySubscriptionStatsLazyQuery } from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewFilterArea,
  ListViewHeader,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AudienceChart } from './audience-chart';
import { AudienceFilter } from './audience-filter';
import { DateRangePresetKey } from './audience-filter-params';
import { AudienceTable } from './audience-table';
import { useAudience } from './useAudience';
import { useAudienceFilter } from './useAudienceFilter';

const AudienceChartWrapper = styled('div')`
  margin-top: ${({ theme }) => theme.spacing(4)};
  padding-top: ${({ theme }) => theme.spacing(2)};
  height: 100%;
  width: 100%;
  min-height: 40vh;
`;

const TableWrapperStyled = styled(TableWrapper)`
  margin-top: ${({ theme }) => theme.spacing(8)};
`;

interface AudienceDashboardProps {
  hideHeader?: boolean;
  hideFilter?: boolean;
  initialDateRange?: DateRangePresetKey;
  persist?: boolean;
}

function AudienceDashboard({
  hideHeader,
  hideFilter,
  initialDateRange,
  persist,
}: AudienceDashboardProps) {
  const { t } = useTranslation();

  const [fetchStats, { data: rawAudienceStats, loading }] =
    useDailySubscriptionStatsLazyQuery({});

  const {
    audienceApiFilter,
    setAudienceApiFilter,
    audienceClientFilter,
    setAudienceClientFilter,
    resolution,
    setResolution,
    audienceComponentFilter,
    setAudienceComponentFilter,
    buildPermalink,
  } = useAudienceFilter({
    fetchStats,
    initialDateRange,
    persist,
  });

  const { audienceStatsComputed, audienceStatsAggregatedByMonth } = useAudience(
    {
      audienceClientFilter,
      audienceStats: rawAudienceStats,
    }
  );

  const audienceStats = useMemo(
    () =>
      resolution === 'daily' ?
        audienceStatsComputed
      : audienceStatsAggregatedByMonth,
    [resolution, audienceStatsComputed, audienceStatsAggregatedByMonth]
  );

  return (
    <>
      <ListViewContainer>
        {!hideHeader && (
          <ListViewHeader>
            <h2>{t('audienceDashboard.title')}</h2>
          </ListViewHeader>
        )}

        {!hideFilter && audienceComponentFilter.filter && (
          <ListViewFilterArea style={{ alignItems: 'center' }}>
            <AudienceFilter
              resolution={resolution}
              setResolution={setResolution}
              clientFilter={audienceClientFilter}
              setClientFilter={setAudienceClientFilter}
              apiFilter={audienceApiFilter}
              setApiFilter={setAudienceApiFilter}
              componentFilter={audienceComponentFilter}
              setComponentFilter={setAudienceComponentFilter}
              buildPermalink={buildPermalink}
            />
          </ListViewFilterArea>
        )}
      </ListViewContainer>

      {audienceComponentFilter.chart && (
        <AudienceChartWrapper>
          <AudienceChart
            audienceStats={audienceStats}
            clientFilter={audienceClientFilter}
            loading={loading}
          />
        </AudienceChartWrapper>
      )}

      {audienceComponentFilter.table && (
        <TableWrapperStyled>
          <AudienceTable
            audienceStats={audienceStats}
            clientFilter={audienceClientFilter}
            timeResolution={resolution}
            loading={loading}
          />
        </TableWrapperStyled>
      )}
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_AUDIENCE_STATS',
])(AudienceDashboard);
export { CheckedPermissionComponent as AudienceDashboard };
