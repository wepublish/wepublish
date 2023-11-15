import {Args, Int, Query, Resolver} from '@nestjs/graphql'
import {CanGetPeriodicJobLog, Permissions} from '@wepublish/permissions/api'
import {PeriodicJobModel} from './periodic-job.model'
import {PeriodicJobService} from './periodic-job.service'

@Resolver()
export class PeriodicJobResolver {
  constructor(private periodicJobService: PeriodicJobService) {}

  @Permissions(CanGetPeriodicJobLog)
  @Query(returns => [PeriodicJobModel], {
    name: 'periodicJobLog',
    description: `
      Returns 
    `
  })
  periodicJobLog(
    @Args('skip', {type: () => Int}) skip: number,
    @Args('take', {type: () => Int}) take: number
  ) {
    return this.periodicJobService.PeriodicJobLog(skip, take)
  }
}
