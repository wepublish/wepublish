import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuditLogActorType, Prisma } from '@prisma/client';
import { AuthSession, AuthSessionType } from '@wepublish/authentication/api';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { Permission } from '@wepublish/permissions';
import { logger } from '@wepublish/utils/api';
import { Observable, tap } from 'rxjs';
import { AUDIT_LOG_METADATA_KEY, AuditLogOptions } from './audit-log.decorator';
import { AuditLogService } from './audit-log.service';
import {
  deriveAction,
  deriveEntity,
  deriveRecordId,
} from './derive-audit-entry';

type Actor = Pick<
  Prisma.AuditLogCreateInput,
  | 'actorType'
  | 'userID'
  | 'userEmail'
  | 'tokenName'
  | 'sessionID'
  | 'impersonatedBy'
>;

export const describeActor = (session: AuthSession | undefined): Actor => {
  if (session?.type === AuthSessionType.Token) {
    return {
      actorType: AuditLogActorType.token,
      userID: null,
      userEmail: null,
      tokenName: session.name,
      sessionID: session.id,
      impersonatedBy: null,
    };
  }

  if (session?.type === AuthSessionType.User) {
    return {
      actorType: AuditLogActorType.user,
      userID: session.user.id,
      userEmail: session.user.email,
      tokenName: null,
      sessionID: session.id,
      impersonatedBy: session.impersonatedBy ?? null,
    };
  }

  return {
    actorType: AuditLogActorType.user,
    userID: null,
    userEmail: null,
    tokenName: null,
    sessionID: null,
    impersonatedBy: null,
  };
};

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<GqlContextType>() !== 'graphql') {
      return next.handle();
    }

    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();

    if (info?.operation?.operation !== 'mutation') {
      return next.handle();
    }

    const options = this.reflector.getAllAndOverride<AuditLogOptions>(
      AUDIT_LOG_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (options?.skip) {
      return next.handle();
    }

    const permissions = this.reflector.getAllAndMerge<Permission[]>(
      PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!permissions?.length) {
      return next.handle();
    }

    const mutation = info.fieldName as string;
    const args = gqlContext.getArgs();
    const request = gqlContext.getContext()?.req;
    const entry = {
      mutation,
      action: options?.action ?? deriveAction(mutation),
      entity: options?.entity ?? deriveEntity(mutation),
      ...describeActor(request?.user),
    };

    return next.handle().pipe(
      tap({
        next: result => {
          this.record({
            ...entry,
            recordId: deriveRecordId(args, result),
            success: true,
          });
        },
        error: (error: Error) => {
          this.record({
            ...entry,
            recordId: deriveRecordId(args, undefined),
            success: false,
            errorMessage: error?.message ?? null,
          });
        },
      })
    );
  }

  private record(entry: Prisma.AuditLogCreateInput) {
    try {
      void this.auditLogService.record(entry);
    } catch (error) {
      logger('audit-log').error(
        `Could not record audit log entry for ${entry.mutation}: ${
          (error as Error).message
        }`
      );
    }
  }
}
