import { Logger } from '@nestjs/common';
import { SellableReconciliationService } from '@wepublish/payment/api';
import { PeriodicJobExecutor } from './periodic-job.executor';

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
    const sellableReconciliation = {
      reconcile: vi.fn(async () => {
        ran.push('sellable reconciliation');

        return { polled: 1, canceled: 2, resynced: 3, failed: 0 };
      }),
    };
    const kv = {
      claim: vi.fn().mockResolvedValue(claimed),
      dragonflyStatus: vi.fn().mockResolvedValue(dragonfly),
    };
    const moduleRef = {
      resolve: vi.fn(async (token: unknown) =>
        token === SellableReconciliationService ?
          sellableReconciliation
        : mailchimpSync
      ),
    };
    const executor = new PeriodicJobExecutor(
      periodicJobs as any,
      moduleRef as any,
      kv as any
    );

    return {
      executor,
      ran,
      kv,
      periodicJobs,
      mailchimpSync,
      sellableReconciliation,
      moduleRef,
    };
  };

  it('runs the periodic jobs, the Mailchimp sync and then the sellable reconciliation on the replica that claims the night', async () => {
    const { executor, ran } = setup(true);

    await executor.handleCron();

    expect(ran).toEqual([
      'periodic jobs',
      'mailchimp sync',
      'sellable reconciliation',
    ]);
  });

  it('resolves the sellable reconciliation non-strictly', async () => {
    const { executor, moduleRef } = setup(true);

    await executor.handleCron();

    expect(moduleRef.resolve).toHaveBeenCalledWith(
      SellableReconciliationService,
      expect.anything(),
      { strict: false }
    );
  });

  it('logs the sellable reconciliation result', async () => {
    const logged = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const { executor } = setup(true);

    await executor.handleCron();

    expect(logged).toHaveBeenCalledWith(
      expect.stringContaining('Sellable reconciliation')
    );
  });

  it('logs a failing sellable reconciliation without affecting the other jobs', async () => {
    const failed = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { executor, ran, sellableReconciliation } = setup(true);
    const error = new Error('reconcile down');
    sellableReconciliation.reconcile.mockRejectedValue(error);

    await expect(executor.handleCron()).resolves.toBeUndefined();

    expect(ran).toEqual(['periodic jobs', 'mailchimp sync']);
    expect(failed).toHaveBeenCalledWith(
      'Sellable reconciliation failed during periodic job:',
      error
    );
  });

  it('still runs the sellable reconciliation when the periodic jobs and the Mailchimp sync fail', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { executor, ran, periodicJobs, mailchimpSync } = setup(true);
    periodicJobs.execute.mockRejectedValue(new Error('jobs down'));
    mailchimpSync.executeAllSync.mockRejectedValue(new Error('mailchimp down'));

    await executor.handleCron();

    expect(ran).toEqual(['sellable reconciliation']);
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
      'sellable reconciliation',
    ]);
    expect(failed).not.toHaveBeenCalled();
  });

  it('still runs the Mailchimp sync when the database guarded run fails', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { executor, ran, periodicJobs } = setup(undefined, 'not-configured');
    periodicJobs.concurrentExecute.mockRejectedValue(
      new Error('database down')
    );

    await executor.handleCron();

    expect(ran).toEqual(['mailchimp sync', 'sellable reconciliation']);
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
