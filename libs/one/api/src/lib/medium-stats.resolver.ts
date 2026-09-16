import { Args, Query, Resolver } from '@nestjs/graphql';
import { MediumStats, MediumStatsService } from '@wepublish/stats/api';
import { OneScopedJwt } from './one-scoped-jwt.decorator';

@Resolver()
export class MediumStatsResolver {
  constructor(private mediumStatsService: MediumStatsService) {}

  @OneScopedJwt('read:stats')
  @Query(() => MediumStats, { name: 'mediumStats' })
  async getMediumStats(
    @Args('from', { type: () => Date, nullable: true }) from?: Date,
    @Args('to', { type: () => Date, nullable: true }) to?: Date
  ): Promise<MediumStats> {
    return this.mediumStatsService.getMediumStats({ from, to });
  }
}
