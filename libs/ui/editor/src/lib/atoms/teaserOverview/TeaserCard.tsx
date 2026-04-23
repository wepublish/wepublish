import { useDraggable, useDroppable } from '@dnd-kit/core';
import styled from '@emotion/styled';
import {
  css,
  Tooltip,
  tooltipClasses,
  TooltipProps,
  useTheme,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { TeaserType } from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdArrowForward,
  MdContentCopy,
  MdDragIndicator,
  MdImage,
} from 'react-icons/md';

import {
  ArticleTeaser,
  EventTeaser,
  PageTeaser,
  Teaser,
} from '../../blocks/types';
import { SlotType } from './useWorkingBlocks';

export function groupColor(groupIndex: number, theme: Theme): string {
  const colors = [
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.dark,
    theme.palette.secondary.dark,
    theme.palette.success.dark,
    theme.palette.warning.dark,
    theme.palette.error.main,
  ];
  return colors[groupIndex % colors.length];
}

const Card = styled('div', {
  shouldForwardProp: p =>
    ![
      'isSelected',
      'groupColor',
      'isOver',
      'isScratch',
      'isEmptyReal',
      'selectionActive',
      'isDropTarget',
      'isShifting',
      'isEmpty',
    ].includes(p as string),
})<{
  isSelected: boolean;
  groupColor: string;
  isOver: boolean;
  isScratch: boolean;
  isEmptyReal: boolean;
  selectionActive: boolean;
  isDropTarget: boolean;
  isShifting: boolean;
  isEmpty: boolean;
}>`
  display: flex;
  align-items: stretch;
  height: 72px;
  border-radius: 6px;
  border: ${({ isDropTarget, isOver }) =>
      isDropTarget || isOver ? '3px' : '2px'}
    ${({ isScratch, isEmptyReal }) =>
      isScratch || isEmptyReal ? 'dashed' : 'solid'}
    ${({
      isSelected,
      isDropTarget,
      isOver,
      isShifting,
      isEmptyReal,
      groupColor,
      theme,
    }) =>
      isDropTarget ? theme.palette.primary.main
      : isOver ? theme.palette.primary.main
      : isShifting ? theme.palette.primary.light
      : isSelected ? theme.palette.primary.main
      : isEmptyReal ? theme.palette.error.main
      : groupColor};
  background: ${({
    isDropTarget,
    isOver,
    isShifting,
    isScratch,
    isEmptyReal,
    theme,
  }) =>
    isDropTarget ? `${theme.palette.primary.main}22`
    : isOver ? `${theme.palette.primary.main}22`
    : isShifting ? `${theme.palette.primary.light}15`
    : isEmptyReal ? `${theme.palette.error.main}11`
    : isScratch ? theme.palette.action.disabledBackground
    : theme.palette.background.paper};
  cursor: ${({ selectionActive, isEmpty }) =>
    isEmpty ? 'default'
    : selectionActive ? 'pointer'
    : 'grab'};
  overflow: hidden;
  user-select: none;
  position: relative;

  &:active {
    cursor: ${({ selectionActive, isEmpty }) =>
      isEmpty ? 'default'
      : selectionActive ? 'pointer'
      : 'grabbing'};
  }
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    background 0.15s;
  box-shadow: ${({ isSelected, isDropTarget, isOver, isShifting, theme }) =>
    isDropTarget ? `0 0 0 4px ${theme.palette.primary.main}55`
    : isOver ? `0 0 0 3px ${theme.palette.primary.main}55`
    : isShifting ? `0 0 0 2px ${theme.palette.primary.light}33`
    : isSelected ? `0 0 0 3px ${theme.palette.primary.main}55`
    : 'none'};

  &:hover {
    box-shadow: ${({
      isEmpty,
      isSelected,
      isDropTarget,
      isOver,
      isShifting,
      theme,
    }) => {
      const base =
        isDropTarget ? `0 0 0 4px ${theme.palette.primary.main}55`
        : isOver ? `0 0 0 3px ${theme.palette.primary.main}55`
        : isShifting ? `0 0 0 2px ${theme.palette.primary.light}33`
        : isSelected ? `0 0 0 3px ${theme.palette.primary.main}55`
        : null;
      if (base) {
        return base;
      }
      if (isEmpty) {
        return 'none';
      }
      return '0 2px 8px rgba(0, 0, 0, 0.15)';
    }};
  }
`;

const ShiftArrowOverlay = styled('div', {
  shouldForwardProp: p => p !== 'strong',
})<{ strong: boolean }>`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  font-size: ${({ strong }) => (strong ? '32px' : '28px')};
  color: ${({ strong, theme }) =>
    strong ? theme.palette.primary.main : theme.palette.primary.light};
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
  z-index: 2;
`;

const ColorBar = styled('div', {
  shouldForwardProp: p => p !== 'barColor' && p !== 'nestDepth',
})<{ barColor: string; nestDepth: number }>`
  width: ${({ nestDepth }) => 6 + nestDepth * 3}px;
  flex-shrink: 0;
  background: ${({ barColor }) => barColor};
  opacity: ${({ nestDepth }) => (nestDepth > 0 ? 0.6 : 1)};
`;

const Thumbnail = styled('div', {
  shouldForwardProp: p => p !== 'isScratch',
})<{ isScratch: boolean }>`
  width: 88px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.palette.action.hover};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: ${({ isScratch }) => (isScratch ? 0.45 : 1)};
    transition: opacity 0.15s;
  }
`;

const ThumbnailPlaceholder = styled('div')`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.palette.text.disabled};
  font-size: 24px;
`;

const TextArea = styled('div')`
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
`;

const PreTitle = styled('div')`
  ${({ theme }) => css`
    font-size: ${theme.typography.caption.fontSize};
    color: ${theme.palette.text.secondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `}
`;

const Title = styled('div')`
  ${({ theme }) => css`
    font-size: ${theme.typography.body2.fontSize};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.palette.text.primary};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

const EmptyScratchContent = styled('div')`
  ${({ theme }) => css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 2px;
    color: ${theme.palette.text.secondary};
    font-size: ${theme.typography.body2.fontSize};
    padding: 4px 8px;
  `}
`;

const EmptyHint = styled('div')`
  ${({ theme }) => css`
    color: ${theme.palette.text.disabled};
    font-size: ${theme.typography.caption.fontSize};
  `}
`;

const DuplicateBadge = styled('div', {
  shouldForwardProp: p => p !== 'badgeColor',
})<{ badgeColor: string }>`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ badgeColor }) => badgeColor};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

const DragHandle = styled('div')`
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  pointer-events: none;
  font-size: 22px;
  color: ${({ theme }) => theme.palette.text.secondary};
  background: ${({ theme }) => theme.palette.action.hover};
  flex-shrink: 0;
`;

const CardWrapper = styled('div', {
  shouldForwardProp: p => p !== 'isDragging',
})<{ isDragging: boolean }>`
  position: relative;
  opacity: ${({ isDragging }) => (isDragging ? 0.4 : 1)};
  transition: opacity 0.15s;
`;

const SelectionTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip
    {...props}
    classes={{ popper: className }}
  />
))`
  & .${tooltipClasses.tooltip} {
    font-size: 11px;
    white-space: pre-line;
  }
`;

export type PreviewState = 'drop-target' | 'will-shift-right' | 'none';

export type TeaserCardProps = {
  dragId: string;
  teaser: Teaser | null;
  slotType: SlotType;
  groupIndex: number;
  nestDepth: number;
  isSelected: boolean;
  isDuplicate: boolean;
  selectionActive: boolean;
  previewState: PreviewState;
  disableTooltip?: boolean;
  onClick: () => void;
};

export function TeaserCard({
  dragId,
  teaser,
  slotType,
  groupIndex,
  nestDepth,
  isSelected,
  isDuplicate,
  selectionActive,
  previewState,
  disableTooltip,
  onClick,
}: TeaserCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = groupColor(groupIndex, theme);

  const isScratch = slotType === 'scratch';
  const isEmpty = teaser === null;
  const isEmptyReal = slotType === 'empty';
  const canDrag = !isEmpty && !selectionActive;
  const canDrop = !selectionActive;
  const isDropTarget = previewState === 'drop-target';
  const isShifting = previewState === 'will-shift-right';

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: dragId, disabled: !canDrag });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dragId,
    disabled: !canDrop,
  });

  let entityImage = null;
  let entityTitle = null as string | null | undefined;
  let entityPreTitle = null as string | null | undefined;

  if (teaser) {
    switch (teaser.type) {
      case TeaserType.Article: {
        const a = teaser as ArticleTeaser;
        entityImage = a.article?.latest?.image ?? null;
        entityTitle = a.article?.latest?.title;
        entityPreTitle = a.article?.latest?.preTitle;
        break;
      }
      case TeaserType.Page: {
        const p = teaser as PageTeaser;
        entityImage = p.page?.latest?.image ?? null;
        entityTitle = p.page?.latest?.title;
        break;
      }
      case TeaserType.Event: {
        const e = teaser as EventTeaser;
        entityImage = e.event?.image ?? null;
        entityTitle = e.event?.name;
        break;
      }
    }
  }

  const teaserImage = teaser?.image ?? entityImage;
  const imageUrl = teaserImage?.mediumURL ?? teaserImage?.url ?? null;
  const displayTitle =
    teaser?.title ?? entityTitle ?? t('teaserOverview.noTitle');
  const displayPreTitle = teaser?.preTitle ?? entityPreTitle ?? '';

  const cardTooltip =
    isOver ? t('teaserOverview.dropHere')
    : isEmptyReal ? t('teaserOverview.tooltipEmptySlot')
    : isEmpty && isScratch ? t('teaserOverview.tooltipEmptyScratch')
    : isScratch ? t('teaserOverview.tooltipScratch')
    : isSelected ? t('teaserOverview.tooltipSelected')
    : t('teaserOverview.tooltipDefault');

  const [badgeHover, setBadgeHover] = useState(false);

  return (
    <SelectionTooltip
      key={isOver ? 'drag-over' : 'default'}
      title={badgeHover || disableTooltip ? '' : cardTooltip}
      placement="top"
      enterDelay={isOver ? 0 : 600}
      {...(isOver && !disableTooltip ? { open: true } : {})}
      {...(disableTooltip ? { open: false } : {})}
    >
      <CardWrapper
        ref={setDropRef}
        isDragging={isDragging}
      >
        {isDuplicate && !isEmpty && (
          <SelectionTooltip
            title={t('teaserOverview.duplicateBadge')}
            placement="top"
            enterDelay={300}
          >
            <DuplicateBadge
              badgeColor={color}
              onMouseEnter={() => setBadgeHover(true)}
              onMouseLeave={() => setBadgeHover(false)}
            >
              <MdContentCopy />
            </DuplicateBadge>
          </SelectionTooltip>
        )}

        <Card
          ref={canDrag ? setDragRef : undefined}
          {...(canDrag ? listeners : {})}
          {...(canDrag ? attributes : {})}
          isSelected={isSelected}
          isOver={isOver && !isDragging}
          isScratch={isScratch}
          isEmptyReal={isEmptyReal}
          isEmpty={isEmpty}
          selectionActive={selectionActive}
          isDropTarget={isDropTarget}
          isShifting={isShifting}
          groupColor={color}
          onClick={onClick}
          role="button"
          aria-pressed={isSelected}
        >
          {(isDropTarget || isShifting) && (
            <ShiftArrowOverlay strong={isDropTarget}>
              <MdArrowForward />
            </ShiftArrowOverlay>
          )}
          {!isEmpty && (
            <ColorBar
              barColor={color}
              nestDepth={nestDepth}
            />
          )}

          {isEmpty ?
            <EmptyScratchContent>
              <div>
                {isEmptyReal ?
                  t('teaserOverview.emptySlot')
                : t('teaserOverview.emptyScratch')}
              </div>
              <EmptyHint>
                {isEmptyReal ?
                  t('teaserOverview.emptySlotHint')
                : t('teaserOverview.scratchHint')}
              </EmptyHint>
            </EmptyScratchContent>
          : <>
              <Thumbnail isScratch={isScratch}>
                {imageUrl ?
                  <img
                    src={imageUrl}
                    alt=""
                  />
                : <ThumbnailPlaceholder>
                    <MdImage />
                  </ThumbnailPlaceholder>
                }
              </Thumbnail>

              <TextArea>
                {displayPreTitle && <PreTitle>{displayPreTitle}</PreTitle>}
                <Title>{displayTitle}</Title>
              </TextArea>

              <DragHandle aria-hidden="true">
                <MdDragIndicator />
              </DragHandle>
            </>
          }
        </Card>
      </CardWrapper>
    </SelectionTooltip>
  );
}
