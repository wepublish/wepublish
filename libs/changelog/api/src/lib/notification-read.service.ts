import { BadRequestException, Injectable } from '@nestjs/common';
import {
  NotificationSource as PrismaNotificationSource,
  PrismaClient,
} from '@prisma/client';
import { validateNotificationItemId } from './notification-item-id';
import { NotificationSource } from './notification-read.model';

const MAX_BULK_READS = 100;

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

  async markNotificationsRead(
    userId: string,
    source: NotificationSource,
    itemIds: string[]
  ) {
    if (itemIds.length > MAX_BULK_READS) {
      throw new BadRequestException(
        `At most ${MAX_BULK_READS} notifications can be marked read at once`
      );
    }

    const uniqueItemIds = [
      ...new Set(itemIds.map(itemId => validateNotificationItemId(itemId))),
    ];

    if (!uniqueItemIds.length) {
      return [];
    }

    const prismaSource = source as PrismaNotificationSource;

    await this.prisma.notificationRead.createMany({
      data: uniqueItemIds.map(itemId => ({
        userId,
        source: prismaSource,
        itemId,
      })),
      skipDuplicates: true,
    });

    return this.prisma.notificationRead.findMany({
      where: { userId, source: prismaSource, itemId: { in: uniqueItemIds } },
    });
  }
}
