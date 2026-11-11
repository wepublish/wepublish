import { Button, MenuItem } from '@mui/material';
import { ClickMenu, enqueueSnackbar } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFileDownload } from 'react-icons/md';

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
    <ClickMenu
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      trigger={
        <Button
          variant="contained"
          startIcon={<MdFileDownload />}
          loading={loading || exporting}
          disabled={!audienceStats.length}
        >
          {t('audienceTableExport.download')}
        </Button>
      }
    >
      {close => [
        <MenuItem
          key="csv"
          onClick={() => {
            exportAudienceStats('csv');
            close();
          }}
        >
          {t('audienceTableExport.csv')}
        </MenuItem>,
        <MenuItem
          key="xlsx"
          onClick={() => {
            exportAudienceStats('xlsx');
            close();
          }}
        >
          {t('audienceTableExport.xlsx')}
        </MenuItem>,
      ]}
    </ClickMenu>
  );
}
