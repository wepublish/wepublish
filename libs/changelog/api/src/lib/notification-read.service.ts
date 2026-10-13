import { Injectable } from '@nestjs/common';
import {
  NotificationSource as PrismaNotificationSource,
  PrismaClient,
} from '@prisma/client';
import { validateNotificationItemId } from './notification-item-id';
import { NotificationSource } from './notification-read.model';

@Injectable()
export class NotificationReadService {
  constructor(private prisma: PrismaClient) {}

  async getNotificationReads(userId: string) {
    return this.prisma.notificationRead.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markNotificationRead(
    userId: string,
    source: NotificationSource,
    itemId: string
  ) {
    const trimmedItemId = validateNotificationItemId(itemId);

    return this.prisma.notificationRead.upsert({
      where: {
        userId_source_itemId: {
          userId,
          source: source as PrismaNotificationSource,
          itemId: trimmedItemId,
        },
      },
      update: {},
      create: {
        userId,
        source: source as PrismaNotificationSource,
        itemId: trimmedItemId,
      },
    });
  }
}
