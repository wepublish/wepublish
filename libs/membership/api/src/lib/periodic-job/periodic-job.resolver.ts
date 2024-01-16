import {Args, Int, Query, Resolver} from '@nestjs/graphql'
import {CanGetPeriodicJobLog, Permissions} from '@wepublish/permissions/api'
import {PeriodicJob} from './periodic-job.model'
import {PeriodicJobService} from './periodic-job.service'

@Resolver(() => PeriodicJob)
export class PeriodicJobResolver {
  constructor(private periodicJobService: PeriodicJobService) {}

  @Permissions(CanGetPeriodicJobLog)
  @Query(() => [PeriodicJob])
  periodicJobLog(
    @Args('take', {type: () => Int, nullable: true, defaultValue: 10}) take: number,
    @Args('skip', {type: () => Int, nullable: true}) skip?: number
  ) {
    return this.periodicJobService.getJobLog(take, skip)
  }
}
