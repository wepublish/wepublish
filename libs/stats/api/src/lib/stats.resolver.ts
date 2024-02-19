import {Query, Resolver} from '@nestjs/graphql'
import {Stats} from './stats.model'
import {StatsService} from './stats.service'

@Resolver(() => Stats)
export class StatsResolver {
  constructor(private statsService: StatsService) {}

  @Query(returns => Stats, {
    description: `Returns a few basic, newsroom-related stats.`
  })
  public stats() {
    return this.statsService.getStats()
  }
}
