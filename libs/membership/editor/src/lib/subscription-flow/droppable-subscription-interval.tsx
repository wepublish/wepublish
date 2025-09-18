import { useDroppable } from '@dnd-kit/core';
import { css } from '@mui/material';
import styled from '@emotion/styled';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

type DropContainerSubscriptionIntervalProps = PropsWithChildren<{
  dayIndex: number;
}>;

const Draggable = styled('div')<{ active?: boolean; hover?: boolean }>`
  transition: border 600ms ease-in-out;
  border: 2px dashed ${({ theme }) => theme.palette.common.white};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  min-height: 50px;

  ${({ active }) =>
    active &&
    css`
      border: 2px dashed lightgrey;
    `}

  ${({ hover }) =>
    hover &&
    css`
      backgroundcolor: #eee;
    `}
`;

const DropHere = styled('span')<{ show?: boolean }>`
  ${({ show }) =>
    !show &&
    css`
      visibility: hidden;
    `}
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
    <Draggable
      ref={setNodeRef}
      hover={isOver}
      active={!!active}
    >
      <DropHere show={!!active}>{t('subscriptionFlow.dropHere')}</DropHere>

      {children}
    </Draggable>
  );
}
