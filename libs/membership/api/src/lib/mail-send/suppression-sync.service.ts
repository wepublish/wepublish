import { Injectable, Logger } from '@nestjs/common';
import { EmailQualityEventSource, PrismaClient } from '@prisma/client';
import { MailContext, MailQualitySignal } from '@wepublish/mail/api';

const CHUNK = 1000;

export interface SuppressionSyncResult {
  /** Entries the provider listed. */
  listed: number;
  /** Addresses recorded tonight; the rest were known already. */
  recorded: number;
}

/**
 * Pulls the provider's suppression lists, the addresses it refuses for any
 * mail sent through the account, and records them as evidence about those
 * addresses. This is how a bounce on a mail sent from the provider's own
 * dashboard, or from another system on the same account, reaches the email
 * quality. Runs nightly after the mail log sync and on the refresh button.
 */
@Injectable()
export class SuppressionSyncService {
  private logger = new Logger('SuppressionSyncService');

  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext
  ) {}

  async syncSuppressions(): Promise<SuppressionSyncResult> {
    const provider = this.mailContext.mailProvider;

    if (!provider) {
      return { listed: 0, recorded: 0 };
    }

    try {
      const result = await this.sync(provider);
      await this.notePoll(provider.id, null);

      return result;
    } catch (error) {
      await this.notePoll(provider.id, (error as Error).message);
      throw error;
    }
  }

  private async sync(
    provider: NonNullable<MailContext['mailProvider']>
  ): Promise<SuppressionSyncResult> {
    const signals = await provider.listSuppressions();
    const known = await this.knownEventIds(
      signals.flatMap(signal => signal.providerEventId ?? [])
    );
    const byAddress = new Map<string, MailQualitySignal[]>();

    for (const signal of signals) {
      if (
        !signal.email ||
        (signal.providerEventId && known.has(signal.providerEventId))
      ) {
        continue;
      }

      const email = signal.email.trim().toLowerCase();
      byAddress.set(email, [...(byAddress.get(email) ?? []), signal]);
    }

    let recorded = 0;
    for (const [email, addressSignals] of byAddress) {
      try {
        await this.mailContext.emailQualityRecorder?.recordAddressSignals({
          email,
          signals: addressSignals,
          source: EmailQualityEventSource.poll,
        });
        recorded++;
      } catch (error) {
        this.logger.error(
          `Could not record the suppression of ${email}: ${
            (error as Error).message
          }`
        );
      }
    }

    this.logger.log(
      `Suppression lists of ${await provider.getName()}: ${signals.length} entries, ${recorded} address(es) recorded`
    );

    return { listed: signals.length, recorded };
  }

  /**
   * Recording an event twice is harmless but re-evaluates the person each
   * time, and a denylist is read whole every night.
   */
  private async knownEventIds(ids: string[]): Promise<Set<string>> {
    const known = new Set<string>();

    for (let i = 0; i < ids.length; i += CHUNK) {
      const rows = await this.prisma.emailQualityEvent.findMany({
        where: { providerEventId: { in: ids.slice(i, i + CHUNK) } },
        select: { providerEventId: true },
      });

      for (const row of rows) {
        if (row.providerEventId) {
          known.add(row.providerEventId);
        }
      }
    }

    return known;
  }

  /** Same note as the mail log poll: when the provider was last asked, and what went wrong. */
  private async notePoll(providerId: string, error: string | null) {
    try {
      await this.prisma.settingMailProvider.update({
        where: { id: providerId },
        data: { lastPollAt: new Date(), lastPollError: error },
      });
    } catch (noteError) {
      this.logger.warn(
        `Could not note the poll on mailProvider ${providerId}: ${
          (noteError as Error).message
        }`
      );
    }
  }
}
