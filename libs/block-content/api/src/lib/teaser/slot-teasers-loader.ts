import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ArticleTeaser, EventTeaser, Teaser, TeaserType } from './teaser.model';
import {
  isTeaserSlotsBlock,
  TeaserSlotsBlock,
} from '../teaser-slot/teaser-slots.model';
import { ArticleService, ArticleSort } from '@wepublish/article/api';
import { SortOrder } from '@wepublish/utils/api';
import { EventService, EventSort } from '@wepublish/event/api';
import { TeaserSlotType } from '../teaser-slot/teaser-slot.model';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { isTeaserGridFlexBlock } from './teaser-flex.model';
import { isTeaserGridBlock } from './teaser-grid.model';
import {
  BlockWithAlignment,
  FlexBlock,
  isFlexBlock,
} from '../flex/flex-block.model';
import { logger } from '@wepublish/utils/api';

const extractTeasers = <Block extends BaseBlock<BlockType>>(block: Block) => {
  if (isTeaserSlotsBlock(block)) {
    return block.slots.reduce((teasers: (typeof Teaser)[], slot) => {
      if (slot.type === TeaserSlotType.Manual && slot.teaser) {
        teasers.push(slot.teaser);
      }

      return teasers;
    }, []);
  }

  if (isTeaserGridBlock(block)) {
    return block.teasers.reduce((teasers: (typeof Teaser)[], teaser) => {
      if (teaser) {
        teasers.push(teaser);
      }

      return teasers;
    }, []);
  }

  if (isTeaserGridFlexBlock(block)) {
    return block.flexTeasers.reduce(
      (teasers: (typeof Teaser)[], flexTeaser) => {
        if (flexTeaser.teaser) {
          teasers.push(flexTeaser.teaser);
        }
        return teasers;
      },
      []
    );
  }

  return [];
};

@Injectable({ scope: Scope.REQUEST })
export class SlotTeasersLoader {
  private loadedTeasers: (typeof Teaser)[] = [];

  constructor(
    private eventService: EventService,
    private articleService: ArticleService,
    @Inject(REQUEST) private request: Record<string, unknown>
  ) {}

  private debugLog(label: string, data: unknown) {
    logger('slotTeasersLoader').info(label, data);
    const logs = this.request['debugLogs'];
    if (Array.isArray(logs)) {
      logs.push({ label, data });
    }
  }

  async populateTeaserSlots(block: TeaserSlotsBlock) {
    // get an array of teasers (arr.length === slots.length) that have never been loaded before
    const autofillCandidates = await this.getAutofillCandidateTeasers(block);

    // get the teasers to be loaded into the teaser-slots-block, store them to exclude them from the next teaser-slots-blocks
    const teasers = this.getTeasers(block, autofillCandidates);

    return {
      ...block,
      autofillTeasers: teasers.autofillTeasers,
      teasers: teasers.allTeasers,
    };
  }

  // process a block recursively
  async processBlock(
    block: BaseBlock<BlockType> | undefined
  ): Promise<BaseBlock<BlockType> | undefined> {
    if (!block) {
      return block;
    }

    // 1. if block is a flex block --> process its nested blocks
    if (isFlexBlock(block)) {
      const updatedBlocks: BlockWithAlignment[] = [];
      for (const nested of block.blocks) {
        const updatedNestedBlock = await this.processBlock(nested.block);
        updatedBlocks.push({
          ...nested,
          block: updatedNestedBlock,
        } as BlockWithAlignment);
      }

      return { ...block, blocks: updatedBlocks } as FlexBlock;
    }

    // 2. else if block is a teaser-slots-block --> populate teasers ...
    //    ... & extract/store them so they can be excluded when next teaser-slots-blocks will be populated
    if (isTeaserSlotsBlock(block)) {
      return await this.populateTeaserSlots(block);
    }

    // 3. else check if block has teasers --> extract/store them so they can be excluded ...
    //    ... when next teaser-slots-blocks will be populated
    this.addLoadedTeaser(...extractTeasers(block));

    return block;
  }

  async loadSlotTeasersIntoBlocks(revisionBlocks: BaseBlock<BlockType>[]) {
    const blocks: (BaseBlock<BlockType> | undefined)[] = [];

    // process each block
    for (const block of revisionBlocks) {
      blocks.push(await this.processBlock(block));
    }

    return blocks as BaseBlock<BlockType>[];
  }

  getTeasers(
    { slots, autofillConfig }: TeaserSlotsBlock,
    autofillCandidates: (typeof Teaser)[]
  ): {
    autofillTeasers: (typeof Teaser)[];
    allTeasers: (typeof Teaser | null)[];
  } {
    this.debugLog('autofillCandidates', {
      teaserType: autofillConfig?.teaserType,
      candidates: autofillCandidates,
    });
    const teasers = slots?.map(({ teaser: manualTeaser, type }, index) => {
      const autofillIndex = slots
        .slice(0, index)
        .filter(slot => slot.type === TeaserSlotType.Autofill).length;

      if (type === TeaserSlotType.Manual) {
        this.debugLog('manualTeaser', {
          teaserType: autofillConfig?.teaserType,
          teaser: manualTeaser,
        });
        // store the manual teaser
        //  - it will be excluded when next teaser-slots-blocks will be populated with autofill teasers
        this.addLoadedTeaser(manualTeaser as typeof Teaser);

        // a slot was manually filled:
        // - check if the manual-teaser is also part of the autofill-candidates for this block
        // - if so, remove it from the list of candidates
        // - otherwise remove the last candidate as it will never be loaded into this block
        const autofillCandidatesLength = autofillCandidates.length;
        if (manualTeaser?.type === autofillConfig.teaserType) {
          if (autofillConfig.teaserType === TeaserType.Article) {
            autofillCandidates = autofillCandidates.filter(teaser => {
              return (
                (teaser as ArticleTeaser).articleID !==
                (manualTeaser as ArticleTeaser).articleID
              );
            });
          } else if (autofillConfig.teaserType === TeaserType.Event) {
            autofillCandidates = autofillCandidates.filter(teaser => {
              return (
                (teaser as EventTeaser).eventID !==
                (manualTeaser as EventTeaser).eventID
              );
            });
          }
        }

        this.debugLog('autofillCandidates:afterFilteringManual', {
          teaserType: autofillConfig?.teaserType,
          candidates: autofillCandidates,
        });

        // if the manual teaser was not part of the autofill-candidates
        // - remove the last candidate as it will never be loaded into this block
        if (autofillCandidatesLength === autofillCandidates.length) {
          autofillCandidates.pop();
        }

        this.debugLog('autofillCandidates:afterPop', {
          teaserType: autofillConfig?.teaserType,
          candidates: autofillCandidates,
        });

        return manualTeaser as typeof Teaser;
      }

      this.debugLog('autofillTeaser', {
        teaserType: autofillConfig?.teaserType,
        slotIndex: index,
        teaser: autofillCandidates[autofillIndex],
      });

      if (autofillCandidates[autofillIndex]) {
        return autofillCandidates[autofillIndex];
      }

      this.debugLog('autofillTeaser:empty', {
        teaserType: autofillConfig?.teaserType,
        slotIndex: index,
      });

      return null;
    });

    // store the loaded autofill teasers
    // - they will be excluded when next teaser-slots-blocks will be populated
    this.addLoadedTeaser(...autofillCandidates);

    this.debugLog('result', {
      teaserType: autofillConfig?.teaserType,
      autofillTeasers: autofillCandidates,
      allTeasers: teasers,
    });

    return {
      autofillTeasers: autofillCandidates,
      allTeasers: teasers as (typeof Teaser | null)[],
    };
  }

  async getAutofillCandidateTeasers(
    slotsBlock: TeaserSlotsBlock
  ): Promise<(typeof Teaser)[]> {
    const { teaserType, filter } = slotsBlock.autofillConfig;
    const take = slotsBlock.slots.length;

    if (teaserType === TeaserType.Article) {
      const articles = await this.articleService.getArticles({
        filter: {
          tags: filter?.tags,
          published: true,
          excludeIds: this.getLoadedTeasers(TeaserType.Article),
        },
        sort: ArticleSort.PublishedAt,
        order: SortOrder.Descending,
        take,
      });

      const teasers = articles.nodes.map(
        article =>
          ({
            articleID: article.id,
            type: TeaserType.Article,
            imageID: undefined,
            lead: undefined,
            title: undefined,
          }) as ArticleTeaser
      );

      return teasers;
    }

    if (teaserType === TeaserType.Event) {
      const events = await this.eventService.getEvents({
        filter: {
          tags: filter?.tags,
        },
        sort: EventSort.StartsAt,
        order: SortOrder.Descending,
        take,
      });

      const teasers = events.nodes.map(
        event =>
          ({
            eventID: event.id,
            type: TeaserType.Event,
            imageID: undefined,
            lead: undefined,
            title: undefined,
          }) as EventTeaser
      );

      this.addLoadedTeaser(...teasers);
      return teasers;
    }

    return [];
  }

  addLoadedTeaser(...teaser: (typeof Teaser)[]) {
    this.loadedTeasers.push(...teaser);
  }

  getLoadedTeasers(type: TeaserType): string[] {
    return this.loadedTeasers.reduce((ids: string[], teaser) => {
      if (teaser.type === type) {
        if (teaser.type === TeaserType.Article && teaser.articleID) {
          ids.push(teaser.articleID);
        }

        if (teaser.type === TeaserType.Event && teaser.eventID) {
          ids.push(teaser.eventID);
        }
      }

      return ids;
    }, []);
  }
}
