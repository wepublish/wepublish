import { TFunction } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';

import { BlockValue, Teaser } from '../../blocks/types';
import {
  ExtractedTeaser,
  extractTeasers,
  setTeaserAt,
  TeaserPath,
} from './extractTeasers';

export type SlotType = 'real' | 'empty' | 'scratch';

export type WorkingTeaser = {
  teaser: Teaser | null;
  type: SlotType;
};

export type WorkingBlock = {
  groupKey: string;
  label: string;
  groupIndex: number;
  originalCount: number;
  teasers: WorkingTeaser[];
  addressTemplates: TeaserPath[];
  nestDepth: number;
};

export type DragSource = {
  groupKey: string;
  idx: number;
  type: SlotType;
};

export type DropTarget = { groupKey: string; idx: number };

export type SlotVisibilityPredicate = (slot: WorkingTeaser) => boolean;

function groupKeyFor(extracted: ExtractedTeaser): string {
  return `${extracted.address.blockIndex}-${extracted.blockLabel}`;
}

function initWorkingBlocks(
  blocks: BlockValue[],
  t: TFunction,
  blockStyleNames: Map<string, string> | undefined
): WorkingBlock[] {
  const extracted = extractTeasers(blocks, t, blockStyleNames);
  const groups = new Map<string, WorkingBlock>();

  for (const e of extracted) {
    const key = groupKeyFor(e);
    let group = groups.get(key);
    if (!group) {
      group = {
        groupKey: key,
        label: e.blockLabel,
        groupIndex: e.groupIndex,
        originalCount: 0,
        teasers: [],
        addressTemplates: [],
        nestDepth: e.nestDepth,
      };
      groups.set(key, group);
    }
    group.teasers.push({ teaser: e.teaser, type: 'real' });
    group.addressTemplates.push(e.address);
    group.originalCount++;
  }

  for (const g of groups.values()) {
    g.teasers.push({ teaser: null, type: 'scratch' });
  }

  return [...groups.values()];
}

function clearSlot(block: WorkingBlock, idx: number): WorkingBlock {
  const slot = block.teasers[idx];
  if (!slot) {
    return block;
  }
  const teasers = [...block.teasers];
  teasers[idx] =
    slot.type === 'scratch' ?
      { teaser: null, type: 'scratch' }
    : { teaser: null, type: 'empty' };
  return { ...block, teasers };
}

function fillSlot(
  block: WorkingBlock,
  idx: number,
  teaser: Teaser
): WorkingBlock {
  const slot = block.teasers[idx];
  if (!slot) {
    return block;
  }
  const isScratch = slot.type === 'scratch';
  const isEmptyReal = slot.type === 'empty';
  if (!isScratch && !isEmptyReal) {
    return block;
  }
  const teasers = [...block.teasers];
  teasers[idx] = {
    teaser,
    type: isScratch ? 'scratch' : 'real',
  };
  return { ...block, teasers };
}

function insertAtGap(
  block: WorkingBlock,
  gapIdx: number,
  teaser: Teaser,
  isSlotVisible: SlotVisibilityPredicate
): WorkingBlock {
  const N = block.originalCount;
  if (gapIdx < 0 || gapIdx > N || N === 0) {
    return block;
  }

  const teasers = [...block.teasers];

  let pushedOutIdx = -1;
  for (let i = N - 1; i >= 0; i--) {
    if (isSlotVisible(teasers[i])) {
      pushedOutIdx = i;
      break;
    }
  }

  if (pushedOutIdx < 0) {
    const targetIdx = Math.min(gapIdx, N - 1);
    teasers[targetIdx] = { teaser, type: 'real' };
    return { ...block, teasers };
  }

  const pushedOut = teasers[pushedOutIdx];

  if (gapIdx > pushedOutIdx) {
    teasers[pushedOutIdx] = { teaser, type: 'real' };
  } else {
    const visiblePositions: number[] = [];
    for (let i = gapIdx; i <= pushedOutIdx; i++) {
      if (isSlotVisible(teasers[i])) {
        visiblePositions.push(i);
      }
    }
    if (visiblePositions.length === 0) {
      teasers[Math.min(gapIdx, pushedOutIdx)] = { teaser, type: 'real' };
    } else {
      for (let k = visiblePositions.length - 1; k > 0; k--) {
        teasers[visiblePositions[k]] = teasers[visiblePositions[k - 1]];
      }
      teasers[visiblePositions[0]] = { teaser, type: 'real' };
    }
  }

  teasers[N] = {
    teaser: pushedOut.type === 'empty' ? null : pushedOut.teaser,
    type: 'scratch',
  };
  return { ...block, teasers };
}

function isFilled(slot: WorkingTeaser | undefined): boolean {
  return !!slot && slot.teaser !== null;
}

function applyWorkingToBlocks(
  working: WorkingBlock[],
  base: BlockValue[]
): BlockValue[] {
  let next = base;
  for (const b of working) {
    for (let i = 0; i < b.originalCount; i++) {
      const address = b.addressTemplates[i];
      const slot = b.teasers[i];
      const teaser = slot?.type === 'real' ? slot.teaser : null;
      next = setTeaserAt(next, address, teaser);
    }
  }
  return next;
}

export type WorkingOps = {
  workingBlocks: WorkingBlock[];
  dispatchDrag: (
    source: DragSource,
    target: DropTarget,
    isSlotVisible?: SlotVisibilityPredicate
  ) => void;
  loadTeaser: (groupKey: string, idx: number, teaser: Teaser) => void;
  validate: () => { groupKey: string; label: string; emptyCount: number }[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
};

const MAX_HISTORY = 50;

export function useWorkingBlocks(
  blocks: BlockValue[],
  t: TFunction,
  blockStyleNames: Map<string, string> | undefined,
  onChange: (blocks: BlockValue[]) => void
): WorkingOps {
  const currentBlocksRef = useRef(blocks);
  const lastSyncedBlocksRef = useRef(blocks);
  currentBlocksRef.current = blocks;

  const historyRef = useRef<WorkingBlock[][]>([]);
  const historyIndexRef = useRef(-1);
  const [historyPos, setHistoryPos] = useState({ index: 0, total: 1 });

  const [workingBlocks, setWorkingBlocks] = useState<WorkingBlock[]>(() => {
    const initial = initWorkingBlocks(blocks, t, blockStyleNames);
    historyRef.current = [initial];
    historyIndexRef.current = 0;
    return initial;
  });

  useEffect(() => {
    if (blocks === lastSyncedBlocksRef.current) {
      return;
    }
    lastSyncedBlocksRef.current = blocks;
    setWorkingBlocks(prev => {
      const fresh = initWorkingBlocks(blocks, t, blockStyleNames);
      const prevScratchByKey = new Map<string, WorkingTeaser>();
      for (const b of prev) {
        const scratch = b.teasers[b.teasers.length - 1];
        if (scratch && scratch.type === 'scratch') {
          prevScratchByKey.set(b.groupKey, scratch);
        }
      }

      const merged = fresh.map(b => {
        const prevScratch = prevScratchByKey.get(b.groupKey);
        if (!prevScratch) {
          return b;
        }
        const teasers = [...b.teasers];
        teasers[teasers.length - 1] = prevScratch;
        return { ...b, teasers };
      });

      historyRef.current = [merged];
      historyIndexRef.current = 0;
      return merged;
    });
    setHistoryPos({ index: 0, total: 1 });
  }, [blocks, t, blockStyleNames]);

  const applyAndNotify = useCallback(
    (wb: WorkingBlock[]) => {
      const newBlocks = applyWorkingToBlocks(wb, currentBlocksRef.current);
      if (newBlocks !== currentBlocksRef.current) {
        lastSyncedBlocksRef.current = newBlocks;
        currentBlocksRef.current = newBlocks;
        onChange(newBlocks);
      }
    },
    [onChange]
  );

  const commit = useCallback(
    (newWorkingBlocks: WorkingBlock[]) => {
      const newHistory = historyRef.current.slice(
        0,
        historyIndexRef.current + 1
      );
      newHistory.push(newWorkingBlocks);
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      setHistoryPos({
        index: historyIndexRef.current,
        total: newHistory.length,
      });
      setWorkingBlocks(newWorkingBlocks);
      applyAndNotify(newWorkingBlocks);
    },
    [applyAndNotify]
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) {
      return;
    }
    historyIndexRef.current--;
    const prev = historyRef.current[historyIndexRef.current];
    setHistoryPos({
      index: historyIndexRef.current,
      total: historyRef.current.length,
    });
    setWorkingBlocks(prev);
    applyAndNotify(prev);
  }, [applyAndNotify]);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) {
      return;
    }
    historyIndexRef.current++;
    const next = historyRef.current[historyIndexRef.current];
    setHistoryPos({
      index: historyIndexRef.current,
      total: historyRef.current.length,
    });
    setWorkingBlocks(next);
    applyAndNotify(next);
  }, [applyAndNotify]);

  const dispatchDrag = useCallback(
    (
      source: DragSource,
      target: DropTarget,
      isSlotVisible: SlotVisibilityPredicate = () => true
    ) => {
      if (source.type === 'empty') {
        return;
      }

      const src = workingBlocks.find(b => b.groupKey === source.groupKey);
      if (!src) {
        return;
      }
      const sourceSlot = src.teasers[source.idx];
      if (!sourceSlot || !isFilled(sourceSlot) || !sourceSlot.teaser) {
        return;
      }
      const movedTeaser = sourceSlot.teaser;

      const tgt = workingBlocks.find(b => b.groupKey === target.groupKey);
      if (!tgt) {
        return;
      }
      const tgtSlot = tgt.teasers[target.idx];
      if (!tgtSlot) {
        return;
      }

      if (source.groupKey === target.groupKey && source.idx === target.idx) {
        return;
      }

      const isFillTarget =
        tgtSlot.type === 'empty' || tgtSlot.type === 'scratch';

      const nextWorking = workingBlocks.map(b => {
        const isSource = b.groupKey === source.groupKey;
        const isTarget = b.groupKey === target.groupKey;
        if (isSource && isTarget) {
          if (isFillTarget) {
            return fillSlot(clearSlot(b, source.idx), target.idx, movedTeaser);
          }
          return insertAtGap(
            clearSlot(b, source.idx),
            target.idx,
            movedTeaser,
            isSlotVisible
          );
        }
        if (isSource) {
          return clearSlot(b, source.idx);
        }
        if (isTarget) {
          if (isFillTarget) {
            return fillSlot(b, target.idx, movedTeaser);
          }
          return insertAtGap(b, target.idx, movedTeaser, isSlotVisible);
        }
        return b;
      });

      commit(nextWorking);
    },
    [workingBlocks, commit]
  );

  const loadTeaser = useCallback(
    (groupKey: string, idx: number, teaser: Teaser) => {
      const block = workingBlocks.find(b => b.groupKey === groupKey);
      const slot = block?.teasers[idx];
      if (!slot) {
        return;
      }

      const nextWorking = workingBlocks.map(b => {
        if (b.groupKey !== groupKey) {
          return b;
        }
        const teasers = b.teasers.map((w, i) => {
          if (i !== idx) {
            return w;
          }
          const newType: SlotType =
            slot.type === 'scratch' ? 'scratch' : 'real';
          return { teaser, type: newType };
        });
        return { ...b, teasers };
      });

      if (slot.type === 'scratch') {
        setWorkingBlocks(nextWorking);
      } else {
        commit(nextWorking);
      }
    },
    [workingBlocks, commit]
  );

  const clearHistory = useCallback(() => {
    historyRef.current = [workingBlocks];
    historyIndexRef.current = 0;
    setHistoryPos({ index: 0, total: 1 });
  }, [workingBlocks]);

  const validate = useCallback(() => {
    const errors: { groupKey: string; label: string; emptyCount: number }[] =
      [];
    for (const b of workingBlocks) {
      const emptyCount = b.teasers.filter(w => w.type === 'empty').length;
      if (emptyCount > 0) {
        errors.push({
          groupKey: b.groupKey,
          label: b.label,
          emptyCount,
        });
      }
    }
    return errors;
  }, [workingBlocks]);

  return {
    workingBlocks,
    dispatchDrag,
    loadTeaser,
    validate,
    undo,
    redo,
    canUndo: historyPos.index > 0,
    canRedo: historyPos.index < historyPos.total - 1,
    clearHistory,
  };
}
