import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import {
  MediumAuditLogFilter,
  MediumAuditLogPage,
} from './medium-audit-log.model';
import { MediumAuditLogService } from './medium-audit-log.service';
import { OneScopedJwt } from './one-scoped-jwt.decorator';

@Resolver()
export class MediumAuditLogResolver {
  constructor(private mediumAuditLogService: MediumAuditLogService) {}

  @OneScopedJwt('read:stats')
  @Query(() => MediumAuditLogPage, { name: 'mediumAuditLogs' })
  async getMediumAuditLogs(
    @Args('filter', { type: () => MediumAuditLogFilter, nullable: true })
    filter?: MediumAuditLogFilter,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number
  ): Promise<MediumAuditLogPage> {
    return this.mediumAuditLogService.listAuditLogs(
      filter ?? undefined,
      limit ?? undefined,
      skip ?? undefined
    );
  }
}
