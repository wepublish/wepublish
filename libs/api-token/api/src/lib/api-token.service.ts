import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiToken, Prisma, PrismaClient, User } from '@prisma/client';
import {
  EXPIRED_API_TOKEN,
  unselectPassword,
} from '@wepublish/authentication/api';
import {
  CanUpdateOtherOrganizations,
  CrossOrganizationPermissions,
} from '@wepublish/permissions';
import { addPredefinedPermissions } from '@wepublish/permissions/api';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  SortOrder,
} from '@wepublish/utils/api';

import { generateApiToken, hashApiToken, prefixOf } from './api-token.crypto';
import {
  ApiTokenListArgs,
  ApiTokenSort,
  ApiTokenStatus,
} from './api-token.model';

export interface CreateApiTokenInput {
  name: string;
  scopes: string[];
  expiresAt: Date;
  organizationId?: string | null;
}

export type ResolvedApiToken = ApiToken & { createdBy: User | null };

export interface ApiTokenCreator {
  userId: string;
  permissions: string[];
  organizationIds: string[];
}

export interface ApiTokenReader {
  userId: string;
  canSeeAll: boolean;
}

export interface ApiTokenRevoker {
  userId: string;
  canRevokeAll: boolean;
}

const LAST_USED_RESOLUTION_MS = 60_000;

const statusFilter = (status?: ApiTokenStatus): Prisma.ApiTokenWhereInput => {
  switch (status) {
    case ApiTokenStatus.Active:
      return { revokedAt: null, expiresAt: { gt: new Date() } };

    case ApiTokenStatus.Expired:
      return { revokedAt: null, expiresAt: { lte: new Date() } };

    case ApiTokenStatus.Revoked:
      return { revokedAt: { not: null } };

    default:
      return {};
  }
};

export const MAX_LIFETIME_YEARS = 3;
export const RECOMMENDED_LIFETIME_YEARS = 1;

const yearsFromNow = (years: number) => {
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() + years);

  return limit;
};

@Injectable()
export class ApiTokenService {
  constructor(private prisma: PrismaClient) {}

  async createToken(
    { name, scopes, expiresAt, organizationId }: CreateApiTokenInput,
    creator: ApiTokenCreator
  ): Promise<{ apiToken: ApiToken; token: string }> {
    const ungranted = scopes.filter(
      scope => !creator.permissions.includes(scope)
    );

    if (ungranted.length) {
      throw new ForbiddenException(
        `Cannot grant a token permissions you do not hold yourself: ${ungranted.join(', ')}`
      );
    }

    if (!expiresAt) {
      throw new BadRequestException(`A token needs an expiry date.`);
    }

    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(`A token has to expire in the future.`);
    }

    if (expiresAt > yearsFromNow(MAX_LIFETIME_YEARS)) {
      throw new BadRequestException(
        `A token cannot last longer than three years.`
      );
    }

    if (organizationId != null) {
      await this.assertMayBindToOrganization(organizationId, scopes, creator);
    }

    const token = generateApiToken();

    const apiToken = await this.prisma.apiToken.create({
      data: {
        name,
        scopes,
        expiresAt,
        tokenHash: hashApiToken(token),
        prefix: prefixOf(token),
        createdById: creator.userId,
        organizationId: organizationId ?? null,
      },
    });

    return { apiToken, token };
  }

  async resolveToken(token: string): Promise<ResolvedApiToken | null> {
    const apiToken = await this.prisma.apiToken.findUnique({
      where: { tokenHash: hashApiToken(token) },
      include: { createdBy: { select: unselectPassword } },
    });

    if (!apiToken || apiToken.revokedAt) {
      return null;
    }

    if (apiToken.expiresAt && apiToken.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(
        `The API key expired on ${apiToken.expiresAt.toISOString()}`,
        { cause: EXPIRED_API_TOKEN }
      );
    }

    if (!(await this.creatorMayStillBind(apiToken))) {
      return null;
    }

    await this.touch(apiToken);

    return apiToken;
  }

  async getApiTokens(
    {
      cursorId,
      sort = ApiTokenSort.CreatedAt,
      order = SortOrder.Descending,
      take = 10,
      skip,
      createdById,
      status,
    }: ApiTokenListArgs,
    reader: ApiTokenReader
  ) {
    const orderBy = createApiTokenOrder(sort, order);
    const where: Prisma.ApiTokenWhereInput = {
      ...(reader.canSeeAll ?
        createdById ? { createdById }
        : {}
      : { createdById: reader.userId }),
      ...statusFilter(status),
    };

    const [totalCount, apiTokens] = await Promise.all([
      this.prisma.apiToken.count({ where, orderBy }),
      this.prisma.apiToken.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = apiTokens.slice(0, getMaxTake(take));
    const firstToken = nodes[0];
    const lastToken = nodes[nodes.length - 1];

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: apiTokens.length > nodes.length,
        startCursor: firstToken?.id,
        endCursor: lastToken?.id,
      },
    };
  }

  async revokeToken(id: string, revoker: ApiTokenRevoker): Promise<ApiToken> {
    if (!revoker.canRevokeAll) {
      const existing = await this.prisma.apiToken.findUnique({ where: { id } });

      if (existing?.createdById !== revoker.userId) {
        throw new ForbiddenException(
          'You may only revoke api tokens you created yourself'
        );
      }
    }

    return this.prisma.apiToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  private async assertMayBindToOrganization(
    organizationId: string,
    scopes: string[],
    creator: ApiTokenCreator
  ) {
    const isMember = creator.organizationIds.includes(organizationId);
    const mayUpdateAny = creator.permissions.includes(
      CanUpdateOtherOrganizations.id
    );

    if (!isMember && !mayUpdateAny) {
      throw new ForbiddenException(
        `You may only bind a token to an organization you are a member of.`
      );
    }

    const crossOrganization = scopes.filter(scope =>
      CrossOrganizationPermissions.some(({ id }) => id === scope)
    );

    if (crossOrganization.length) {
      throw new BadRequestException(
        `A token bound to an organization cannot reach other organizations: ${crossOrganization.join(', ')}`
      );
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!organization) {
      throw new BadRequestException(
        `Organization ${organizationId} does not exist.`
      );
    }
  }

  private async creatorMayStillBind({
    organizationId,
    createdById,
  }: ApiToken): Promise<boolean> {
    if (organizationId == null) {
      return true;
    }

    if (createdById == null) {
      return false;
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId: createdById, organizationId },
      },
      select: { userId: true },
    });

    if (membership) {
      return true;
    }

    const creator = await this.prisma.user.findUnique({
      where: { id: createdById },
      select: { roleIDs: true },
    });

    if (!creator) {
      return false;
    }

    const roles = await this.prisma.userRole.findMany({
      where: { id: { in: creator.roleIDs } },
      select: { id: true, permissionIDs: true },
    });

    return roles
      .map(addPredefinedPermissions)
      .some(role =>
        role.permissionIDs.includes(CanUpdateOtherOrganizations.id)
      );
  }

  private async touch(apiToken: ApiToken): Promise<void> {
    const lastUsedAt = apiToken.lastUsedAt?.getTime() ?? 0;

    if (Date.now() - lastUsedAt < LAST_USED_RESOLUTION_MS) {
      return;
    }

    await this.prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });
  }
}

export const createApiTokenOrder = (
  field: ApiTokenSort,
  sortOrder: SortOrder
): Prisma.ApiTokenFindManyArgs['orderBy'] => {
  switch (field) {
    case ApiTokenSort.CreatedAt:
      return { createdAt: graphQLSortOrderToPrisma(sortOrder) };

    case ApiTokenSort.LastUsedAt:
      return { lastUsedAt: graphQLSortOrderToPrisma(sortOrder) };

    case ApiTokenSort.Name:
      return { name: graphQLSortOrderToPrisma(sortOrder) };
  }
};
