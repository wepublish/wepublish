import { EmailQualityLevel, MailLogState } from '@prisma/client';
import { MailSendJobOutcomeService } from './mail-send-job-outcome.service';

describe('MailSendJobOutcomeService', () => {
  const makeService = ({
    states = [] as { state: MailLogState; _count: number }[],
    dead = 0,
    clicked = 0,
  } = {}) => {
    const prisma = {
      mailLog: { groupBy: vi.fn(async () => states) },
      mailSendJobRecipient: { count: vi.fn(async () => dead) },
      $queryRaw: vi.fn(async () => [{ count: clicked }]),
    };

    return { prisma, service: new MailSendJobOutcomeService(prisma as any) };
  };

  it('sums up what became of the mails of a job', async () => {
    const { prisma, service } = makeService({
      states: [
        { state: MailLogState.delivered, _count: 8 },
        { state: MailLogState.accepted, _count: 3 },
        { state: MailLogState.bounced, _count: 2 },
        { state: MailLogState.rejected, _count: 1 },
      ],
      dead: 2,
      clicked: 4,
    });

    await expect(service.outcomeOf('job-1')).resolves.toEqual({
      delivered: 8,
      bounced: 3,
      dead: 2,
      clicked: 4,
    });

    expect(prisma.mailLog.groupBy).toHaveBeenCalledWith({
      by: ['state'],
      where: { mailSendJobId: 'job-1' },
      _count: true,
    });
    expect(prisma.mailSendJobRecipient.count).toHaveBeenCalledWith({
      where: {
        jobId: 'job-1',
        user: { emailQuality: { is: { level: EmailQualityLevel.dead } } },
      },
    });
  });

  it('is all zeros for a job that sent nothing yet', async () => {
    const { prisma, service } = makeService();
    prisma.$queryRaw.mockResolvedValueOnce([]);

    await expect(service.outcomeOf('job-2')).resolves.toEqual({
      delivered: 0,
      bounced: 0,
      dead: 0,
      clicked: 0,
    });
  });
});
