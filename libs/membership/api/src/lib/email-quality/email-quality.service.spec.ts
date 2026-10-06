import {
  EmailQualityEventSource,
  EmailQualityEventType,
  EmailQualityLevel,
} from '@prisma/client';
import { EmailQualityService } from './email-quality.service';

const makeService = ({
  email = 'Jane@Example.com',
  snapshot = null as any,
  events = [] as any[],
  setting = { value: {} } as any,
} = {}) => {
  const prisma = {
    user: {
      findMany: jest.fn(async () => [{ id: 'user-1', email }]),
      findUnique: jest.fn(async () => ({ email, emailQuality: snapshot })),
    },
    emailQualityEvent: {
      createMany: jest.fn(async () => ({ count: 1 })),
      findMany: jest.fn(async () => events),
    },
    userEmailQuality: {
      upsert: jest.fn(async ({ create }) => create),
    },
  };
  const settings = {
    settingByName: jest.fn(async () => {
      if (!setting) {
        throw new Error('Setting with name emailQuality not found');
      }

      return setting;
    }),
  };

  return {
    prisma,
    settings,
    service: new EmailQualityService(prisma as any, settings as any),
  };
};

describe('EmailQualityService', () => {
  it('stores evidence for the current, lowercased address and skips duplicates', async () => {
    const { prisma, service } = makeService();

    await service.record({
      userId: 'user-1',
      type: EmailQualityEventType.hardBounce,
      source: EmailQualityEventSource.webhook,
      mailLogId: 'log-1',
    });

    expect(prisma.emailQualityEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'user-1',
          email: 'jane@example.com',
          type: EmailQualityEventType.hardBounce,
          mailLogId: 'log-1',
        }),
      ],
      skipDuplicates: true,
    });
    expect(prisma.userEmailQuality.upsert).toHaveBeenCalled();
  });

  it('ignores evidence for users that no longer exist', async () => {
    const { prisma, service } = makeService();
    prisma.user.findMany.mockResolvedValueOnce([]);

    await service.record({
      userId: 'gone',
      type: EmailQualityEventType.hardBounce,
      source: EmailQualityEventSource.webhook,
    });

    expect(prisma.emailQualityEvent.createMany).toHaveBeenCalledWith({
      data: [],
      skipDuplicates: true,
    });
    expect(prisma.userEmailQuality.upsert).not.toHaveBeenCalled();
  });

  it('evaluates with the configured placeholder patterns', async () => {
    const { service } = makeService({
      email: 'nw-1@placeholder.neuewege.ch',
      setting: { value: { placeholderPatterns: ['@placeholder.neuewege.ch'] } },
    });

    await expect(service.recompute('user-1')).resolves.toMatchObject({
      level: EmailQualityLevel.placeholder,
      reason: 'pattern',
    });
  });

  it('falls back to the defaults when the setting is missing', async () => {
    const { service } = makeService({ setting: null });

    await expect(service.recompute('user-1')).resolves.toMatchObject({
      level: EmailQualityLevel.unknown,
    });
  });

  it('keeps the date a level was first reached while it does not change', async () => {
    const firstSeen = new Date('2026-01-01T00:00:00Z');
    const { prisma, service } = makeService({
      snapshot: {
        email: 'jane@example.com',
        level: EmailQualityLevel.undeliverable,
        since: firstSeen,
      },
      events: [
        {
          type: EmailQualityEventType.hardBounce,
          occurredAt: new Date('2026-09-01T00:00:00Z'),
          email: 'jane@example.com',
          detail: null,
        },
      ],
    });

    await service.recompute('user-1');

    expect(prisma.userEmailQuality.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          level: EmailQualityLevel.undeliverable,
          since: firstSeen,
        }),
      })
    );
  });

  it('starts over after an email change', async () => {
    const { prisma, service } = makeService({
      snapshot: {
        email: 'old@example.com',
        level: EmailQualityLevel.undeliverable,
        since: new Date('2026-01-01T00:00:00Z'),
      },
    });

    await service.recompute('user-1');

    expect(prisma.emailQualityEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', email: 'jane@example.com' },
      })
    );
    expect(prisma.userEmailQuality.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          email: 'jane@example.com',
          level: EmailQualityLevel.unknown,
        }),
      })
    );
  });
});
