import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { logger } from '@wepublish/utils/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { AuditLogService } from './audit-log.service';

export const DEFAULT_RETENTION_DAYS = 365;
export const RETENTION_BATCH_SIZE = 10_000;
export const MAX_BATCHES_PER_RUN = 20;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const NIGHT_CLAIM_MS = 12 * 60 * 60 * 1000;

@Injectable()
export class AuditLogRetentionService {
  constructor(
    private auditLogService: AuditLogService,
    private config: ConfigService,
    private kv: KvTtlCacheService
  ) {}

  get retentionDays() {
    const configured = Number(this.config.get('AUDIT_LOG_RETENTION_DAYS'));

    return Number.isFinite(configured) && configured > 0 ?
        configured
      : DEFAULT_RETENTION_DAYS;
  }

  cutoffDate(now = new Date()) {
    return new Date(now.getTime() - this.retentionDays * MS_PER_DAY);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'auditLogRetention' })
  async pruneNightly() {
    const claimed = await this.kv.claim('audit-log-retention', NIGHT_CLAIM_MS);

    if (claimed === undefined) {
      logger('audit-log').error(
        'Audit log retention not run: without Dragonfly (REDIS_URL unset or Dragonfly unreachable) nothing makes sure only one replica runs it. The next run catches up.'
      );

      return 0;
    }

    return claimed ? this.pruneExpiredEntries() : 0;
  }

  async pruneExpiredEntries() {
    const cutoff = this.cutoffDate();
    let deleted = 0;

    for (let batch = 0; batch < MAX_BATCHES_PER_RUN; batch++) {
      const count = await this.auditLogService.deleteOlderThan(
        cutoff,
        RETENTION_BATCH_SIZE
      );

      deleted += count;

      if (count < RETENTION_BATCH_SIZE) {
        break;
      }
    }

    if (deleted) {
      logger('audit-log').info(
        `Pruned ${deleted} audit log entries older than ${cutoff.toISOString()}`
      );
    }

    return deleted;
  }
}
