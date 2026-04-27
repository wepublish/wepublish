import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import styled from '@emotion/styled';
import { Chip, Collapse, css, Typography } from '@mui/material';
import { TeaserType, useBlockStylesQuery } from '@wepublish/editor/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdClose,
  MdEditNote,
  MdExpandLess,
  MdExpandMore,
  MdGridView,
  MdRedo,
  MdUndo,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';
import { Drawer, IconButton } from 'rsuite';

import { BlockValue, Teaser } from '../../blocks/types';
import { useRegisterValidator } from '../../hooks/useEditorValidation';
import { TeaserSelectAndEditPanel } from '../../panel/teaserSelectAndEditPanel';
import { teaserContentKey } from './extractTeasers';
import { TeaserBlockGroup } from './TeaserBlockGroup';
import { TeaserCard } from './TeaserCard';
import { useWorkingBlocks } from './useWorkingBlocks';

const PanelWrapper = styled('div', {
  shouldForwardProp: p => p !== 'hasError',
})<{ hasError: boolean }>`
  width: 100%;
  margin-bottom: 16px;
  border: 1px solid
    ${({ hasError, theme }) =>
      hasError ? theme.palette.error.main : theme.palette.divider};
  border-radius: 8px;
  transition: border-color 0.15s;
`;

const Header = styled('button', {
  shouldForwardProp: p => p !== 'isOpen' && p !== 'hasError',
})<{ isOpen: boolean; hasError: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${({ hasError, theme }) =>
    hasError ? `${theme.palette.error.main}22` : '#f7f9fa'};
  border: none;
  border-radius: ${({ isOpen }) => (isOpen ? '7px 7px 0 0' : '7px')};
  transition:
    border-radius 0ms ${({ isOpen }) => (isOpen ? '0ms' : '250ms')},
    background 0.15s;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${({ hasError, theme }) =>
      hasError ? `${theme.palette.error.main}33` : '#eef1f3'};
  }
`;

const HeaderIcon = styled('div')`
  font-size: 20px;
  color: ${({ theme }) => theme.palette.text.secondary};
  display: flex;
  align-items: center;
`;

const HeaderTitle = styled(Typography)`
  ${({ theme }) => css`
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.palette.text.primary};
    flex: 1;
  `}
`;

const HeaderMeta = styled(Typography)`
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const ChevronIcon = styled('div')`
  font-size: 20px;
  color: ${({ theme }) => theme.palette.text.secondary};
  display: flex;
  align-items: center;
`;

const Content = styled('div')`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-radius: 0 0 7px 7px;
  background: ${({ theme }) => theme.palette.background.default};
`;

const StickyActionBar = styled('div', {
  shouldForwardProp: p => p !== 'visible',
})<{ visible: boolean }>`
  ${({ theme }) => css`
    font-size: ${theme.typography.caption.fontSize};
    color: ${theme.palette.primary.main}99;
    background: #eef4fb;
    border: 1px solid ${theme.palette.primary.light}55;
    border-radius: 4px;
    padding: 4px 8px 4px 12px;
  `}
  position: sticky;
  top: 66px;
  z-index: 9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity 0.15s;
`;

const StickyActionBarLeft = styled('div')`
  display: flex;
  align-items: center;
  margin-left: 10px;
`;

const StickyActionBarRight = styled('div')`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
`;

const HintText = styled('span')`
  flex: 1;
  ${({ theme }) => css`
    color: ${theme.palette.primary.dark};
  `}
`;

const HintActions = styled('div')`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const FilterBar = styled('div')`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding: 8px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  background: #f7f9fa;
`;

const StickyHistoryBtnWrap = styled('span')`
  display: inline-flex;
  border: 1px solid ${({ theme }) => `${theme.palette.primary.light}88`};
  border-radius: 4px;
  color: ${({ theme }) => theme.palette.primary.dark};

  .rs-btn {
    color: inherit;
  }

  .rs-btn:disabled {
    color: ${({ theme }) => theme.palette.primary.light};
  }
`;

const StickyHideAllBtnWrap = styled(StickyHistoryBtnWrap)`
  .rs-btn svg {
    width: 16px;
    height: 16px;
  }
`;

const FilterLabel = styled(Typography)`
  ${({ theme }) => css`
    color: ${theme.palette.text.secondary};
    margin-right: 4px;
  `}
`;

const ChipCount = styled('span', {
  shouldForwardProp: p => p !== 'active',
})<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  margin-left: 4px;
  background: ${({ active, theme }) =>
    active ? 'rgba(255,255,255,0.25)' : theme.palette.action.hover};
  color: ${({ active, theme }) =>
    active ? '#fff' : theme.palette.text.secondary};
`;

const EmptyState = styled(Typography)`
  ${({ theme }) => css`
    color: ${theme.palette.text.disabled};
    text-align: center;
    padding: 16px;
  `}
`;

const ALL_TEASER_TYPES = [
  TeaserType.Article,
  TeaserType.Page,
  TeaserType.Event,
  TeaserType.Custom,
] as const;

type SelectedSlot = { groupKey: string; idx: number };

type TeaserOverviewPanelProps = {
  blocks: BlockValue[];
  onChange: (blocks: BlockValue[]) => void;
};

type ParsedId = { groupKey: string; idx: number };

function parseDragId(id: string): ParsedId | null {
  const firstSep = id.indexOf('::');
  if (firstSep < 0) {
    return null;
  }
  const kind = id.slice(0, firstSep);
  if (kind !== 'slot') {
    return null;
  }
  const rest = id.slice(firstSep + 2);
  const lastSep = rest.lastIndexOf('::');
  if (lastSep < 0) {
    return null;
  }
  const groupKey = rest.slice(0, lastSep);
  const num = Number(rest.slice(lastSep + 2));
  return { groupKey, idx: num };
}

export function TeaserOverviewPanel({
  blocks,
  onChange,
}: TeaserOverviewPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedSlot | null>(null);
  const [replaceSlot, setReplaceSlot] = useState<SelectedSlot | null>(null);
  const filterStorageKey = useMemo(
    () =>
      `teaserOverview.activeFilters.${
        typeof window !== 'undefined' ? window.location.pathname : ''
      }`,
    []
  );
  const [activeFilters, setActiveFilters] = useState<Set<TeaserType>>(() => {
    if (typeof window === 'undefined') {
      return new Set([TeaserType.Article]);
    }
    try {
      const raw = window.localStorage.getItem(filterStorageKey);
      if (!raw) {
        return new Set([TeaserType.Article]);
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return new Set([TeaserType.Article]);
      }
      const valid: TeaserType[] = parsed.filter(
        (v): v is TeaserType =>
          typeof v === 'string' &&
          (Object.values(TeaserType) as string[]).includes(v)
      );
      return new Set(valid);
    } catch {
      return new Set([TeaserType.Article]);
    }
  });
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [activeDrag, setActiveDrag] = useState<SelectedSlot | null>(null);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const hiddenStorageKey = useMemo(
    () =>
      `teaserOverview.hiddenBlocks.${
        typeof window !== 'undefined' ? window.location.pathname : ''
      }`,
    []
  );
  const [hiddenBlocks, setHiddenBlocks] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') {
      return new Set();
    }
    try {
      const raw = window.localStorage.getItem(hiddenStorageKey);
      if (!raw) {
        return new Set();
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set<string>(parsed) : new Set();
    } catch {
      return new Set();
    }
  });

  const persistHidden = useCallback(
    (next: Set<string>) => {
      try {
        window.localStorage.setItem(
          hiddenStorageKey,
          JSON.stringify([...next])
        );
      } catch {
        // ignore quota / private mode
      }
    },
    [hiddenStorageKey]
  );

  const toggleHidden = useCallback((groupKey: string) => {
    setHiddenBlocks(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  const { data: blockStylesData } = useBlockStylesQuery();
  const blockStyleNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const style of blockStylesData?.blockStyles ?? []) {
      map.set(style.id, style.name);
    }
    return map;
  }, [blockStylesData]);

  const {
    workingBlocks,
    dispatchDrag,
    loadTeaser,
    validate,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  } = useWorkingBlocks(blocks, t, blockStyleNames, onChange);

  const hideableGroupKeys = useMemo(
    () =>
      workingBlocks
        .filter(b => !b.teasers.some(w => w.type === 'empty'))
        .map(b => b.groupKey),
    [workingBlocks]
  );

  const canHideAll = hideableGroupKeys.some(k => !hiddenBlocks.has(k));
  const canUnhideAll = hiddenBlocks.size > 0;

  const hideAll = useCallback(() => {
    setHiddenBlocks(prev => {
      const next = new Set(prev);
      for (const k of hideableGroupKeys) {
        next.add(k);
      }
      return next;
    });
  }, [hideableGroupKeys]);

  const unhideAll = useCallback(() => {
    setHiddenBlocks(new Set());
  }, []);

  useEffect(() => {
    setHiddenBlocks(prev => {
      let changed = false;
      const next = new Set(prev);
      for (const b of workingBlocks) {
        const hasEmpty = b.teasers.some(w => w.type === 'empty');
        if (hasEmpty && next.has(b.groupKey)) {
          next.delete(b.groupKey);
          changed = true;
        }
      }
      if (!changed) {
        return prev;
      }
      persistHidden(next);
      return next;
    });
  }, [workingBlocks, persistHidden]);

  useEffect(() => {
    persistHidden(hiddenBlocks);
  }, [hiddenBlocks, persistHidden]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        filterStorageKey,
        JSON.stringify([...activeFilters])
      );
    } catch {
      // ignore quota / private mode
    }
  }, [activeFilters, filterStorageKey]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, undo, redo]);

  const totalRealTeasers = useMemo(
    () =>
      workingBlocks.reduce(
        (sum, b) =>
          sum + b.teasers.filter(w => w.type === 'real' && w.teaser).length,
        0
      ),
    [workingBlocks]
  );

  const isFiltering = activeFilters.size !== ALL_TEASER_TYPES.length;

  const teaserCountsByType = useMemo(() => {
    const counts = new Map<TeaserType, number>();
    for (const b of workingBlocks) {
      for (const w of b.teasers) {
        if (w.type !== 'real' || !w.teaser) {
          continue;
        }
        counts.set(w.teaser.type, (counts.get(w.teaser.type) ?? 0) + 1);
      }
    }
    return counts;
  }, [workingBlocks]);

  const validationErrors = useMemo(() => validate(), [validate]);
  const showErrors = saveAttempted && validationErrors.length > 0;

  useRegisterValidator('teaser-overview', () => {
    const errors = validate();
    if (errors.length === 0) {
      clearHistory();
      return { ok: true };
    }
    setSaveAttempted(true);
    setIsOpen(true);
    return {
      ok: false,
      summary: t(
        errors.length === 1 ?
          'teaserOverview.validationSummaryOne'
        : 'teaserOverview.validationSummaryMany',
        { count: errors.length }
      ),
    };
  });

  useEffect(() => {
    if (saveAttempted && validationErrors.length === 0) {
      setSaveAttempted(false);
    }
  }, [saveAttempted, validationErrors.length]);

  const errorsByGroup = useMemo(() => {
    if (!showErrors) {
      return new Map<string, number>();
    }
    const m = new Map<string, number>();
    for (const e of validationErrors) {
      m.set(e.groupKey, e.emptyCount);
    }
    return m;
  }, [validationErrors, showErrors]);

  const visibleBlocks = useMemo(() => {
    if (!isFiltering) {
      return workingBlocks;
    }
    return workingBlocks.filter(b => {
      const hasEmpty = b.teasers.some(w => w.type === 'empty');
      const hasMatchingReal = b.teasers.some(
        w =>
          w.type === 'real' &&
          w.teaser !== null &&
          activeFilters.has(w.teaser.type)
      );
      return hasEmpty || hasMatchingReal;
    });
  }, [workingBlocks, activeFilters, isFiltering]);

  const visibleTeaserCount = useMemo(
    () =>
      visibleBlocks.reduce(
        (sum, b) =>
          sum +
          b.teasers.filter(
            w =>
              w.type === 'real' &&
              w.teaser !== null &&
              activeFilters.has(w.teaser.type)
          ).length,
        0
      ),
    [visibleBlocks, activeFilters]
  );

  const duplicateKeys = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of workingBlocks) {
      for (const w of b.teasers) {
        if (!w.teaser) {
          continue;
        }
        const key = teaserContentKey(w.teaser);
        if (!key) {
          continue;
        }
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    const dupes = new Set<string>();
    for (const [key, count] of counts) {
      if (count > 1) {
        dupes.add(key);
      }
    }
    return dupes;
  }, [workingBlocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const parsed = parseDragId(event.active.id as string);
    if (parsed) {
      setActiveDrag({ groupKey: parsed.groupKey, idx: parsed.idx });
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      const { active, over } = event;
      if (!over) {
        return;
      }
      const source = parseDragId(active.id as string);
      const target = parseDragId(over.id as string);
      if (!source || !target) {
        return;
      }
      const sourceBlock = workingBlocks.find(
        b => b.groupKey === source.groupKey
      );
      if (!sourceBlock) {
        return;
      }
      const sourceSlot = sourceBlock.teasers[source.idx];
      if (!sourceSlot) {
        return;
      }

      const isSlotVisible = (slot: { teaser: Teaser | null; type: string }) =>
        slot.type !== 'real' ||
        slot.teaser === null ||
        activeFilters.has(slot.teaser.type);

      dispatchDrag(
        {
          groupKey: source.groupKey,
          idx: source.idx,
          type: sourceSlot.type,
        },
        { groupKey: target.groupKey, idx: target.idx },
        isSlotVisible
      );
    },
    [workingBlocks, dispatchDrag, activeFilters]
  );

  const toggleFilter = useCallback((type: TeaserType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleSlotClick = useCallback(
    (groupKey: string, idx: number) => {
      if (selected && selected.groupKey === groupKey && selected.idx === idx) {
        setSelected(null);
        return;
      }
      setSelected({ groupKey, idx });
    },
    [selected]
  );

  const handleCancelSelection = useCallback(() => {
    setSelected(null);
  }, []);

  const handleReplaceClick = useCallback(() => {
    setReplaceSlot(selected);
  }, [selected]);

  const handleReplaceConfirm = useCallback(
    (teaser: Teaser) => {
      if (!replaceSlot) {
        return;
      }
      loadTeaser(replaceSlot.groupKey, replaceSlot.idx, teaser);
      setReplaceSlot(null);
      setSelected(null);
    },
    [replaceSlot, loadTeaser]
  );

  const handleReplaceClose = useCallback(() => {
    setReplaceSlot(null);
  }, []);

  if (workingBlocks.length === 0) {
    return null;
  }

  const summary = t(
    workingBlocks.length === 1 ?
      'teaserOverview.summaryOne'
    : 'teaserOverview.summaryMany',
    {
      count: totalRealTeasers,
      blocks: workingBlocks.length,
    }
  );

  const filterSuffix =
    isFiltering ?
      ` (${t('teaserOverview.filterSuffix', { count: visibleTeaserCount })})`
    : '';

  const selectedWorking =
    selected &&
    workingBlocks.find(b => b.groupKey === selected.groupKey)?.teasers[
      selected.idx
    ];

  return (
    <>
      <PanelWrapper hasError={showErrors}>
        <Header
          isOpen={isOpen}
          hasError={showErrors}
          onClick={() => {
            setIsOpen(v => !v);
            if (isOpen) {
              setSelected(null);
            }
          }}
          aria-expanded={isOpen}
        >
          <HeaderIcon>
            <MdGridView />
          </HeaderIcon>

          <HeaderTitle variant="body2">{t('teaserOverview.title')}</HeaderTitle>

          <HeaderMeta variant="caption">
            {summary}
            {filterSuffix}
          </HeaderMeta>

          <ChevronIcon>
            {isOpen ?
              <MdExpandLess />
            : <MdExpandMore />}
          </ChevronIcon>
        </Header>

        <Collapse
          in={isOpen}
          onEnter={() => setIsCollapsing(true)}
          onEntered={() => setIsCollapsing(false)}
          onExit={() => setIsCollapsing(true)}
          onExited={() => setIsCollapsing(false)}
        >
          <FilterBar>
            <FilterLabel variant="caption">
              {t('teaserOverview.filterLabel')}
            </FilterLabel>
            {ALL_TEASER_TYPES.map(type => (
              <Chip
                key={type}
                label={
                  <>
                    {t(`teaserOverview.teaserTypes.${type}`)}
                    <ChipCount active={activeFilters.has(type)}>
                      {teaserCountsByType.get(type) ?? 0}
                    </ChipCount>
                  </>
                }
                size="small"
                variant={activeFilters.has(type) ? 'filled' : 'outlined'}
                color={activeFilters.has(type) ? 'primary' : 'default'}
                disabled={!!selected}
                onClick={e => {
                  e.stopPropagation();
                  toggleFilter(type);
                }}
              />
            ))}
          </FilterBar>

          <Content>
            <StickyActionBar visible={!isCollapsing}>
              <StickyActionBarLeft>
                <StickyHideAllBtnWrap>
                  <IconButton
                    size="xs"
                    appearance="subtle"
                    icon={canHideAll ? <MdVisibilityOff /> : <MdVisibility />}
                    disabled={!canHideAll && !canUnhideAll}
                    onClick={canHideAll ? hideAll : unhideAll}
                    title={t(
                      canHideAll ?
                        'teaserOverview.hideAllBlocks'
                      : 'teaserOverview.unhideAllBlocks'
                    )}
                  />
                </StickyHideAllBtnWrap>
              </StickyActionBarLeft>
              <StickyActionBarRight>
                {selected ?
                  <>
                    <HintText>
                      {selectedWorking?.teaser ?
                        t('teaserOverview.hintTextReplace')
                      : t('teaserOverview.hintTextLoad')}
                    </HintText>
                    <HintActions>
                      <IconButton
                        size="xs"
                        appearance="ghost"
                        icon={<MdClose />}
                        onClick={handleCancelSelection}
                        title={
                          selectedWorking?.teaser ?
                            t('teaserOverview.cancelReplaceTitle')
                          : t('teaserOverview.cancelLoadTitle')
                        }
                      >
                        {selectedWorking?.teaser ?
                          t('teaserOverview.cancelReplace')
                        : t('teaserOverview.cancelLoad')}
                      </IconButton>
                      <IconButton
                        size="xs"
                        appearance="primary"
                        icon={<MdEditNote />}
                        onClick={handleReplaceClick}
                        title={
                          selectedWorking?.teaser ?
                            t('teaserOverview.replaceButtonTitle')
                          : t('teaserOverview.loadButtonTitle')
                        }
                      >
                        {selectedWorking?.teaser ?
                          t('teaserOverview.replaceButton')
                        : t('teaserOverview.loadButton')}
                      </IconButton>
                    </HintActions>
                  </>
                : <>
                    <StickyHistoryBtnWrap>
                      <IconButton
                        size="xs"
                        appearance="subtle"
                        icon={<MdUndo />}
                        disabled={!canUndo}
                        onClick={undo}
                        title={t(
                          canUndo ?
                            'teaserOverview.undo'
                          : 'teaserOverview.undoEmpty'
                        )}
                      />
                    </StickyHistoryBtnWrap>
                    <StickyHistoryBtnWrap>
                      <IconButton
                        size="xs"
                        appearance="subtle"
                        icon={<MdRedo />}
                        disabled={!canRedo}
                        onClick={redo}
                        title={t(
                          canRedo ?
                            'teaserOverview.redo'
                          : 'teaserOverview.redoEmpty'
                        )}
                      />
                    </StickyHistoryBtnWrap>
                  </>
                }
              </StickyActionBarRight>
            </StickyActionBar>

            {visibleBlocks.length === 0 && (
              <EmptyState variant="body2">
                {t('teaserOverview.emptyState')}
              </EmptyState>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveDrag(null)}
            >
              {visibleBlocks.map(block => (
                <TeaserBlockGroup
                  key={block.groupKey}
                  block={block}
                  duplicateKeys={duplicateKeys}
                  selected={selected}
                  errorEmptyCount={errorsByGroup.get(block.groupKey)}
                  errorLabel={
                    errorsByGroup.has(block.groupKey) ?
                      t(
                        errorsByGroup.get(block.groupKey) === 1 ?
                          'teaserOverview.blockEmptyErrorOne'
                        : 'teaserOverview.blockEmptyErrorMany',
                        { count: errorsByGroup.get(block.groupKey) }
                      )
                    : undefined
                  }
                  activeFilters={activeFilters}
                  selectionActive={!!selected}
                  isHidden={hiddenBlocks.has(block.groupKey)}
                  canHide={!block.teasers.some(w => w.type === 'empty')}
                  onToggleHidden={toggleHidden}
                  onSlotClick={handleSlotClick}
                />
              ))}
              <DragOverlay dropAnimation={null}>
                {(() => {
                  if (!activeDrag) {
                    return null;
                  }
                  const block = workingBlocks.find(
                    b => b.groupKey === activeDrag.groupKey
                  );
                  const slot = block?.teasers[activeDrag.idx];
                  if (!block || !slot || !slot.teaser) {
                    return null;
                  }
                  return (
                    <div style={{ width: 220 }}>
                      <TeaserCard
                        dragId="drag-overlay"
                        teaser={slot.teaser}
                        slotType={slot.type}
                        groupIndex={block.groupIndex}
                        nestDepth={block.nestDepth}
                        isSelected={false}
                        isDuplicate={false}
                        selectionActive={false}
                        previewState="none"
                        disableTooltip
                        onClick={() => undefined}
                      />
                    </div>
                  );
                })()}
              </DragOverlay>
            </DndContext>
          </Content>
        </Collapse>
      </PanelWrapper>

      <Drawer
        open={replaceSlot !== null}
        size="sm"
        onClose={handleReplaceClose}
      >
        <TeaserSelectAndEditPanel
          onClose={handleReplaceClose}
          onSelect={teaser => {
            handleReplaceConfirm(teaser);
          }}
        />
      </Drawer>
    </>
  );
}
