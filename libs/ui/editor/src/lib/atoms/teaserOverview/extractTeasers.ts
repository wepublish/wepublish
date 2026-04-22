import {
  EditorBlockType,
  TeaserSlotType,
  TeaserType,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';

import {
  BaseBlockValue,
  BlockValue,
  FlexBlockWithAlignment,
  Teaser,
  TeaserGridBlockValue,
  TeaserGridFlexBlockValue,
  TeaserSlotsBlockValue,
} from '../../blocks/types';

export enum BlockType {
  TeaserGrid = 'teaserGrid',
  TeaserFlex = 'teaserFlex',
  TeaserSlots = 'teaserSlots',
  FlexBlock = 'flexNested',
}

export type TeaserGridAddress = {
  blockType: BlockType.TeaserGrid;
  blockIndex: number;
  teaserIndex: number;
};

export type TeaserFlexAddress = {
  blockType: BlockType.TeaserFlex;
  blockIndex: number;
  flexIndex: number;
};

export type TeaserSlotsAddress = {
  blockType: BlockType.TeaserSlots;
  blockIndex: number;
  slotIndex: number;
};

export type TeaserFlexBlockAddress = {
  blockType: BlockType.FlexBlock;
  blockIndex: number;
  nestedBlockIndex: number;
  nested: TeaserAddress;
};

export type TeaserAddress =
  | TeaserGridAddress
  | TeaserFlexAddress
  | TeaserSlotsAddress
  | TeaserFlexBlockAddress;

export type ExtractedTeaser = {
  address: TeaserAddress;
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
          if (!teaser) continue;

          results.push({
            address: {
              blockType: BlockType.TeaserGrid,
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
          if (!teaser) continue;

          results.push({
            address: {
              blockType: BlockType.TeaserFlex,
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
          if (slot.type !== TeaserSlotType.Manual || !slot.teaser) continue;

          results.push({
            address: {
              blockType: BlockType.TeaserSlots,
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

        const sortedIndices = nestedBlocks
          .map((b, i) => i)
          .sort((a, b) => {
            const aa = nestedBlocks[a].alignment;
            const bb = nestedBlocks[b].alignment;
            return aa.y - bb.y || aa.x - bb.x;
          });

        for (let sortedPos = 0; sortedPos < sortedIndices.length; sortedPos++) {
          const nestedBlockIndex = sortedIndices[sortedPos];
          const { block: nestedBlock } = nestedBlocks[nestedBlockIndex];
          if (!nestedBlock) continue;

          const nestedBlockType = nestedBlock.type as EditorBlockType;
          const nestedTypeLabel =
            BLOCK_TYPE_KEY[nestedBlockType] ?
              t(BLOCK_TYPE_KEY[nestedBlockType]!)
            : String(nestedBlockType);
          const nestedTitle =
            nestedBlockType === EditorBlockType.TeaserSlots ?
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
                blockType: BlockType.FlexBlock,
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
