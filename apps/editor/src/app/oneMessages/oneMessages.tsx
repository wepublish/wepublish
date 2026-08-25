import styled from '@emotion/styled';
import { NotificationItem, NotificationSeverity } from '@wepublish/ui/editor';
import { useReducer } from 'react';
import { useTranslation } from 'react-i18next';

import { isMinimized, setMinimized, useOneMessages } from './oneMessages.hooks';
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
}

export function OneMessages({
  hideHeader,
  emptyMessage,
  sourceTag,
}: OneMessagesProps) {
  const { t, i18n } = useTranslation();
  const messages = useOneMessages(i18n.language);
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  if (!messages.length) {
    return emptyMessage ? <EmptyText>{emptyMessage}</EmptyText> : null;
  }

  const expand = (id: number) => {
    setMinimized(id, false);
    forceRender();
  };

  const minimize = (id: number) => {
    setMinimized(id, true);
    forceRender();
  };

  return (
    <Stack>
      {!hideHeader && <Header>{t('oneMessages.header')}</Header>}

      {messages.map(message =>
        isMinimized(message) ?
          <NotificationItem
            key={message.id}
            severity={SEVERITY_TYPE[message.severity]}
            title={message.title}
            sourceTag={sourceTag}
            onClick={() => expand(message.id)}
          />
        : <NotificationItem
            key={message.id}
            severity={SEVERITY_TYPE[message.severity]}
            title={message.title}
            sourceTag={sourceTag}
            closable={message.dismissible}
            onClose={() => minimize(message.id)}
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
      )}
    </Stack>
  );
}
