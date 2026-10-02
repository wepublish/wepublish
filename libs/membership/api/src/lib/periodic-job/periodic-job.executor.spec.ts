import { Logger } from '@nestjs/common';
import { PeriodicJobExecutor } from './periodic-job.executor';

describe('PeriodicJobExecutor', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const setup = (claimed: boolean | undefined) => {
    const ran: string[] = [];
    const periodicJobs = {
      execute: jest.fn(async () => {
        ran.push('periodic jobs');
      }),
    };
    const mailchimpSync = {
      executeAllSync: jest.fn(async () => {
        ran.push('mailchimp sync');
      }),
    };
    const kv = { claim: jest.fn().mockResolvedValue(claimed) };
    const executor = new PeriodicJobExecutor(
      periodicJobs as any,
      { resolve: jest.fn().mockResolvedValue(mailchimpSync) } as any,
      kv as any
    );

    return { executor, ran, kv };
  };

  it('runs the periodic jobs and then the Mailchimp sync on the replica that claims the night', async () => {
    const { executor, ran } = setup(true);

    await executor.handleCron();

    expect(ran).toEqual(['periodic jobs', 'mailchimp sync']);
  });

  it('leaves the night to the replica that claimed it', async () => {
    const { executor, ran } = setup(false);

    await executor.handleCron();

    expect(ran).toEqual([]);
  });

  it('runs nothing and reports it when Dragonfly cannot tell who claimed the night', async () => {
    const failed = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { executor, ran } = setup(undefined);

    await executor.handleCron();

    expect(ran).toEqual([]);
    expect(failed).toHaveBeenCalledWith(expect.stringContaining('Dragonfly'));
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
