import {
  AuditLogRetentionService,
  DEFAULT_RETENTION_DAYS,
  MAX_BATCHES_PER_RUN,
  RETENTION_BATCH_SIZE,
} from './audit-log-retention.service';
import { ConfigService } from '@nestjs/config';
import { AuditLogService } from './audit-log.service';

describe('AuditLogRetentionService', () => {
  let service: AuditLogRetentionService;
  let auditLogService: { deleteOlderThan: jest.Mock };
  let configured: string | undefined;

  const withRetention = (value: string | undefined) => {
    configured = value;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    configured = undefined;
    auditLogService = { deleteOlderThan: jest.fn().mockResolvedValue(0) };

    const config = { get: jest.fn(() => configured) };

    service = new AuditLogRetentionService(
      auditLogService as unknown as AuditLogService,
      config as unknown as ConfigService
    );
  });

  describe('retentionDays', () => {
    it('defaults to a year', () => {
      expect(service.retentionDays).toBe(DEFAULT_RETENTION_DAYS);
    });

    it('takes a configured value', () => {
      withRetention('30');

      expect(service.retentionDays).toBe(30);
    });

    it('ignores a non numeric value', () => {
      withRetention('forever');

      expect(service.retentionDays).toBe(DEFAULT_RETENTION_DAYS);
    });

    it('ignores a zero or negative value', () => {
      withRetention('0');
      expect(service.retentionDays).toBe(DEFAULT_RETENTION_DAYS);

      withRetention('-5');
      expect(service.retentionDays).toBe(DEFAULT_RETENTION_DAYS);
    });
  });

  describe('cutoffDate', () => {
    it('is the retention window before now', () => {
      withRetention('10');
      const now = new Date('2026-09-24T00:00:00.000Z');

      expect(service.cutoffDate(now).toISOString()).toBe(
        '2026-09-14T00:00:00.000Z'
      );
    });
  });

  describe('pruneExpiredEntries', () => {
    it('stops after a partial batch', async () => {
      auditLogService.deleteOlderThan.mockResolvedValueOnce(5);

      expect(await service.pruneExpiredEntries()).toBe(5);
      expect(auditLogService.deleteOlderThan).toHaveBeenCalledTimes(1);
    });

    it('keeps going while batches come back full', async () => {
      auditLogService.deleteOlderThan
        .mockResolvedValueOnce(RETENTION_BATCH_SIZE)
        .mockResolvedValueOnce(RETENTION_BATCH_SIZE)
        .mockResolvedValueOnce(1);

      expect(await service.pruneExpiredEntries()).toBe(
        RETENTION_BATCH_SIZE * 2 + 1
      );
      expect(auditLogService.deleteOlderThan).toHaveBeenCalledTimes(3);
    });

    it('does not run forever', async () => {
      auditLogService.deleteOlderThan.mockResolvedValue(RETENTION_BATCH_SIZE);

      await service.pruneExpiredEntries();

      expect(auditLogService.deleteOlderThan).toHaveBeenCalledTimes(
        MAX_BATCHES_PER_RUN
      );
    });

    it('deletes nothing when nothing expired', async () => {
      expect(await service.pruneExpiredEntries()).toBe(0);
    });
  });
});
