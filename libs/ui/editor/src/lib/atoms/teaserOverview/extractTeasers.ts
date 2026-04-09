import { EditorBlockType } from '@wepublish/editor/api';
import { TeaserSlotType } from '@wepublish/editor/api';

import {
  BlockValue,
  FlexBlockWithAlignment,
  Teaser,
  TeaserGridBlockValue,
  TeaserGridFlexBlockValue,
  TeaserListBlockValue,
  TeaserSlotsBlockValue,
} from '../../blocks/types';

// ─── Address Types ────────────────────────────────────────────────────────────

/**
 * A TeaserAddress precisely identifies a single teaser slot within the blocks
 * array so it can be read or written without mutating state.
 */
export type TeaserGridAddress = {
  blockKind: 'teaserGrid';
  blockIndex: number;
  teaserIndex: number;
};

export type TeaserFlexAddress = {
  blockKind: 'teaserFlex';
  blockIndex: number;
  flexIndex: number;
};

export type TeaserListAddress = {
  blockKind: 'teaserList';
  blockIndex: number;
  teaserIndex: number;
};

export type TeaserSlotsAddress = {
  blockKind: 'teaserSlots';
  blockIndex: number;
  slotIndex: number;
};

export type TeaserFlexNestedAddress = {
  blockKind: 'flexNested';
  blockIndex: number;
  nestedBlockIndex: number;
  nested: TeaserAddress;
};

export type TeaserAddress =
  | TeaserGridAddress
  | TeaserFlexAddress
  | TeaserListAddress
  | TeaserSlotsAddress
  | TeaserFlexNestedAddress;

// ─── Extracted Teaser ─────────────────────────────────────────────────────────

export type ExtractedTeaser = {
  /** Pointer back into the blocks array — used for swapping */
  address: TeaserAddress;
  teaser: Teaser;
  /** Human-readable label for the containing block, e.g. "Flex Grid · Block 3" */
  blockLabel: string;
  /** Colour index (cycle through GROUP_COLORS in the UI) */
  groupIndex: number;
  /** 0 = top-level block, 1 = inside a FlexBlock */
  nestDepth: number;
};

// ─── Label helpers ────────────────────────────────────────────────────────────

const BLOCK_LABELS: Partial<Record<EditorBlockType, string>> = {
  [EditorBlockType.TeaserGrid1]: 'Teaser Grid 1',
  [EditorBlockType.TeaserGrid6]: 'Teaser Grid 6',
  [EditorBlockType.TeaserGridFlex]: 'Flex Grid',
  [EditorBlockType.TeaserList]: 'Teaser List',
  [EditorBlockType.TeaserSlots]: 'Teaser Slots',
  [EditorBlockType.FlexBlock]: 'Flex Block',
};

function blockLabel(type: EditorBlockType, blockIndex: number): string {
  return `${BLOCK_LABELS[type] ?? type} · Block ${blockIndex + 1}`;
}

// ─── Extraction ───────────────────────────────────────────────────────────────

/**
 * Recursively walks all blocks and returns every non-null manual teaser with
 * its precise address, label, and grouping metadata.
 */
export function extractTeasers(blocks: BlockValue[]): ExtractedTeaser[] {
  const results: ExtractedTeaser[] = [];
  let groupIndex = 0;

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];

    switch (block.type) {
      case EditorBlockType.TeaserGrid1:
      case EditorBlockType.TeaserGrid6: {
        const value = block.value as TeaserGridBlockValue;
        const label = blockLabel(block.type, blockIndex);

        for (let i = 0; i < value.teasers.length; i++) {
          const [, teaser] = value.teasers[i];
          if (!teaser) continue;

          results.push({
            address: { blockKind: 'teaserGrid', blockIndex, teaserIndex: i },
            teaser,
            blockLabel: label,
            groupIndex,
            nestDepth: 0,
          });
        }
        groupIndex++;
        break;
      }

      case EditorBlockType.TeaserGridFlex: {
        const value = block.value as TeaserGridFlexBlockValue;
        const label = blockLabel(block.type, blockIndex);

        for (let i = 0; i < value.flexTeasers.length; i++) {
          const { teaser } = value.flexTeasers[i];
          if (!teaser) continue;

          results.push({
            address: { blockKind: 'teaserFlex', blockIndex, flexIndex: i },
            teaser,
            blockLabel: label,
            groupIndex,
            nestDepth: 0,
          });
        }
        groupIndex++;
        break;
      }

      case EditorBlockType.TeaserList: {
        const value = block.value as TeaserListBlockValue;
        const label = blockLabel(block.type, blockIndex);

        // Only manual teasers — the query-driven auto-fill results are read-only
        for (let i = 0; i < value.teasers.length; i++) {
          const [, teaser] = value.teasers[i];
          if (!teaser) continue;

          results.push({
            address: { blockKind: 'teaserList', blockIndex, teaserIndex: i },
            teaser,
            blockLabel: label,
            groupIndex,
            nestDepth: 0,
          });
        }
        groupIndex++;
        break;
      }

      case EditorBlockType.TeaserSlots: {
        const value = block.value as TeaserSlotsBlockValue;
        const label = blockLabel(block.type, blockIndex);

        for (let i = 0; i < value.slots.length; i++) {
          const slot = value.slots[i];
          // Only manual slots with an assigned teaser
          if (slot.type !== TeaserSlotType.Manual || !slot.teaser) continue;

          results.push({
            address: { blockKind: 'teaserSlots', blockIndex, slotIndex: i },
            teaser: slot.teaser,
            blockLabel: label,
            groupIndex,
            nestDepth: 0,
          });
        }
        groupIndex++;
        break;
      }

      case EditorBlockType.FlexBlock: {
        const nestedBlocks = block.value.blocks as FlexBlockWithAlignment[];
        const parentGroupIndex = groupIndex;
        groupIndex++; // reserve one index for the flex container itself

        for (
          let nestedBlockIndex = 0;
          nestedBlockIndex < nestedBlocks.length;
          nestedBlockIndex++
        ) {
          const { block: nestedBlock } = nestedBlocks[nestedBlockIndex];
          if (!nestedBlock) continue;

          // Build a label that tells users exactly where in the flex block
          // this teaser lives: "Flex Block 3 › Block 2 (Teaser Slots, "My Title")"
          const nestedBlockType = nestedBlock.type as EditorBlockType;
          const nestedTypeLabel =
            BLOCK_LABELS[nestedBlockType] ?? String(nestedBlockType);
          const nestedTitle =
            nestedBlockType === EditorBlockType.TeaserSlots ?
              ((nestedBlock.value as TeaserSlotsBlockValue).title ?? '')
            : '';
          const nestedTitleSuffix = nestedTitle ? `, "${nestedTitle}"` : '';
          const nestedLabel = `Flex Block ${blockIndex + 1} › Block ${nestedBlockIndex + 1} (${nestedTypeLabel}${nestedTitleSuffix})`;

          // Temporarily wrap the nested block in a single-item array so we can
          // reuse extractTeasers recursively, then remap the addresses.
          const nested = extractTeasers([nestedBlock as BlockValue]);
          for (const extracted of nested) {
            results.push({
              ...extracted,
              address: {
                blockKind: 'flexNested',
                blockIndex,
                nestedBlockIndex,
                nested: extracted.address,
              },
              blockLabel: nestedLabel,
              groupIndex: parentGroupIndex,
              nestDepth: extracted.nestDepth + 1,
            });
          }
        }
        break;
      }

      default:
        break;
    }
  }

  return results;
}
