import { EditorBlockType, TeaserSlotType } from '@wepublish/editor/api';

import {
  BlockValue,
  FlexBlockValue,
  FlexBlockWithAlignment,
  FlexTeaser,
  Teaser,
  TeaserGridBlockValue,
  TeaserGridFlexBlockValue,
  TeaserSlotsBlockValue,
} from '../../blocks/types';
import { BlockType, TeaserAddress } from './extractTeasers';

export function getTeaserAt(
  blocks: BlockValue[],
  address: TeaserAddress
): Teaser | null {
  switch (address.blockType) {
    case BlockType.TeaserGrid: {
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

    case BlockType.TeaserFlex: {
      const block = blocks[address.blockIndex];
      if (block.type !== EditorBlockType.TeaserGridFlex) return null;
      return (block.value as TeaserGridFlexBlockValue).flexTeasers[
        address.flexIndex
      ].teaser;
    }

    case BlockType.TeaserSlots: {
      const block = blocks[address.blockIndex];
      if (block.type !== EditorBlockType.TeaserSlots) return null;
      return (
        (block.value as TeaserSlotsBlockValue).slots[address.slotIndex]
          .teaser ?? null
      );
    }

    case BlockType.FlexBlock: {
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

export function setTeaserAt(
  blocks: BlockValue[],
  address: TeaserAddress,
  teaser: Teaser | null
): BlockValue[] {
  switch (address.blockType) {
    case BlockType.TeaserGrid: {
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

    case BlockType.TeaserFlex: {
      return replaceBlock(blocks, address.blockIndex, block => {
        const value = block.value as TeaserGridFlexBlockValue;
        const flexTeasers = value.flexTeasers.map(
          (ft: FlexTeaser, i: number) =>
            i === address.flexIndex ? { ...ft, teaser } : ft
        );
        return { ...block, value: { ...value, flexTeasers } } as BlockValue;
      });
    }

    case BlockType.TeaserSlots: {
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

    case BlockType.FlexBlock: {
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

export function swapTeasers(
  blocks: BlockValue[],
  a: TeaserAddress,
  b: TeaserAddress
): BlockValue[] {
  const teaserA = getTeaserAt(blocks, a);
  const teaserB = getTeaserAt(blocks, b);
  return setTeaserAt(setTeaserAt(blocks, a, teaserB), b, teaserA);
}

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
