import { Button } from '@mui/material';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { Ref, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFileDownload } from 'react-icons/md';
import { Dropdown } from 'rsuite';

import {
  exportAudienceStatsAsCsv,
  exportAudienceStatsAsXlsx,
  getAudienceExportColumns,
  getAudienceExportFilename,
} from './audience-export';
import { AudienceClientFilter, TimeResolution } from './audience-filter-params';
import { AudienceStatsComputed } from './useAudience';

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
      enqueueSnackbar((error as Error).message, {
        variant: 'error',
        autoHideDuration: 8000,
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dropdown
      placement="bottomEnd"
      renderToggle={(props: object, ref: Ref<HTMLButtonElement>) => (
        <Button
          variant="contained"
          startIcon={<MdFileDownload />}
          {...props}
          ref={ref}
          loading={loading || exporting}
          disabled={!audienceStats.length}
        >
          {t('audienceTableExport.download')}
        </Button>
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
