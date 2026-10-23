import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Organization, Prisma, PrismaClient } from '@prisma/client';
import {
  AuthSession,
  AuthSessionType,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import {
  canManageOrganization,
  mayReadAnyOrganization,
  mayUpdateAnyOrganization,
  memberOrganizationsWhere,
  visibleOrganizationsWhere,
} from '../event-scope';
import { OrganizationDataloaderService } from './organization-dataloader.service';
import {
  CreateOrganizationInput,
  OrganizationArgs,
  OrganizationFilter,
  OrganizationListArgs,
  OrganizationMemberArgs,
  OrganizationSort,
  UpdateOrganizationInput,
} from './organization.model';

type Session = AuthSession | null | undefined;

const MAX_NAME_LENGTH = 100;
const MAX_ZIP_LENGTH = 4;

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaClient,
    private sessionCache: SessionCacheInvalidator
  ) {}

  @PrimeDataLoader(OrganizationDataloaderService)
  async getOrganizations(
    {
      filter,
      cursorId,
      sort = OrganizationSort.Name,
      order = SortOrder.Ascending,
      take = 10,
      skip,
    }: OrganizationListArgs,
    session: Session
  ) {
    const orderBy = createOrganizationOrder(sort, order);
    const where = createOrganizationFilter(filter, session);

    const [totalCount, organizations] = await Promise.all([
      this.prisma.organization.count({
        where,
      }),
      this.prisma.organization.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = organizations.slice(0, getMaxTake(take));
    const firstOrganization = nodes[0];
    const lastOrganization = nodes[nodes.length - 1];

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: organizations.length > nodes.length,
        startCursor: firstOrganization?.id,
        endCursor: lastOrganization?.id,
      },
    };
  }

  @PrimeDataLoader(OrganizationDataloaderService)
  async getOrganization({ id, slug }: OrganizationArgs, session: Session) {
    const lookup: Prisma.OrganizationWhereInput | null =
      id != null ? { id }
      : slug != null ? { slug }
      : null;

    if (!lookup) {
      throw new BadRequestException('Organization id or slug required.');
    }

    const organization = await this.prisma.organization.findFirst({
      where: {
        AND: [lookup, visibleOrganizationsWhere(session)],
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${id ?? slug} was not found.`);
    }

    return organization;
  }

  @PrimeDataLoader(OrganizationDataloaderService)
  async createOrganization(
    { enabled, partner, ...input }: CreateOrganizationInput,
    session: Session
  ) {
    const mayUpdateAny = mayUpdateAnyOrganization(session);
    const creator =
      session?.type === AuthSessionType.User ? session.user.id : null;

    if (!mayUpdateAny && !creator) {
      throw new ForbiddenException(
        'Only users can create organizations they will be a member of.'
      );
    }

    this.assertMayChangePrivilegedFields(
      { enabled, partner },
      { enabled: true, partner: false },
      session
    );
    await this.validate(input, null);

    const organization = await this.prisma.organization.create({
      data: {
        ...input,
        enabled: enabled ?? undefined,
        partner: partner ?? undefined,
        members:
          !mayUpdateAny && creator ?
            { create: { userId: creator } }
          : undefined,
      },
    });

    if (!mayUpdateAny) {
      await this.sessionCache.invalidate();
    }

    return organization;
  }

  @PrimeDataLoader(OrganizationDataloaderService)
  async updateOrganization(
    { id, enabled, partner, ...input }: UpdateOrganizationInput,
    session: Session
  ) {
    const existing = await this.findOrganizationOrFail(id);

    if (!canManageOrganization(session, id)) {
      throw new ForbiddenException(
        'You may only update organizations you are a member of.'
      );
    }

    this.assertMayChangePrivilegedFields(
      { enabled, partner },
      existing,
      session
    );
    await this.validate(input, existing);

    return this.prisma.organization.update({
      where: { id },
      data: {
        ...input,
        name: input.name ?? undefined,
        enabled: enabled ?? undefined,
        partner: partner ?? undefined,
      },
    });
  }

  async deleteOrganization(id: string, session: Session) {
    await this.findOrganizationOrFail(id);

    if (!canManageOrganization(session, id)) {
      throw new ForbiddenException(
        'You may only delete organizations you are a member of.'
      );
    }

    const organization = await this.prisma.organization.delete({
      where: { id },
    });
    await this.sessionCache.invalidate();

    return organization;
  }

  async addOrganizationMember({
    organizationId,
    userId,
  }: OrganizationMemberArgs) {
    await this.findOrganizationOrFail(organizationId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} was not found.`);
    }

    const member = await this.prisma.organizationMember.upsert({
      where: {
        userId_organizationId: { userId, organizationId },
      },
      create: { userId, organizationId },
      update: {},
    });
    await this.sessionCache.invalidate();

    return member;
  }

  async removeOrganizationMember({
    organizationId,
    userId,
  }: OrganizationMemberArgs) {
    const where = {
      userId_organizationId: { userId, organizationId },
    };

    const existing = await this.prisma.organizationMember.findUnique({
      where,
    });

    if (!existing) {
      throw new NotFoundException(
        `User ${userId} is not a member of organization ${organizationId}.`
      );
    }

    const member = await this.prisma.organizationMember.delete({ where });
    await this.sessionCache.invalidate();

    return member;
  }

  private async findOrganizationOrFail(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${id} was not found.`);
    }

    return organization;
  }

  private assertMayChangePrivilegedFields(
    requested: { enabled?: boolean | null; partner?: boolean | null },
    current: Pick<Organization, 'enabled' | 'partner'>,
    session: Session
  ) {
    const changes =
      (requested.enabled != null && requested.enabled !== current.enabled) ||
      (requested.partner != null && requested.partner !== current.partner);

    if (changes && !mayUpdateAnyOrganization(session)) {
      throw new ForbiddenException(
        'Changing partner or enabled needs CAN_UPDATE_OTHER_ORGANIZATIONS.'
      );
    }
  }

  private async validate(
    input: Partial<Omit<CreateOrganizationInput, 'enabled' | 'partner'>>,
    existing: Organization | null
  ) {
    const merged = { ...existing, ...input };

    if (!merged.name?.trim()) {
      throw new BadRequestException('Name must not be blank.');
    }

    if (merged.name.length > MAX_NAME_LENGTH) {
      throw new BadRequestException(
        `Name must not be longer than ${MAX_NAME_LENGTH} characters.`
      );
    }

    if (merged.zip && merged.zip.length > MAX_ZIP_LENGTH) {
      throw new BadRequestException(
        `Zip must not be longer than ${MAX_ZIP_LENGTH} characters.`
      );
    }

    if ((merged.latitude == null) !== (merged.longitude == null)) {
      throw new BadRequestException(
        'Latitude and longitude must be given together.'
      );
    }

    if (input.regionId != null && input.regionId !== existing?.regionId) {
      const region = await this.prisma.region.findUnique({
        where: { id: input.regionId },
      });

      if (!region) {
        throw new BadRequestException(
          `Region ${input.regionId} does not exist.`
        );
      }

      if (!region.enabled) {
        throw new BadRequestException(
          `Region ${input.regionId} does not accept new organizations.`
        );
      }
    }

    if (input.slug != null) {
      const owner = await this.prisma.organization.findUnique({
        where: { slug: input.slug },
      });

      if (owner && owner.id !== existing?.id) {
        throw new BadRequestException(
          `Slug ${input.slug} is used by another organization.`
        );
      }
    }
  }
}

export const createOrganizationOrder = (
  field: OrganizationSort,
  sortOrder: SortOrder
): Prisma.OrganizationOrderByWithRelationInput => {
  switch (field) {
    case OrganizationSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case OrganizationSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case OrganizationSort.Name:
    default:
      return {
        name: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const assertMayFilterBySensitiveData = (
  filter: Partial<OrganizationFilter> | undefined,
  session: Session
) => {
  const filtersBySensitiveData =
    filter?.hasMembers != null ||
    filter?.partner != null ||
    filter?.createdByMigration != null;

  if (filtersBySensitiveData && !mayReadAnyOrganization(session)) {
    throw new ForbiddenException(
      'Filtering by members, partner or createdByMigration needs CAN_GET_OTHER_ORGANIZATIONS.'
    );
  }
};

const createHasMembersFilter = (
  filter: Partial<OrganizationFilter> | undefined
): Prisma.OrganizationWhereInput => {
  if (filter?.hasMembers == null) {
    return {};
  }

  return filter.hasMembers ?
      { members: { some: {} } }
    : { members: { none: {} } };
};

export const createOrganizationFilter = (
  filter: Partial<OrganizationFilter> | undefined,
  session: Session
): Prisma.OrganizationWhereInput & { AND: Prisma.OrganizationWhereInput[] } => {
  assertMayFilterBySensitiveData(filter, session);

  return {
    AND: [
      visibleOrganizationsWhere(session),
      filter?.name ?
        { name: { contains: filter.name, mode: 'insensitive' } }
      : {},
      filter?.ids ? { id: { in: filter.ids } } : {},
      filter?.partner != null ? { partner: filter.partner } : {},
      filter?.enabled != null ? { enabled: filter.enabled } : {},
      filter?.regionId ? { regionId: filter.regionId } : {},
      filter?.createdByMigration != null ?
        { createdByMigration: filter.createdByMigration }
      : {},
      filter?.mine ? memberOrganizationsWhere(session) : {},
      createHasMembersFilter(filter),
    ],
  };
};
