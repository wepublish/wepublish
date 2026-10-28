import {
  EmailQualityEventSource,
  EmailQualityEventType,
  EmailQualityLevel,
  MailChannel,
  MailLogState,
} from '@prisma/client';
import { SettingName } from '@wepublish/settings/api';
import { EmailQualityService } from './email-quality.service';

const NOW = new Date('2026-10-12T08:00:00Z');
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

type UserRow = {
  id: string;
  email: string;
  lastLogin: Date | null;
  emailVerifiedAt: Date | null;
  emailQuality: {
    email: string;
    level: EmailQualityLevel;
    since: Date;
  } | null;
};

const makeService = ({
  user = {
    id: 'user-1',
    email: 'Jane@Example.com',
    lastLogin: null,
    emailVerifiedAt: null,
    emailQuality: null,
  } as UserRow | null,
  events = [] as any[],
  mails = { _count: 0, _min: { sentDate: null as Date | null } },
  settings = {
    [SettingName.EMAIL_QUALITY_UNRESPONSIVE_AFTER_DAYS]: 180,
    [SettingName.EMAIL_QUALITY_MIN_MAILS_FOR_UNRESPONSIVE]: 1,
  } as Partial<Record<string, unknown>>,
} = {}) => {
  const prisma = {
    setting: {
      findUnique: vi.fn(async ({ where }: { where: { name: string } }) =>
        where.name in settings ?
          { name: where.name, value: settings[where.name] }
        : null
      ),
    },
    user: {
      findMany: vi.fn(async () => (user ? [user] : [])),
      findUnique: vi.fn(async () => user),
    },
    emailQualityEvent: {
      createMany: vi.fn(async () => ({ count: 1 })),
      findMany: vi.fn(async () => events),
    },
    userEmailQuality: {
      upsert: vi.fn(async ({ create }) => create),
    },
    mailLog: {
      findUnique: vi.fn(async () => ({
        recipientID: 'user-1',
        sentDate: daysAgo(1),
      })),
      aggregate: vi.fn(async () => mails),
    },
  };
  return {
    prisma,
    service: new EmailQualityService(prisma as any),
  };
};

describe('EmailQualityService', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterAll(() => vi.useRealTimers());

  describe('getConfig', () => {
    it('reads the two settings', async () => {
      const { service } = makeService({
        settings: {
          [SettingName.EMAIL_QUALITY_UNRESPONSIVE_AFTER_DAYS]: 90,
          [SettingName.EMAIL_QUALITY_MIN_MAILS_FOR_UNRESPONSIVE]: 2,
        },
      });

      await expect(service.getConfig()).resolves.toEqual({
        unresponsiveAfterDays: 90,
        minMailsForUnresponsive: 2,
      });
    });

    it('falls back to the defaults when a setting is missing', async () => {
      const { service } = makeService({ settings: {} });

      await expect(service.getConfig()).resolves.toEqual({
        unresponsiveAfterDays: 180,
        minMailsForUnresponsive: 1,
      });
    });
  });

  describe('record', () => {
    it('stores evidence for the current, lowercased address and skips duplicates', async () => {
      const { prisma, service } = makeService();

      await service.record({
        userId: 'user-1',
        type: EmailQualityEventType.hardBounce,
        source: EmailQualityEventSource.webhook,
        mailLogId: 'log-1',
        providerEventId: 'mailgun:evt-1',
      });

      expect(prisma.emailQualityEvent.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: 'user-1',
            email: 'jane@example.com',
            type: EmailQualityEventType.hardBounce,
            mailLogId: 'log-1',
            providerEventId: 'mailgun:evt-1',
          }),
        ],
        skipDuplicates: true,
      });
      expect(prisma.userEmailQuality.upsert).toHaveBeenCalled();
    });

    it('ignores evidence for users that no longer exist', async () => {
      const { prisma, service } = makeService({ user: null });

      await service.record({
        userId: 'gone',
        type: EmailQualityEventType.hardBounce,
        source: EmailQualityEventSource.webhook,
      });

      expect(prisma.emailQualityEvent.createMany).not.toHaveBeenCalled();
      expect(prisma.userEmailQuality.upsert).not.toHaveBeenCalled();
    });
  });

  describe('recompute', () => {
    it('is null for a missing user', async () => {
      const { prisma, service } = makeService({ user: null });

      await expect(service.recompute('gone')).resolves.toBeNull();
      expect(prisma.userEmailQuality.upsert).not.toHaveBeenCalled();
    });

    it('counts the mails delivered to the current address, legacy rows included, letters excluded', async () => {
      const { prisma, service } = makeService();

      await service.recompute('user-1');

      expect(prisma.mailLog.aggregate).toHaveBeenCalledWith({
        _count: true,
        _min: { sentDate: true },
        where: {
          recipientID: 'user-1',
          channel: MailChannel.mail,
          state: { in: [MailLogState.delivered, MailLogState.accepted] },
          OR: [
            { recipientEmail: 'jane@example.com' },
            { recipientEmail: null },
          ],
        },
      });
    });

    it('turns a bounce into dead', async () => {
      const { prisma, service } = makeService({
        events: [
          {
            type: EmailQualityEventType.hardBounce,
            occurredAt: daysAgo(3),
            email: 'jane@example.com',
            detail: null,
          },
        ],
      });

      await expect(service.recompute('user-1')).resolves.toMatchObject({
        userId: 'user-1',
        email: 'jane@example.com',
        level: EmailQualityLevel.dead,
        reason: 'hardBounce',
        since: daysAgo(3),
        lastEvaluatedAt: NOW,
      });
      expect(prisma.userEmailQuality.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } })
      );
    });

    it('turns unanswered mails into unresponsive using the settings', async () => {
      const { service } = makeService({
        mails: { _count: 2, _min: { sentDate: daysAgo(200) } },
      });

      await expect(service.recompute('user-1')).resolves.toMatchObject({
        level: EmailQualityLevel.unresponsive,
        reason: 'noInteraction',
      });
    });

    it('reads logins and confirmations from the user', async () => {
      const { service } = makeService({
        user: {
          id: 'user-1',
          email: 'jane@example.com',
          lastLogin: daysAgo(10),
          emailVerifiedAt: null,
          emailQuality: null,
        },
        mails: { _count: 2, _min: { sentDate: daysAgo(200) } },
      });

      await expect(service.recompute('user-1')).resolves.toMatchObject({
        level: EmailQualityLevel.active,
        reason: 'login',
      });
    });

    it('keeps the date a level was first reached while it does not change', async () => {
      const firstSeen = daysAgo(100);
      const { prisma, service } = makeService({
        user: {
          id: 'user-1',
          email: 'jane@example.com',
          lastLogin: null,
          emailVerifiedAt: null,
          emailQuality: {
            email: 'jane@example.com',
            level: EmailQualityLevel.dead,
            since: firstSeen,
          },
        },
        events: [
          {
            type: EmailQualityEventType.hardBounce,
            occurredAt: daysAgo(3),
            email: 'jane@example.com',
            detail: null,
          },
        ],
      });

      await service.recompute('user-1');

      expect(prisma.userEmailQuality.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            level: EmailQualityLevel.dead,
            since: firstSeen,
          }),
        })
      );
    });

    it('starts over after an email change', async () => {
      const { prisma, service } = makeService({
        user: {
          id: 'user-1',
          email: 'new@example.com',
          lastLogin: null,
          emailVerifiedAt: null,
          emailQuality: {
            email: 'old@example.com',
            level: EmailQualityLevel.dead,
            since: daysAgo(100),
          },
        },
      });

      await service.recompute('user-1');

      expect(prisma.emailQualityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', email: 'new@example.com' },
        })
      );
      expect(prisma.userEmailQuality.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            email: 'new@example.com',
            level: EmailQualityLevel.unknown,
          }),
        })
      );
    });
  });

  describe('recordMailSignals', () => {
    it('finds the recipient through the mail log', async () => {
      const { prisma, service } = makeService();

      await service.recordMailSignals({
        mailLogId: 'log-1',
        signals: [
          {
            type: EmailQualityEventType.hardBounce,
            email: 'jane@example.com',
            detail: 'bad_mailbox',
          },
        ],
        source: EmailQualityEventSource.webhook,
      });

      expect(prisma.emailQualityEvent.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: 'user-1',
            mailLogId: 'log-1',
            type: EmailQualityEventType.hardBounce,
            detail: 'bad_mailbox',
            source: EmailQualityEventSource.webhook,
          }),
        ],
        skipDuplicates: true,
      });
    });

    it('drops a click seconds after sending: a link scanner, not a person', async () => {
      const { prisma, service } = makeService();
      const sentDate = daysAgo(1);
      const at = (seconds: number) =>
        new Date(sentDate.getTime() + seconds * 1000);

      await service.recordMailSignals({
        mailLogId: 'log-1',
        signals: [
          { type: EmailQualityEventType.clicked, occurredAt: at(5) },
          { type: EmailQualityEventType.clicked, occurredAt: at(600) },
        ],
        source: EmailQualityEventSource.webhook,
      });

      const [{ data }] = prisma.emailQualityEvent.createMany.mock.calls[0];

      expect(data).toEqual([
        expect.objectContaining({
          type: EmailQualityEventType.clicked,
          occurredAt: at(600),
        }),
      ]);
    });

    it('records nothing when every signal was a scanner', async () => {
      const { prisma, service } = makeService();

      await service.recordMailSignals({
        mailLogId: 'log-1',
        signals: [
          {
            type: EmailQualityEventType.clicked,
            occurredAt: new Date(daysAgo(1).getTime() + 1000),
          },
        ],
        source: EmailQualityEventSource.webhook,
      });

      expect(prisma.emailQualityEvent.createMany).not.toHaveBeenCalled();
    });

    it('drops evidence for a mail whose recipient is gone', async () => {
      const { prisma, service } = makeService();
      prisma.mailLog.findUnique.mockResolvedValueOnce(null as any);

      await service.recordMailSignals({
        mailLogId: 'gone',
        signals: [{ type: EmailQualityEventType.hardBounce }],
        source: EmailQualityEventSource.webhook,
      });

      expect(prisma.emailQualityEvent.createMany).not.toHaveBeenCalled();
    });
  });

  describe('recordAddressSignals', () => {
    it('applies to every user with that address, whatever its case', async () => {
      const { prisma, service } = makeService();
      // answers both the lookup by address and the one by id inside record()
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1', email: 'jane@example.com' },
        { id: 'user-2', email: 'Jane@Example.com' },
      ] as any);

      await service.recordAddressSignals({
        email: 'JANE@example.com',
        signals: [
          {
            type: EmailQualityEventType.hardBounce,
            providerEventId: 'brevo:camp-1:hard_bounce',
          },
        ],
        source: EmailQualityEventSource.webhook,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: { equals: 'JANE@example.com', mode: 'insensitive' } },
        })
      );
      expect(prisma.emailQualityEvent.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: 'user-1',
            email: 'jane@example.com',
            providerEventId: 'brevo:camp-1:hard_bounce',
          }),
          expect.objectContaining({
            userId: 'user-2',
            email: 'jane@example.com',
            // the same provider event may only be stored once
            providerEventId: null,
          }),
        ],
        skipDuplicates: true,
      });
    });

    it('does nothing for an unknown address', async () => {
      const { prisma, service } = makeService({ user: null });

      await service.recordAddressSignals({
        email: 'nobody@example.com',
        signals: [{ type: EmailQualityEventType.hardBounce }],
        source: EmailQualityEventSource.webhook,
      });

      expect(prisma.emailQualityEvent.createMany).not.toHaveBeenCalled();
    });
  });

  describe('recomputeAll', () => {
    it('re-evaluates everyone with a level or a recent mail, page by page', async () => {
      const { prisma, service } = makeService();
      prisma.user.findMany
        .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }] as any)
        .mockResolvedValueOnce([{ id: 'c' }] as any)
        .mockResolvedValueOnce([]);

      await expect(service.recomputeAll({ pageSize: 2 })).resolves.toEqual({
        recomputed: 3,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { emailQuality: { isNot: null } },
              { mailSent: { some: { sentDate: { gte: daysAgo(180) } } } },
            ],
          },
          select: { id: true },
          orderBy: { id: 'asc' },
          take: 2,
        })
      );
      expect(prisma.user.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ cursor: { id: 'c' }, skip: 1 })
      );
      expect(prisma.userEmailQuality.upsert).toHaveBeenCalledTimes(3);
    });
  });
});
