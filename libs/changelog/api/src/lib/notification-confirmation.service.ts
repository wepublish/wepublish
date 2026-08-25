import { Injectable } from '@nestjs/common';
import {
  NotificationSource as PrismaNotificationSource,
  PrismaClient,
} from '@prisma/client';
import { validateNotificationItemId } from './notification-item-id';
import { NotificationSource } from './notification-read.model';

@Injectable()
export class NotificationConfirmationService {
  constructor(private prisma: PrismaClient) {}

  async getNotificationConfirmations() {
    return this.prisma.notificationConfirmation.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Confirmations are instance-wide: the first confirmation wins and is never
  // overwritten by later ones.
  async confirmNotification(
    userId: string,
    source: NotificationSource,
    itemId: string
  ) {
    const trimmedItemId = validateNotificationItemId(itemId);

    return this.prisma.notificationConfirmation.upsert({
      where: {
        source_itemId: {
          source: source as PrismaNotificationSource,
          itemId: trimmedItemId,
        },
      },
      update: {},
      create: {
        source: source as PrismaNotificationSource,
        itemId: trimmedItemId,
        confirmedByUserId: userId,
      },
    });
  }
}
