import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {TeaserListBlockSort} from '../teaser/teaser-list.model'
import {ArticleTeaser, EventTeaser, PageTeaser, Teaser, TeaserType} from '../teaser/teaser.model'
import {TeaserSlotsBlock} from './teaser-slots.model'

import {EventService, EventSort} from '@wepublish/event/api'
import {forwardRef, Inject} from '@nestjs/common'
import {
  ArticleService,
  ArticleSort,
  HOT_AND_TRENDING_DATA_SOURCE,
  HotAndTrendingDataSource
} from '@wepublish/article/api'
import {PageService, PageSort} from '@wepublish/page/api'
import {Article} from '@prisma/client'
import {SortOrder} from '@wepublish/utils/api'

@Resolver(() => TeaserSlotsBlock)
export class TeaserSlotsBlockResolver {
  constructor(
    private eventService: EventService,
    @Inject(forwardRef(() => ArticleService))
    private articleService: ArticleService,
    @Inject(forwardRef(() => PageService))
    private pageService: PageService,
    @Inject(HOT_AND_TRENDING_DATA_SOURCE) private hotAndTrending: HotAndTrendingDataSource
  ) {}

  @ResolveField(() => [Teaser], {nullable: true})
  async teasers(@Parent() parent: TeaserSlotsBlock) {
    const {teaserType, sort, filter} = parent.autofillConfig
    const take = parent.slots.length

    if (teaserType === TeaserType.Article) {
      let articles: Article[] = []

      if (sort === TeaserListBlockSort.HotAndTrending) {
        try {
          articles = await this.hotAndTrending.getMostViewedArticles({take})
        } catch (e) {
          console.error(e)
        }
      } else {
        articles = (
          await this.articleService.getArticles({
            filter: {
              tags: filter?.tags,
              published: true
            },
            sort: ArticleSort.PublishedAt,
            order: SortOrder.Descending,
            take
          })
        )?.nodes
      }

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
      console.log(teasers)

      return teasers
    }

    if (teaserType === TeaserType.Page) {
      const pages = await this.pageService.getPages({
        filter: {
          tags: filter?.tags,
          published: true
        },
        sort: PageSort.PublishedAt,
        order: SortOrder.Descending,
        take
      })

      return pages.nodes.map(
        page =>
          ({
            pageID: page.id,
            type: TeaserType.Page,
            imageID: undefined,
            lead: undefined,
            title: undefined
          } as PageTeaser)
      )
    }

    if (teaserType === TeaserType.Event) {
      const pages = await this.eventService.getEvents({
        filter: {
          tags: filter?.tags
        },
        sort: EventSort.StartsAt,
        order: SortOrder.Descending,
        take
      })

      return pages.nodes.map(
        event =>
          ({
            eventID: event.id,
            type: TeaserType.Event,
            imageID: undefined,
            lead: undefined,
            title: undefined
          } as EventTeaser)
      )
    }

    return []
  }
}
