import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthSession } from '@wepublish/authentication/api';
import { mayReadAnyOrganization } from '../event-scope';

const BY_NAME = [{ name: 'asc' as const }, { id: 'asc' as const }];

@Injectable()
export class EventTaxonomyService {
  constructor(private prisma: PrismaClient) {}

  getRegions(session: AuthSession | null | undefined) {
    return this.prisma.region.findMany({
      where: mayReadAnyOrganization(session) ? {} : { enabled: true },
      orderBy: BY_NAME,
    });
  }

  getAudiences() {
    return this.prisma.audience.findMany({ orderBy: BY_NAME });
  }

  getAffiliations() {
    return this.prisma.affiliation.findMany({ orderBy: BY_NAME });
  }
}
