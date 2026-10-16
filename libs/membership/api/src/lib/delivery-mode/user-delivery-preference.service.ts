import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DeliveryPreferenceOrigin,
  MailChannel,
  PrismaClient,
} from '@prisma/client';
import { canReceiveLetters } from '@wepublish/letter/api';
import { MailAudienceInput } from '../mail-send/mail-send.model';
import { MailSendRecipientService } from '../mail-send/mail-send-recipient.service';
import {
  DeliveryModeAudiencePreview,
  DeliveryModeBulkResult,
  UserDeliveryPreferenceModel,
} from './delivery-mode.model';

const PAGE_SIZE = 500;

export type DeliveryPreferenceChange = {
  origin: DeliveryPreferenceOrigin;
  reason?: string | null;
  changedByUserId?: string | null;
};

const changedBySelect = {
  select: { id: true, email: true, name: true, firstName: true },
} as const;

/**
 * Which way a user's automated subscription mails go. No row means mail; a
 * row is written by an admin (manual) or by confirming a suggestion.
 */
@Injectable()
export class UserDeliveryPreferenceService {
  constructor(
    private prisma: PrismaClient,
    private recipients: MailSendRecipientService
  ) {}

  async get(userId: string): Promise<UserDeliveryPreferenceModel> {
    const [user, preference] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { address: true },
      }),
      this.prisma.userDeliveryPreference.findUnique({
        where: { userId },
        include: { changedBy: changedBySelect },
      }),
    ]);

    return {
      channel: preference?.channel ?? MailChannel.mail,
      origin: preference?.origin ?? null,
      reason: preference?.reason ?? null,
      changedAt: preference?.changedAt ?? null,
      changedBy: preference?.changedBy ?? null,
      canReceiveLetters: !!user && canReceiveLetters(user),
    };
  }

  /** Letters need a usable postal address; the way back to mail is always open. */
  async set(
    userId: string,
    channel: MailChannel,
    change: DeliveryPreferenceChange
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { address: true },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (channel === MailChannel.letter && !canReceiveLetters(user)) {
      throw new BadRequestException(
        'The user has no usable postal address, so letters cannot be chosen.'
      );
    }

    await this.store(userId, channel, change);
  }

  /**
   * Switch everyone in an audience, one decision per person. Those without a
   * usable address are left as they are when moving to letters.
   */
  async setForAudience(
    audience: MailAudienceInput,
    channel: MailChannel,
    changedByUserId: string
  ): Promise<DeliveryModeBulkResult> {
    let skip = 0;
    let changed = 0;
    let skippedWithoutAddress = 0;

    for (;;) {
      // The letter channel resolves one row per person, whatever the audience.
      const page = await this.recipients.resolvePage(
        audience,
        skip,
        PAGE_SIZE,
        MailChannel.letter
      );

      if (!page.length) {
        break;
      }

      for (const { user } of page) {
        if (channel === MailChannel.letter && !canReceiveLetters(user)) {
          skippedWithoutAddress++;
          continue;
        }

        await this.store(user.id, channel, {
          origin: DeliveryPreferenceOrigin.manual,
          reason: 'bulk',
          changedByUserId,
        });
        changed++;
      }

      skip += page.length;
    }

    return { changed, skippedWithoutAddress };
  }

  async previewAudience(
    audience: MailAudienceInput,
    channel: MailChannel
  ): Promise<DeliveryModeAudiencePreview> {
    const userCount = await this.recipients.countUsers(audience);
    const withoutAddressCount =
      channel === MailChannel.letter ?
        await this.recipients.countWithoutAddress(audience, MailChannel.letter)
      : 0;

    return { userCount, withoutAddressCount };
  }

  private async store(
    userId: string,
    channel: MailChannel,
    change: DeliveryPreferenceChange
  ): Promise<void> {
    const data = {
      channel,
      origin: change.origin,
      reason: change.reason ?? null,
      changedByUserId: change.changedByUserId ?? null,
      changedAt: new Date(),
    };

    await this.prisma.userDeliveryPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    // A decision was made; whatever was suggested is answered.
    await this.prisma.deliverySuggestion.deleteMany({ where: { userId } });
  }
}
