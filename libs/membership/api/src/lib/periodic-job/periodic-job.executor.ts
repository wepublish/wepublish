import { Cron } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { DistributedClaims } from '@wepublish/dragonfly/api';
import { NIGHT_CLAIM_MS, PeriodicJobService } from './periodic-job.service';
import { MailchimpSyncService } from '../mailchimp-sync/mailchimp-sync.service';

const SCHEDULE =
  process.env['PERIODIC_JOB_EXECUTION_SCHEDULE'] || '0 0 3 * * *';

const CLAIM_RETRY_FOR_MS = 60_000;

@Injectable()
export class PeriodicJobExecutor {
  private logger = new Logger('PeriodicJobExecutor');

  constructor(
    private periodicJobController: PeriodicJobService,
    private moduleRef: ModuleRef,
    private claims: DistributedClaims
  ) {}

  @Cron(
    SCHEDULE,
    // Allow only chron that run once a day example: [number] [number] [number] [star] [star] [star]
    {
      disabled: !/[1-5]?[0-9] [1-5]?[0-9] [1-2]?[0-9] \* \* \*/.test(SCHEDULE),
    }
  )
  async handleCron() {
    const claimed = await this.claims.claim('nightly-job', NIGHT_CLAIM_MS, {
      retryForMs: CLAIM_RETRY_FOR_MS,
    });

    switch (claimed) {
      case 'claimed':
        return this.runNight(() => this.periodicJobController.execute());

      case 'taken':
        this.logger.log('Nightly job was claimed by another replica, skipping');

        return;

      case 'not-configured':
        this.logger.log(
          'No Dragonfly configured (REDIS_URL unset), the database makes sure only one replica runs the nightly job'
        );

        return this.runNight(() =>
          this.periodicJobController.concurrentExecute()
        );

      case 'unavailable':
        this.logger.error(
          'Nightly job not run: Dragonfly is configured but unreachable, so nothing makes sure only one replica runs it. The next run catches up.'
        );

        return;
    }
  }

  private async runNight(runPeriodicJobs: () => Promise<void>) {
    try {
      await runPeriodicJobs();
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
