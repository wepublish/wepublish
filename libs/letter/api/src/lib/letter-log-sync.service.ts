import { Injectable, Logger } from '@nestjs/common';
import { MailChannel, MailLogState, PrismaClient } from '@prisma/client';
import { LetterContext, toProviderState } from './letter-context';

/** Letters the provider has not handed to the post yet. */
const PENDING_STATES: MailLogState[] = [
  MailLogState.submitted,
  MailLogState.accepted,
];

/**
 * How long a dispatched letter is still asked about. Most never change again,
 * but returned post takes weeks to be reported as undeliverable.
 */
const DISPATCHED_RECHECK_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** How many letters a single sync call looks at. */
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 2000;

/**
 * `rejected` shares a rank with `accepted`: the provider reports a problem
 * with a letter as an issue, and once it is resolved there the letter is
 * printed after all.
 */
const LETTER_LOG_STATE_RANK: Partial<Record<MailLogState, number>> = {
  [MailLogState.submitted]: 0,
  [MailLogState.accepted]: 1,
  [MailLogState.rejected]: 1,
  [MailLogState.dispatched]: 2,
  [MailLogState.delivered]: 3,
  [MailLogState.undeliverable]: 3,
  [MailLogState.canceled]: 3,
};

/**
 * Provider events arrive out of order and get retried, and the poll and the
 * webhook report on the same letter: a late `sent` must not turn a returned
 * letter back into a dispatched one. A state only moves forward.
 */
export const shouldUpdateLetterLogState = (
  current: MailLogState,
  next: MailLogState
) =>
  (LETTER_LOG_STATE_RANK[next] ?? 0) >= (LETTER_LOG_STATE_RANK[current] ?? 0);

export interface LetterLogSyncResult {
  /** Letters the provider was asked about. */
  checked: number;
  /** Letters whose state actually changed. */
  updated: number;
  /** No letter provider is set up, so there was nobody to ask. */
  skipped?: true;
}

/**
 * Pulls delivery states from the letter provider for letters that can still
 * change. The counterpart of the mail log sync: the provider webhook is the
 * primary mechanism, this is the fallback for when it cannot deliver.
 */
@Injectable()
export class LetterLogSyncService {
  private logger = new Logger('LetterLogSyncService');

  constructor(
    private prisma: PrismaClient,
    private letterContext: LetterContext
  ) {}

  async syncOpenStates(limit = DEFAULT_LIMIT): Promise<LetterLogSyncResult> {
    const provider = this.letterContext.letterProvider;

    if (!provider || !(await provider.isConfigured())) {
      return { checked: 0, updated: 0, skipped: true };
    }

    const take = Math.min(limit, MAX_LIMIT);
    // Letter ids belong to the provider that printed the letter; after
    // switching providers the old ones cannot be looked up with the new one.
    const ofProvider = {
      channel: MailChannel.letter,
      providerLetterID: { not: null },
      mailProviderID: provider.id,
    };
    const select = { id: true, state: true, providerLetterID: true };

    const logs = await this.prisma.mailLog.findMany({
      where: { ...ofProvider, state: { in: PENDING_STATES } },
      select,
      orderBy: { sentDate: 'desc' },
      take,
    });

    if (logs.length < take) {
      logs.push(
        ...(await this.prisma.mailLog.findMany({
          where: {
            ...ofProvider,
            state: MailLogState.dispatched,
            sentDate: {
              gte: new Date(Date.now() - DISPATCHED_RECHECK_DAYS * DAY_MS),
            },
          },
          select,
          // Oldest first, so a letter gets its turn before its time is up.
          orderBy: { sentDate: 'asc' },
          take: take - logs.length,
        }))
      );
    }

    if (!logs.length) {
      return { checked: 0, updated: 0 };
    }

    const states = await provider.getMessageStates(
      logs.map(log => log.providerLetterID as string)
    );
    const byLetterID = new Map(
      states.map(state => [state.providerLetterID, state])
    );

    let updated = 0;
    for (const log of logs) {
      const remote = byLetterID.get(log.providerLetterID as string);

      if (!remote) {
        continue;
      }

      const state = toProviderState(remote.state);

      // Unchanged, or older than what a webhook already reported.
      if (
        state === log.state ||
        !shouldUpdateLetterLogState(log.state, state)
      ) {
        continue;
      }

      await this.prisma.mailLog.update({
        where: { id: log.id },
        data: { state, mailData: remote.letterData },
      });
      updated++;
    }

    this.logger.log(
      `Synced ${logs.length} open letter log(s) with ${await provider.getName()}, ${updated} updated`
    );

    return { checked: logs.length, updated };
  }
}
