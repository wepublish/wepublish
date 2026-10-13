import { Injectable } from '@nestjs/common';
import { AuditLogService } from '@wepublish/audit-log/api';
import { SortOrder } from '@wepublish/utils/api';
import {
  MediumAuditLogFilter,
  MediumAuditLogPage,
} from './medium-audit-log.model';

export const AUDIT_LOG_LIST_LIMIT = 100;

@Injectable()
export class MediumAuditLogService {
  constructor(private auditLogService: AuditLogService) {}

  async listAuditLogs(
    filter?: MediumAuditLogFilter,
    limit = AUDIT_LOG_LIST_LIMIT,
    skip = 0
  ): Promise<MediumAuditLogPage> {
    const { nodes, totalCount, supported } =
      await this.auditLogService.getAuditLogsSafe({
        filter,
        skip: Math.max(skip, 0),
        take: Math.min(Math.max(limit, 1), AUDIT_LOG_LIST_LIMIT),
        order: SortOrder.Descending,
      });

    return { nodes, totalCount, supported };
  }
}
