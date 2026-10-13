import { useDroppable } from '@dnd-kit/core';
import styled from '@emotion/styled';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

type DropContainerSubscriptionIntervalProps = PropsWithChildren<{
  dayIndex: number;
}>;

const DropArea = styled('div')<{ active?: boolean; hover?: boolean }>`
  position: relative;
  display: grid;
  gap: 8px;
  min-width: 0;
  margin: -6px;
  padding: 4px;
  border: 2px dashed
    ${({ active, hover }) =>
      hover ? 'var(--rs-primary-500)'
      : active ? 'var(--rs-border-primary)'
      : 'transparent'};
  border-radius: var(--rs-radius-md);
  background-color: ${({ hover }) =>
    hover ? 'var(--rs-bg-well)' : 'transparent'};
  transition:
    border-color 150ms ease,
    background-color 150ms ease;
`;

const DropHere = styled('span')`
  position: absolute;
  top: -10px;
  right: 12px;
  padding: 0 6px;
  background-color: var(--rs-bg-card);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  color: var(--rs-primary-500);
  pointer-events: none;
`;

export function DroppableSubscriptionInterval({
  dayIndex,
  children,
}: DropContainerSubscriptionIntervalProps) {
  const { t } = useTranslation();
  const { isOver, setNodeRef, active } = useDroppable({
    id: `droppable-${dayIndex}`,
    data: {
      dayIndex,
    },
  });

  return (
    <DropArea
      ref={setNodeRef}
      hover={isOver}
      active={!!active}
    >
      {isOver && <DropHere>{t('subscriptionFlow.dropHere')}</DropHere>}

      {children}
    </DropArea>
  );
}
