import { Test } from '@nestjs/testing';
import { AuditLogAction, PrismaClient } from '@prisma/client';
import { SortOrder } from '@wepublish/utils/api';
import { AuditLogService, createAuditLogFilter } from './audit-log.service';

describe('createAuditLogFilter', () => {
  it('is empty for an empty filter', () => {
    expect(createAuditLogFilter({})).toEqual({});
  });

  it('searches across the readable columns', () => {
    expect(createAuditLogFilter({ search: 'article' }).OR).toEqual([
      { mutation: { contains: 'article', mode: 'insensitive' } },
      { entity: { contains: 'article', mode: 'insensitive' } },
      { recordId: { contains: 'article', mode: 'insensitive' } },
      { userEmail: { contains: 'article', mode: 'insensitive' } },
      { tokenName: { contains: 'article', mode: 'insensitive' } },
    ]);
  });

  it('matches a session exactly', () => {
    expect(createAuditLogFilter({ sessionID: 'session-1' })).toEqual({
      sessionID: 'session-1',
    });
  });

  it('combines a date range into one condition', () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-02-01');

    expect(createAuditLogFilter({ from, to }).createdAt).toEqual({
      gte: from,
      lte: to,
    });
  });

  it('keeps an open ended date range open', () => {
    const from = new Date('2026-01-01');

    expect(createAuditLogFilter({ from }).createdAt).toEqual({
      gte: from,
      lte: undefined,
    });
  });

  it('filters impersonated entries', () => {
    expect(createAuditLogFilter({ impersonatedOnly: true })).toEqual({
      impersonatedBy: { not: null },
    });
  });

  it('does not filter impersonation when the flag is false', () => {
    expect(createAuditLogFilter({ impersonatedOnly: false })).toEqual({});
  });

  it('keeps success false as a filter', () => {
    expect(createAuditLogFilter({ success: false })).toEqual({
      success: false,
    });
  });

  it('filters by several actions', () => {
    expect(
      createAuditLogFilter({
        actions: [AuditLogAction.create, AuditLogAction.delete],
      })
    ).toEqual({
      action: { in: [AuditLogAction.create, AuditLogAction.delete] },
    });
  });
});

describe('AuditLogService', () => {
  let service: AuditLogService;
  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaClient, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(AuditLogService);
  });

  describe('record', () => {
    it('writes the entry', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({});

      await service.record({
        mutation: 'updateArticle',
        action: AuditLogAction.update,
        actorType: 'user',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ mutation: 'updateArticle' }),
      });
    });

    it('swallows a write failure', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('table missing'));

      await expect(
        service.record({
          mutation: 'updateArticle',
          action: AuditLogAction.update,
          actorType: 'user',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('getAuditLogs', () => {
    it('reports another page when more rows than requested come back', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(3);
      mockPrisma.auditLog.findMany.mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
      ]);

      const result = await service.getAuditLogs({ take: 2, skip: 0 });

      expect(result.nodes).toHaveLength(2);
      expect(result.totalCount).toBe(3);
      expect(result.pageInfo).toEqual({
        hasPreviousPage: false,
        hasNextPage: true,
        startCursor: 'a',
        endCursor: 'b',
      });
    });

    it('reports a previous page once skipping', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(1);
      mockPrisma.auditLog.findMany.mockResolvedValue([{ id: 'a' }]);

      const result = await service.getAuditLogs({ take: 10, skip: 10 });

      expect(result.pageInfo.hasPreviousPage).toBe(true);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('sorts newest first by default', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      await service.getAuditLogs({});

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } })
      );
    });

    it('can sort oldest first', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      await service.getAuditLogs({ order: SortOrder.Ascending });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } })
      );
    });
  });

  describe('getAuditLogsSafe', () => {
    it('reports support when the read works', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(1);
      mockPrisma.auditLog.findMany.mockResolvedValue([{ id: 'a' }]);

      const result = await service.getAuditLogsSafe({});

      expect(result.supported).toBe(true);
      expect(result.nodes).toEqual([{ id: 'a' }]);
    });

    it('reports an empty unsupported page instead of throwing', async () => {
      mockPrisma.auditLog.count.mockRejectedValue(
        new Error('relation "audit_logs" does not exist')
      );
      mockPrisma.auditLog.findMany.mockRejectedValue(
        new Error('relation "audit_logs" does not exist')
      );

      expect(await service.getAuditLogsSafe({})).toEqual({
        nodes: [],
        totalCount: 0,
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          startCursor: undefined,
          endCursor: undefined,
        },
        supported: false,
      });
    });
  });

  describe('deleteOlderThan', () => {
    it('deletes the batch it found', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
      ]);
      mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 2 });

      const cutoff = new Date('2026-01-01');

      expect(await service.deleteOlderThan(cutoff, 10)).toBe(2);
      expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['a', 'b'] } },
      });
    });

    it('does not delete when nothing expired', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      expect(await service.deleteOlderThan(new Date(), 10)).toBe(0);
      expect(mockPrisma.auditLog.deleteMany).not.toHaveBeenCalled();
    });
  });
});
