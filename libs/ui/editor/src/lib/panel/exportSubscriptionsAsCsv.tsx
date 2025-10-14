import {
  SubscriptionFilter,
  useSubscriptionsAsCsvLazyQuery,
} from '@wepublish/editor/api';
import { useTranslation } from 'react-i18next';
import { MdFileDownload } from 'react-icons/md';
import { IconButton } from 'rsuite';

export interface ExportSubscriptionAsCsvProps {
  filter?: SubscriptionFilter;
}

/**
 * Get blob from csv string and download it as file.
 */
function downloadBlob(csvString: string) {
  const filename = `${new Date().getTime()}-wep-subscriptions.csv`;
  const contentType = 'text/csv;charset=utf-8;';
  const blob = new Blob([csvString], { type: contentType });
  const url = URL.createObjectURL(blob);
  const pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', filename);
  pom.click();
}

/**
 * Initialize download by getting data from api and start the blob download
 */
async function initDownload(getCsv: any, filter?: SubscriptionFilter) {
  // required to pass the variables here. see: https://github.com/apollographql/apollo-client/issues/5912#issuecomment-587877697
  const csv = (await getCsv({ variables: { filter } }))?.data
    ?.subscriptionsAsCsv;
  if (csv) {
    downloadBlob(csv);
  }
}

export function ExportSubscriptionsAsCsv({
  filter,
}: ExportSubscriptionAsCsvProps) {
  const { t } = useTranslation();
  const [getCsv, { loading }] = useSubscriptionsAsCsvLazyQuery({
    fetchPolicy: 'network-only',
  });

  return (
    <IconButton
      appearance="primary"
      icon={<MdFileDownload />}
      loading={loading}
      onClick={() => initDownload(getCsv, filter)}
    >
      {t('subscriptionList.overview.downloadCsv')}
    </IconButton>
  );
}

export function useExportSubscriptionsAsCsv() {
  const [getCsv, { loading }] = useSubscriptionsAsCsvLazyQuery({
    fetchPolicy: 'network-only',
  });

  return { initDownload, loading, getCsv };
}
