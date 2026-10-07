import {
  AuditLogRetentionService,
  DEFAULT_RETENTION_DAYS,
  MAX_BATCHES_PER_RUN,
  RETENTION_BATCH_SIZE,
} from './audit-log-retention.service';
import { ConfigService } from '@nestjs/config';
import { AuditLogService } from './audit-log.service';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import type { Mock } from 'vitest';

describe('AuditLogRetentionService', () => {
  let service: AuditLogRetentionService;
  let auditLogService: { deleteOlderThan: Mock };
  let configured: string | undefined;

  const withRetention = (value: string | undefined) => {
    configured = value;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    configured = undefined;
    auditLogService = { deleteOlderThan: vi.fn().mockResolvedValue(0) };

    const config = { get: vi.fn(() => configured) };

    service = new AuditLogRetentionService(
      auditLogService as unknown as AuditLogService,
      config as unknown as ConfigService,
      {} as unknown as KvTtlCacheService
    );
  });

  describe('once a night', () => {
    const night = (claimed: boolean | undefined) => {
      const kv = { claim: vi.fn().mockResolvedValue(claimed) };
      const retention = new AuditLogRetentionService(
        auditLogService as unknown as AuditLogService,
        { get: vi.fn() } as unknown as ConfigService,
        kv as unknown as KvTtlCacheService
      );

      return { retention, kv };
    };

    it('prunes on the replica that claims the night', async () => {
      await night(true).retention.pruneNightly();

      expect(auditLogService.deleteOlderThan).toHaveBeenCalled();
    });

    it('leaves the night to the replica that claimed it', async () => {
      await night(false).retention.pruneNightly();

      expect(auditLogService.deleteOlderThan).not.toHaveBeenCalled();
    });

    it('still prunes when Dragonfly cannot tell who claimed the night, because deleting old entries twice is harmless', async () => {
      auditLogService.deleteOlderThan.mockResolvedValueOnce(3);

      expect(await night(undefined).retention.pruneNightly()).toBe(3);
      expect(auditLogService.deleteOlderThan).toHaveBeenCalled();
    });

    it('keeps trying to claim the night for a while, so a short Dragonfly blip does not skip it', async () => {
      const { retention, kv } = night(true);

      await retention.pruneNightly();

      const [[, , options]] = kv.claim.mock.calls;
      expect(options.retryForMs).toBeGreaterThanOrEqual(30_000);
    });

    it('claims the night for longer than a run takes, but frees it before the next night', async () => {
      const { retention, kv } = night(true);

      await retention.pruneNightly();

      const [[name, ttlMs]] = kv.claim.mock.calls;
      expect(name).toBe('audit-log-retention');
      expect(ttlMs).toBeGreaterThanOrEqual(2 * 60 * 60 * 1000);
      expect(ttlMs).toBeLessThan(24 * 60 * 60 * 1000);
    });
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
