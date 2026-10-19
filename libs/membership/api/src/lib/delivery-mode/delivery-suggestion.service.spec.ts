import { BadRequestException } from '@nestjs/common';
import {
  DeliveryPreferenceOrigin,
  DeliverySuggestionKind,
  EmailQualityLevel,
  MailChannel,
  PrismaClient,
} from '@prisma/client';
import { LetterSender } from '@wepublish/mail/api';
import { MailSendRecipientService } from '../mail-send/mail-send-recipient.service';
import { DeliverySuggestionService } from './delivery-suggestion.service';
import { UserDeliveryPreferenceService } from './user-delivery-preference.service';

const address = {
  company: null,
  streetAddress: 'Musterstrasse',
  streetAddressNumber: '7',
  streetAddress2: null,
  streetAddress2Number: null,
  zipCode: '8000',
  city: 'Zürich',
  country: 'CH',
};

type FakeUser = {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  address: typeof address | null;
  emailQuality: {
    level: EmailQualityLevel;
    reason: string;
    since: Date;
  } | null;
  deliveryPreference: {
    channel: MailChannel;
    origin: DeliveryPreferenceOrigin;
  } | null;
};

const since = new Date('2026-10-01T00:00:00.000Z');

const fakeUser = (id: string, overrides: Partial<FakeUser> = {}): FakeUser => ({
  id,
  email: `${id}@example.com`,
  name: 'Doe',
  firstName: 'Jane',
  address,
  emailQuality: { level: EmailQualityLevel.dead, reason: 'hardBounce', since },
  deliveryPreference: null,
  ...overrides,
});

function setup({
  users = [] as FakeUser[],
  suggestions = [] as {
    id: string;
    userId: string;
    kind: DeliverySuggestionKind;
    reason: string;
  }[],
  configured = true,
  patterns = ['@placeholder.local'],
} = {}) {
  const rows = suggestions.map(s => ({ ...s, createdAt: since }));

  const prisma = {
    user: {
      // The service pages with a cursor; a single page is enough here.
      findMany: vi.fn(async ({ cursor }: any) => (cursor ? [] : users)),
    },
    userDeliveryPreference: {
      findMany: vi.fn(async ({ cursor }: any) =>
        cursor ?
          []
        : users
            .filter(u => u.deliveryPreference)
            .map(u => ({ userId: u.id, user: u, ...u.deliveryPreference }))
      ),
    },
    deliverySuggestion: {
      findMany: vi.fn(async ({ where, skip, take }: any) => {
        let list = rows;
        if (where?.kind) list = list.filter(r => r.kind === where.kind);
        if (where?.id) list = list.filter(r => r.id === where.id);
        list = list.map(r => ({
          ...r,
          user: users.find(u => u.id === r.userId),
        }));
        return list.slice(skip ?? 0, (skip ?? 0) + (take ?? list.length));
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        const row = rows.find(r =>
          where.userId ? r.userId === where.userId : r.id === where.id
        );
        return row ?
            { ...row, user: users.find(u => u.id === row.userId) }
          : null;
      }),
      count: vi.fn(
        async ({ where }: any) =>
          rows.filter(r => !where?.kind || r.kind === where.kind).length
      ),
      groupBy: vi.fn(async () =>
        Object.values(DeliverySuggestionKind).map(kind => ({
          kind,
          _count: { _all: rows.filter(r => r.kind === kind).length },
        }))
      ),
      deleteMany: vi.fn(async () => ({ count: 0 })),
      upsert: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
    },
  };
  const recipients = {
    placeholderPatterns: vi.fn(async () => patterns),
  };
  const letterSender: Record<keyof LetterSender, any> = {
    isConfigured: vi.fn(async () => configured),
    canReceiveLetters: vi.fn(),
    sendLetter: vi.fn(),
  };
  const preferences = {
    set: vi.fn(async () => undefined),
    get: vi.fn(async () => ({ channel: MailChannel.mail })),
  };

  const service = new DeliverySuggestionService(
    prisma as unknown as PrismaClient,
    recipients as unknown as MailSendRecipientService,
    preferences as unknown as UserDeliveryPreferenceService,
    letterSender
  );

  return { service, prisma, preferences, letterSender };
}

describe('DeliverySuggestionService.recomputeAll', () => {
  it('does nothing while letters are not enabled', async () => {
    const { service, prisma } = setup({ configured: false });

    await expect(service.recomputeAll()).resolves.toEqual({ skipped: true });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('suggests letters for dead and placeholder addresses with a postal address', async () => {
    const { service, prisma } = setup({
      users: [
        fakeUser('dead'),
        fakeUser('placeholder', {
          email: 'x@placeholder.local',
          emailQuality: null,
        }),
      ],
    });

    await expect(service.recomputeAll()).resolves.toEqual({
      toLetter: 2,
      toMail: 0,
      removed: 0,
    });
    expect(prisma.deliverySuggestion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'dead' },
        create: expect.objectContaining({
          kind: DeliverySuggestionKind.toLetter,
          reason: 'emailQuality:dead',
        }),
      })
    );
    expect(prisma.deliverySuggestion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'placeholder' },
        create: expect.objectContaining({ reason: 'placeholderEmail' }),
      })
    );
  });

  it('asks the database only for dead or placeholder users with an address who are not in letter mode already', async () => {
    const { service, prisma } = setup();

    await service.recomputeAll();

    const { where } = prisma.user.findMany.mock.calls[0][0];

    expect(where.AND).toEqual(
      expect.arrayContaining([
        { address: { isNot: null } },
        {
          OR: [
            { deliveryPreference: null },
            {
              deliveryPreference: {
                is: {
                  channel: MailChannel.mail,
                  origin: DeliveryPreferenceOrigin.suggestion,
                },
              },
            },
          ],
        },
      ])
    );
    expect(JSON.stringify(where)).toContain('"level":"dead"');
    expect(JSON.stringify(where)).toContain('@placeholder.local');
  });

  it('skips a candidate whose address is not usable after all', async () => {
    const { service, prisma } = setup({
      users: [fakeUser('dead', { address: { ...address, zipCode: '' } })],
    });

    await expect(service.recomputeAll()).resolves.toMatchObject({
      toLetter: 0,
    });
    expect(prisma.deliverySuggestion.upsert).not.toHaveBeenCalled();
  });

  it('suggests the way back for suggestion-made letter users who became active', async () => {
    const { service, prisma } = setup({
      users: [
        fakeUser('back', {
          emailQuality: {
            level: EmailQualityLevel.active,
            reason: 'login',
            since,
          },
          deliveryPreference: {
            channel: MailChannel.letter,
            origin: DeliveryPreferenceOrigin.suggestion,
          },
        }),
      ],
    });

    await expect(service.recomputeAll()).resolves.toMatchObject({ toMail: 1 });
    expect(prisma.deliverySuggestion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'back' },
        create: expect.objectContaining({
          kind: DeliverySuggestionKind.toMail,
          reason: 'emailQuality:active',
        }),
      })
    );

    const { where } = prisma.userDeliveryPreference.findMany.mock.calls[0][0];

    expect(where).toMatchObject({
      channel: MailChannel.letter,
      origin: DeliveryPreferenceOrigin.suggestion,
    });
    expect(JSON.stringify(where)).toContain('"level":"active"');
  });

  it('never suggests the way back for a manual switch', async () => {
    const { service, prisma } = setup();

    await service.recomputeAll();

    const { where } = prisma.userDeliveryPreference.findMany.mock.calls[0][0];

    expect(where.origin).toBe(DeliveryPreferenceOrigin.suggestion);
  });

  it('removes suggestions that no longer apply', async () => {
    const { service, prisma } = setup({
      users: [fakeUser('dead')],
      suggestions: [
        {
          id: 's-old',
          userId: 'recovered',
          kind: DeliverySuggestionKind.toLetter,
          reason: 'emailQuality:dead',
        },
      ],
    });

    await expect(service.recomputeAll()).resolves.toMatchObject({ removed: 1 });
    expect(prisma.deliverySuggestion.deleteMany).toHaveBeenCalledWith({
      where: { userId: { in: ['recovered'] } },
    });
  });

  it('keeps an unchanged suggestion as it is', async () => {
    const { service, prisma } = setup({
      users: [fakeUser('dead')],
      suggestions: [
        {
          id: 's-dead',
          userId: 'dead',
          kind: DeliverySuggestionKind.toLetter,
          reason: 'emailQuality:dead',
        },
      ],
    });

    await service.recomputeAll();

    expect(prisma.deliverySuggestion.upsert).not.toHaveBeenCalled();
    expect(prisma.deliverySuggestion.deleteMany).not.toHaveBeenCalled();
  });
});

describe('DeliverySuggestionService.confirm', () => {
  const suggestion = {
    id: 's1',
    userId: 'dead',
    kind: DeliverySuggestionKind.toLetter,
    reason: 'emailQuality:dead',
  };

  it('applies a suggestion that still holds, as a suggestion-made switch', async () => {
    const { service, preferences } = setup({
      users: [fakeUser('dead')],
      suggestions: [suggestion],
    });

    await service.confirm('s1', 'admin');

    expect(preferences.set).toHaveBeenCalledWith('dead', MailChannel.letter, {
      origin: DeliveryPreferenceOrigin.suggestion,
      reason: 'emailQuality:dead',
      changedByUserId: 'admin',
    });
  });

  it('refuses a stale suggestion and drops it', async () => {
    const { service, preferences, prisma } = setup({
      users: [
        fakeUser('dead', {
          emailQuality: {
            level: EmailQualityLevel.active,
            reason: 'login',
            since,
          },
        }),
      ],
      suggestions: [suggestion],
    });

    await expect(service.confirm('s1', 'admin')).rejects.toThrow(
      BadRequestException
    );
    expect(preferences.set).not.toHaveBeenCalled();
    expect(prisma.deliverySuggestion.delete).toHaveBeenCalledWith({
      where: { id: 's1' },
    });
  });

  it('applies the way back only while the address is still active', async () => {
    const { service, preferences } = setup({
      users: [
        fakeUser('back', {
          emailQuality: {
            level: EmailQualityLevel.active,
            reason: 'login',
            since,
          },
          deliveryPreference: {
            channel: MailChannel.letter,
            origin: DeliveryPreferenceOrigin.suggestion,
          },
        }),
      ],
      suggestions: [
        {
          id: 's2',
          userId: 'back',
          kind: DeliverySuggestionKind.toMail,
          reason: 'emailQuality:active',
        },
      ],
    });

    await service.confirm('s2', 'admin');

    expect(preferences.set).toHaveBeenCalledWith('back', MailChannel.mail, {
      origin: DeliveryPreferenceOrigin.suggestion,
      reason: 'emailQuality:active',
      changedByUserId: 'admin',
    });
  });

  it('confirms all of a kind and counts what no longer applied', async () => {
    const { service, preferences } = setup({
      users: [
        fakeUser('dead'),
        fakeUser('fine', {
          emailQuality: {
            level: EmailQualityLevel.active,
            reason: 'login',
            since,
          },
        }),
      ],
      suggestions: [
        suggestion,
        {
          id: 's3',
          userId: 'fine',
          kind: DeliverySuggestionKind.toLetter,
          reason: 'emailQuality:dead',
        },
      ],
    });

    await expect(
      service.confirmAll(DeliverySuggestionKind.toLetter, 'admin')
    ).resolves.toEqual({ confirmed: 1, skipped: 1 });
    expect(preferences.set).toHaveBeenCalledTimes(1);
  });
});

describe('DeliverySuggestionService.keep', () => {
  const suggestion = {
    id: 's1',
    userId: 'dead',
    kind: DeliverySuggestionKind.toLetter,
    reason: 'emailQuality:dead',
  };

  it('stores the current channel as a manual decision, which the night never overrides', async () => {
    const { service, preferences } = setup({
      users: [fakeUser('dead')],
      suggestions: [suggestion],
    });
    preferences.get.mockResolvedValue({ channel: MailChannel.mail });

    await service.keep('s1', 'admin');

    expect(preferences.get).toHaveBeenCalledWith('dead');
    expect(preferences.set).toHaveBeenCalledWith('dead', MailChannel.mail, {
      origin: DeliveryPreferenceOrigin.manual,
      reason: 'kept',
      changedByUserId: 'admin',
    });
  });

  it('keeps letters for someone suggested back to email', async () => {
    const { service, preferences } = setup({
      users: [fakeUser('back')],
      suggestions: [
        {
          id: 's2',
          userId: 'back',
          kind: DeliverySuggestionKind.toMail,
          reason: 'emailQuality:active',
        },
      ],
    });
    preferences.get.mockResolvedValue({ channel: MailChannel.letter });

    await service.keep('s2', 'admin');

    expect(preferences.set).toHaveBeenCalledWith(
      'back',
      MailChannel.letter,
      expect.objectContaining({ reason: 'kept' })
    );
  });

  it('refuses an unknown suggestion', async () => {
    const { service, preferences } = setup();

    await expect(service.keep('missing', 'admin')).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(preferences.set).not.toHaveBeenCalled();
  });
});

describe('DeliverySuggestionService.userSuggestion', () => {
  it("answers with the person's open suggestion", async () => {
    const { service } = setup({
      users: [fakeUser('dead')],
      suggestions: [
        {
          id: 's1',
          userId: 'dead',
          kind: DeliverySuggestionKind.toLetter,
          reason: 'emailQuality:dead',
        },
      ],
    });

    await expect(service.userSuggestion('dead')).resolves.toEqual(
      expect.objectContaining({
        id: 's1',
        kind: DeliverySuggestionKind.toLetter,
        reason: 'emailQuality:dead',
        user: expect.objectContaining({ id: 'dead' }),
        emailQuality: expect.objectContaining({
          level: EmailQualityLevel.dead,
        }),
      })
    );
  });

  it('answers with null when nothing is open', async () => {
    const { service } = setup({ users: [fakeUser('dead')] });

    await expect(service.userSuggestion('dead')).resolves.toBeNull();
  });
});

describe('DeliverySuggestionService lists', () => {
  it('counts open suggestions per kind', async () => {
    const { service } = setup({
      users: [fakeUser('dead')],
      suggestions: [
        {
          id: 's1',
          userId: 'dead',
          kind: DeliverySuggestionKind.toLetter,
          reason: 'emailQuality:dead',
        },
      ],
    });

    await expect(service.counts()).resolves.toEqual({ toLetter: 1, toMail: 0 });
  });

  it('lists suggestions with the user and their email quality', async () => {
    const { service } = setup({
      users: [fakeUser('dead')],
      suggestions: [
        {
          id: 's1',
          userId: 'dead',
          kind: DeliverySuggestionKind.toLetter,
          reason: 'emailQuality:dead',
        },
      ],
    });

    await expect(
      service.list(DeliverySuggestionKind.toLetter, 0, 20)
    ).resolves.toEqual({
      totalCount: 1,
      nodes: [
        expect.objectContaining({
          id: 's1',
          kind: DeliverySuggestionKind.toLetter,
          reason: 'emailQuality:dead',
          user: expect.objectContaining({
            id: 'dead',
            email: 'dead@example.com',
          }),
          emailQuality: expect.objectContaining({
            level: EmailQualityLevel.dead,
          }),
        }),
      ],
    });
  });
});
