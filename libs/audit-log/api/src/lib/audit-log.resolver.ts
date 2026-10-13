import { Args, Query, Resolver } from '@nestjs/graphql';
import { Permissions } from '@wepublish/permissions/api';
import { CanGetAuditLogs } from '@wepublish/permissions';
import { AuditLogListArgs, PaginatedAuditLogs } from './audit-log.model';
import { AuditLogService } from './audit-log.service';

@Resolver(() => PaginatedAuditLogs)
export class AuditLogResolver {
  constructor(private auditLogService: AuditLogService) {}

  @Permissions(CanGetAuditLogs)
  @Query(() => PaginatedAuditLogs, {
    description: `Returns a paginated list of audit log entries based on the filters given.`,
  })
  public auditLogs(@Args() args: AuditLogListArgs) {
    return this.auditLogService.getAuditLogsSafe(args);
  }
}
