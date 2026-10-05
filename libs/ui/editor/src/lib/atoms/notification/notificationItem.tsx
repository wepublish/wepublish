import styled from '@emotion/styled';
import { MouseEvent, ReactNode } from 'react';
import { Message, Tag } from 'rsuite';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

/**
 * Worst first. Stacks of notifications are flex columns, so every item carries
 * its own `order` and a list mixing several sources sorts itself by severity —
 * a failing job never sits below a piece of news just because its source is
 * rendered later. Items of equal severity keep the order they were written in.
 */
export const SEVERITY_ORDER: Record<NotificationSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
  success: 3,
};

const Wrapper = styled.div<{
  clickable: boolean;
  severity: NotificationSeverity;
}>`
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'inherit')};
  order: ${({ severity }) => SEVERITY_ORDER[severity]};
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
}

export function NotificationItem({
  severity,
  title,
  tags,
  sourceTag,
  actions,
  children,
  onClick,
}: NotificationItemProps) {
  return (
    <Wrapper
      clickable={!!onClick}
      severity={severity}
      onClick={onClick}
    >
      <Message
        type={severity}
        showIcon
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
