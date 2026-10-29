import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiToken, Prisma, PrismaClient } from '@prisma/client';
import { EXPIRED_API_TOKEN } from '@wepublish/authentication/api';
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
        tokenHash: hashApiToken(token),
        prefix: prefixOf(token),
        createdById: creator.userId,
      },
    });

    return { apiToken, token };
  }

  async resolveToken(token: string): Promise<ApiToken | null> {
    const apiToken = await this.prisma.apiToken.findUnique({
      where: { tokenHash: hashApiToken(token) },
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
