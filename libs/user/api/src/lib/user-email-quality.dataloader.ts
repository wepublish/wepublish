import { Injectable, Scope } from '@nestjs/common';
import { PrismaClient, UserEmailQuality } from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';

/** The derived email quality of users; null while nothing was evaluated yet. */
@Injectable({
  scope: Scope.REQUEST,
})
export class UserEmailQualityDataloader extends DataLoaderService<UserEmailQuality> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(userIds: string[]) {
    const rows = await this.prisma.userEmailQuality.findMany({
      where: { userId: { in: userIds } },
    });
    const byUser = new Map(rows.map(row => [row.userId, row]));

    return userIds.map(userId => byUser.get(userId) ?? null);
  }
}
