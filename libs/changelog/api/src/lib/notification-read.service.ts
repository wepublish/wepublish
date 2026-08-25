import { BadRequestException, Injectable } from '@nestjs/common';
import {
  NotificationSource as PrismaNotificationSource,
  PrismaClient,
} from '@prisma/client';
import { NotificationSource } from './notification-read.model';

const MAX_ITEM_ID_LENGTH = 200;

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
    const trimmedItemId = itemId.trim();

    if (!trimmedItemId || trimmedItemId.length > MAX_ITEM_ID_LENGTH) {
      throw new BadRequestException(
        `itemId has to be between 1 and ${MAX_ITEM_ID_LENGTH} characters`
      );
    }

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
