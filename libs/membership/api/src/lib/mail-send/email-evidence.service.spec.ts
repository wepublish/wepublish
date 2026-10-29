import {
  EmailQualityEventSource,
  MailProviderType,
  PrismaClient,
} from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import { EmailEvidenceService } from './email-evidence.service';

const NOW = new Date('2026-10-21T08:00:00Z');
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

const makeService = ({
  provider = {
    id: 'mailchimp',
    type: MailProviderType.MAILCHIMP,
    name: 'Mandrill',
    lastWebhookAt: daysAgo(1),
    lastPollAt: daysAgo(0.5),
    lastPollError: null as string | null,
  } as {
    id: string;
    type: MailProviderType;
    name: string | null;
    lastWebhookAt: Date | null;
    lastPollAt: Date | null;
    lastPollError: string | null;
  } | null,
  recent = [] as {
    source: EmailQualityEventSource;
    _count: { _all: number };
  }[],
  latest = [] as {
    source: EmailQualityEventSource;
    _max: { createdAt: Date | null };
  }[],
  warnAfterDays = undefined as number | undefined,
} = {}) => {
  const groupBy = vi.fn(async (args: { _count?: unknown; _max?: unknown }) =>
    args._count ? recent : latest
  );
  const prisma = {
    settingMailProvider: { findUnique: vi.fn(async () => provider) },
    emailQualityEvent: { groupBy },
  };
  const mailContext = {
    mailProvider: provider ? { id: provider.id } : undefined,
  };
  const settings = {
    settingByName: vi.fn(async (name: string) => {
      if (
        name === SettingName.EMAIL_QUALITY_EVIDENCE_WARN_AFTER_DAYS &&
        warnAfterDays !== undefined
      ) {
        return { name, value: warnAfterDays };
      }

      throw new Error(`Setting with name ${name} not found`);
    }),
  };

  return {
    prisma,
    service: new EmailEvidenceService(
      prisma as unknown as PrismaClient,
      mailContext as unknown as MailContext,
      settings as unknown as SettingsService
    ),
  };
};

describe('EmailEvidenceService', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterAll(() => vi.useRealTimers());

  it('describes the provider and when it last reached us', async () => {
    const { service } = makeService();

    await expect(service.summary()).resolves.toMatchObject({
      providerType: MailProviderType.MAILCHIMP,
      providerName: 'Mandrill',
      providerReportsDelivery: true,
      lastWebhookAt: daysAgo(1),
      lastPollAt: daysAgo(0.5),
      lastPollError: null,
      warnAfterDays: 14,
    });
  });

  it('counts the evidence of the last 30 days per source and keeps the newest of each', async () => {
    const { service, prisma } = makeService({
      recent: [
        { source: EmailQualityEventSource.webhook, _count: { _all: 12 } },
        { source: EmailQualityEventSource.poll, _count: { _all: 3 } },
      ],
      latest: [
        {
          source: EmailQualityEventSource.webhook,
          _max: { createdAt: daysAgo(2) },
        },
        {
          source: EmailQualityEventSource.poll,
          _max: { createdAt: daysAgo(40) },
        },
        {
          source: EmailQualityEventSource.send,
          _max: { createdAt: daysAgo(90) },
        },
      ],
    });

    const summary = await service.summary();

    expect(summary.sources).toEqual([
      { source: EmailQualityEventSource.send, count: 0, lastAt: daysAgo(90) },
      {
        source: EmailQualityEventSource.webhook,
        count: 12,
        lastAt: daysAgo(2),
      },
      { source: EmailQualityEventSource.poll, count: 3, lastAt: daysAgo(40) },
      { source: EmailQualityEventSource.verification, count: 0, lastAt: null },
    ]);
    expect(summary.lastProviderEvidenceAt).toEqual(daysAgo(2));
    expect(prisma.emailQualityEvent.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdAt: { gte: daysAgo(30) } },
      })
    );
  });

  it('knows that SMTP never reports anything', async () => {
    const { service } = makeService({
      provider: {
        id: 'smtp',
        type: MailProviderType.SMTP,
        name: 'SMTP',
        lastWebhookAt: null,
        lastPollAt: null,
        lastPollError: null,
      },
    });

    await expect(service.summary()).resolves.toMatchObject({
      providerType: MailProviderType.SMTP,
      providerReportsDelivery: false,
      lastProviderEvidenceAt: null,
    });
  });

  it('copes without a mail provider', async () => {
    const { service } = makeService({ provider: null });

    await expect(service.summary()).resolves.toMatchObject({
      providerType: null,
      providerName: null,
      providerReportsDelivery: false,
    });
  });

  it('reads the warning threshold from the settings', async () => {
    const { service } = makeService({ warnAfterDays: 30 });

    await expect(service.summary()).resolves.toMatchObject({
      warnAfterDays: 30,
    });
  });
});
