import { SetMetadata } from '@nestjs/common';
import { AuditLogAction } from '@prisma/client';

export const AUDIT_LOG_METADATA_KEY = 'audit_log';

export type AuditLogOptions = {
  entity?: string;
  action?: AuditLogAction;
  skip?: boolean;
};

export const AuditLogged = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG_METADATA_KEY, options);
