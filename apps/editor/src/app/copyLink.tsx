import { enqueueSnackbar } from '@wepublish/ui/editor';
import { TFunction } from 'i18next';

export async function copyLinkToClipboard(url: string, t: TFunction) {
  try {
    await navigator.clipboard.writeText(url);

    enqueueSnackbar(t('copyLink.copied'), {
      variant: 'success',
      autoHideDuration: 3000,
    });
  } catch {
    enqueueSnackbar(t('copyLink.failed'), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  }
}
