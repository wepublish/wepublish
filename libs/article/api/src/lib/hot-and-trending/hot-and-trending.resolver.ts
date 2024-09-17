import {Args, Int, Query, Resolver} from '@nestjs/graphql'
import {Inject} from '@nestjs/common'
import {Article} from '../article.model'

export const HOT_AND_TRENDING_DATA_SOURCE = Symbol('HOT_AND_TRENDING_DATA_SOURCE')

export interface HotAndTrendingDataSource {
  getMostViewedArticles(opts: {
    start?: Date | null
    take?: number | null
    skip?: number | null
  }): Promise<Article[]> | Article[]
}

@Resolver()
export class HotAndTrendingResolver {
  constructor(@Inject(HOT_AND_TRENDING_DATA_SOURCE) private datasource: HotAndTrendingDataSource) {}

  @Query(returns => [Article], {
    name: 'hotAndTrending',
    description: `
      Returns the most viewed articles in descending order.
    `
  })
  async hotAndTrending(
    @Args('start', {
      nullable: true,
      type: () => Date
    })
    start: Date | null,
    @Args('take', {nullable: true, type: () => Int, defaultValue: 10}) take: number
  ) {
    const result = await this.datasource.getMostViewedArticles({
      start,
      take
    })

    return result.map(({id}) => ({
      __typename: 'Article',
      id
    }))
  }
}
