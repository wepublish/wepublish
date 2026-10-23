import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Organization, Prisma, PrismaClient, TagType } from '@prisma/client';
import {
  AuthSession,
  AuthSessionType,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import {
  ORGANIZATION_CONTACT_LABEL_MAX_LENGTH,
  ORGANIZATION_CONTACTS_MAX,
  ORGANIZATION_TAGS_MAX,
  organizationAffiliationIdsSchema,
  organizationContactsSchema,
  organizationTagIdsSchema,
} from '@wepublish/event/schedule';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
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
import { assertValidLocation } from '../location-rules';
import { OrganizationDataloaderService } from './organization-dataloader.service';
import {
  CreateOrganizationInput,
  OrganizationArgs,
  OrganizationContactInput,
  OrganizationFilter,
  OrganizationListArgs,
  OrganizationMemberArgs,
  OrganizationSort,
  UpdateOrganizationInput,
} from './organization.model';

type Session = AuthSession | null | undefined;

const MAX_NAME_LENGTH = 100;

type OrganizationRelationsInput = Pick<
  CreateOrganizationInput,
  'tagIds' | 'affiliationIds' | 'contacts'
>;

const blankToNull = (value: string | null | undefined) => value?.trim() || null;

const contactData = (contacts: OrganizationContactInput[]) =>
  contacts.map(({ label, email, phone }) => ({
    label: blankToNull(label),
    email: blankToNull(email),
    phone: blankToNull(phone),
  }));

const relationsData = (
  { tagIds, affiliationIds, contacts }: OrganizationRelationsInput,
  replace: boolean
) => {
  const write = <T>(data: T[] | undefined) =>
    data === undefined ? undefined
    : replace ? { deleteMany: {}, createMany: { data } }
    : { createMany: { data } };

  return {
    tags: write(tagIds?.map(tagId => ({ tagId }))),
    affiliations: write(
      affiliationIds?.map(affiliationId => ({ affiliationId }))
    ),
    contacts: write(contacts ? contactData(contacts) : undefined),
  };
};

const withoutUndefined = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaClient,
    private sessionCache: SessionCacheInvalidator,
    private publicContentCache: PublicContentCacheInvalidator
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
    {
      enabled,
      partner,
      tagIds,
      affiliationIds,
      contacts,
      ...input
    }: CreateOrganizationInput,
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

    const relations = this.presentRelations({
      tagIds,
      affiliationIds,
      contacts,
    });
    await this.assertValidRelations(relations);

    const organization = await this.prisma.organization.create({
      data: {
        ...input,
        ...withoutUndefined(relationsData(relations, false)),
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
    {
      id,
      enabled,
      partner,
      tagIds,
      affiliationIds,
      contacts,
      ...input
    }: UpdateOrganizationInput,
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

    const relations = this.presentRelations({
      tagIds,
      affiliationIds,
      contacts,
    });
    await this.assertValidRelations(relations);

    const organization = await this.prisma.organization.update({
      where: { id },
      data: {
        ...input,
        ...withoutUndefined(relationsData(relations, true)),
        name: input.name ?? undefined,
        enabled: enabled ?? undefined,
        partner: partner ?? undefined,
      },
    });
    await this.publicContentCache.invalidate('events');

    return organization;
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
    await this.publicContentCache.invalidate('events');

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

  private presentRelations({
    tagIds,
    affiliationIds,
    contacts,
  }: OrganizationRelationsInput) {
    return {
      tagIds: tagIds ?? undefined,
      affiliationIds: affiliationIds ?? undefined,
      contacts: contacts ?? undefined,
    };
  }

  private async assertValidRelations({
    tagIds,
    affiliationIds,
    contacts,
  }: OrganizationRelationsInput) {
    if (tagIds && !organizationTagIdsSchema.safeParse(tagIds).success) {
      throw new BadRequestException(
        `An organization takes at most ${ORGANIZATION_TAGS_MAX} distinct tags.`
      );
    }

    if (
      affiliationIds &&
      !organizationAffiliationIdsSchema.safeParse(affiliationIds).success
    ) {
      throw new BadRequestException('Affiliations must be distinct.');
    }

    if (contacts && !organizationContactsSchema.safeParse(contacts).success) {
      throw new BadRequestException(
        `An organization takes at most ${ORGANIZATION_CONTACTS_MAX} contacts, each with an email address or a phone number, a valid email and a label of at most ${ORGANIZATION_CONTACT_LABEL_MAX_LENGTH} characters.`
      );
    }

    if (tagIds?.length) {
      const found = await this.prisma.tag.count({
        where: { id: { in: tagIds }, type: TagType.Event },
      });

      if (found !== tagIds.length) {
        throw new BadRequestException(
          'Every tag must be an existing event tag.'
        );
      }
    }

    if (affiliationIds?.length) {
      const found = await this.prisma.affiliation.count({
        where: { id: { in: affiliationIds } },
      });

      if (found !== affiliationIds.length) {
        throw new BadRequestException(
          'Every affiliation must be an existing one.'
        );
      }
    }
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

    assertValidLocation(merged);

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
