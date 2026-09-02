import { Ref, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFileDownload } from 'react-icons/md';
import { Dropdown, IconButton, Message, toaster } from 'rsuite';

import {
  exportAudienceStatsAsCsv,
  exportAudienceStatsAsXlsx,
  getAudienceExportColumns,
  getAudienceExportFilename,
} from './audience-export';
import { AudienceStatsComputed } from './useAudience';
import { AudienceClientFilter, TimeResolution } from './useAudienceFilter';

type AudienceExportFormat = 'csv' | 'xlsx';

type AudienceTableExportProps = {
  audienceStats: AudienceStatsComputed[];
  clientFilter: AudienceClientFilter;
  timeResolution: TimeResolution;
  loading: boolean;
};

export function AudienceTableExport({
  audienceStats,
  clientFilter,
  timeResolution,
  loading,
}: AudienceTableExportProps) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState<boolean>(false);

  async function exportAudienceStats(format: AudienceExportFormat) {
    const columns = getAudienceExportColumns(clientFilter, t);
    const filename = getAudienceExportFilename(audienceStats, timeResolution);

    setExporting(true);

    try {
      if (format === 'csv') {
        exportAudienceStatsAsCsv({ audienceStats, columns, filename });
      } else {
        await exportAudienceStatsAsXlsx({ audienceStats, columns, filename });
      }
    } catch (error) {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={3000}
        >
          {(error as Error).message}
        </Message>
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dropdown
      placement="bottomEnd"
      renderToggle={(props: object, ref: Ref<HTMLButtonElement>) => (
        <IconButton
          {...props}
          ref={ref}
          appearance="primary"
          icon={<MdFileDownload />}
          loading={loading || exporting}
          disabled={!audienceStats.length}
        >
          {t('audienceTableExport.download')}
        </IconButton>
      )}
    >
      <Dropdown.Item onClick={() => exportAudienceStats('csv')}>
        {t('audienceTableExport.csv')}
      </Dropdown.Item>
      <Dropdown.Item onClick={() => exportAudienceStats('xlsx')}>
        {t('audienceTableExport.xlsx')}
      </Dropdown.Item>
    </Dropdown>
  );
}
