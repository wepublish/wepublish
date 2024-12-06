import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {TeaserListBlock, TeaserListBlockSort} from './teaser-list.model'
import {
  ArticleTeaser,
  EventTeaser,
  PageTeaser,
  Teaser,
  TeaserStyle,
  TeaserType
} from './teaser.model'
import {
  ArticleService,
  ArticleSort,
  HOT_AND_TRENDING_DATA_SOURCE,
  HotAndTrendingDataSource
} from '@wepublish/article/api'
import {Inject} from '@nestjs/common'
import {PageService, PageSort} from '@wepublish/page/api'
import {Article} from '@prisma/client'
import {SortOrder} from '@wepublish/utils/api'
import {EventService, EventSort} from '@wepublish/event/api'

@Resolver(() => TeaserListBlock)
export class TeaserListBlockResolver {
  constructor(
    private articleService: ArticleService,
    private pageService: PageService,
    private eventService: EventService,
    @Inject(HOT_AND_TRENDING_DATA_SOURCE) private hotAndTrending: HotAndTrendingDataSource
  ) {}

  @ResolveField(() => [Teaser], {nullable: true})
  async teasers(@Parent() parent: TeaserListBlock) {
    const {teaserType, skip, sort, take, filter} = parent

    if (teaserType === TeaserType.Article) {
      let articles: Article[] = []

      if (sort === TeaserListBlockSort.HotAndTrending) {
        try {
          articles = await this.hotAndTrending.getMostViewedArticles({skip, take})
        } catch (e) {
          console.error(e)
        }
      } else {
        articles = (
          await this.articleService.getArticles({
            filter: {
              tags: filter.tags
            },
            sort: ArticleSort.PublishedAt,
            order: SortOrder.Descending,
            skip,
            take
          })
        )?.nodes
      }

      return articles.map(
        article =>
          ({
            articleID: article.id,
            style: TeaserStyle.Default,
            type: TeaserType.Article,
            imageID: undefined,
            lead: undefined,
            title: undefined
          } as ArticleTeaser)
      )
    }

    if (teaserType === TeaserType.Page) {
      const pages = await this.pageService.getPages({
        filter: {
          tags: filter.tags
        },
        sort: PageSort.PublishedAt,
        order: SortOrder.Descending,
        skip,
        take
      })

      return pages.nodes.map(
        page =>
          ({
            pageID: page.id,
            style: TeaserStyle.Default,
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
          tags: filter.tags
        },
        sort: EventSort.StartsAt,
        order: SortOrder.Descending,
        skip,
        take
      })

      return pages.nodes.map(
        event =>
          ({
            eventID: event.id,
            style: TeaserStyle.Default,
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