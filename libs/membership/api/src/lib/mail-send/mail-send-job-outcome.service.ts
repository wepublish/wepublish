import { Injectable } from '@nestjs/common';
import {
  EmailQualityEventType,
  EmailQualityLevel,
  MailLogState,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { MailSendJobOutcome } from './mail-send.model';

const BOUNCED_STATES: MailLogState[] = [
  MailLogState.bounced,
  MailLogState.rejected,
];

/**
 * What became of a campaign after it was sent: the provider's delivery
 * states, the clicks it reported, and how many of the people written to count
 * as dead by now. This is what the media look at before the next pass.
 */
@Injectable()
export class MailSendJobOutcomeService {
  constructor(private prisma: PrismaClient) {}

  async outcomeOf(jobId: string): Promise<MailSendJobOutcome> {
    const [states, dead, [clicks]] = await Promise.all([
      this.prisma.mailLog.groupBy({
        by: ['state'],
        where: { mailSendJobId: jobId },
        _count: true,
      }),
      this.prisma.mailSendJobRecipient.count({
        where: {
          jobId,
          user: { emailQuality: { is: { level: EmailQualityLevel.dead } } },
        },
      }),
      // Events know their mail log only by id, so this is the one join the
      // Prisma schema cannot express.
      this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
        SELECT count(DISTINCT e."mailLogId")::int AS count
        FROM email_quality_events e
        JOIN "mail.log" l ON l.id = e."mailLogId"
        WHERE l."mailSendJobId" = ${jobId}
          AND e.type = ${EmailQualityEventType.clicked}::"EmailQualityEventType"
      `),
    ]);

    const countOf = (included: MailLogState[]) =>
      states
        .filter(({ state }) => included.includes(state))
        .reduce((sum, { _count }) => sum + (_count as number), 0);

    return {
      delivered: countOf([MailLogState.delivered]),
      bounced: countOf(BOUNCED_STATES),
      dead,
      clicked: clicks?.count ?? 0,
    };
  }
}
