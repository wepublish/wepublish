import { Cron } from '@nestjs/schedule';
import { Injectable, Logger, Type } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { NIGHT_CLAIM_MS, PeriodicJobService } from './periodic-job.service';
import { MailchimpSyncService } from '../mailchimp-sync/mailchimp-sync.service';
import { MailLogSyncService } from '../mail-send/mail-log-sync.service';
import { EmailQualityService } from '../email-quality/email-quality.service';
import { DeliverySuggestionService } from '../delivery-mode/delivery-suggestion.service';

const SCHEDULE =
  process.env['PERIODIC_JOB_EXECUTION_SCHEDULE'] || '0 0 3 * * *';

const CLAIM_RETRY_FOR_MS = 60_000;

// The sync service caps a call at 500; one call a night is plenty for the
// handful of mails whose webhook never arrived.
const NIGHTLY_MAIL_LOG_SYNC_LIMIT = 500;

@Injectable()
export class PeriodicJobExecutor {
  private logger = new Logger('PeriodicJobExecutor');

  constructor(
    private periodicJobController: PeriodicJobService,
    private moduleRef: ModuleRef,
    private kv: KvTtlCacheService
  ) {}

  @Cron(
    SCHEDULE,
    // Allow only chron that run once a day example: [number] [number] [number] [star] [star] [star]
    {
      disabled: !/[1-5]?[0-9] [1-5]?[0-9] [1-2]?[0-9] \* \* \*/.test(SCHEDULE),
    }
  )
  async handleCron() {
    const claimed = await this.kv.claim('nightly-job', NIGHT_CLAIM_MS, {
      retryForMs: CLAIM_RETRY_FOR_MS,
    });

    if (claimed === undefined) {
      if ((await this.kv.dragonflyStatus()) === 'not-configured') {
        this.logger.log(
          'No Dragonfly configured (REDIS_URL unset), the database makes sure only one replica runs the nightly job'
        );

        return this.runNight(() =>
          this.periodicJobController.concurrentExecute()
        );
      }

      this.logger.error(
        'Nightly job not run: Dragonfly is configured but unreachable, so nothing makes sure only one replica runs it. The next run catches up.'
      );

      return;
    }

    if (!claimed) {
      this.logger.log('Nightly job was claimed by another replica, skipping');

      return;
    }

    return this.runNight(() => this.periodicJobController.execute());
  }

  private async runNight(runPeriodicJobs: () => Promise<void>) {
    try {
      await runPeriodicJobs();
    } catch (error) {
      this.logger.error('Periodic jobs failed:', error);
    }

    await this.runStep('Mailchimp sync', MailchimpSyncService, service =>
      service.executeAllSync()
    );
    // Delivery states a provider never reported by webhook, then the levels
    // that change with time alone (unresponsive). Order matters: a polled
    // bounce should count tonight, not tomorrow.
    await this.runStep('Mail log sync', MailLogSyncService, service =>
      service.syncOpenStates(NIGHTLY_MAIL_LOG_SYNC_LIMIT)
    );
    await this.runStep('Email quality', EmailQualityService, service =>
      service.recomputeAll()
    );
    // Built from tonight's levels, so it comes after them.
    await this.runStep(
      'Delivery suggestions',
      DeliverySuggestionService,
      service => service.recomputeAll()
    );
  }

  /** Each step of the night fails on its own; the next one still runs. */
  private async runStep<T>(
    name: string,
    service: Type<T>,
    run: (service: T) => Promise<unknown>
  ) {
    try {
      const contextId = ContextIdFactory.create();

      await run(
        await this.moduleRef.resolve(service, contextId, { strict: false })
      );
    } catch (error) {
      this.logger.error(`${name} failed during periodic job:`, error);
    }
  }
}
