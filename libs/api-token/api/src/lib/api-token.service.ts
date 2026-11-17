import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiToken, Prisma, PrismaClient, User } from '@prisma/client';
import {
  BLOCKED_API_TOKEN,
  EXPIRED_API_TOKEN,
} from '@wepublish/authentication/api';
import { CanCreateApiToken } from '@wepublish/permissions';
import {
  addPredefinedPermissions,
  permissionsOf,
} from '@wepublish/permissions/api';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  SortOrder,
} from '@wepublish/utils/api';

import {
  generateApiToken,
  hashApiToken,
  prefixOf,
  verifyApiToken,
} from './api-token.crypto';
import {
  ApiTokenBlockedReason,
  ApiTokenCreatorStateKind,
  ApiTokenListArgs,
  ApiTokenSort,
  ApiTokenStatus,
} from './api-token.model';

export interface CreateApiTokenInput {
  name: string;
  scopes: string[];
  expiresAt: Date;
}

export interface ApiTokenCreator {
  userId: string;
  permissions: string[];
}

export interface ApiTokenReader {
  userId: string;
  canSeeAll: boolean;
}

export interface ApiTokenRevoker {
  userId: string;
  canRevokeAll: boolean;
}

/**
 * A token acts on behalf of the user who created it: `permissions` are the
 * token's scopes that this user still holds right now.
 */
export interface ResolvedApiToken {
  apiToken: ApiToken;
  creator: Pick<User, 'id' | 'email'>;
  permissions: string[];
}

export interface ApiTokenCreatorCheck {
  state: ApiTokenCreatorStateKind;
  blockedReason: ApiTokenBlockedReason | null;
  /** Scopes of the key its creator no longer holds. */
  missingScopes: string[];
  creator: Pick<User, 'id' | 'email'> | null;
}

const blocked = (
  blockedReason: ApiTokenBlockedReason,
  creator: ApiTokenCreatorCheck['creator'] = null
): ApiTokenCreatorCheck => ({
  state: ApiTokenCreatorStateKind.Blocked,
  blockedReason,
  missingScopes: [],
  creator,
});

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
    { name, scopes, expiresAt }: CreateApiTokenInput,
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

    const token = generateApiToken();

    const apiToken = await this.prisma.apiToken.create({
      data: {
        name,
        scopes,
        expiresAt,
        tokenHash: await hashApiToken(token),
        prefix: prefixOf(token),
        createdById: creator.userId,
      },
    });

    return { apiToken, token };
  }

  async resolveToken(token: string): Promise<ResolvedApiToken | null> {
    const candidates = await this.prisma.apiToken.findMany({
      where: { prefix: prefixOf(token) },
    });

    let apiToken: ApiToken | undefined;

    for (const candidate of candidates) {
      if (await verifyApiToken(candidate.tokenHash, token)) {
        apiToken = candidate;
        break;
      }
    }

    if (!apiToken || apiToken.revokedAt) {
      return null;
    }

    if (apiToken.expiresAt && apiToken.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(
        `The API key expired on ${apiToken.expiresAt.toISOString()}`,
        { cause: EXPIRED_API_TOKEN }
      );
    }

    const check = await this.creatorCheck(apiToken);

    if (!check.creator || check.state === ApiTokenCreatorStateKind.Blocked) {
      throw new UnauthorizedException(
        (
          check.blockedReason ===
            ApiTokenBlockedReason.CreatorMayNotCreateApiTokens
        ) ?
          `The user who created the API key "${apiToken.name}" may no longer create API keys (${CanCreateApiToken.id}).`
        : `The user who created the API key "${apiToken.name}" no longer exists or is inactive.`,
        { cause: BLOCKED_API_TOKEN }
      );
    }

    await this.touch(apiToken);

    return {
      apiToken,
      creator: check.creator,
      permissions: apiToken.scopes.filter(
        scope => !check.missingScopes.includes(scope)
      ),
    };
  }

  /**
   * What the creator still allows this key. The one check behind both the
   * calls made with a key and what the key list shows, so they cannot differ.
   * Never cached: deleting, deactivating or demoting a user takes effect on
   * their keys at once.
   */
  async creatorCheck(
    apiToken: Pick<ApiToken, 'createdById' | 'scopes'>
  ): Promise<ApiTokenCreatorCheck> {
    const user =
      apiToken.createdById ?
        await this.prisma.user.findUnique({
          where: { id: apiToken.createdById },
        })
      : null;

    if (!user) {
      return blocked(ApiTokenBlockedReason.CreatorMissing);
    }

    const creator = { id: user.id, email: user.email };

    if (!user.active) {
      return blocked(ApiTokenBlockedReason.CreatorInactive, creator);
    }

    const roles = (
      await this.prisma.userRole.findMany({
        where: { id: { in: user.roleIDs } },
      })
    ).map(addPredefinedPermissions);
    const held = new Set(permissionsOf({ roles }));

    if (!held.has(CanCreateApiToken.id)) {
      return blocked(
        ApiTokenBlockedReason.CreatorMayNotCreateApiTokens,
        creator
      );
    }

    const missingScopes = apiToken.scopes.filter(scope => !held.has(scope));

    return {
      state:
        missingScopes.length ?
          ApiTokenCreatorStateKind.Limited
        : ApiTokenCreatorStateKind.Ok,
      blockedReason: null,
      missingScopes,
      creator,
    };
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
    const where: Prisma.ApiTokenWhereInput = {
      ...(reader.canSeeAll ?
        createdById ? { createdById }
        : {}
      : { createdById: reader.userId }),
      ...statusFilter(status),
    };

    const [totalCount, apiTokens] = await Promise.all([
      this.prisma.apiToken.count({ where }),
      sort === ApiTokenSort.ScopeCount ?
        this.byScopeCount(where, order, { cursorId, skip, take })
      : this.prisma.apiToken.findMany({
          where,
          skip,
          take: getMaxTake(take) + 1,
          orderBy: createApiTokenOrder(sort, order),
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

  /**
   * The database cannot order by the length of `scopes`, so the matching keys
   * are sorted here. A medium has a few dozen keys at most.
   */
  private async byScopeCount(
    where: Prisma.ApiTokenWhereInput,
    order: SortOrder,
    {
      cursorId,
      skip = 0,
      take = 10,
    }: Pick<ApiTokenListArgs, 'cursorId' | 'skip' | 'take'>
  ) {
    const direction = order === SortOrder.Ascending ? 1 : -1;
    // Newest first among keys with as many permissions, as without sorting.
    const sorted = (
      await this.prisma.apiToken.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
    ).sort((a, b) => direction * (a.scopes.length - b.scopes.length));
    const start =
      cursorId ?
        Math.max(
          0,
          sorted.findIndex(({ id }) => id === cursorId)
        )
      : 0;

    return sorted.slice(start + skip, start + skip + getMaxTake(take) + 1);
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

    case ApiTokenSort.ExpiresAt:
      return { expiresAt: graphQLSortOrderToPrisma(sortOrder) };

    case ApiTokenSort.Owner: {
      const direction = graphQLSortOrderToPrisma(sortOrder);

      return [
        { createdBy: { name: direction } },
        { createdBy: { firstName: direction } },
      ];
    }

    // Active (not revoked, expiring later) < expired < revoked.
    case ApiTokenSort.Status:
      return sortOrder === SortOrder.Ascending ?
          [
            { revokedAt: { sort: 'asc', nulls: 'first' } },
            { expiresAt: 'desc' },
          ]
        : [
            { revokedAt: { sort: 'desc', nulls: 'last' } },
            { expiresAt: 'asc' },
          ];

    // Sorted in memory, see `byScopeCount`.
    case ApiTokenSort.ScopeCount:
      return { createdAt: 'desc' };
  }
};
