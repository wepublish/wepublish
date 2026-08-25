import styled from '@emotion/styled';
import { MouseEvent, ReactNode } from 'react';
import { Message, Tag } from 'rsuite';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

const Wrapper = styled.div<{ clickable: boolean }>`
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'inherit')};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Content = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const Body = styled.div`
  flex: 1 1 300px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
`;

export interface NotificationItemProps {
  severity: NotificationSeverity;
  title: ReactNode;
  /** Extra status tags rendered next to the title */
  tags?: ReactNode;
  /** Short label identifying where the notification comes from */
  sourceTag?: string;
  actions?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  closable?: boolean;
  onClose?: () => void;
}

export function NotificationItem({
  severity,
  title,
  tags,
  sourceTag,
  actions,
  children,
  onClick,
  closable,
  onClose,
}: NotificationItemProps) {
  return (
    <Wrapper
      clickable={!!onClick}
      onClick={onClick}
    >
      <Message
        type={severity}
        showIcon
        closable={closable}
        onClose={onClose}
        header={
          <TitleRow>
            <strong>{title}</strong>
            {tags}
            {sourceTag && <Tag size="sm">{sourceTag}</Tag>}
          </TitleRow>
        }
      >
        {(children || actions) && (
          <Content>
            {children && <Body>{children}</Body>}

            {actions && (
              <Actions onClick={(event: MouseEvent) => event.stopPropagation()}>
                {actions}
              </Actions>
            )}
          </Content>
        )}
      </Message>
    </Wrapper>
  );
}
