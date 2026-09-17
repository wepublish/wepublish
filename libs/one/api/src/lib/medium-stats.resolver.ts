import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { MediumStats, MediumStatsService } from '@wepublish/stats/api';
import { MediumMigration } from './medium-migrations.model';
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

  /**
   * The full migration history, newest first. The stats query carries only a
   * summary; this is for the drill-down, where an operator needs the names,
   * timestamps and the error of the one that failed.
   */
  @OneScopedJwt('read:stats')
  @Query(() => [MediumMigration], { name: 'mediumMigrations' })
  async getMediumMigrations(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number
  ): Promise<MediumMigration[]> {
    return this.mediumStatsService.listMigrations(limit ?? undefined);
  }
}
