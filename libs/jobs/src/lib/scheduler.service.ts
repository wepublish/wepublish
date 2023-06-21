import {Injectable, Logger} from '@nestjs/common'
import PgBoss, {WorkHandler} from 'pg-boss'

@Injectable()
export class Scheduler {
  private logger = new Logger(Scheduler.name)

  constructor(private readonly boss: PgBoss) {}

  async scheduleJob(cron: string, jobName: string, handler: WorkHandler<any>) {
    await this.boss.work(jobName, this.prepareWorkload(handler))
    await this.boss.schedule(jobName, cron)
    this.logger.log(`Scheduled job "${jobName}"`)
  }

  prepareWorkload(handler: WorkHandler<any>): WorkHandler<any> {
    return async job => {
      this.logger.log(`Processing job ${job.name} with id=${job.id}`)
      await handler(job)
    }
  }

  async unscheduleJob(jobName: string) {
    await this.boss.unschedule(jobName)
    this.logger.log(`Unscheduled job "${jobName}"`)
  }
}
