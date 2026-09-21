import { TFunction } from 'i18next';
import writeXlsxFile, { Column } from 'write-excel-file/browser';

import { AudienceClientFilter, TimeResolution } from './audience-filter-params';
import { AudienceStatsComputed } from './useAudience';

type AudienceExportValue = string | number | Date | null;

interface AudienceExportColumn {
  header: string;
  width: number;
  value: (stat: AudienceStatsComputed) => AudienceExportValue;
}

type PredictedRenewalProbability =
  | 'perDayHighProbability'
  | 'perDayLowProbability';

function getPredictedRenewalCount(
  stat: AudienceStatsComputed,
  probability: PredictedRenewalProbability
): number {
  const flatKey = `predictedSubscriptionRenewalCount.${probability}` as const;

  return (
    stat[flatKey] ?? stat.predictedSubscriptionRenewalCount?.[probability] ?? 0
  );
}

function toUtcDay(date: string): Date {
  const localDate = new Date(date);

  return new Date(
    Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
  );
}

function formatIsoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getAudienceExportColumns(
  clientFilter: AudienceClientFilter,
  t: TFunction
): AudienceExportColumn[] {
  const columns: AudienceExportColumn[] = [
    {
      header: t('audienceTable.header.date'),
      width: 14,
      value: stat => toUtcDay(stat.date),
    },
  ];

  if (clientFilter.replacedSubscriptionCount) {
    columns.push({
      header: t('audience.legend.replacedSubscriptionCount'),
      width: 20,
      value: stat => stat.replacedSubscriptionCount,
    });
  }

  if (clientFilter.createdSubscriptionCount) {
    columns.push({
      header: t('audience.legend.createdSubscriptionCount'),
      width: 20,
      value: stat => stat.createdSubscriptionCount,
    });
  }

  if (clientFilter.renewedSubscriptionCount) {
    columns.push({
      header: t('audience.legend.renewedSubscriptionCount'),
      width: 20,
      value: stat => stat.renewedSubscriptionCount,
    });
  }

  if (clientFilter.predictedSubscriptionRenewalCount) {
    columns.push(
      {
        header: t(
          'audience.legend.predictedSubscriptionRenewalCountPerDay.highProbability'
        ),
        width: 20,
        value: stat => getPredictedRenewalCount(stat, 'perDayHighProbability'),
      },
      {
        header: t(
          'audience.legend.predictedSubscriptionRenewalCountPerDay.lowProbability'
        ),
        width: 20,
        value: stat => getPredictedRenewalCount(stat, 'perDayLowProbability'),
      }
    );
  }

  if (clientFilter.endingSubscriptionCount) {
    columns.push({
      header: t('audience.legend.endingSubscriptionCount'),
      width: 20,
      value: stat => stat.endingSubscriptionCount,
    });
  }

  columns.push({
    header: t('audience.legend.totalNewSubscriptions'),
    width: 24,
    value: stat => stat.totalNewSubscriptions,
  });

  if (clientFilter.overdueSubscriptionCount) {
    columns.push({
      header: t('audience.legend.overdueSubscriptionCount'),
      width: 20,
      value: stat => stat.overdueSubscriptionCount,
    });
  }

  if (clientFilter.deactivatedSubscriptionCount) {
    columns.push({
      header: t('audience.legend.deactivatedSubscriptionCount'),
      width: 20,
      value: stat => stat.deactivatedSubscriptionCount,
    });
  }

  if (clientFilter.totalActiveSubscriptionCount) {
    columns.push({
      header: t('audience.legend.totalActiveSubscriptionCount'),
      width: 24,
      value: stat => stat.totalActiveSubscriptionCount,
    });
  }

  columns.push(
    {
      header: t('audienceTableExport.header.renewedAndReplaced'),
      width: 20,
      value: stat => stat.renewedAndReplaced,
    },
    {
      header: t('audienceTableExport.header.totalToBeRenewed'),
      width: 20,
      value: stat => stat.totalToBeRenewed,
    },
    {
      header: `${t('audience.legend.renewalRate')} (%)`,
      width: 16,
      value: stat => stat.renewalRate,
    },
    {
      header: `${t('audience.legend.cancellationRate')} (%)`,
      width: 16,
      value: stat => stat.cancellationRate,
    }
  );

  return columns;
}

export function getAudienceExportFilename(
  audienceStats: AudienceStatsComputed[],
  timeResolution: TimeResolution
): string {
  const days = audienceStats.map(stat => formatIsoDay(toUtcDay(stat.date)));
  const dateRange = days.length ? `-${days[0]}_${days[days.length - 1]}` : '';

  return `audience-${timeResolution}${dateRange}`;
}

function sanitizeCsvValue(value: AudienceExportValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return formatIsoDay(value);
  }

  if (typeof value === 'number') {
    return `${value}`;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.click();
  URL.revokeObjectURL(url);
}

export function exportAudienceStatsAsCsv({
  audienceStats,
  columns,
  filename,
}: {
  audienceStats: AudienceStatsComputed[];
  columns: AudienceExportColumn[];
  filename: string;
}) {
  const rows = [
    columns.map(column => sanitizeCsvValue(column.header)),
    ...audienceStats.map(stat =>
      columns.map(column => sanitizeCsvValue(column.value(stat)))
    ),
  ];

  const csvString = rows.map(row => row.join(',')).join('\r\n');

  downloadBlob(
    new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }),
    `${filename}.csv`
  );
}

export async function exportAudienceStatsAsXlsx({
  audienceStats,
  columns,
  filename,
}: {
  audienceStats: AudienceStatsComputed[];
  columns: AudienceExportColumn[];
  filename: string;
}) {
  const xlsxColumns: Column<AudienceStatsComputed>[] = columns.map(column => ({
    header: {
      value: column.header,
      fontWeight: 'bold',
    },
    width: column.width,
    cell: stat => {
      const value = column.value(stat);

      if (value == null) {
        return null;
      }

      if (value instanceof Date) {
        return { value, type: Date, format: 'yyyy-mm-dd' };
      }

      return { value };
    },
  }));

  await writeXlsxFile(audienceStats, { columns: xlsxColumns }).toFile(
    `${filename}.xlsx`
  );
}
