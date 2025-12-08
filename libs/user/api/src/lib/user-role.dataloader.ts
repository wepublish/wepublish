import { createOptionalsArray, DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, UserRole } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class UserRoleDataloader extends DataLoaderService<UserRole> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(ids: string[]) {
    return createOptionalsArray(
      ids,
      await this.prisma.userRole.findMany({
        where: { id: { in: ids } },
      }),
      'id'
    );
  }
}
