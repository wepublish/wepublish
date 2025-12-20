import { Injectable, Scope } from '@nestjs/common';
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
import { FlexBlock, isFlexBlock } from '../flex/flex-block.model';

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

  if (isFlexBlock(block)) {
    return block.blocks.reduce((teasers: (typeof Teaser)[], nestedBlock) => {
      if (nestedBlock.block) {
        teasers.push(...extractTeasers(nestedBlock.block));
      }

      return teasers;
    }, []);
  }

  return [];
};

@Injectable({ scope: Scope.REQUEST })
export class SlotTeasersLoader {
  private loadedTeasers: (typeof Teaser)[] = [];

  constructor(
    private eventService: EventService,
    private articleService: ArticleService
  ) {}

  async populateTeaserSlots(block: BaseBlock<BlockType> | undefined) {
    if (!block) {
      return block;
    }
    if (isTeaserSlotsBlock(block)) {
      const autofillTeasers = await this.getAutofillTeasers(block);
      const teasers = await this.getTeasers(block, autofillTeasers);

      return {
        ...block,
        autofillTeasers,
        teasers,
      };
    }
    return block;
  }

  async processBlock(
    block: BaseBlock<BlockType> | undefined
  ): Promise<BaseBlock<BlockType> | undefined> {
    if (!block) return block;

    this.addLoadedTeaser(...extractTeasers(block));

    if (isTeaserSlotsBlock(block)) {
      return await this.populateTeaserSlots(block);
    }

    if (isFlexBlock(block)) {
      const updatedBlocks = await Promise.all(
        block.blocks.map(async nested => ({
          ...nested,
          block: await this.processBlock(nested.block),
        }))
      );

      return { ...block, blocks: updatedBlocks } as FlexBlock;
    }

    return block;
  }

  async loadSlotTeasersIntoBlocks(revisionBlocks: BaseBlock<BlockType>[]) {
    const blocks = await Promise.all(
      revisionBlocks.map(block => this.processBlock(block))
    );

    return blocks as BaseBlock<BlockType>[];
  }

  async getTeasers(
    { slots }: TeaserSlotsBlock,
    autofillTeasers: (typeof Teaser)[]
  ): Promise<(typeof Teaser | null)[]> {
    return slots?.map(({ teaser: manualTeaser, type }, index) => {
      const autofillIndex = slots
        .slice(0, index)
        .filter(slot => slot.type === TeaserSlotType.Autofill).length;

      return (
        (type === TeaserSlotType.Manual ?
          manualTeaser
        : autofillTeasers[autofillIndex]) ?? null
      );
    });
  }

  async getAutofillTeasers(
    slotsBlock: TeaserSlotsBlock
  ): Promise<(typeof Teaser)[]> {
    const { teaserType, filter } = slotsBlock.autofillConfig;
    const take = slotsBlock.slots.filter(
      ({ type }) => type === TeaserSlotType.Autofill
    ).length;

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

      this.addLoadedTeaser(...teasers);

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
