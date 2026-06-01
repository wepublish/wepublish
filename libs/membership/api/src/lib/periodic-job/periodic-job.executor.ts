import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { PeriodicJobService } from './periodic-job.service';
import { MailchimpSyncService } from '../mailchimp-sync/mailchimp-sync.service';

const SCHEDULE =
  process.env['PERIODIC_JOB_EXECUTION_SCHEDULE'] || '0 0 3 * * *';

@Injectable()
export class PeriodicJobExecutor {
  private logger = new Logger('PeriodicJobExecutor');

  constructor(
    private periodicJobController: PeriodicJobService,
    private moduleRef: ModuleRef
  ) {}

  @Cron(
    SCHEDULE,
    // Allow only chron that run once a day example: [number] [number] [number] [star] [star] [star]
    {
      disabled: !/[1-5]?[0-9] [1-5]?[0-9] [1-2]?[0-9] \* \* \*/.test(SCHEDULE),
    }
  )
  async handleCron() {
    try {
      await this.periodicJobController.concurrentExecute();
    } catch (error) {
      this.logger.error('Periodic jobs failed:', error);
    }

    try {
      const contextId = ContextIdFactory.create();
      const mailchimpSyncService = await this.moduleRef.resolve(
        MailchimpSyncService,
        contextId,
        { strict: false }
      );
      await mailchimpSyncService.executeAllSync();
    } catch (error) {
      this.logger.error('Mailchimp sync failed during periodic job:', error);
    }
  }
}
