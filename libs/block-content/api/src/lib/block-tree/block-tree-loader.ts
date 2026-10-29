import { forwardRef, Inject, Injectable, Scope } from '@nestjs/common';
import {
  ArticleTeaser,
  EventTeaser,
  Teaser,
  TeaserType,
} from '../teaser/teaser.model';
import {
  isTeaserSlotsBlock,
  TeaserSlotsBlock,
} from '../teaser-slot/teaser-slots.model';
import { ArticleService, ArticleSort } from '@wepublish/article/api';
import { SortOrder } from '@wepublish/utils/api';
import type { BlockContent } from '../block-content.model';
import { EventService, EventSort } from '@wepublish/event/api';
import { TeaserSlotType } from '../teaser-slot/teaser-slot.model';
import { BaseBlock } from '../base-block.model';
import { BlockType } from '../block-type.model';
import { isTeaserGridFlexBlock } from '../teaser/teaser-flex.model';
import { isTeaserGridBlock } from '../teaser/teaser-grid.model';
import {
  BlockWithAlignment,
  FlexBlock,
  isFlexBlock,
} from '../flex/flex-block.model';
import {
  BlockTemplate,
  BlockTemplateBlock,
  isBlockTemplateBlock,
} from '../block-template/block-template.model';
import { BlockTemplateDataloaderService } from '../block-template/block-template-dataloader.service';
import { displayedBlocks } from '../timing/displayed-blocks';
import { nextTimingChange, shouldDisplayBlock } from '../timing/block-timing';

// extract teasers recursively
// - teasers of hidden blocks are skipped as they aren't displayed
const extractManualTeasers = <Block extends BaseBlock<BlockType>>(
  block: Block | undefined,
  isHidden: (block: BaseBlock<BlockType>) => boolean,
  includeHidden = false
): (typeof Teaser)[] => {
  if (!block || (isHidden(block) && !includeHidden)) {
    return [];
  }

  if (isFlexBlock(block)) {
    const teasers: (typeof Teaser)[] = [];

    for (const nested of block.blocks) {
      teasers.push(
        ...extractManualTeasers(
          nested.block as BaseBlock<BlockType>,
          isHidden,
          includeHidden
        )
      );
    }

    return teasers;
  }

  if (isBlockTemplateBlock(block)) {
    return (block.template?.blocks ?? []).flatMap(nested =>
      extractManualTeasers(
        nested as BaseBlock<BlockType>,
        isHidden,
        includeHidden
      )
    );
  }

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

export type LoadBlocksOptions = {
  onlyDisplayed: boolean;
};

@Injectable({ scope: Scope.REQUEST })
export class BlockTreeLoader {
  readonly now = new Date();
  private loadedTeasers: (typeof Teaser)[] = [];
  private populatedTemplates = new WeakMap<object, BlockTemplate>();
  private loadedBlocks = new WeakMap<object, Promise<BaseBlock<BlockType>[]>>();
  private nextChanges = new WeakMap<object, Promise<Date | null>>();
  private expandedBlocks = new WeakMap<
    object,
    Promise<BaseBlock<BlockType>[]>
  >();

  constructor(
    private eventService: EventService,
    @Inject(forwardRef(() => ArticleService))
    private articleService: ArticleService,
    private blockTemplates: BlockTemplateDataloaderService
  ) {}

  async populateTeaserSlots(
    block: TeaserSlotsBlock,
    loadedTeasers = this.loadedTeasers
  ) {
    // get autofill teasers: load & store them in the loaded teasers list
    const autofillTeasers = await this.getAutofillTeasers(block, loadedTeasers);
    // get all teasers (manual & autofill)
    const teasers = await this.getTeasers(block, autofillTeasers);

    return {
      ...block,
      autofillTeasers,
      teasers,
    };
  }

  // process a block recursively
  async processBlock(
    block: BaseBlock<BlockType> | undefined,
    loadedTeasers = this.loadedTeasers,
    hidden = false
  ): Promise<BaseBlock<BlockType> | undefined> {
    if (!block) {
      return block;
    }

    // hidden blocks (and their nested blocks) are still populated for the editor,
    // but without taking teasers away from the displayed blocks
    if (this.isHidden(block) && !hidden) {
      loadedTeasers = [
        ...loadedTeasers,
        ...extractManualTeasers(block, this.isHidden, true),
      ];
      hidden = true;
    }

    // 1. if block is a flex block --> process its nested blocks
    if (isFlexBlock(block)) {
      const updatedBlocks: BlockWithAlignment[] = [];
      for (const nested of block.blocks) {
        const updatedNestedBlock = await this.processBlock(
          nested.block,
          loadedTeasers,
          hidden
        );
        updatedBlocks.push({
          ...nested,
          block: updatedNestedBlock,
        } as BlockWithAlignment);
      }

      return { ...block, blocks: updatedBlocks } as FlexBlock;
    }

    // 2. if block is a block template (already expanded) --> process the template's blocks
    if (isBlockTemplateBlock(block) && block.template) {
      const updatedBlocks: (typeof BlockContent)[] = [];
      for (const nested of block.template.blocks) {
        const updatedNestedBlock = await this.processBlock(
          nested as BaseBlock<BlockType>,
          loadedTeasers,
          hidden
        );
        if (updatedNestedBlock) {
          updatedBlocks.push(updatedNestedBlock as typeof BlockContent);
        }
      }

      const template = { ...block.template, blocks: updatedBlocks };
      this.populatedTemplates.set(template, template);

      return { ...block, template } as BlockTemplateBlock;
    }

    // 3. else if block is a teaser-slots-block
    // - populate its teaser slots with manual & autofill teasers
    // - extract/store them so they can be excluded when next teaser-slots-blocks will be populated
    if (isTeaserSlotsBlock(block)) {
      return await this.populateTeaserSlots(block, loadedTeasers);
    }

    return block;
  }

  async expandBlockTemplates(
    block: BaseBlock<BlockType> | undefined,
    visitedTemplateIDs: string[] = []
  ): Promise<BaseBlock<BlockType> | undefined> {
    if (!block) {
      return block;
    }

    if (isFlexBlock(block)) {
      const blocks = await Promise.all(
        block.blocks.map(
          async nested =>
            ({
              ...nested,
              block: await this.expandBlockTemplates(
                nested.block,
                visitedTemplateIDs
              ),
            }) as BlockWithAlignment
        )
      );

      return { ...block, blocks } as FlexBlock;
    }

    if (isBlockTemplateBlock(block)) {
      // circular templates are prevented when saving, this is just a safeguard
      if (visitedTemplateIDs.includes(block.templateId)) {
        return { ...block, template: null } as unknown as BlockTemplateBlock;
      }

      const template = await this.blockTemplates.load(block.templateId);

      if (!template) {
        return block;
      }

      const blocks = (
        await Promise.all(
          (template.blocks as unknown as BaseBlock<BlockType>[]).map(nested =>
            this.expandBlockTemplates(nested, [
              ...visitedTemplateIDs,
              block.templateId,
            ])
          )
        )
      ).filter(Boolean) as (typeof BlockContent)[];

      return {
        ...block,
        template: { ...template, blocks },
      } as BlockTemplateBlock;
    }

    return block;
  }

  async loadBlocks(
    blocks: BaseBlock<BlockType>[],
    { onlyDisplayed }: LoadBlocksOptions
  ) {
    const loaded = await this.load(blocks, this.loadedTeasers);

    return onlyDisplayed ? this.displayed(loaded) : loaded;
  }

  async loadTemplateBlocks(
    template: BlockTemplate,
    { onlyDisplayed }: LoadBlocksOptions
  ) {
    const populated = this.populatedTemplates.get(template);
    const loaded =
      (populated?.blocks as BaseBlock<BlockType>[] | undefined) ??
      (await this.load(template.blocks as BaseBlock<BlockType>[], []));

    return onlyDisplayed ? this.displayed(loaded) : loaded;
  }

  nextChange(blocks: BaseBlock<BlockType>[]) {
    const next =
      this.nextChanges.get(blocks) ??
      this.expand(blocks).then(expanded =>
        nextTimingChange(expanded, this.now)
      );

    this.nextChanges.set(blocks, next);

    return next;
  }

  private isHidden = (block: BaseBlock<BlockType>) =>
    !shouldDisplayBlock(block, this.now);

  private displayed(blocks: BaseBlock<BlockType>[]) {
    return displayedBlocks(blocks, this.now, {
      onTemplateRebuilt: (template, original) => {
        const populated = this.populatedTemplates.get(original);

        if (populated) {
          this.populatedTemplates.set(template, populated);
        }
      },
    });
  }

  private load(
    blocksToLoad: BaseBlock<BlockType>[],
    loadedTeasers: (typeof Teaser)[]
  ) {
    const loaded =
      this.loadedBlocks.get(blocksToLoad) ??
      this.populate(blocksToLoad, loadedTeasers);

    this.loadedBlocks.set(blocksToLoad, loaded);

    return loaded;
  }

  private expand(blocksToExpand: BaseBlock<BlockType>[]) {
    const expanded =
      this.expandedBlocks.get(blocksToExpand) ??
      Promise.all(
        blocksToExpand.map(block => this.expandBlockTemplates(block))
      ).then(blocks => blocks.filter(Boolean) as BaseBlock<BlockType>[]);

    this.expandedBlocks.set(blocksToExpand, expanded);

    return expanded;
  }

  private async populate(
    blocksToLoad: BaseBlock<BlockType>[],
    loadedTeasers: (typeof Teaser)[]
  ) {
    const blocks: BaseBlock<BlockType>[] = [];
    const revisionBlocks = await this.expand(blocksToLoad);

    // extract & store all manual teasers
    // - they will be completely excluded from being autofilled
    for (const block of revisionBlocks) {
      this.addLoadedTeaser(
        extractManualTeasers(block, this.isHidden),
        loadedTeasers
      );
    }

    // process each block
    for (const block of revisionBlocks) {
      const processed = await this.processBlock(block, loadedTeasers);
      if (processed) {
        blocks.push(processed);
      }
    }

    return blocks;
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
    slotsBlock: TeaserSlotsBlock,
    loadedTeasers = this.loadedTeasers
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
          excludeIds: this.getLoadedTeasers(TeaserType.Article, loadedTeasers),
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

      this.addLoadedTeaser(teasers, loadedTeasers);
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

      this.addLoadedTeaser(teasers, loadedTeasers);
      return teasers;
    }

    return [];
  }

  addLoadedTeaser(
    teasers: (typeof Teaser)[],
    loadedTeasers = this.loadedTeasers
  ) {
    loadedTeasers.push(...teasers.filter(Boolean));
  }

  getLoadedTeasers(
    type: TeaserType,
    loadedTeasers = this.loadedTeasers
  ): string[] {
    return loadedTeasers.reduce((ids: string[], teaser) => {
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
