import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ImpersonationUser } from './impersonation.model';

export const USER_SEARCH_LIMIT = 25;

export function clampSearchLimit(limit: number | undefined): number {
  if (!limit || limit < 1) {
    return 10;
  }

  return Math.min(limit, USER_SEARCH_LIMIT);
}

@Injectable()
export class ImpersonationSearchService {
  constructor(private prisma: PrismaClient) {}

  async searchUsers(
    query: string,
    limit?: number
  ): Promise<ImpersonationUser[]> {
    const term = (query ?? '').trim();

    if (term.length < 2) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        roleIDs: true,
      },
      orderBy: { email: 'asc' },
      take: clampSearchLimit(limit),
    });

    const roleIds = [...new Set(users.flatMap(user => user.roleIDs))];

    const roles =
      roleIds.length ?
        await this.prisma.userRole.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, name: true },
        })
      : [];

    const roleNameById = new Map(roles.map(role => [role.id, role.name]));

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      active: user.active,
      roles: user.roleIDs.map(id => roleNameById.get(id) ?? id),
    }));
  }
}
