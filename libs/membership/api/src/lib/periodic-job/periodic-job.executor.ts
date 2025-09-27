import {Cron} from '@nestjs/schedule'
import {Injectable, Scope} from '@nestjs/common'
import {PeriodicJobService} from './periodic-job.service'

const SCHEDULE = process.env['PERIODIC_JOB_EXECUTION_SCHEDULE'] || '0 0 3 * * *'

@Injectable({
  scope: Scope.TRANSIENT
})
export class PeriodicJobExecutor {
  constructor(private periodicJobController: PeriodicJobService) {}

  @Cron(
    SCHEDULE,
    // Allow only chron that run once a day example: [number] [number] [number] [star] [star] [star]
    {
      disabled: !/[1-5]?[0-9] [1-5]?[0-9] [1-2]?[0-9] \* \* \*/.test(SCHEDULE)
    }
  )
  async handleCron() {
    await this.periodicJobController.concurrentExecute()
  }
}
