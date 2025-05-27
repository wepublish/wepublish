import {Injectable, Scope} from '@nestjs/common'
import {Article} from '@prisma/client'
import {ArticleTeaser, EventTeaser, Teaser, TeaserType} from './teaser.model'
import {isTeaserSlotsBlock, TeaserSlotsBlock} from '../teaser-slot/teaser-slots.model'
import {ArticleService, ArticleSort} from '@wepublish/article/api'
import {SortOrder} from '@wepublish/utils/api'
import {EventService, EventSort} from '@wepublish/event/api'
import {TeaserSlotType} from '../teaser-slot/teaser-slot.model'
import {BaseBlock} from '../base-block.model'
import {BlockType} from '../block-type.model'
import {isTeaserGridFlexBlock} from './teaser-flex.model'
import {isTeaserGridBlock} from './teaser-grid.model'

@Injectable({scope: Scope.REQUEST})
export class SlotTeasersLoader {
  private loadedTeasers: (typeof Teaser)[] = []

  constructor(private eventService: EventService, private articleService: ArticleService) {}

  async loadSlotTeasersIntoBlocks(revisionBlocks: BaseBlock<BlockType>[]) {
    revisionBlocks.forEach(block => {
      if (isTeaserSlotsBlock(block)) {
        this.addLoadedTeaser(
          ...block.slots.reduce((teasers: (typeof Teaser)[], slot) => {
            if (slot.type === TeaserSlotType.Manual && slot.teaser) {
              teasers.push(slot.teaser)
            }
            return teasers
          }, [])
        )
      }
      if (isTeaserGridBlock(block)) {
        this.addLoadedTeaser(
          ...block.teasers.reduce((teasers: (typeof Teaser)[], teaser) => {
            if (teaser) {
              teasers.push(teaser)
            }
            return teasers
          }, [])
        )
      }
      if (isTeaserGridFlexBlock(block)) {
        this.addLoadedTeaser(
          ...block.flexTeasers.reduce((teasers: (typeof Teaser)[], flexTeaser) => {
            if (flexTeaser.teaser) {
              teasers.push(flexTeaser.teaser)
            }
            return teasers
          }, [])
        )
      }
    })

    const blocks = []
    for (const block of revisionBlocks) {
      if (isTeaserSlotsBlock(block)) {
        blocks.push({
          ...block,
          teasers: await this.getTeasers(block)
        })
      } else {
        blocks.push(block)
      }
    }
    return blocks
  }

  async getTeasers(slotsBlock: TeaserSlotsBlock): Promise<(typeof Teaser)[]> {
    const {teaserType, sort, filter} = slotsBlock.autofillConfig
    const take = slotsBlock.slots.filter(({type}) => type === TeaserSlotType.Autofill).length

    if (teaserType === TeaserType.Article) {
      let articles: Article[] = []
      articles = (
        await this.articleService.getArticles({
          filter: {
            tags: filter?.tags,
            published: true,
            excludeIds: this.getLoadedTeasers(TeaserType.Article)
          },
          sort: ArticleSort.PublishedAt,
          order: SortOrder.Descending,
          take
        })
      )?.nodes

      const teasers = articles.map(
        article =>
          ({
            articleID: article.id,
            type: TeaserType.Article,
            imageID: undefined,
            lead: undefined,
            title: undefined
          } as ArticleTeaser)
      )

      this.addLoadedTeaser(...teasers)
      return teasers
    }

    if (teaserType === TeaserType.Event) {
      const events = await this.eventService.getEvents({
        filter: {
          tags: filter?.tags
        },
        sort: EventSort.StartsAt,
        order: SortOrder.Descending,
        take
      })

      const teasers = events.nodes.map(
        event =>
          ({
            eventID: event.id,
            type: TeaserType.Event,
            imageID: undefined,
            lead: undefined,
            title: undefined
          } as EventTeaser)
      )
      this.addLoadedTeaser(...teasers)
      return teasers
    }

    return []
  }

  addLoadedTeaser(...teaser: (typeof Teaser)[]) {
    this.loadedTeasers.push(...teaser)
  }

  getLoadedTeasers(type: TeaserType): string[] {
    return this.loadedTeasers.reduce((ids: string[], teaser) => {
      if (teaser.type === type) {
        if (teaser.type === TeaserType.Article && teaser.articleID) {
          ids.push(teaser.articleID)
        }
        if (teaser.type === TeaserType.Event && teaser.eventID) {
          ids.push(teaser.eventID)
        }
      }
      return ids
    }, [])
  }
}
