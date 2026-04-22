import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Inject, Logger } from '@nestjs/common';
import { Article as ArticleModel } from '../article.model';
import { Article } from '@prisma/client';
import { Public } from '@wepublish/authentication/api';

export const HOT_AND_TRENDING_DATA_SOURCE = Symbol(
  'HOT_AND_TRENDING_DATA_SOURCE'
);

export interface HotAndTrendingDataSource {
  getMostViewedArticles(opts: {
    start?: Date | null;
    take?: number | null;
    skip?: number | null;
  }): Promise<Article[]> | Article[];
}

@Resolver()
export class HotAndTrendingResolver {
  private readonly logger = new Logger(HotAndTrendingResolver.name);

  constructor(
    @Inject(HOT_AND_TRENDING_DATA_SOURCE)
    private datasource: HotAndTrendingDataSource
  ) {}

  @Public()
  @Query(returns => [ArticleModel], {
    name: 'hotAndTrending',
    description: `
      Returns the most viewed articles in descending order.
    `,
  })
  async hotAndTrending(
    @Args('start', {
      nullable: true,
      type: () => Date,
    })
    start: Date | null,
    @Args('take', { nullable: true, type: () => Int, defaultValue: 10 })
    take: number
  ): Promise<Article[]> {
    try {
      return await this.datasource.getMostViewedArticles({
        start,
        take,
      });
    } catch (error) {
      this.logger.error(
        `hotAndTrending query failed: ${error instanceof Error ? error.message : error}`
      );

      return [];
    }
  }
}
