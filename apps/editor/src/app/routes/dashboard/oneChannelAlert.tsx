import styled from '@emotion/styled';
import { useOneChannelStatusQuery } from '@wepublish/editor/api';
import { NotificationItem } from '@wepublish/ui/editor';
import { ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export interface OneChannelAlertProps {
  sourceTag?: string;
  /** Reports whether the outage notice is currently rendered */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * The outage notice as a list of items, so a panel that mixes several sources
 * can sort everything by severity instead of rendering source after source.
 */
export function useOneChannelNotifications({
  sourceTag,
  onVisibilityChange,
}: OneChannelAlertProps): ReactElement[] {
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
    return [];
  }

  const lastSuccess = status?.lastSuccessAt;

  return [
    <NotificationItem
      key="one-channel-outage"
      severity="error"
      title={t('oneChannel.outageTitle')}
      sourceTag={sourceTag}
    >
      {lastSuccess ?
        t('oneChannel.outageText', {
          value: new Date(lastSuccess).toLocaleString('de-CH'),
        })
      : t('oneChannel.outageTextNever')}
    </NotificationItem>,
  ];
}

export function OneChannelAlert(props: OneChannelAlertProps) {
  const items = useOneChannelNotifications(props);

  return items.length ? <Stack>{items}</Stack> : null;
}
