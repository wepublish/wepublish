import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CanGetPeriodicJobLog,
  CanRetryPeriodicJob,
} from '@wepublish/permissions';
import { PeriodicJob } from './periodic-job.model';
import { PeriodicJobService } from './periodic-job.service';
import { Permissions } from '@wepublish/permissions/api';

@Resolver(() => PeriodicJob)
export class PeriodicJobResolver {
  constructor(private periodicJobService: PeriodicJobService) {}

  @Permissions(CanGetPeriodicJobLog)
  @Query(() => [PeriodicJob])
  periodicJobLog(
    @Args('take', { type: () => Int, nullable: true, defaultValue: 10 })
    take: number,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number
  ) {
    return this.periodicJobService.getJobLog(take, skip);
  }

  @Permissions(CanRetryPeriodicJob)
  @Mutation(() => PeriodicJob, {
    description: `Retries the failed periodic job and then catches up every run up to today. Answers once the failed run is taken over; the runs go on in the background. Refused while a run is going on.`,
  })
  retryPeriodicJob() {
    return this.periodicJobService.retryAndCatchUp();
  }

  @ResolveField(() => Boolean)
  running(@Parent() job: PeriodicJob) {
    return this.periodicJobService.isRunning(job);
  }
}
