import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogAction,
  AuditLogActorType,
  PrismaClient,
} from '@prisma/client';
import { AuditLogService } from '@wepublish/audit-log/api';
import {
  AuthSession,
  AuthSessionType,
  UserSession,
} from '@wepublish/authentication/api';
import { isManagedByWepublishLogin } from '@wepublish/user/api';
import { randomUUID } from 'crypto';
import {
  DEFAULT_IMPERSONATION_MINUTES,
  IMPERSONATION_GRANT_TTL_SECONDS,
  ImpersonationError,
  assertReason,
} from './impersonation';
import { JwtService, WEBSITE_URL_TOKEN } from './jwt.service';
import { SessionService } from './session.service';

@Injectable()
export class ImpersonationService {
  constructor(
    private prisma: PrismaClient,
    private sessionService: SessionService,
    private jwtService: JwtService,
    private auditLog: AuditLogService,
    @Inject(WEBSITE_URL_TOKEN) private websiteURL: string
  ) {}

  currentSession(session: AuthSession | null) {
    if (session?.type !== AuthSessionType.User) {
      return { canImpersonate: false, impersonatedBy: null, expiresAt: null };
    }

    return {
      canImpersonate: !!session.canImpersonate && !session.impersonatedBy,
      impersonatedBy: session.impersonatedBy ?? null,
      expiresAt: session.expiresAt,
    };
  }

  async impersonateInEditor(
    session: AuthSession | null,
    userId: string,
    reason: string
  ) {
    const { supporter, user, checkedReason } = await this.check(
      session,
      userId,
      reason
    );

    const created = await this.sessionService.createUserSession(user, {
      ttlMs: DEFAULT_IMPERSONATION_MINUTES * 60 * 1000,
      impersonatedBy: supporter,
      impersonationReason: checkedReason,
    });

    await this.record('impersonateUser', 'Session', user, supporter, {
      recordId: created.sessionId,
      sessionId: created.sessionId,
    });

    return created;
  }

  async impersonateOnWebsite(
    session: AuthSession | null,
    userId: string,
    reason: string
  ) {
    const { supporter, user, checkedReason } = await this.check(
      session,
      userId,
      reason
    );

    const jti = randomUUID();

    await this.prisma.impersonationGrant.create({
      data: {
        jti,
        expiresAt: new Date(
          Date.now() + IMPERSONATION_GRANT_TTL_SECONDS * 1000
        ),
      },
    });

    const token = await this.jwtService.generateImpersonationGrant({
      userId: user.id,
      durationMinutes: DEFAULT_IMPERSONATION_MINUTES,
      impersonatedBy: supporter,
      reason: checkedReason,
      jti,
    });

    await this.record('createWebsiteImpersonation', 'User', user, supporter, {
      recordId: user.id,
      sessionId: null,
    });

    return { token, url: this.websiteURL };
  }

  private async check(
    session: AuthSession | null,
    userId: string,
    reason: string
  ) {
    if (
      session?.type !== AuthSessionType.User ||
      !session.canImpersonate ||
      session.impersonatedBy
    ) {
      throw new ForbiddenException('This session may not impersonate.');
    }

    let checkedReason: string;

    try {
      checkedReason = assertReason(reason);
    } catch (error) {
      if (error instanceof ImpersonationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} was not found.`);
    }

    if (user.id === session.user.id) {
      throw new ForbiddenException('You cannot impersonate yourself.');
    }

    if (!user.active) {
      throw new ForbiddenException('Inactive users cannot be impersonated.');
    }

    if (isManagedByWepublishLogin(user)) {
      throw new ForbiddenException(
        'We.Publish accounts cannot be impersonated.'
      );
    }

    return {
      supporter: (session as UserSession).user.email,
      user,
      checkedReason,
    };
  }

  private record(
    mutation: string,
    entity: string,
    user: { id: string; email: string },
    supporter: string,
    { recordId, sessionId }: { recordId: string; sessionId: string | null }
  ) {
    return this.auditLog.record({
      mutation,
      action: AuditLogAction.other,
      entity,
      recordId,
      actorType: AuditLogActorType.user,
      userId: user.id,
      userEmail: user.email,
      sessionId,
      impersonatedBy: supporter,
      success: true,
      errorMessage: null,
    });
  }
}
