import { BadRequestException, Injectable } from '@nestjs/common';
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
    // A failing job is a live state, not a task someone can sign off: the run
    // either recovers or it does not. Letting it be confirmed away would hide
    // an outage from everyone while nothing about the job had changed.
    if (source === NotificationSource.PERIODIC_JOB) {
      throw new BadRequestException(
        'Periodic job logs cannot be confirmed — they reflect the current state of the job.'
      );
    }

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
