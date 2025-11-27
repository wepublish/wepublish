import { useExportSubscriptionsAsCsv } from '@wepublish/ui/editor';
import { Button } from 'rsuite';
import { AggregatedUsers, AudienceStatsComputed } from './useAudience';
import { DailySubscriptionStatsUser } from '@wepublish/editor/api-v2';
import { SubscriptionFilter } from '@wepublish/editor/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import FileDownloadIcon from '@rsuite/icons/FileDownload';

export interface AudienceCsvBtnProps {
  audienceStats:
    | Omit<AudienceStatsComputed, 'predictedSubscriptionRenewalCount'>
    | undefined;
  selectedStatKey: AggregatedUsers;
  dateFrom: Date;
  dateTo: Date;
}

export function AudienceCsvBtn({
  audienceStats,
  selectedStatKey,
  dateFrom,
  dateTo,
}: AudienceCsvBtnProps) {
  const { initDownload, getCsv, loading } = useExportSubscriptionsAsCsv();
  const {
    t,
    i18n: { language },
  } = useTranslation();

  // helper functions for the csv download
  const formattedDateRange = useMemo<string>(() => {
    const dateTimeFormat: Intl.DateTimeFormatOptions = { dateStyle: 'short' };
    return `${dateFrom?.toLocaleDateString(language, dateTimeFormat)}-${dateTo?.toLocaleDateString(
      language,
      dateTimeFormat
    )}`;
  }, [language, dateFrom, dateTo]);

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
      filename: `${formattedDateRange}-${selectedStatKey}`,
      prefixByDate: false,
    });
  };

  const disableBtn = useMemo<boolean>(
    () => !audienceStats || !filteredStats.length,
    [audienceStats, filteredStats]
  );

  return (
    <>
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
    </>
  );
}
