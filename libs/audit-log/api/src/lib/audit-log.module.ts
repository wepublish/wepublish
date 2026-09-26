import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '@wepublish/nest-modules';
import { AuditLogRetentionService } from './audit-log-retention.service';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { AuditLogResolver } from './audit-log.resolver';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [PrismaModule],
  providers: [
    AuditLogService,
    AuditLogResolver,
    AuditLogRetentionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
