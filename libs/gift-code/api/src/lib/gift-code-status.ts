import { registerEnumType } from '@nestjs/graphql';
import { GiftCode, Prisma } from '@prisma/client';

export enum GiftCodeStatus {
  ordered = 'ordered',
  issued = 'issued',
  redeemed = 'redeemed',
  canceled = 'canceled',
  expired = 'expired',
}

registerEnumType(GiftCodeStatus, {
  name: 'GiftCodeStatus',
});

export const deriveGiftCodeStatus = (
  {
    issuedAt,
    expiresAt,
    redeemedAt,
    canceledAt,
  }: Pick<GiftCode, 'issuedAt' | 'expiresAt' | 'redeemedAt' | 'canceledAt'>,
  now = new Date()
): GiftCodeStatus => {
  if (canceledAt) {
    return GiftCodeStatus.canceled;
  }

  if (redeemedAt) {
    return GiftCodeStatus.redeemed;
  }

  if (!issuedAt) {
    return GiftCodeStatus.ordered;
  }

  if (expiresAt && expiresAt <= now) {
    return GiftCodeStatus.expired;
  }

  return GiftCodeStatus.issued;
};

export const giftCodeStatusWhere = (
  status: GiftCodeStatus,
  now: Date
): Prisma.GiftCodeWhereInput => {
  switch (status) {
    case GiftCodeStatus.ordered:
      return { issuedAt: null, canceledAt: null };

    case GiftCodeStatus.issued:
      return {
        issuedAt: { not: null },
        canceledAt: null,
        redeemedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      };

    case GiftCodeStatus.redeemed:
      return { redeemedAt: { not: null }, canceledAt: null };

    case GiftCodeStatus.canceled:
      return { canceledAt: { not: null } };

    case GiftCodeStatus.expired:
      return {
        issuedAt: { not: null },
        canceledAt: null,
        redeemedAt: null,
        expiresAt: { lte: now },
      };
  }
};
