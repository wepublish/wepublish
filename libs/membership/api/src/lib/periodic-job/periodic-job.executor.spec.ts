import { Logger } from '@nestjs/common';
import { PeriodicJobExecutor } from './periodic-job.executor';
import { MailchimpSyncService } from '../mailchimp-sync/mailchimp-sync.service';
import { MailLogSyncService } from '../mail-send/mail-log-sync.service';
import { EmailQualityService } from '../email-quality/email-quality.service';
import { DeliverySuggestionService } from '../delivery-mode/delivery-suggestion.service';

describe('PeriodicJobExecutor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setup = (
    claimed: boolean | undefined,
    dragonfly: 'reachable' | 'unreachable' | 'not-configured' = 'reachable'
  ) => {
    const ran: string[] = [];
    const periodicJobs = {
      execute: vi.fn(async () => {
        ran.push('periodic jobs');
      }),
      concurrentExecute: vi.fn(async () => {
        ran.push('periodic jobs guarded by the database');
      }),
    };
    const mailchimpSync = {
      executeAllSync: vi.fn(async () => {
        ran.push('mailchimp sync');
      }),
    };
    const mailLogSync = {
      syncOpenStates: vi.fn(async () => {
        ran.push('mail log sync');
      }),
    };
    const emailQuality = {
      recomputeAll: vi.fn(async () => {
        ran.push('email quality');
      }),
    };
    const deliverySuggestions = {
      recomputeAll: vi.fn(async () => {
        ran.push('delivery suggestions');
      }),
    };
    const services = new Map<unknown, unknown>([
      [MailchimpSyncService, mailchimpSync],
      [MailLogSyncService, mailLogSync],
      [EmailQualityService, emailQuality],
      [DeliverySuggestionService, deliverySuggestions],
    ]);
    const kv = {
      claim: vi.fn().mockResolvedValue(claimed),
      dragonflyStatus: vi.fn().mockResolvedValue(dragonfly),
    };
    const executor = new PeriodicJobExecutor(
      periodicJobs as any,
      {
        resolve: vi.fn(async (token: unknown) => services.get(token)),
      } as any,
      kv as any
    );

    return { executor, ran, kv, periodicJobs, mailLogSync };
  };

  it('runs the periodic jobs, the Mailchimp sync, the mail log sync and the email quality on the replica that claims the night', async () => {
    const { executor, ran } = setup(true);

    await executor.handleCron();

    expect(ran).toEqual([
      'periodic jobs',
      'mailchimp sync',
      'mail log sync',
      'email quality',
      'delivery suggestions',
    ]);
  });

  it('still re-evaluates the email quality when the mail log sync fails', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { executor, ran, mailLogSync } = setup(true);
    mailLogSync.syncOpenStates.mockRejectedValue(new Error('provider down'));

    await executor.handleCron();

    expect(ran).toEqual([
      'periodic jobs',
      'mailchimp sync',
      'email quality',
      'delivery suggestions',
    ]);
  });

  it('leaves the night to the replica that claimed it', async () => {
    const { executor, ran } = setup(false);

    await executor.handleCron();

    expect(ran).toEqual([]);
  });

  it('runs nothing and reports it when Dragonfly is configured but cannot tell who claimed the night', async () => {
    const failed = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { executor, ran } = setup(undefined, 'unreachable');

    await executor.handleCron();

    expect(ran).toEqual([]);
    expect(failed).toHaveBeenCalledWith(expect.stringContaining('Dragonfly'));
  });

  it('runs the night guarded by the database, as before Dragonfly, when no Dragonfly is configured', async () => {
    const failed = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { executor, ran, kv } = setup(undefined, 'not-configured');

    await executor.handleCron();

    expect(kv.dragonflyStatus).toHaveBeenCalled();
    expect(ran).toEqual([
      'periodic jobs guarded by the database',
      'mailchimp sync',
      'mail log sync',
      'email quality',
      'delivery suggestions',
    ]);
    expect(failed).not.toHaveBeenCalled();
  });

  it('still runs the rest of the night when the database guarded run fails', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { executor, ran, periodicJobs } = setup(undefined, 'not-configured');
    periodicJobs.concurrentExecute.mockRejectedValue(
      new Error('database down')
    );

    await executor.handleCron();

    expect(ran).toEqual([
      'mailchimp sync',
      'mail log sync',
      'email quality',
      'delivery suggestions',
    ]);
  });

  it('does not ask Dragonfly for its status when the night was claimed', async () => {
    const { executor, kv } = setup(true);

    await executor.handleCron();

    expect(kv.dragonflyStatus).not.toHaveBeenCalled();
  });

  it('claims the night for longer than a run takes, but frees it before the next night', async () => {
    const { executor, kv } = setup(true);

    await executor.handleCron();

    const [[name, ttlMs]] = kv.claim.mock.calls;
    expect(name).toBe('nightly-job');
    expect(ttlMs).toBeGreaterThanOrEqual(2 * 60 * 60 * 1000);
    expect(ttlMs).toBeLessThan(24 * 60 * 60 * 1000);
  });

  it('keeps trying to claim the night for a while, so a short Dragonfly blip does not skip it', async () => {
    const { executor, kv } = setup(true);

    await executor.handleCron();

    const [[, , options]] = kv.claim.mock.calls;
    expect(options.retryForMs).toBeGreaterThanOrEqual(30_000);
  });
});
