import { Injectable, Logger } from '@nestjs/common';
import {
  EmailQualityEventSource,
  EmailQualityEventType,
  PrismaClient,
} from '@prisma/client';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import {
  DEFAULT_EMAIL_QUALITY_CONFIG,
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
  createdById?: string | null;
};

@Injectable()
export class EmailQualityService {
  private logger = new Logger('EmailQualityService');

  constructor(
    private prisma: PrismaClient,
    private settings: SettingsService
  ) {}

  async getConfig(): Promise<EmailQualityConfig> {
    try {
      const setting = await this.settings.settingByName(
        SettingName.EMAIL_QUALITY
      );

      return parseEmailQualityConfig(setting.value);
    } catch {
      return DEFAULT_EMAIL_QUALITY_CONFIG;
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

    await this.prisma.emailQualityEvent.createMany({
      data: events
        .filter(({ userId }) => emailByUser.has(userId))
        .map(event => ({
          userId: event.userId,
          email: (event.email ?? emailByUser.get(event.userId)!).toLowerCase(),
          type: event.type,
          source: event.source,
          occurredAt: event.occurredAt ?? new Date(),
          detail: event.detail ?? null,
          mailLogId: event.mailLogId ?? null,
          createdById: event.createdById ?? null,
        })),
      skipDuplicates: true,
    });

    for (const userId of emailByUser.keys()) {
      await this.recompute(userId);
    }
  }

  async recompute(userId: string, config?: EmailQualityConfig) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailQuality: true },
    });

    if (!user) {
      return null;
    }

    const email = user.email.toLowerCase();
    const { placeholderPatterns } = config ?? (await this.getConfig());
    const events = await this.prisma.emailQualityEvent.findMany({
      where: { userId, email },
      select: { type: true, occurredAt: true, email: true, detail: true },
    });

    const verdict = evaluateEmailQuality(events, {
      email,
      placeholderPatterns,
    });
    const now = new Date();
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
      manualLevel: verdict.manualLevel,
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
}
