import { useDndContext, useDroppable } from '@dnd-kit/core';
import styled from '@emotion/styled';
import { css, Typography, useTheme } from '@mui/material';
import { TeaserType } from '@wepublish/editor/api';
import { Fragment } from 'react';

import { teaserContentKey } from './extractTeasers';
import { groupColor, TeaserCard } from './TeaserCard';
import { WorkingBlock } from './useWorkingBlocks';

const GroupWrapper = styled('div', {
  shouldForwardProp: p => p !== 'borderColor' && p !== 'hasError',
})<{ borderColor: string; hasError: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-left: 0;
  padding-left: 10px;
  ${({ hasError, theme }) =>
    hasError &&
    css`
      outline: 1px solid ${theme.palette.error.main};
      outline-offset: 4px;
      border-radius: 4px;
    `}
`;

const GroupHeader = styled('div')`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const GroupDot = styled('div', {
  shouldForwardProp: p => p !== 'dotColor',
})<{ dotColor: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ dotColor }) => dotColor};
  flex-shrink: 0;
`;

const GroupLabel = styled(Typography)`
  ${({ theme }) => css`
    font-size: ${theme.typography.caption.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.palette.text.secondary};
    letter-spacing: 0.02em;
  `}
`;

const ErrorLabel = styled(Typography)`
  ${({ theme }) => css`
    font-size: ${theme.typography.caption.fontSize};
    color: ${theme.palette.error.main};
  `}
`;

const Row = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  row-gap: 8px;
`;

const SlotWrapper = styled('div')`
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: calc(25% - 33px);
  min-width: 0;
  box-sizing: border-box;
`;

const GapDrop = styled('div', {
  shouldForwardProp: p => p !== 'isOver' && p !== 'isForbidden',
})<{ isOver: boolean; isForbidden: boolean }>`
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: 25px;
  align-self: stretch;
  margin: 2px 4px;
  border-radius: 8px;
  background: ${({ isOver, isForbidden, theme }) =>
    isForbidden && isOver ? `${theme.palette.error.main}55`
    : isForbidden ? `${theme.palette.error.main}22`
    : isOver ? theme.palette.primary.main
    : theme.palette.action.selected};
  box-shadow: ${({ isOver, isForbidden, theme }) =>
    isForbidden && isOver ? `0 0 0 2px ${theme.palette.error.light}88`
    : isOver ? `0 0 0 2px ${theme.palette.primary.light}88`
    : 'none'};
  cursor: ${({ isForbidden }) => (isForbidden ? 'not-allowed' : 'auto')};
  transition:
    background 0.15s,
    box-shadow 0.15s;
`;

type SelectedSlot = { groupKey: string; idx: number };

type TeaserBlockGroupProps = {
  block: WorkingBlock;
  duplicateKeys: Set<string>;
  selected: SelectedSlot | null;
  errorEmptyCount?: number;
  errorLabel?: string;
  activeFilters: Set<TeaserType>;
  selectionActive: boolean;
  onSlotClick: (groupKey: string, idx: number) => void;
};

function Gap({
  dropId,
  groupKey,
  gapIdx,
}: {
  dropId: string;
  groupKey: string;
  gapIdx: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  const { active } = useDndContext();

  let isForbidden = false;
  if (active && typeof active.id === 'string') {
    const parts = active.id.split('::');
    if (parts.length === 3 && parts[0] === 'slot') {
      const sourceKey = parts[1];
      const sourceIdx = Number(parts[2]);
      if (
        sourceKey === groupKey &&
        (gapIdx === sourceIdx || gapIdx === sourceIdx + 1)
      ) {
        isForbidden = true;
      }
    }
  }

  return (
    <GapDrop
      ref={setNodeRef}
      isOver={isOver}
      isForbidden={isForbidden}
    />
  );
}

export function TeaserBlockGroup({
  block,
  duplicateKeys,
  selected,
  errorEmptyCount,
  errorLabel,
  activeFilters,
  selectionActive,
  onSlotClick,
}: TeaserBlockGroupProps) {
  const theme = useTheme();
  const color = groupColor(block.groupIndex, theme);
  const hasError = errorEmptyCount !== undefined && errorEmptyCount > 0;

  return (
    <GroupWrapper
      borderColor={color}
      hasError={hasError}
    >
      <GroupHeader>
        <GroupDot dotColor={color} />
        <GroupLabel variant="caption">{block.label}</GroupLabel>
        {hasError && errorLabel && (
          <ErrorLabel variant="caption">{errorLabel}</ErrorLabel>
        )}
      </GroupHeader>

      <Row>
        {block.teasers.map((working, i) => {
          const isSelected =
            selected?.groupKey === block.groupKey && selected?.idx === i;
          const slotDragId = `slot::${block.groupKey}::${i}`;

          const isHiddenByFilter =
            working.type === 'real' &&
            working.teaser !== null &&
            !activeFilters.has(working.teaser.type);
          if (isHiddenByFilter) return null;

          return (
            <Fragment key={i}>
              <Gap
                dropId={`gap::${block.groupKey}::${i}`}
                groupKey={block.groupKey}
                gapIdx={i}
              />
              <SlotWrapper>
                <TeaserCard
                  dragId={slotDragId}
                  teaser={working.teaser}
                  slotType={working.type}
                  groupIndex={block.groupIndex}
                  nestDepth={block.nestDepth}
                  isSelected={isSelected}
                  isTarget={false}
                  isDuplicate={
                    working.teaser !== null &&
                    duplicateKeys.has(teaserContentKey(working.teaser))
                  }
                  selectionActive={selectionActive}
                  onClick={() => onSlotClick(block.groupKey, i)}
                />
              </SlotWrapper>
            </Fragment>
          );
        })}
      </Row>
    </GroupWrapper>
  );
}
