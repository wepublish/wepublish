import { useLazyQuery } from '@apollo/client/react';
import { Button, MenuItem } from '@mui/material';
import {
  SubscriptionFilter,
  SubscriptionsAsCsvDocument,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFileDownload } from 'react-icons/md';

import { ClickMenu } from '../popover/click-menu';
import { enqueueSnackbar } from '../snackbar';
import {
  exportSubscriptionsAsCsv,
  exportSubscriptionsAsXlsx,
  SubscriptionExportFormat,
} from './subscriptionsExport';

export interface ExportSubscriptionsProps {
  filter?: SubscriptionFilter;
}

/**
 * Get the subscriptions from the api and start the file download
 */
async function initDownload({
  getCsv,
  format,
  filter,
  filename = 'wep-subscriptions',
  prefixByDate = true,
}: {
  getCsv: any;
  format: SubscriptionExportFormat;
  filter?: SubscriptionFilter;
  filename?: string;
  prefixByDate?: boolean;
}) {
  const csvString = (await getCsv({ variables: filter ?? {} }))?.data
    ?.subscriptionsAsCsv;

  if (!csvString) {
    return;
  }

  const fullFilename =
    prefixByDate ? `${new Date().getTime()}-${filename}` : filename;

  if (format === 'xlsx') {
    await exportSubscriptionsAsXlsx({ csvString, filename: fullFilename });
  } else {
    exportSubscriptionsAsCsv({ csvString, filename: fullFilename });
  }
}

export function ExportSubscriptions({ filter }: ExportSubscriptionsProps) {
  const { t } = useTranslation();

  const { initDownload, getCsv, loading } = useExportSubscriptions();

  return (
    <SubscriptionExportDropdown
      label={t('subscriptionsExport.download')}
      loading={loading}
      onExport={format => initDownload({ getCsv, format, filter })}
    />
  );
}

export function SubscriptionExportDropdown({
  label,
  loading,
  disabled,
  onExport,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onExport: (format: SubscriptionExportFormat) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState<boolean>(false);

  async function exportSubscriptions(format: SubscriptionExportFormat) {
    setExporting(true);

    try {
      await onExport(format);
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
          disabled={disabled}
        >
          {label}
        </Button>
      }
    >
      {close => [
        <MenuItem
          key="csv"
          onClick={() => {
            exportSubscriptions('csv');
            close();
          }}
        >
          {t('subscriptionsExport.csv')}
        </MenuItem>,
        <MenuItem
          key="xlsx"
          onClick={() => {
            exportSubscriptions('xlsx');
            close();
          }}
        >
          {t('subscriptionsExport.xlsx')}
        </MenuItem>,
      ]}
    </ClickMenu>
  );
}

export function useExportSubscriptions() {
  const [getCsv, { loading }] = useLazyQuery(SubscriptionsAsCsvDocument, {});

  return { initDownload, loading, getCsv };
}
