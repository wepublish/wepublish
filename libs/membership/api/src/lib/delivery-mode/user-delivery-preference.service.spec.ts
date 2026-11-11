import { BadRequestException } from '@nestjs/common';
import {
  DeliveryPreferenceOrigin,
  MailChannel,
  PrismaClient,
} from '@prisma/client';
import {
  MailEmailSegment,
  MailRecipientBase,
} from '../mail-send/mail-send.model';
import { MailSendRecipientService } from '../mail-send/mail-send-recipient.service';
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

const user = (id: string, withAddress = true) => ({
  id,
  email: `${id}@example.com`,
  name: 'Doe',
  firstName: 'Jane',
  address: withAddress ? address : null,
});

function setup(users: ReturnType<typeof user>[] = [user('u1')]) {
  const prisma = {
    user: {
      findUnique: vi.fn(
        async ({ where }: any) => users.find(u => u.id === where.id) ?? null
      ),
      findMany: vi.fn(async () => [] as unknown[]),
      count: vi.fn(async () => users.length),
    },
    userDeliveryPreference: {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async ({ create }: any) => create),
      groupBy: vi.fn(async () => [] as unknown[]),
    },
    deliverySuggestion: {
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
    deliveryModeBulkChange: {
      create: vi.fn(async ({ data }: any) => ({ id: 'change-1', ...data })),
      findMany: vi.fn(async () => []),
      count: vi.fn(async () => 0),
    },
  };
  const recipients = {
    placeholderPatterns: vi.fn(async () => ['@placeholder.local']),
    resolvePage: vi.fn(async (_a: unknown, skip: number) =>
      skip === 0 ? users.map(u => ({ user: u })) : []
    ),
    countUsers: vi.fn(async () => users.length),
    countWithoutAddress: vi.fn(
      async () => users.filter(u => !u.address).length
    ),
    countUsersBySegment: vi.fn(async () => [
      { segment: 'placeholder', userCount: 1 },
    ]),
  };
  const service = new UserDeliveryPreferenceService(
    prisma as unknown as PrismaClient,
    recipients as unknown as MailSendRecipientService
  );

  return { service, prisma, recipients };
}

const audience = { base: MailRecipientBase.allUsers } as any;

describe('UserDeliveryPreferenceService', () => {
  describe('get', () => {
    it('reports mail for a user without a preference', async () => {
      const { service } = setup();

      await expect(service.get('u1')).resolves.toEqual({
        channel: MailChannel.mail,
        origin: null,
        reason: null,
        changedAt: null,
        changedBy: null,
        canReceiveLetters: true,
        emailSegment: MailEmailSegment.unknown,
      });
    });

    it('says how the email address fares, so a switch to email can be weighed', async () => {
      const dead = {
        ...user('dead'),
        emailQuality: { level: 'dead' },
      };
      const placeholder = {
        ...user('p'),
        email: 'p@placeholder.local',
        emailQuality: { level: 'active' },
      };
      const { service } = setup([dead, placeholder]);

      await expect(service.get('dead')).resolves.toEqual(
        expect.objectContaining({ emailSegment: MailEmailSegment.dead })
      );
      // A placeholder is no mailbox, whatever its quality says.
      await expect(service.get('p')).resolves.toEqual(
        expect.objectContaining({ emailSegment: MailEmailSegment.placeholder })
      );
    });

    it('reports the stored preference and whether letters are possible', async () => {
      const { service, prisma } = setup([user('u1', false)]);
      const changedAt = new Date();
      prisma.userDeliveryPreference.findUnique.mockResolvedValue({
        channel: MailChannel.letter,
        origin: DeliveryPreferenceOrigin.manual,
        reason: 'bulk',
        changedAt,
        changedBy: { id: 'admin', email: 'a@x.ch', name: 'A', firstName: null },
      } as never);

      await expect(service.get('u1')).resolves.toEqual({
        channel: MailChannel.letter,
        origin: DeliveryPreferenceOrigin.manual,
        reason: 'bulk',
        changedAt,
        changedBy: { id: 'admin', email: 'a@x.ch', name: 'A', firstName: null },
        canReceiveLetters: false,
        emailSegment: MailEmailSegment.unknown,
      });
    });
  });

  describe('set', () => {
    it('stores a manual switch to letters and drops an open suggestion', async () => {
      const { service, prisma } = setup();

      await service.set('u1', MailChannel.letter, {
        origin: DeliveryPreferenceOrigin.manual,
        changedByUserId: 'admin',
      });

      expect(prisma.userDeliveryPreference.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          create: expect.objectContaining({
            userId: 'u1',
            channel: MailChannel.letter,
            origin: DeliveryPreferenceOrigin.manual,
            changedByUserId: 'admin',
            changedAt: expect.any(Date),
          }),
        })
      );
      expect(prisma.deliverySuggestion.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
    });

    it('refuses letters for a user without a usable address', async () => {
      const { service, prisma } = setup([user('u1', false)]);

      await expect(
        service.set('u1', MailChannel.letter, {
          origin: DeliveryPreferenceOrigin.manual,
        })
      ).rejects.toThrow(BadRequestException);
      expect(prisma.userDeliveryPreference.upsert).not.toHaveBeenCalled();
    });

    it('lets anyone go back to mail', async () => {
      const { service, prisma } = setup([user('u1', false)]);

      await service.set('u1', MailChannel.mail, {
        origin: DeliveryPreferenceOrigin.manual,
      });

      expect(prisma.userDeliveryPreference.upsert).toHaveBeenCalled();
    });

    it('refuses an unknown user', async () => {
      const { service } = setup([]);

      await expect(
        service.set('nobody', MailChannel.mail, {
          origin: DeliveryPreferenceOrigin.manual,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setForAudience', () => {
    it('switches everyone with an address and counts the rest', async () => {
      const { service, prisma } = setup([
        user('u1'),
        user('u2', false),
        user('u3'),
      ]);

      await expect(
        service.setForAudience(audience, MailChannel.letter, 'admin')
      ).resolves.toEqual({ changed: 2, skippedWithoutAddress: 1 });

      expect(prisma.userDeliveryPreference.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.userDeliveryPreference.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId: 'u3',
            origin: DeliveryPreferenceOrigin.manual,
            reason: 'bulk',
            changedByUserId: 'admin',
          }),
        })
      );
    });

    it('switches everyone back to mail, address or not', async () => {
      const { service } = setup([user('u1'), user('u2', false)]);

      await expect(
        service.setForAudience(audience, MailChannel.mail, 'admin')
      ).resolves.toEqual({ changed: 2, skippedWithoutAddress: 0 });
    });

    it('resolves the audience one row per person', async () => {
      const { service, recipients } = setup();

      await service.setForAudience(audience, MailChannel.mail, 'admin');

      expect(recipients.resolvePage).toHaveBeenCalledWith(
        audience,
        0,
        expect.any(Number),
        MailChannel.letter
      );
    });

    // The per-user preference only keeps its last change; which filter put a
    // few hundred people on letters is otherwise lost the moment it is done.
    it('records the switch with the filter and the counts', async () => {
      const { service, prisma } = setup([
        user('u1'),
        user('u2', false),
        user('u3'),
      ]);
      const filtered = {
        base: MailRecipientBase.hasSubscription,
        memberPlanIDs: ['plan-1'],
      } as any;

      await service.setForAudience(filtered, MailChannel.letter, 'admin');

      expect(prisma.deliveryModeBulkChange.create).toHaveBeenCalledWith({
        data: {
          channel: MailChannel.letter,
          audience: filtered,
          userCount: 3,
          changed: 2,
          skippedWithoutAddress: 1,
          changedByUserId: 'admin',
        },
      });
    });

    it('records a switch that touched nobody, so the attempt is visible', async () => {
      const { service, prisma } = setup([]);

      await service.setForAudience(audience, MailChannel.letter, 'admin');

      expect(prisma.deliveryModeBulkChange.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userCount: 0, changed: 0 }),
      });
    });
  });

  describe('listBulkChanges', () => {
    it('pages the newest first, with who did it', async () => {
      const { service, prisma } = setup();
      prisma.deliveryModeBulkChange.findMany.mockResolvedValue([
        { id: 'change-1' },
      ] as never);
      prisma.deliveryModeBulkChange.count.mockResolvedValue(7 as never);

      await expect(service.listBulkChanges(20, 10)).resolves.toEqual({
        nodes: [{ id: 'change-1' }],
        totalCount: 7,
      });
      expect(prisma.deliveryModeBulkChange.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 10,
        include: {
          changedBy: {
            select: { id: true, email: true, name: true, firstName: true },
          },
        },
      });
    });

    it('narrows to one channel when asked', async () => {
      const { service, prisma } = setup();

      await service.listBulkChanges(0, 20, MailChannel.letter);

      expect(prisma.deliveryModeBulkChange.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { channel: MailChannel.letter } })
      );
      expect(prisma.deliveryModeBulkChange.count).toHaveBeenCalledWith({
        where: { channel: MailChannel.letter },
      });
    });
  });

  describe('channelCounts', () => {
    it('counts everyone without a row on the default channel, email', async () => {
      const { service, prisma } = setup();
      prisma.user.count.mockResolvedValue(10);
      prisma.userDeliveryPreference.groupBy.mockResolvedValue([
        { channel: MailChannel.letter, _count: { _all: 3 } },
        { channel: MailChannel.mail, _count: { _all: 2 } },
      ]);

      await expect(service.channelCounts()).resolves.toEqual([
        { channel: MailChannel.mail, userCount: 7 },
        { channel: MailChannel.letter, userCount: 3 },
      ]);
    });

    it('names every channel, also an empty one', async () => {
      const { service, prisma } = setup();
      prisma.user.count.mockResolvedValue(4);

      await expect(service.channelCounts()).resolves.toEqual([
        { channel: MailChannel.mail, userCount: 4 },
        { channel: MailChannel.letter, userCount: 0 },
      ]);
    });
  });

  describe('listByChannel', () => {
    const changedAt = new Date('2026-10-10T08:00:00.000Z');
    const admin = { id: 'admin', email: 'a@x.ch', name: 'A', firstName: null };

    it('lists the people on letters with how they got there', async () => {
      const { service, prisma } = setup();
      prisma.user.findMany.mockResolvedValue([
        {
          ...user('u1'),
          deliveryPreference: {
            channel: MailChannel.letter,
            origin: DeliveryPreferenceOrigin.manual,
            reason: 'bulk',
            changedAt,
            changedBy: admin,
          },
        },
      ]);
      prisma.user.count.mockResolvedValue(1);

      await expect(
        service.listByChannel(MailChannel.letter, undefined, 0, 20)
      ).resolves.toEqual({
        totalCount: 1,
        nodes: [
          {
            user: {
              id: 'u1',
              email: 'u1@example.com',
              name: 'Doe',
              firstName: 'Jane',
            },
            channel: MailChannel.letter,
            origin: DeliveryPreferenceOrigin.manual,
            reason: 'bulk',
            changedAt,
            changedBy: admin,
            canReceiveLetters: true,
            emailSegment: MailEmailSegment.unknown,
          },
        ],
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deliveryPreference: { is: { channel: MailChannel.letter } },
          },
          skip: 0,
          take: 20,
        })
      );
    });

    it('counts people without a row as email', async () => {
      const { service, prisma } = setup();
      prisma.user.findMany.mockResolvedValue([
        { ...user('u1', false), deliveryPreference: null },
      ]);

      const { nodes } = await service.listByChannel(
        MailChannel.mail,
        undefined,
        0,
        20
      );

      expect(nodes[0]).toEqual(
        expect.objectContaining({
          channel: MailChannel.mail,
          origin: null,
          reason: null,
          changedAt: null,
          changedBy: null,
          canReceiveLetters: false,
        })
      );
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { deliveryPreference: null },
              { deliveryPreference: { is: { channel: MailChannel.mail } } },
            ],
          },
        })
      );
    });

    it('searches by name, first name and email address', async () => {
      const { service, prisma } = setup();

      await service.listByChannel(MailChannel.letter, ' muster ', 20, 10);

      const where = {
        AND: [
          { deliveryPreference: { is: { channel: MailChannel.letter } } },
          {
            OR: [
              { name: { contains: 'muster', mode: 'insensitive' } },
              { firstName: { contains: 'muster', mode: 'insensitive' } },
              { email: { contains: 'muster', mode: 'insensitive' } },
            ],
          },
        ],
      };
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where, skip: 20, take: 10 })
      );
      expect(prisma.user.count).toHaveBeenCalledWith({ where });
    });
  });

  describe('previewAudience', () => {
    it('counts the people and those without an address for letters', async () => {
      const { service } = setup([user('u1'), user('u2', false)]);

      await expect(
        service.previewAudience(audience, MailChannel.letter)
      ).resolves.toEqual({
        userCount: 2,
        withoutAddressCount: 1,
        segments: [{ segment: 'placeholder', userCount: 1 }],
      });
    });

    it('has nobody to skip when moving to mail', async () => {
      const { service, recipients } = setup([user('u1'), user('u2', false)]);

      await expect(
        service.previewAudience(audience, MailChannel.mail)
      ).resolves.toEqual({
        userCount: 2,
        withoutAddressCount: 0,
        segments: [{ segment: 'placeholder', userCount: 1 }],
      });
      expect(recipients.countWithoutAddress).not.toHaveBeenCalled();
    });
  });
});
