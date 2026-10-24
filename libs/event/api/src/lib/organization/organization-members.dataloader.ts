import { Injectable, Scope } from '@nestjs/common';
import { OrganizationMember, PrismaClient } from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class OrganizationMembersDataloader extends DataLoaderService<
  OrganizationMember[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(organizationIds: string[]) {
    const members = groupBy(
      member => member.organizationId,
      await this.prisma.organizationMember.findMany({
        where: {
          organizationId: {
            in: organizationIds,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
    );

    return organizationIds.map(organizationId => members[organizationId] ?? []);
  }
}
