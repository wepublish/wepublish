import { Injectable, Logger } from '@nestjs/common';
import {
  EmailQualityEventSource,
  EmailQualityEventType,
  MailChannel,
  MailLogState,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import { EmailQualityRecorder, MailQualitySignal } from '@wepublish/mail/api';
import {
  EmailQualityConfig,
  parseEmailQualityConfig,
} from './email-quality.config';
import { evaluateEmailQuality } from './evaluate-email-quality';

export type RecordEmailQualityEvent = {
  userId: string;
  type: EmailQualityEventType;
  source: EmailQualityEventSource;
  /** The address the evidence is about. Defaults to the user's current email. */
  email?: string;
  occurredAt?: Date;
  detail?: string | null;
  mailLogId?: string | null;
  providerEventId?: string | null;
};

/**
 * Security scanners follow every link of a mail within seconds of its
 * delivery. A click that early is no sign of a human reading it.
 */
export const SCANNER_CLICK_WINDOW_MS = 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class EmailQualityService implements EmailQualityRecorder {
  private logger = new Logger('EmailQualityService');

  constructor(
    private prisma: PrismaClient,
    private settings: SettingsService
  ) {}

  async getConfig(): Promise<EmailQualityConfig> {
    const [unresponsiveAfterDays, minMailsForUnresponsive] = await Promise.all([
      this.settingValue(SettingName.EMAIL_QUALITY_UNRESPONSIVE_AFTER_DAYS),
      this.settingValue(SettingName.EMAIL_QUALITY_MIN_MAILS_FOR_UNRESPONSIVE),
    ]);

    return parseEmailQualityConfig({
      unresponsiveAfterDays,
      minMailsForUnresponsive,
    });
  }

  private async settingValue(name: SettingName): Promise<unknown> {
    try {
      return (await this.settings.settingByName(name)).value;
    } catch {
      return undefined;
    }
  }

  /**
   * Stores evidence and re-evaluates the affected users. The same provider
   * event arriving twice is stored once.
   */
  async record(input: RecordEmailQualityEvent | RecordEmailQualityEvent[]) {
    const events = Array.isArray(input) ? input : [input];

    if (!events.length) {
      return;
    }

    const userIds = [...new Set(events.map(({ userId }) => userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });
    const emailByUser = new Map(users.map(({ id, email }) => [id, email]));
    const data = events
      .filter(({ userId }) => emailByUser.has(userId))
      .map(event => ({
        userId: event.userId,
        email: (event.email ?? emailByUser.get(event.userId)!).toLowerCase(),
        type: event.type,
        source: event.source,
        occurredAt: event.occurredAt ?? new Date(),
        detail: event.detail ?? null,
        mailLogId: event.mailLogId ?? null,
        providerEventId: event.providerEventId ?? null,
      }));

    if (!data.length) {
      return;
    }

    await this.prisma.emailQualityEvent.createMany({
      data,
      skipDuplicates: true,
    });

    const config = await this.getConfig();

    for (const userId of new Set(data.map(({ userId }) => userId))) {
      await this.recompute(userId, config);
    }
  }

  async recordMailSignals({
    mailLogId,
    userId,
    signals,
    source,
  }: {
    mailLogId: string;
    userId?: string;
    signals: MailQualitySignal[];
    source: EmailQualityEventSource;
  }) {
    if (!signals.length) {
      return;
    }

    const mailLog = await this.prisma.mailLog.findUnique({
      where: { id: mailLogId },
      select: { recipientID: true, sentDate: true },
    });
    const recipientId = userId ?? mailLog?.recipientID;

    if (!recipientId) {
      return;
    }

    const isScannerClick = (signal: MailQualitySignal) =>
      signal.type === EmailQualityEventType.clicked &&
      !!mailLog &&
      (signal.occurredAt ?? new Date()).getTime() - mailLog.sentDate.getTime() <
        SCANNER_CLICK_WINDOW_MS;

    await this.record(
      signals
        .filter(signal => !isScannerClick(signal))
        .map(signal => ({
          userId: recipientId,
          type: signal.type,
          source,
          email: signal.email,
          occurredAt: signal.occurredAt,
          detail: signal.detail,
          mailLogId,
          providerEventId: signal.providerEventId,
        }))
    );
  }

  async recordAddressSignals({
    email,
    signals,
    source,
  }: {
    email: string;
    signals: MailQualitySignal[];
    source: EmailQualityEventSource;
  }) {
    if (!signals.length) {
      return;
    }

    const users = await this.prisma.user.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });

    await this.record(
      users.flatMap(({ id }, index) =>
        signals.map(signal => ({
          userId: id,
          type: signal.type,
          source,
          email,
          occurredAt: signal.occurredAt,
          detail: signal.detail,
          // the provider's event id is unique; a second user with the same
          // address gets the evidence without it
          providerEventId: index === 0 ? signal.providerEventId : null,
        }))
      )
    );
  }

  async recompute(userId: string, config?: EmailQualityConfig) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        lastLogin: true,
        emailVerifiedAt: true,
        emailQuality: true,
      },
    });

    if (!user) {
      return null;
    }

    const email = user.email.toLowerCase();
    const [events, mails] = await Promise.all([
      this.prisma.emailQualityEvent.findMany({
        where: { userId, email },
        select: { type: true, occurredAt: true, email: true, detail: true },
      }),
      // Rows from before `recipientEmail` existed count for the current
      // address. Letters share this table and say nothing about the inbox.
      this.prisma.mailLog.aggregate({
        _count: true,
        _min: { sentDate: true },
        where: {
          recipientID: userId,
          channel: MailChannel.mail,
          state: { in: [MailLogState.delivered, MailLogState.accepted] },
          OR: [{ recipientEmail: email }, { recipientEmail: null }],
        },
      }),
    ]);

    const now = new Date();
    const verdict = evaluateEmailQuality({
      email,
      events,
      lastLogin: user.lastLogin,
      emailVerifiedAt: user.emailVerifiedAt,
      mails: { count: mails._count, earliestSentDate: mails._min.sentDate },
      now,
      config: config ?? (await this.getConfig()),
    });
    const unchanged =
      user.emailQuality?.email === email &&
      user.emailQuality.level === verdict.level;
    // keep the date the level was first reached while it does not change
    const since = unchanged ? user.emailQuality!.since : (verdict.since ?? now);

    const data = {
      email,
      level: verdict.level,
      reason: verdict.reason,
      since,
      lastEvaluatedAt: now,
    };

    if (!unchanged) {
      this.logger.log(
        `Email quality of user ${userId}: ${user.emailQuality?.level ?? 'none'} -> ${verdict.level} (${verdict.reason})`
      );
    }

    return this.prisma.userEmailQuality.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  /**
   * Levels age: an address becomes unresponsive by time passing, not by an
   * event. Run nightly and on demand for everyone who has a level or got a
   * mail recently enough to earn one.
   */
  async recomputeAll({ pageSize = 500 }: { pageSize?: number } = {}) {
    const config = await this.getConfig();
    const where: Prisma.UserWhereInput = {
      OR: [
        { emailQuality: { isNot: null } },
        {
          mailSent: {
            some: {
              sentDate: {
                gte: new Date(
                  Date.now() - config.unresponsiveAfterDays * DAY_MS
                ),
              },
            },
          },
        },
      ],
    };
    let cursor: string | undefined;
    let recomputed = 0;

    for (;;) {
      const page = await this.prisma.user.findMany({
        where,
        select: { id: true },
        orderBy: { id: 'asc' },
        take: pageSize,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      if (!page.length) {
        break;
      }

      for (const { id } of page) {
        await this.recompute(id, config);
        recomputed++;
      }

      cursor = page[page.length - 1].id;
    }

    this.logger.log(`Re-evaluated the email quality of ${recomputed} users`);

    return { recomputed };
  }
}
