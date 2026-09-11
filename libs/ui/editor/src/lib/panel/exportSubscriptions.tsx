import {
  SubscriptionFilter,
  useSubscriptionsAsCsvLazyQuery,
} from '@wepublish/editor/api';
import { Ref, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdFileDownload } from 'react-icons/md';
import { Dropdown, IconButton, Message, toaster } from 'rsuite';

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
          disabled={disabled}
        >
          {label}
        </IconButton>
      )}
    >
      <Dropdown.Item onClick={() => exportSubscriptions('csv')}>
        {t('subscriptionsExport.csv')}
      </Dropdown.Item>
      <Dropdown.Item onClick={() => exportSubscriptions('xlsx')}>
        {t('subscriptionsExport.xlsx')}
      </Dropdown.Item>
    </Dropdown>
  );
}

export function useExportSubscriptions() {
  const [getCsv, { loading }] = useSubscriptionsAsCsvLazyQuery({});

  return { initDownload, loading, getCsv };
}
