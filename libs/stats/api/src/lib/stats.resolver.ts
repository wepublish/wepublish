import { Resolver, ResolveField, Parent, Query } from '@nestjs/graphql';
import { StatsService } from './stats.service';
import { GraphQLISODateTime } from '@nestjs/graphql';
import { Stats } from './stats.model';
import { Public } from '@wepublish/authentication/api';

@Resolver(() => Stats)
export class StatsResolver {
  constructor(private statsService: StatsService) {}

  @Public()
  @Query(() => Stats, { name: 'stats', nullable: true })
  getStats() {
    // Return a dummy object; actual data is fetched through ResolveField
    return {};
  }

  @ResolveField(() => Number)
  async authorsCount(@Parent() stats: Stats) {
    return this.statsService.getAuthorsCount();
  }

  @ResolveField(() => Number)
  async articlesCount(@Parent() stats: Stats) {
    return this.statsService.getArticlesCount();
  }

  @ResolveField(() => GraphQLISODateTime)
  async firstArticleDate(@Parent() stats: Stats) {
    return this.statsService.getFirstArticleDate();
  }
}
