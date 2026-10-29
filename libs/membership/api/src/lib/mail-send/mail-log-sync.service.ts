import { Injectable, Logger } from '@nestjs/common';
import {
  EmailQualityEventSource,
  MailLogState,
  PrismaClient,
} from '@prisma/client';
import {
  MailContext,
  recordEmailQualitySafely,
  shouldUpdateMailLogState,
} from '@wepublish/mail/api';

/**
 * States that can still change. Everything else is an end state the provider
 * will not revise, so those rows are never polled again.
 */
const OPEN_STATES: MailLogState[] = [
  MailLogState.submitted,
  MailLogState.accepted,
  MailLogState.deferred,
];

/** How many mails a single sync call looks at, newest first. */
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export interface MailLogSyncResult {
  /** Mails that had a provider message id and were asked about. */
  checked: number;
  /** Mails whose state actually changed. */
  updated: number;
}

/**
 * Pulls delivery states from the mail provider for mails still in an open
 * state.
 *
 * The provider webhook is the primary mechanism and needs no polling. This is
 * the fallback for when it cannot deliver: local development (the provider
 * cannot reach localhost), an installation with no webhook configured, or
 * events that were missed while the API was down.
 */
@Injectable()
export class MailLogSyncService {
  private logger = new Logger('MailLogSyncService');

  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext
  ) {}

  async syncOpenStates(limit = DEFAULT_LIMIT): Promise<MailLogSyncResult> {
    const provider = this.mailContext.mailProvider;

    if (!provider) {
      return { checked: 0, updated: 0 };
    }

    // Only mails the provider gave us a handle for can be looked up. SMTP and
    // Slack never return one, so their logs are simply left alone.
    // Message ids belong to the provider that sent the mail; after switching
    // providers the old ones cannot be looked up with the new one.
    const logs = await this.prisma.mailLog.findMany({
      where: {
        state: { in: OPEN_STATES },
        mailProviderMessageID: { not: null },
        mailProviderID: provider.id,
      },
      select: {
        id: true,
        state: true,
        mailProviderMessageID: true,
        recipientID: true,
      },
      orderBy: { sentDate: 'desc' },
      take: Math.min(limit, MAX_LIMIT),
    });

    if (!logs.length) {
      return { checked: 0, updated: 0 };
    }

    const states = await provider.getMessageStates(
      logs.map(log => log.mailProviderMessageID as string)
    );
    const byMessageID = new Map(
      states.map(state => [state.providerMessageID, state])
    );

    let updated = 0;
    for (const log of logs) {
      const remote = byMessageID.get(log.mailProviderMessageID as string);

      // Absent (provider no longer knows the id), unchanged or older than
      // what a webhook already reported — nothing to do.
      if (
        !remote ||
        remote.state === log.state ||
        !shouldUpdateMailLogState(log.state, remote.state)
      ) {
        continue;
      }

      await this.prisma.mailLog.update({
        where: { id: log.id },
        data: { state: remote.state, mailData: remote.mailData },
      });
      updated++;

      if (remote.qualitySignals?.length) {
        await recordEmailQualitySafely(
          this.mailContext.emailQualityRecorder,
          recorder =>
            recorder.recordMailSignals({
              mailLogId: log.id,
              userId: log.recipientID,
              signals: remote.qualitySignals!,
              source: EmailQualityEventSource.poll,
            })
        );
      }
    }

    this.logger.log(
      `Synced ${logs.length} open mail log(s) with ${await provider.getName()}, ${updated} updated`
    );

    return { checked: logs.length, updated };
  }
}
