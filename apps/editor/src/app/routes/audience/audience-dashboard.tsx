import { useLazyQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import { DailySubscriptionStatsDocument } from '@wepublish/editor/api';
import { CanGetAudienceStats } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  TableWrapper,
  PageTitle,
} from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AudienceChart } from './audience-chart';
import { AudienceFilter } from './audience-filter';
import { DateRangePresetKey } from './audience-filter-params';
import { AudienceTable } from './audience-table';
import { AudienceTableExport } from './audience-table-export';
import { useAudience } from './useAudience';
import { useAudienceFilter } from './useAudienceFilter';

const AudienceChartWrapper = styled('div')`
  margin-top: ${({ theme }) => theme.spacing(4)};
  padding-top: ${({ theme }) => theme.spacing(2)};
  height: 100%;
  width: 100%;
`;

const TableWrapperStyled = styled(TableWrapper)``;

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

  const [fetchStats, { data: rawAudienceStats, loading }] = useLazyQuery(
    DailySubscriptionStatsDocument,
    {}
  );

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
          <>
            <ListViewHeader>
              <PageTitle>{t('audienceDashboard.title')}</PageTitle>
            </ListViewHeader>

            <ListViewActions>
              <AudienceTableExport
                audienceStats={audienceStats}
                clientFilter={audienceClientFilter}
                timeResolution={resolution}
                loading={loading}
              />
            </ListViewActions>
          </>
        )}

        {!hideFilter && audienceComponentFilter.filter && (
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
        )}
      </ListViewContainer>

      {audienceComponentFilter.chart && (
        <AudienceChartWrapper>
          <AudienceChart
            audienceStats={audienceStats}
            clientFilter={audienceClientFilter}
            loading={loading}
            headingLevel={hideHeader ? 3 : 2}
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
  CanGetAudienceStats.id,
])(AudienceDashboard);
export { CheckedPermissionComponent as AudienceDashboard };
