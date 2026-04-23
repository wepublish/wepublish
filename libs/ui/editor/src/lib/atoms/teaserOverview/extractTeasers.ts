import {
  EditorBlockType,
  TeaserSlotType,
  TeaserType,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';

import {
  BaseBlockValue,
  BlockValue,
  FlexBlockValue,
  FlexBlockWithAlignment,
  FlexTeaser,
  Teaser,
  TeaserGridBlockValue,
  TeaserGridFlexBlockValue,
  TeaserSlotsBlockValue,
} from '../../blocks/types';

export enum TeaserContainerType {
  TeaserGrid = 'teaserGrid',
  TeaserFlex = 'teaserFlex',
  TeaserSlots = 'teaserSlots',
  FlexBlock = 'flexNested',
}

export type TeaserGridPath = {
  blockType: TeaserContainerType.TeaserGrid;
  blockIndex: number;
  teaserIndex: number;
};

export type TeaserFlexPath = {
  blockType: TeaserContainerType.TeaserFlex;
  blockIndex: number;
  flexIndex: number;
};

export type TeaserSlotsPath = {
  blockType: TeaserContainerType.TeaserSlots;
  blockIndex: number;
  slotIndex: number;
};

export type TeaserFlexBlockPath = {
  blockType: TeaserContainerType.FlexBlock;
  blockIndex: number;
  nestedBlockIndex: number;
  nested: TeaserPath;
};

export type TeaserPath =
  | TeaserGridPath
  | TeaserFlexPath
  | TeaserSlotsPath
  | TeaserFlexBlockPath;

export type ExtractedTeaser = {
  address: TeaserPath;
  teaser: Teaser;
  blockLabel: string;
  groupIndex: number;
  nestDepth: number;
};

const BLOCK_TYPE_KEY: Partial<Record<EditorBlockType, string>> = {
  [EditorBlockType.TeaserGrid1]: 'teaserOverview.blockTypes.teaserGrid1',
  [EditorBlockType.TeaserGrid6]: 'teaserOverview.blockTypes.teaserGrid6',
  [EditorBlockType.TeaserGridFlex]: 'teaserOverview.blockTypes.flexGrid',
  [EditorBlockType.TeaserList]: 'teaserOverview.blockTypes.teaserList',
  [EditorBlockType.TeaserSlots]: 'teaserOverview.blockTypes.teaserSlots',
  [EditorBlockType.FlexBlock]: 'teaserOverview.blockTypes.flexBlock',
};

function blockLabel(
  type: EditorBlockType,
  blockIndex: number,
  t: TFunction,
  blockStyleId?: string | null,
  blockStyleNames?: Map<string, string>
): string {
  const typeLabel =
    BLOCK_TYPE_KEY[type] ? t(BLOCK_TYPE_KEY[type]!) : String(type);
  const base = `${typeLabel} · Block ${blockIndex + 1}`;
  const styleName =
    blockStyleId ? (blockStyleNames?.get(blockStyleId) ?? blockStyleId) : '';
  return styleName ? `${base} · ${styleName}` : base;
}

export function teaserContentKey(teaser: Teaser): string {
  switch (teaser.type) {
    case TeaserType.Article:
      return `article:${teaser.article?.id}`;
    case TeaserType.Page:
      return `page:${teaser.page?.id}`;
    case TeaserType.Event:
      return `event:${teaser.event?.id}`;
    case TeaserType.Custom:
      return `custom:${teaser.contentUrl ?? ''}`;
  }
}

export function extractTeasers(
  blocks: BlockValue[],
  t: TFunction,
  blockStyleNames?: Map<string, string>
): ExtractedTeaser[] {
  const results: ExtractedTeaser[] = [];
  let groupIndex = 0;

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
    const block = blocks[blockIndex];

    switch (block.type) {
      case EditorBlockType.TeaserGrid1:
      case EditorBlockType.TeaserGrid6: {
        const value = block.value as TeaserGridBlockValue;
        const label = blockLabel(
          block.type,
          blockIndex,
          t,
          value.blockStyle,
          blockStyleNames
        );

        for (let i = 0; i < value.teasers.length; i++) {
          const [, teaser] = value.teasers[i];
          if (!teaser) {
            continue;
          }

          results.push({
            address: {
              blockType: TeaserContainerType.TeaserGrid,
              blockIndex,
              teaserIndex: i,
            },
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
        const label = blockLabel(
          block.type,
          blockIndex,
          t,
          value.blockStyle,
          blockStyleNames
        );

        for (let i = 0; i < value.flexTeasers.length; i++) {
          const { teaser } = value.flexTeasers[i];
          if (!teaser) {
            continue;
          }

          results.push({
            address: {
              blockType: TeaserContainerType.TeaserFlex,
              blockIndex,
              flexIndex: i,
            },
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
        const label = blockLabel(
          block.type,
          blockIndex,
          t,
          value.blockStyle,
          blockStyleNames
        );

        for (let i = 0; i < value.slots.length; i++) {
          const slot = value.slots[i];
          if (slot.type !== TeaserSlotType.Manual || !slot.teaser) {
            continue;
          }

          results.push({
            address: {
              blockType: TeaserContainerType.TeaserSlots,
              blockIndex,
              slotIndex: i,
            },
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
        groupIndex++;

        const nestedBlockIndicesSortedByPosition = nestedBlocks
          .map((_block, index) => index)
          .sort((indexA, indexB) => {
            const alignmentA = nestedBlocks[indexA].alignment;
            const alignmentB = nestedBlocks[indexB].alignment;
            return alignmentA.y - alignmentB.y || alignmentA.x - alignmentB.x;
          });

        for (
          let sortedPos = 0;
          sortedPos < nestedBlockIndicesSortedByPosition.length;
          sortedPos++
        ) {
          const nestedBlockIndex =
            nestedBlockIndicesSortedByPosition[sortedPos];
          const { block: nestedBlock } = nestedBlocks[nestedBlockIndex];
          if (!nestedBlock) {
            continue;
          }

          const nestedTeaserContainerType = nestedBlock.type as EditorBlockType;
          const nestedTypeLabel =
            BLOCK_TYPE_KEY[nestedTeaserContainerType] ?
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              t(BLOCK_TYPE_KEY[nestedTeaserContainerType]!)
            : String(nestedTeaserContainerType);
          const nestedTitle =
            nestedTeaserContainerType === EditorBlockType.TeaserSlots ?
              ((nestedBlock.value as TeaserSlotsBlockValue).title ?? '')
            : '';
          const nestedBlockStyleId =
            (nestedBlock.value as BaseBlockValue).blockStyle ?? '';
          const nestedBlockStyleName =
            nestedBlockStyleId ?
              (blockStyleNames?.get(nestedBlockStyleId) ?? nestedBlockStyleId)
            : '';
          const nestedDetail = nestedTitle || nestedBlockStyleName;
          const nestedLabel =
            nestedDetail ?
              t('teaserOverview.nestedLabelWithTitle', {
                blockIndex: blockIndex + 1,
                nestedIndex: sortedPos + 1,
                type: nestedTypeLabel,
                title: nestedDetail,
              })
            : t('teaserOverview.nestedLabel', {
                blockIndex: blockIndex + 1,
                nestedIndex: sortedPos + 1,
                type: nestedTypeLabel,
              });

          const nested = extractTeasers(
            [nestedBlock as BlockValue],
            t,
            blockStyleNames
          );
          for (const extracted of nested) {
            results.push({
              ...extracted,
              address: {
                blockType: TeaserContainerType.FlexBlock,
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

export function getTeaserAt(
  blocks: BlockValue[],
  address: TeaserPath
): Teaser | null {
  switch (address.blockType) {
    case TeaserContainerType.TeaserGrid:
      return (blocks[address.blockIndex].value as TeaserGridBlockValue).teasers[
        address.teaserIndex
      ][1];

    case TeaserContainerType.TeaserFlex:
      return (blocks[address.blockIndex].value as TeaserGridFlexBlockValue)
        .flexTeasers[address.flexIndex].teaser;

    case TeaserContainerType.TeaserSlots:
      return (
        (blocks[address.blockIndex].value as TeaserSlotsBlockValue).slots[
          address.slotIndex
        ].teaser ?? null
      );

    case TeaserContainerType.FlexBlock: {
      const nestedBlock = (blocks[address.blockIndex].value as FlexBlockValue)
        .blocks[address.nestedBlockIndex]?.block;
      if (!nestedBlock) {
        return null;
      }
      return getTeaserAt([nestedBlock as BlockValue], address.nested);
    }
  }
}

export function setTeaserAt(
  blocks: BlockValue[],
  address: TeaserPath,
  teaser: Teaser | null
): BlockValue[] {
  switch (address.blockType) {
    case TeaserContainerType.TeaserGrid: {
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

    case TeaserContainerType.TeaserFlex: {
      return replaceBlock(blocks, address.blockIndex, block => {
        const value = block.value as TeaserGridFlexBlockValue;
        const flexTeasers = value.flexTeasers.map(
          (ft: FlexTeaser, i: number) =>
            i === address.flexIndex ? { ...ft, teaser } : ft
        );
        return { ...block, value: { ...value, flexTeasers } } as BlockValue;
      });
    }

    case TeaserContainerType.TeaserSlots: {
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

    case TeaserContainerType.FlexBlock: {
      return replaceBlock(blocks, address.blockIndex, block => {
        const value = block.value as FlexBlockValue;
        const nestedBlocks = value.blocks.map(
          (nb: FlexBlockWithAlignment, i: number) => {
            if (i !== address.nestedBlockIndex || !nb.block) {
              return nb;
            }
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
