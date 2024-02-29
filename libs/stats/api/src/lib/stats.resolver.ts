import {Query, Resolver} from '@nestjs/graphql'
import {StatsService} from './stats.service'
import {GraphQLISODateTime} from '@nestjs/graphql'

@Resolver()
export class StatsResolver {
  constructor(private statsService: StatsService) {}

  @Query(() => Number)
  async authorsCount() {
    return this.statsService.getAuthorsCount()
  }

  @Query(() => Number)
  async articlesCount() {
    return this.statsService.getArticlesCount()
  }

  @Query(() => GraphQLISODateTime)
  async firstArticleDate() {
    return this.statsService.getFirstArticleDate()
  }
}
