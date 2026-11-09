import { MailSendJobResolver } from './mail-send-job.resolver';

describe('MailSendJobResolver', () => {
  it('resolves the outcome of a job through the outcome service', async () => {
    const outcome = { delivered: 1, bounced: 0, dead: 0, clicked: 1 };
    const outcomeService = { outcomeOf: vi.fn(async () => outcome) };

    await expect(
      new MailSendJobResolver(outcomeService as any).outcome({
        id: 'job-1',
      } as any)
    ).resolves.toBe(outcome);

    expect(outcomeService.outcomeOf).toHaveBeenCalledWith('job-1');
  });
});
