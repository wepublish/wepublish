import { TFunction } from 'i18next';
import { Message, toaster } from 'rsuite';

export async function copyLinkToClipboard(url: string, t: TFunction) {
  try {
    await navigator.clipboard.writeText(url);

    toaster.push(
      <Message
        type="success"
        showIcon
        closable
        duration={3000}
      >
        {t('copyLink.copied')}
      </Message>
    );
  } catch {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={8000}
      >
        {t('copyLink.failed')}
      </Message>
    );
  }
}
