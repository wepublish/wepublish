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
    ${({ active, hover, theme }) =>
      hover ? `${theme.vars.palette.primary.main}`
      : active ? `${theme.vars.palette.divider}`
      : 'transparent'};
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px * 0.75)`};
  background-color: ${({ hover, theme }) =>
    hover ? `${theme.vars.palette.background.default}` : 'transparent'};
  transition:
    border-color 150ms ease,
    background-color 150ms ease;
`;

const DropHere = styled('span')`
  position: absolute;
  top: -10px;
  right: 12px;
  padding: 0 6px;
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  color: ${({ theme }) => theme.vars.palette.primary.main};
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
