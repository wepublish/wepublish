import { useDndContext } from '@dnd-kit/core';
import styled from '@emotion/styled';
import { css, Typography, useTheme } from '@mui/material';
import { TeaserType } from '@wepublish/editor/api';
import { useMemo } from 'react';

import { teaserContentKey } from './extractTeasers';
import { groupColor, TeaserCard } from './TeaserCard';
import { WorkingBlock, WorkingTeaser } from './useWorkingBlocks';

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
  gap: 8px;
`;

const SlotWrapper = styled('div')`
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: calc(25% - 6px);
  min-width: 0;
  box-sizing: border-box;
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

function parseSlotId(id: string): { groupKey: string; idx: number } | null {
  if (typeof id !== 'string' || !id.startsWith('slot::')) return null;
  const rest = id.slice('slot::'.length);
  const sep = rest.lastIndexOf('::');
  if (sep < 0) return null;
  return { groupKey: rest.slice(0, sep), idx: Number(rest.slice(sep + 2)) };
}

function computePreview(
  block: WorkingBlock,
  activeId: string | null,
  overId: string | null,
  activeFilters: Set<TeaserType>
): Map<number, 'drop-target' | 'will-shift-right'> {
  const preview = new Map<number, 'drop-target' | 'will-shift-right'>();
  if (!activeId || !overId) return preview;

  const source = parseSlotId(activeId);
  const target = parseSlotId(overId);
  if (!source || !target) return preview;
  if (target.groupKey !== block.groupKey) return preview;

  const targetSlot = block.teasers[target.idx];
  if (!targetSlot) return preview;

  if (source.groupKey === target.groupKey && source.idx === target.idx) {
    return preview;
  }

  const isFilledRealTarget =
    targetSlot.type === 'real' && targetSlot.teaser !== null;
  if (!isFilledRealTarget) {
    return preview;
  }

  const N = block.originalCount;
  const isSlotVisible = (slot: WorkingTeaser) =>
    slot.type !== 'real' ||
    slot.teaser === null ||
    activeFilters.has(slot.teaser.type);

  let pushedOutIdx = -1;
  for (let i = N - 1; i >= 0; i--) {
    if (isSlotVisible(block.teasers[i])) {
      pushedOutIdx = i;
      break;
    }
  }

  preview.set(target.idx, 'drop-target');

  if (pushedOutIdx < 0 || target.idx > pushedOutIdx) {
    return preview;
  }

  for (let i = target.idx + 1; i <= pushedOutIdx; i++) {
    if (isSlotVisible(block.teasers[i])) {
      preview.set(i, 'will-shift-right');
    }
  }
  preview.set(N, 'will-shift-right');

  return preview;
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

  const { active, over } = useDndContext();
  const activeId = active && typeof active.id === 'string' ? active.id : null;
  const overId = over && typeof over.id === 'string' ? over.id : null;

  const preview = useMemo(
    () => computePreview(block, activeId, overId, activeFilters),
    [block, activeId, overId, activeFilters]
  );

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
            <SlotWrapper key={i}>
              <TeaserCard
                dragId={slotDragId}
                teaser={working.teaser}
                slotType={working.type}
                groupIndex={block.groupIndex}
                nestDepth={block.nestDepth}
                isSelected={isSelected}
                isDuplicate={
                  working.teaser !== null &&
                  duplicateKeys.has(teaserContentKey(working.teaser))
                }
                selectionActive={selectionActive}
                previewState={preview.get(i) ?? 'none'}
                onClick={() => onSlotClick(block.groupKey, i)}
              />
            </SlotWrapper>
          );
        })}
      </Row>
    </GroupWrapper>
  );
}
