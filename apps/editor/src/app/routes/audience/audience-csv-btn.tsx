import FileDownloadIcon from '@rsuite/icons/FileDownload';
import {
  DailySubscriptionStatsUser,
  SubscriptionFilter,
} from '@wepublish/editor/api';
import { useExportSubscriptionsAsCsv } from '@wepublish/ui/editor';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'rsuite';

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
  const { initDownload, getCsv, loading } = useExportSubscriptionsAsCsv();
  const { t } = useTranslation();

  // helper functions for the csv download
  const filteredStats = useMemo<DailySubscriptionStatsUser[]>(() => {
    if (!audienceStats) {
      return [];
    }
    return audienceStats[selectedStatKey];
  }, [audienceStats, selectedStatKey]);

  // main function to download the csv file
  const downloadCsv = () => {
    const filter: SubscriptionFilter = {
      subscriptionIDs: filteredStats.map(
        filteredStat => filteredStat.subscriptionID as string
      ),
    };

    initDownload({
      getCsv,
      filter,
      filename: `${fileNameDate}-${t(`audience.legend.${selectedStatKey}`)}`,
      prefixByDate: false,
    });
  };

  const disableBtn = useMemo<boolean>(
    () => !audienceStats || !filteredStats.length,
    [audienceStats, filteredStats]
  );

  return (
    <Button
      disabled={disableBtn}
      loading={loading}
      appearance="primary"
      color="green"
      startIcon={<FileDownloadIcon />}
      onClick={() => downloadCsv()}
    >
      {t('audienceCsvBtn.exportUsers')}
    </Button>
  );
}
