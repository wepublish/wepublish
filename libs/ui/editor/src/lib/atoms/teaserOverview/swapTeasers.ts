import { EditorBlockType, TeaserSlotType } from '@wepublish/editor/api';

import {
  BlockValue,
  FlexBlockValue,
  FlexBlockWithAlignment,
  FlexTeaser,
  Teaser,
  TeaserGridBlockValue,
  TeaserGridFlexBlockValue,
  TeaserListBlockValue,
  TeaserSlotsBlockValue,
} from '../../blocks/types';
import { TeaserAddress } from './extractTeasers';

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Returns the Teaser at the given address without modifying any state.
 * Returns null if the address points to an empty slot.
 */
export function getTeaserAt(
  blocks: BlockValue[],
  address: TeaserAddress
): Teaser | null {
  switch (address.blockKind) {
    case 'teaserGrid': {
      const block = blocks[address.blockIndex];
      if (
        block.type !== EditorBlockType.TeaserGrid1 &&
        block.type !== EditorBlockType.TeaserGrid6
      )
        return null;
      return (block.value as TeaserGridBlockValue).teasers[
        address.teaserIndex
      ][1];
    }

    case 'teaserFlex': {
      const block = blocks[address.blockIndex];
      if (block.type !== EditorBlockType.TeaserGridFlex) return null;
      return (block.value as TeaserGridFlexBlockValue).flexTeasers[
        address.flexIndex
      ].teaser;
    }

    case 'teaserList': {
      const block = blocks[address.blockIndex];
      if (block.type !== EditorBlockType.TeaserList) return null;
      return (block.value as TeaserListBlockValue).teasers[
        address.teaserIndex
      ][1];
    }

    case 'teaserSlots': {
      const block = blocks[address.blockIndex];
      if (block.type !== EditorBlockType.TeaserSlots) return null;
      return (
        (block.value as TeaserSlotsBlockValue).slots[address.slotIndex]
          .teaser ?? null
      );
    }

    case 'flexNested': {
      const block = blocks[address.blockIndex];
      if (block.type !== EditorBlockType.FlexBlock) return null;
      const nestedBlock = (block.value as FlexBlockValue).blocks[
        address.nestedBlockIndex
      ]?.block;
      if (!nestedBlock) return null;
      return getTeaserAt([nestedBlock as BlockValue], address.nested);
    }
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Returns a new blocks array with the teaser at `address` replaced by `teaser`.
 * All operations are immutable — no mutation of the input array.
 */
export function setTeaserAt(
  blocks: BlockValue[],
  address: TeaserAddress,
  teaser: Teaser | null
): BlockValue[] {
  switch (address.blockKind) {
    case 'teaserGrid': {
      return replaceBlock(blocks, address.blockIndex, block => {
        const value = block.value as TeaserGridBlockValue;
        const teasers = value.teasers.map((entry, i) =>
          i === address.teaserIndex ?
            ([entry[0], teaser] as [string, Teaser | null])
          : entry
        );
        return { ...block, value: { ...value, teasers } } as BlockValue;
      });
    }

    case 'teaserFlex': {
      return replaceBlock(blocks, address.blockIndex, block => {
        const value = block.value as TeaserGridFlexBlockValue;
        const flexTeasers = value.flexTeasers.map(
          (ft: FlexTeaser, i: number) =>
            i === address.flexIndex ? { ...ft, teaser } : ft
        );
        return { ...block, value: { ...value, flexTeasers } } as BlockValue;
      });
    }

    case 'teaserList': {
      return replaceBlock(blocks, address.blockIndex, block => {
        const value = block.value as TeaserListBlockValue;
        const teasers = value.teasers.map((entry, i) =>
          i === address.teaserIndex ?
            ([entry[0], teaser] as [string, Teaser])
          : entry
        );
        return { ...block, value: { ...value, teasers } } as BlockValue;
      });
    }

    case 'teaserSlots': {
      return replaceBlock(blocks, address.blockIndex, block => {
        const value = block.value as TeaserSlotsBlockValue;
        const slots = value.slots.map((slot, i) =>
          i === address.slotIndex ?
            { ...slot, type: TeaserSlotType.Manual, teaser }
          : slot
        );
        return { ...block, value: { ...value, slots } } as BlockValue;
      });
    }

    case 'flexNested': {
      return replaceBlock(blocks, address.blockIndex, block => {
        const value = block.value as FlexBlockValue;
        const nestedBlocks = value.blocks.map(
          (nb: FlexBlockWithAlignment, i: number) => {
            if (i !== address.nestedBlockIndex || !nb.block) return nb;
            const updatedNested = setTeaserAt(
              [nb.block as BlockValue],
              address.nested,
              teaser
            );
            return { ...nb, block: updatedNested[0] };
          }
        );
        return {
          ...block,
          value: { ...value, blocks: nestedBlocks },
        } as BlockValue;
      });
    }
  }
}

// ─── Swap ─────────────────────────────────────────────────────────────────────

/**
 * Returns a new blocks array with the teasers at addresses `a` and `b`
 * exchanged. Works across different block types and across FlexBlock nesting.
 */
export function swapTeasers(
  blocks: BlockValue[],
  a: TeaserAddress,
  b: TeaserAddress
): BlockValue[] {
  const teaserA = getTeaserAt(blocks, a);
  const teaserB = getTeaserAt(blocks, b);
  return setTeaserAt(setTeaserAt(blocks, a, teaserB), b, teaserA);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function replaceBlock(
  blocks: BlockValue[],
  index: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updater: (block: BlockValue) => any
): BlockValue[] {
  return blocks.map((block, i) =>
    i === index ? (updater(block) as BlockValue) : block
  );
}
