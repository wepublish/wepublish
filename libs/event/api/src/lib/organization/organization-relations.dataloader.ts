import { Injectable, Scope } from '@nestjs/common';
import { Affiliation, Contact, PrismaClient, Tag } from '@prisma/client';
import { DataLoaderService } from '@wepublish/utils/api';
import { groupBy } from 'ramda';

const byOrganization = <T extends { organizationId: string }, R>(
  organizationIds: string[],
  rows: T[],
  pick: (row: T) => R
) => {
  const grouped = groupBy(row => row.organizationId, rows);

  return organizationIds.map(id => (grouped[id] ?? []).map(pick));
};

@Injectable({
  scope: Scope.REQUEST,
})
export class OrganizationTagsDataloader extends DataLoaderService<Tag[]> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(organizationIds: string[]) {
    return byOrganization(
      organizationIds,
      await this.prisma.taggedOrganizations.findMany({
        where: { organizationId: { in: organizationIds } },
        include: { tag: true },
        orderBy: [{ tag: { tag: 'asc' } }, { tagId: 'asc' }],
      }),
      ({ tag }) => tag
    );
  }
}

@Injectable({
  scope: Scope.REQUEST,
})
export class OrganizationAffiliationsDataloader extends DataLoaderService<
  Affiliation[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(organizationIds: string[]) {
    return byOrganization(
      organizationIds,
      await this.prisma.organizationAffiliation.findMany({
        where: { organizationId: { in: organizationIds } },
        include: { affiliation: true },
        orderBy: [{ affiliation: { name: 'asc' } }, { affiliationId: 'asc' }],
      }),
      ({ affiliation }) => affiliation
    );
  }
}

@Injectable({
  scope: Scope.REQUEST,
})
export class OrganizationContactsDataloader extends DataLoaderService<
  Contact[]
> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(organizationIds: string[]) {
    return byOrganization(
      organizationIds,
      await this.prisma.contact.findMany({
        where: { organizationId: { in: organizationIds } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      }),
      contact => contact
    );
  }
}
