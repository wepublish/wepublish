import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  TeaserListBlock,
  TeaserListBlockFilter,
  TeaserListBlockSort,
} from './teaser-list.model';
import {
  ArticleTeaser,
  EventTeaser,
  PageTeaser,
  Teaser,
  TeaserType,
} from './teaser.model';
import {
  ArticleService,
  ArticleSort,
  HOT_AND_TRENDING_DATA_SOURCE,
  HotAndTrendingDataSource,
} from '@wepublish/article/api';
import { forwardRef, Inject } from '@nestjs/common';
import { PageService, PageSort } from '@wepublish/page/api';
import { Article } from '@prisma/client';
import { SortOrder } from '@wepublish/utils/api';
import { EventService, EventSort } from '@wepublish/event/api';
import { Tag, TagDataloader } from '@wepublish/tag/api';

@Resolver(() => TeaserListBlock)
export class TeaserListBlockResolver {
  constructor(
    private eventService: EventService,
    @Inject(forwardRef(() => ArticleService))
    private articleService: ArticleService,
    @Inject(forwardRef(() => PageService))
    private pageService: PageService,
    @Inject(HOT_AND_TRENDING_DATA_SOURCE)
    private hotAndTrending: HotAndTrendingDataSource
  ) {}

  @ResolveField(() => [Teaser], { nullable: true })
  async teasers(@Parent() parent: TeaserListBlock) {
    const { teaserType, skip, sort, take, filter } = parent;

    if (teaserType === TeaserType.Article) {
      let articles: Article[] = [];

      if (sort === TeaserListBlockSort.HotAndTrending) {
        try {
          articles = await this.hotAndTrending.getMostViewedArticles({
            skip,
            take,
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        articles = (
          await this.articleService.getArticles({
            filter: {
              tags: filter.tags,
              published: true,
            },
            sort:
              sort === TeaserListBlockSort.UpdatedAt ?
                ArticleSort.ModifiedAt
              : ArticleSort.PublishedAt,
            order: SortOrder.Descending,
            skip,
            take,
          })
        )?.nodes;
      }

      return articles.map(
        article =>
          ({
            articleID: article.id,
            type: TeaserType.Article,
            imageID: undefined,
            lead: undefined,
            title: undefined,
          }) as ArticleTeaser
      );
    }

    if (teaserType === TeaserType.Page) {
      const pages = await this.pageService.getPages({
        filter: {
          tags: filter.tags,
          published: true,
        },
        sort:
          sort === TeaserListBlockSort.UpdatedAt ?
            PageSort.ModifiedAt
          : PageSort.PublishedAt,
        order: SortOrder.Descending,
        skip,
        take,
      });

      return pages.nodes.map(
        page =>
          ({
            pageID: page.id,
            type: TeaserType.Page,
            imageID: undefined,
            lead: undefined,
            title: undefined,
          }) as PageTeaser
      );
    }

    if (teaserType === TeaserType.Event) {
      const events = await this.eventService.getEvents({
        filter: {
          tags: filter.tags,
        },
        sort:
          sort === TeaserListBlockSort.UpdatedAt ?
            EventSort.ModifiedAt
          : EventSort.StartsAt,
        order: SortOrder.Descending,
        skip,
        take,
      });

      return events.nodes.map(
        event =>
          ({
            eventID: event.id,
            type: TeaserType.Event,
            imageID: undefined,
            lead: undefined,
            title: undefined,
          }) as EventTeaser
      );
    }

    return [];
  }
}

@Resolver(() => TeaserListBlockFilter)
export class TeaserListBlockFilterResolver {
  public constructor(private tagDataloader: TagDataloader) {}

  @ResolveField(() => [Tag])
  async tagObjects(@Parent() parent: TeaserListBlockFilter) {
    return this.tagDataloader.loadMany(parent.tags);
  }
}
