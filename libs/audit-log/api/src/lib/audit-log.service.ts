import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { getMaxTake, logger, SortOrder } from '@wepublish/utils/api';
import { AuditLogFilter, AuditLogListArgs } from './audit-log.model';

export type CreateAuditLogEntry = Prisma.AuditLogCreateInput;

export const createAuditLogFilter = (
  filter: AuditLogFilter
): Prisma.AuditLogWhereInput => {
  const where: Prisma.AuditLogWhereInput = {};

  if (filter.search) {
    where.OR = [
      { mutation: { contains: filter.search, mode: 'insensitive' } },
      { entity: { contains: filter.search, mode: 'insensitive' } },
      { recordId: { contains: filter.search, mode: 'insensitive' } },
      { userEmail: { contains: filter.search, mode: 'insensitive' } },
      { tokenName: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  if (filter.userID) {
    where.userID = filter.userID;
  }

  if (filter.userEmail) {
    where.userEmail = { contains: filter.userEmail, mode: 'insensitive' };
  }

  if (filter.sessionID) {
    where.sessionID = filter.sessionID;
  }

  if (filter.entity) {
    where.entity = filter.entity;
  }

  if (filter.recordId) {
    where.recordId = filter.recordId;
  }

  if (filter.mutation) {
    where.mutation = { contains: filter.mutation, mode: 'insensitive' };
  }

  if (filter.actions?.length) {
    where.action = { in: filter.actions };
  }

  if (filter.actorType) {
    where.actorType = filter.actorType;
  }

  if (filter.success != null) {
    where.success = filter.success;
  }

  if (filter.impersonatedOnly) {
    where.impersonatedBy = { not: null };
  }

  if (filter.from || filter.to) {
    where.createdAt = {
      gte: filter.from ?? undefined,
      lte: filter.to ?? undefined,
    };
  }

  return where;
};

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaClient) {}

  async record(entry: CreateAuditLogEntry) {
    try {
      await this.prisma.auditLog.create({ data: entry });
    } catch (error) {
      logger('audit-log').error(
        `Could not write audit log entry for ${entry.mutation}: ${
          (error as Error).message
        }`
      );
    }
  }

  async getAuditLogs({
    filter,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: AuditLogListArgs) {
    const where = createAuditLogFilter(filter ?? {});
    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
      createdAt: order === SortOrder.Ascending ? 'asc' : 'desc',
    };

    const [totalCount, auditLogs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = auditLogs.slice(0, getMaxTake(take));
    const firstEntry = nodes[0];
    const lastEntry = nodes[nodes.length - 1];

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: auditLogs.length > nodes.length,
        startCursor: firstEntry?.id,
        endCursor: lastEntry?.id,
      },
    };
  }

  async getAuditLogsSafe(args: AuditLogListArgs) {
    try {
      return { ...(await this.getAuditLogs(args)), supported: true };
    } catch (error) {
      logger('audit-log').warn(
        `Could not read audit logs: ${(error as Error).message}`
      );

      return {
        nodes: [],
        totalCount: 0,
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          startCursor: undefined,
          endCursor: undefined,
        },
        supported: false,
      };
    }
  }

  async deleteOlderThan(cutoff: Date, batchSize: number) {
    const expired = await this.prisma.auditLog.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true },
      take: batchSize,
    });

    if (!expired.length) {
      return 0;
    }

    const { count } = await this.prisma.auditLog.deleteMany({
      where: { id: { in: expired.map(({ id }) => id) } },
    });

    return count;
  }
}
