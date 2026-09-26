import {
  AuditLogRetentionService,
  DEFAULT_RETENTION_DAYS,
  MAX_BATCHES_PER_RUN,
  RETENTION_BATCH_SIZE,
} from './audit-log-retention.service';
import { AuditLogService } from './audit-log.service';

describe('AuditLogRetentionService', () => {
  let service: AuditLogRetentionService;
  let auditLogService: { deleteOlderThan: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env['AUDIT_LOG_RETENTION_DAYS'];
    auditLogService = { deleteOlderThan: jest.fn().mockResolvedValue(0) };
    service = new AuditLogRetentionService(
      auditLogService as unknown as AuditLogService
    );
  });

  afterEach(() => {
    delete process.env['AUDIT_LOG_RETENTION_DAYS'];
  });

  describe('retentionDays', () => {
    it('defaults to a year', () => {
      expect(service.retentionDays).toBe(DEFAULT_RETENTION_DAYS);
    });

    it('takes a configured value', () => {
      process.env['AUDIT_LOG_RETENTION_DAYS'] = '30';

      expect(service.retentionDays).toBe(30);
    });

    it('ignores a non numeric value', () => {
      process.env['AUDIT_LOG_RETENTION_DAYS'] = 'forever';

      expect(service.retentionDays).toBe(DEFAULT_RETENTION_DAYS);
    });

    it('ignores a zero or negative value', () => {
      process.env['AUDIT_LOG_RETENTION_DAYS'] = '0';
      expect(service.retentionDays).toBe(DEFAULT_RETENTION_DAYS);

      process.env['AUDIT_LOG_RETENTION_DAYS'] = '-5';
      expect(service.retentionDays).toBe(DEFAULT_RETENTION_DAYS);
    });
  });

  describe('cutoffDate', () => {
    it('is the retention window before now', () => {
      process.env['AUDIT_LOG_RETENTION_DAYS'] = '10';
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
