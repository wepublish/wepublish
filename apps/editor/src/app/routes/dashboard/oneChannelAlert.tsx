import { useOneChannelStatusQuery } from '@wepublish/editor/api';
import { NotificationItem } from '@wepublish/ui/editor';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface OneChannelAlertProps {
  sourceTag?: string;
  /** Reports whether the outage notice is currently rendered */
  onVisibilityChange?: (visible: boolean) => void;
}

export function OneChannelAlert({
  sourceTag,
  onVisibilityChange,
}: OneChannelAlertProps) {
  const { t } = useTranslation();
  const { data } = useOneChannelStatusQuery({
    fetchPolicy: 'cache-and-network',
  });

  const status = data?.oneChannelStatus;
  const unreachable = !!status?.unreachable;

  useEffect(() => {
    onVisibilityChange?.(unreachable);
  }, [onVisibilityChange, unreachable]);

  if (!unreachable) {
    return null;
  }

  const lastSuccess = status?.lastSuccessAt;

  return (
    <NotificationItem
      severity="error"
      title={t('oneChannel.outageTitle')}
      sourceTag={sourceTag}
    >
      {lastSuccess ?
        t('oneChannel.outageText', {
          value: new Date(lastSuccess).toLocaleString('de-CH'),
        })
      : t('oneChannel.outageTextNever')}
    </NotificationItem>
  );
}
