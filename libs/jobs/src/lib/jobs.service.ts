import {Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit} from '@nestjs/common'
import PgBoss from 'pg-boss'

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  static JOBS_SERVICE_PG_BOSS = Symbol('JOBS_SERVICE_PG_BOSS')

  private logger = new Logger(JobsService.name)

  constructor(
    @Inject(JobsService.JOBS_SERVICE_PG_BOSS)
    private readonly boss: PgBoss
  ) {}

  async processInQueue<T extends object>(queue: string, job: T) {
    const jobId = await this.boss.send(queue, job, {})
    this.logger.log(`Queued job "${jobId}" into "${queue}"`)
  }

  async installJobHandler<T = any>(queue: string, jobHandler: PgBoss.WorkHandler<T>) {
    await this.boss.work<T>(queue, async job => {
      this.logger.log(`Processing job "${job.id}" in "${queue}"`)
      await jobHandler(job)
    })
    this.logger.log(`Job handler for queue "${queue}" installed`)
  }

  async onModuleInit() {
    this.boss.on('error', error => this.logger.error(error))
    await this.boss.start()
    this.logger.log(`PgBoss started`)
  }

  async onModuleDestroy() {
    this.boss.removeAllListeners()
    await this.boss.stop()
  }
}
