import styled from '@emotion/styled';
import { useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Message } from 'rsuite';

import { dismiss, isHidden, useOneMessages } from './oneMessages.hooks';
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

  const visible = messages.filter(message => !isHidden(message));

  if (!visible.length) {
    return null;
  }

  return (
    <Stack>
      {visible.map(message => (
        <Message
          key={message.id}
          showIcon
          type={SEVERITY_TYPE[message.severity]}
          closable={message.dismissible}
          onClose={() => {
            dismiss(message.id);
            forceRender();
          }}
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
      ))}
    </Stack>
  );
}
