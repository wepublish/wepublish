import { BadRequestException } from '@nestjs/common';
import {
  DeliveryPreferenceOrigin,
  MailChannel,
  PrismaClient,
} from '@prisma/client';
import { MailRecipientBase } from '../mail-send/mail-send.model';
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
    },
    userDeliveryPreference: {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async ({ create }: any) => create),
    },
    deliverySuggestion: {
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
  };
  const recipients = {
    resolvePage: vi.fn(async (_a: unknown, skip: number) =>
      skip === 0 ? users.map(u => ({ user: u })) : []
    ),
    countUsers: vi.fn(async () => users.length),
    countWithoutAddress: vi.fn(
      async () => users.filter(u => !u.address).length
    ),
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
      });
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
  });

  describe('previewAudience', () => {
    it('counts the people and those without an address for letters', async () => {
      const { service } = setup([user('u1'), user('u2', false)]);

      await expect(
        service.previewAudience(audience, MailChannel.letter)
      ).resolves.toEqual({ userCount: 2, withoutAddressCount: 1 });
    });

    it('has nobody to skip when moving to mail', async () => {
      const { service, recipients } = setup([user('u1'), user('u2', false)]);

      await expect(
        service.previewAudience(audience, MailChannel.mail)
      ).resolves.toEqual({ userCount: 2, withoutAddressCount: 0 });
      expect(recipients.countWithoutAddress).not.toHaveBeenCalled();
    });
  });
});
