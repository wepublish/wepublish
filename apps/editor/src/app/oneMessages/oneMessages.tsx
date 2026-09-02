import styled from '@emotion/styled';
import { NotificationItem, NotificationSeverity } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Button } from 'rsuite';

import { useOneMessages } from './oneMessages.hooks';
import type { Severity } from './oneMessages.types';

const SEVERITY_TYPE: Record<Severity, NotificationSeverity> = {
  info: 'info',
  warning: 'warning',
  critical: 'error',
};

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Header = styled.h5`
  margin: 0;
`;

const Body = styled.p`
  white-space: pre-line;
  margin: 0;
`;

const Link = styled.a`
  display: inline-block;
  margin-top: 8px;
`;

const EmptyText = styled.p`
  text-align: center;
  color: gray;
  padding: 12px;
`;

export interface OneMessagesProps {
  hideHeader?: boolean;
  emptyMessage?: string;
  sourceTag?: string;
  /** Messages whose id is in here are hidden (already read by the user) */
  readItemIds?: ReadonlySet<string>;
  /** Enables marking dismissible messages as read for the current user */
  onMarkRead?: (itemId: string) => void;
}

export function OneMessages({
  hideHeader,
  emptyMessage,
  sourceTag,
  readItemIds,
  onMarkRead,
}: OneMessagesProps) {
  const { t, i18n } = useTranslation();
  const messages = useOneMessages(i18n.language);

  const visibleMessages =
    readItemIds ?
      messages.filter(message => !readItemIds.has(String(message.id)))
    : messages;

  if (!visibleMessages.length) {
    return emptyMessage ? <EmptyText>{emptyMessage}</EmptyText> : null;
  }

  return (
    <Stack>
      {!hideHeader && <Header>{t('oneMessages.header')}</Header>}

      {visibleMessages.map(message => (
        <NotificationItem
          key={message.id}
          severity={SEVERITY_TYPE[message.severity]}
          title={message.title}
          sourceTag={sourceTag}
          actions={
            onMarkRead && message.dismissible ?
              <Button
                size="sm"
                appearance="default"
                onClick={() => onMarkRead(String(message.id))}
              >
                {t('notifications.markAsRead')}
              </Button>
            : undefined
          }
        >
          {message.body || message.link_url ?
            <>
              {message.body && <Body>{message.body}</Body>}

              {message.link_url && (
                <Link
                  href={message.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {message.link_label || t('oneMessages.linkFallback')}
                </Link>
              )}
            </>
          : null}
        </NotificationItem>
      ))}
    </Stack>
  );
}
