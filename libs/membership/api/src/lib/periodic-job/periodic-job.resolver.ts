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
import { PeriodicJob, PeriodicJobStep } from './periodic-job.model';
import type { PeriodicJobStep as StoredStep } from '@prisma/client';
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

  /** The log query brings the steps along; a retried job loads its own. */
  @ResolveField(() => [PeriodicJobStep])
  async steps(
    @Parent() job: PeriodicJob & { steps?: StoredStep[] }
  ): Promise<PeriodicJobStep[]> {
    const steps = job.steps ?? (await this.periodicJobService.getSteps(job.id));

    return steps.map(
      ({ key, status, counts, error, startedAt, finishedAt }) => ({
        key,
        status,
        counts: Object.entries((counts ?? {}) as Record<string, unknown>)
          .filter(([, value]) => typeof value === 'number')
          .map(([name, value]) => ({ name, value: value as number })),
        error: error ?? undefined,
        startedAt,
        finishedAt,
      })
    );
  }
}
