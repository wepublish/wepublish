import { Cron } from '@nestjs/schedule';
import { Injectable, Logger, Type } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { DistributedClaims } from '@wepublish/dragonfly/api';
import {
  NIGHT_CLAIM_MS,
  NightStepRecord,
  PeriodicJobService,
} from './periodic-job.service';
import { MailchimpSyncService } from '../mailchimp-sync/mailchimp-sync.service';
import { MailLogSyncService } from '../mail-send/mail-log-sync.service';
import { SuppressionSyncService } from '../mail-send/suppression-sync.service';
import { EmailQualityService } from '../email-quality/email-quality.service';
import { DeliverySuggestionService } from '../delivery-mode/delivery-suggestion.service';
import {
  BexioContactSyncResult,
  BexioContactSyncService,
} from '@wepublish/payment/api';
import { describeError } from '@wepublish/utils/api';
import type { MailchimpSyncRunResult } from '../mailchimp-sync/mailchimp-sync.service';

const SCHEDULE =
  process.env['PERIODIC_JOB_EXECUTION_SCHEDULE'] || '0 0 3 * * *';

const CLAIM_RETRY_FOR_MS = 60_000;

// The sync service caps a call at 500; one call a night is plenty for the
// handful of mails whose webhook never arrived.
const NIGHTLY_MAIL_LOG_SYNC_LIMIT = 500;

type StepReport = Pick<NightStepRecord, 'status' | 'counts' | 'error'>;

/** The numbers a step answers with, e.g. `{checked: 12, updated: 3}`. */
const countsOf = (result: unknown): StepReport['counts'] => {
  if (!result || typeof result !== 'object') {
    return undefined;
  }

  const counts = Object.fromEntries(
    Object.entries(result).filter(([, value]) => typeof value === 'number')
  );

  return Object.keys(counts).length ? counts : undefined;
};

/** A step that answers `{skipped: true}` has nothing to do for this medium. */
const reportCounts = (result: unknown): StepReport =>
  (result as { skipped?: unknown } | undefined)?.skipped === true ?
    { status: 'skipped' }
  : { status: 'ok', counts: countsOf(result) };

/**
 * Some readers refused is a warning; bexio stopping the push, or refusing
 * every reader, is an error.
 */
const reportBexio = (results: BexioContactSyncResult[] | undefined) => {
  if (!results?.length) {
    return { status: 'skipped' } satisfies StepReport;
  }

  const sum = (field: 'readers' | 'pushed' | 'failed') =>
    results.reduce((total, result) => total + result[field], 0);
  const failedOut = results.some(
    result =>
      result.stopped === 'key-rejected' ||
      (result.readers > 0 && result.failed === result.readers)
  );
  const failed = sum('failed');

  return {
    status:
      failedOut ? 'error'
      : failed || results.some(result => result.stopped) ? 'warning'
      : 'ok',
    counts: { readers: sum('readers'), pushed: sum('pushed'), failed },
    error: results.find(result => result.firstError)?.firstError,
  } satisfies StepReport;
};

const reportMailchimp = (
  result: MailchimpSyncRunResult | undefined
): StepReport => {
  if (!result || result.synced + result.failed === 0) {
    return { status: 'skipped' };
  }

  return {
    status:
      !result.failed ? 'ok'
      : result.synced ? 'warning'
      : 'error',
    counts: { synced: result.synced, failed: result.failed },
    error: result.firstError,
  };
};

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
      name: 'periodicJob',
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

    // Reader data changed today reaches bexio tonight, for media that want it.
    await this.runStep(
      'bexioContactSync',
      BexioContactSyncService,
      service => service.syncAll(),
      reportBexio
    );
    await this.runStep(
      'mailchimpSync',
      MailchimpSyncService,
      service => service.executeAllSync(),
      reportMailchimp
    );
    // Delivery states a provider never reported by webhook, then the levels
    // that change with time alone (unresponsive). Order matters: a polled
    // bounce should count tonight, not tomorrow.
    await this.runStep('mailLogSync', MailLogSyncService, service =>
      service.syncOpenStates(NIGHTLY_MAIL_LOG_SYNC_LIMIT)
    );
    // The addresses the provider refuses for any mail, ours or not.
    await this.runStep('suppressionSync', SuppressionSyncService, service =>
      service.syncSuppressions()
    );
    await this.runStep('emailQuality', EmailQualityService, service =>
      service.recomputeAll()
    );
    // Built from tonight's levels, so it comes after them.
    await this.runStep(
      'deliverySuggestions',
      DeliverySuggestionService,
      service => service.recomputeAll()
    );
  }

  /**
   * Each step of the night fails on its own; the next one still runs. What it
   * did goes on the job log.
   */
  private async runStep<T, R>(
    key: string,
    service: Type<T>,
    run: (service: T) => Promise<R>,
    report: (result: R) => StepReport = reportCounts
  ) {
    const startedAt = new Date();
    let outcome: StepReport;

    try {
      const contextId = ContextIdFactory.create();

      outcome = report(
        await run(
          await this.moduleRef.resolve(service, contextId, { strict: false })
        )
      );
    } catch (error) {
      this.logger.error(`${key} failed during periodic job:`, error);
      outcome = { status: 'error', error: describeError(error) };
    }

    try {
      await this.periodicJobController.recordNightStep({
        key,
        ...outcome,
        startedAt,
        finishedAt: new Date(),
      });
    } catch (error) {
      this.logger.error(`Could not note ${key} on the job log:`, error);
    }
  }
}
