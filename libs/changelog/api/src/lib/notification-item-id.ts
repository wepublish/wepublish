import { BadRequestException } from '@nestjs/common';

const MAX_ITEM_ID_LENGTH = 200;

export function validateNotificationItemId(itemId: string): string {
  const trimmedItemId = itemId.trim();

  if (!trimmedItemId || trimmedItemId.length > MAX_ITEM_ID_LENGTH) {
    throw new BadRequestException(
      `itemId has to be between 1 and ${MAX_ITEM_ID_LENGTH} characters`
    );
  }

  return trimmedItemId;
}
