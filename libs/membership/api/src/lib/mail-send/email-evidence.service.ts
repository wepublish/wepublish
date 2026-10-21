import { Injectable } from '@nestjs/common';
import {
  EmailQualityEventSource,
  MailProviderType,
  PrismaClient,
} from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import { subDays } from 'date-fns';
import { EmailEvidenceModel, EmailEvidenceSourceModel } from './mail-send.model';

/** Days without provider evidence after which the editor warns. */
export const DEFAULT_EVIDENCE_WARN_AFTER_DAYS = 14;

const RECENT_DAYS = 30;

/** Mail providers that report delivery outcomes, by webhook or on request. */
const REPORTING_PROVIDERS = new Set<MailProviderType>([
  MailProviderType.MAILCHIMP,
  MailProviderType.MAILGUN,
]);

/** Everything but a verification is the word of a provider. */
const PROVIDER_SOURCES: EmailQualityEventSource[] = [
  EmailQualityEventSource.send,
  EmailQualityEventSource.webhook,
  EmailQualityEventSource.poll,
];

const SOURCES: EmailQualityEventSource[] = [
  ...PROVIDER_SOURCES,
  EmailQualityEventSource.verification,
];

/**
 * Where the email status comes from, for the admin who wonders whether it
 * rests on anything the providers said or on logins alone.
 */
@Injectable()
export class EmailEvidenceService {
  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext,
    private settings: SettingsService
  ) {}

  async summary(): Promise<EmailEvidenceModel> {
    const providerId = this.mailContext.mailProvider?.id;
    const now = new Date();
    const [provider, recent, latest, warnAfterDays] = await Promise.all([
      providerId ?
        this.prisma.settingMailProvider.findUnique({
          where: { id: providerId },
          select: {
            type: true,
            name: true,
            lastWebhookAt: true,
            lastPollAt: true,
            lastPollError: true,
          },
        })
      : null,
      this.prisma.emailQualityEvent.groupBy({
        by: ['source'],
        where: { createdAt: { gte: subDays(now, RECENT_DAYS) } },
        _count: { _all: true },
      }),
      this.prisma.emailQualityEvent.groupBy({
        by: ['source'],
        _max: { createdAt: true },
      }),
      this.warnAfterDays(),
    ]);

    const countOf = new Map(
      recent.map(row => [row.source, row._count._all as number])
    );
    const lastOf = new Map(
      latest.map(row => [row.source, row._max.createdAt ?? null])
    );
    const sources: EmailEvidenceSourceModel[] = SOURCES.map(source => ({
      source,
      count: countOf.get(source) ?? 0,
      lastAt: lastOf.get(source) ?? null,
    }));
    const lastProviderEvidenceAt = PROVIDER_SOURCES.map(
      source => lastOf.get(source) ?? null
    ).reduce<Date | null>(
      (newest, at) => (at && (!newest || at > newest) ? at : newest),
      null
    );

    return {
      providerType: provider?.type ?? null,
      providerName: provider?.name ?? null,
      providerReportsDelivery:
        !!provider && REPORTING_PROVIDERS.has(provider.type),
      lastWebhookAt: provider?.lastWebhookAt ?? null,
      lastPollAt: provider?.lastPollAt ?? null,
      lastPollError: provider?.lastPollError ?? null,
      lastProviderEvidenceAt,
      warnAfterDays,
      sources,
    };
  }

  private async warnAfterDays(): Promise<number> {
    try {
      const { value } = await this.settings.settingByName(
        SettingName.EMAIL_QUALITY_EVIDENCE_WARN_AFTER_DAYS
      );
      const days = Number(value);

      return Number.isInteger(days) && days > 0 ?
          days
        : DEFAULT_EVIDENCE_WARN_AFTER_DAYS;
    } catch {
      return DEFAULT_EVIDENCE_WARN_AFTER_DAYS;
    }
  }
}
