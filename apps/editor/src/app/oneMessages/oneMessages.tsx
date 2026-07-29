import styled from '@emotion/styled';
import { useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from 'rsuite';

import { isMinimized, setMinimized, useOneMessages } from './oneMessages.hooks';
import type { Severity } from './oneMessages.types';

const SEVERITY_TYPE: Record<Severity, 'info' | 'warning' | 'error'> = {
  info: 'info',
  warning: 'warning',
  critical: 'error',
};

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const Header = styled.h5`
  margin: 0;
`;

const MinimizedMessage = styled(Message)`
  cursor: pointer;
`;

const Body = styled.p`
  white-space: pre-line;
  margin: 4px 0 0;
`;

const Link = styled.a`
  display: inline-block;
  margin-top: 8px;
`;

export function OneMessages() {
  const { t, i18n } = useTranslation();
  const messages = useOneMessages(i18n.language);
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  if (!messages.length) {
    return null;
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
      <Header>{t('oneMessages.header')}</Header>

      {messages.map(message =>
        isMinimized(message) ?
          <MinimizedMessage
            key={message.id}
            showIcon
            type={SEVERITY_TYPE[message.severity]}
            header={<strong>{message.title}</strong>}
            title={t('oneMessages.expand')}
            onClick={() => expand(message.id)}
          />
        : <Message
            key={message.id}
            showIcon
            type={SEVERITY_TYPE[message.severity]}
            closable={message.dismissible}
            onClose={() => minimize(message.id)}
            header={<strong>{message.title}</strong>}
          >
            {message.body && <Body>{message.body}</Body>}

            {message.link_url && (
              <Link
                href={message.link_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {message.link_label ?? t('oneMessages.linkFallback')}
              </Link>
            )}
          </Message>
      )}
    </Stack>
  );
}
