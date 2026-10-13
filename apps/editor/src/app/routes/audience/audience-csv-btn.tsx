import {
  DailySubscriptionStatsUser,
  SubscriptionFilter,
} from '@wepublish/editor/api';
import {
  SubscriptionExportDropdown,
  useExportSubscriptions,
} from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AggregatedUsers, AudienceStatsComputed } from './useAudience';

export interface AudienceCsvBtnProps {
  audienceStats:
    | Omit<AudienceStatsComputed, 'predictedSubscriptionRenewalCount'>
    | undefined;
  selectedStatKey: AggregatedUsers;
  fileNameDate: string;
}

export function AudienceCsvBtn({
  audienceStats,
  selectedStatKey,
  fileNameDate,
}: AudienceCsvBtnProps) {
  const { initDownload, getCsv, loading } = useExportSubscriptions();
  const { t } = useTranslation();

  // helper functions for the csv download
  const filteredStats = useMemo<DailySubscriptionStatsUser[]>(() => {
    if (!audienceStats) {
      return [];
    }
    return audienceStats[selectedStatKey];
  }, [audienceStats, selectedStatKey]);

  const disableBtn = useMemo<boolean>(
    () => !audienceStats || !filteredStats.length,
    [audienceStats, filteredStats]
  );

  return (
    <SubscriptionExportDropdown
      label={t('audienceCsvBtn.exportUsers')}
      loading={loading}
      disabled={disableBtn}
      onExport={format => {
        const filter: SubscriptionFilter = {
          subscriptionIDs: filteredStats.map(
            filteredStat => filteredStat.subscriptionID as string
          ),
        };

        return initDownload({
          getCsv,
          format,
          filter,
          filename: `${fileNameDate}-${t(`audience.legend.${selectedStatKey}`)}`,
          prefixByDate: false,
        });
      }}
    />
  );
}
