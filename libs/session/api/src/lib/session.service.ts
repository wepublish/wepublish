import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  AuditLogAction,
  AuditLogActorType,
  PrismaClient,
  User,
  UserEvent,
} from '@prisma/client';
import { AuditLogService } from '@wepublish/audit-log/api';
import { InvalidCredentialsError, NotActiveError } from './session.errors';
import nanoid from 'nanoid/generate';
import {
  ImpersonationError,
  assertCodeChallenge,
  assertDuration,
  assertReason,
  codeChallengeOf,
  isImpersonationEnabled,
  isSupportAccount,
  type ImpersonationClaims,
} from './impersonation';
import { UserAuthenticationService } from './user-authentication.service';
import { JwtAuthenticationService } from './jwt-authentication.service';
import {
  SessionCacheInvalidator,
  unselectPassword,
  UserSession,
} from '@wepublish/authentication/api';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import { Validator } from './validator';
import { UserService } from '@wepublish/user/api';
import {
  logger,
  ONE_MINUTE_IN_MILLISECONDS,
  USER_PROPERTY_LAST_LOGIN_LINK_SEND,
} from '@wepublish/utils/api';
import { JwtService } from './jwt.service';
import { TotpService } from './totp.service';
import { Property } from '@wepublish/property/api';

const IDAlphabet =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const SESSION_TTL_TOKEN = 'SESSION_TTL_TOKEN';

@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaClient,
    @Inject(SESSION_TTL_TOKEN) private sessionTTL: number,
    private userAuthenticationService: UserAuthenticationService,
    private userService: UserService,
    private jwtAuthenticationService: JwtAuthenticationService,
    private jwtService: JwtService,
    private settingsService: SettingsService,
    private mailContext: MailContext,
    private totpService: TotpService,
    private sessionCache: SessionCacheInvalidator,
    private auditLog: AuditLogService
  ) {}

  private async sessionTtlMs(): Promise<number> {
    const days = await this.settingsService
      .settingByName(SettingName.SESSION_TTL_DAYS)
      .catch(() => null);

    const value = Number(days?.value);

    return Number.isFinite(value) && value > 0 ?
        value * 24 * 60 * 60 * 1000
      : this.sessionTTL;
  }

  /**
   * Checks if a given email requires TOTP during login.
   * Returns true if the user has TOTP enabled or if the user doesn't exist
   * (to prevent user enumeration - unknown emails look the same as TOTP users).
   * Returns false only for existing users without TOTP configured.
   */
  async checkLoginOtp(email: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase(), mode: 'insensitive' } },
      select: { totpEnabled: true },
    });

    if (!user) {
      return true;
    }

    return user.totpEnabled;
  }

  async createSessionWithEmailAndPassword(
    email: string,
    password: string,
    totpToken?: string
  ) {
    const user =
      await this.userAuthenticationService.authenticateUserWithEmailAndPassword(
        email,
        password
      );

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.active) {
      throw new NotActiveError();
    }

    if (user.totpEnabled) {
      // User has TOTP configured - require valid code to get a session.
      // No exceptions: password login without TOTP = no session.
      if (!totpToken) {
        throw new InvalidCredentialsError();
      }

      await this.totpService.verifyUserTotp(user.id, totpToken);
    }

    return this.createUserSession(user);
  }

  async createSessionWithJWT(
    jwt: string,
    totpToken?: string,
    codeVerifier?: string
  ) {
    const grant = await this.jwtService.verifyImpersonationGrant(jwt);

    if (grant) {
      return this.redeemImpersonationGrant(grant, codeVerifier);
    }

    // Try preview audience first (1-min JWT from editor, skips TOTP)
    let isPreview = false;
    let user = null;

    try {
      const userId = await this.jwtService.verifyJWT(jwt, 'preview');
      if (userId) {
        user = await this.prisma.user.findUnique({ where: { id: userId } });
        isPreview = true;
      }
    } catch {
      // Not a preview JWT - try normal website audience
    }

    if (!user) {
      user = await this.jwtAuthenticationService.authenticateUserWithJWT(jwt);
    }

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.active) {
      throw new NotActiveError();
    }

    // Preview JWTs skip TOTP - the editor user already passed 2FA
    if (!isPreview && user.totpEnabled) {
      if (!totpToken) {
        throw new BadRequestException('TOTP_REQUIRED');
      }

      await this.totpService.verifyUserTotp(user.id, totpToken);
    }

    return this.createUserSession(user);
  }

  async revokeSession(session: UserSession | null) {
    if (!session) {
      return false;
    }

    const revoked = await this.prisma.session.delete({
      where: {
        token: session.token,
      },
    });
    await this.sessionCache.invalidate();

    return !!revoked;
  }

  async createImpersonationGrant({
    userId,
    durationMinutes,
    reason,
    impersonatedBy,
    codeChallenge,
  }: {
    userId: string;
    durationMinutes: number;
    reason?: string | null;
    impersonatedBy: string;
    codeChallenge?: string | null;
  }) {
    if (!isImpersonationEnabled(process.env)) {
      throw new ImpersonationError('Impersonation is disabled for this medium');
    }

    const minutes = assertDuration(durationMinutes);
    const actor = assertReason(impersonatedBy);
    const challenge = assertCodeChallenge(codeChallenge);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ImpersonationError('Unknown user');
    }

    if (!user.active) {
      throw new ImpersonationError('User is not active');
    }

    const checkedReason =
      reason?.trim() || !isSupportAccount(user.email) ?
        assertReason(reason ?? '')
      : null;

    const jti = nanoid(IDAlphabet, 32);
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await this.prisma.impersonationGrant.create({
      data: { jti, expiresAt, codeChallenge: challenge },
    });

    const token = await this.jwtService.generateImpersonationGrant({
      userId,
      durationMinutes: minutes,
      impersonatedBy: actor,
      reason: checkedReason,
      jti,
    });

    return { token, expiresAt, durationMinutes: minutes, email: user.email };
  }

  private async redeemImpersonationGrant(
    claims: ImpersonationClaims,
    codeVerifier?: string
  ) {
    const redeemed = await this.prisma.impersonationGrant.updateMany({
      where: {
        jti: claims.jti,
        redeemedAt: null,
        codeChallenge: codeVerifier ? codeChallengeOf(codeVerifier) : null,
      },
      data: { redeemedAt: new Date() },
    });

    if (redeemed.count !== 1) {
      await this.recordImpersonation(claims, {
        error:
          'Impersonation grant refused: already redeemed or wrong code verifier',
      });
      throw new InvalidCredentialsError();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: claims.userId },
    });

    if (!user) {
      await this.recordImpersonation(claims, {
        error: 'Impersonation grant refused: unknown user',
      });
      throw new InvalidCredentialsError();
    }

    if (!user.active) {
      await this.recordImpersonation(claims, {
        user,
        error: 'Impersonation grant refused: user is not active',
      });
      throw new NotActiveError();
    }

    const session = await this.createUserSession(user, {
      ttlMs: assertDuration(claims.durationMinutes) * 60 * 1000,
      impersonatedBy: claims.impersonatedBy,
      impersonationReason: claims.reason,
    });

    await this.recordImpersonation(claims, {
      user,
      sessionId: session.sessionId,
    });

    return session;
  }

  private recordImpersonation(
    claims: ImpersonationClaims,
    outcome: { user?: User; sessionId?: string; error?: string }
  ) {
    return this.auditLog.record({
      mutation: 'createSessionWithJWT',
      action: AuditLogAction.other,
      entity: 'Session',
      recordId: outcome.sessionId ?? null,
      actorType: AuditLogActorType.user,
      userId: claims.userId,
      userEmail: outcome.user?.email ?? null,
      sessionId: outcome.sessionId ?? null,
      impersonatedBy: claims.impersonatedBy,
      success: !outcome.error,
      errorMessage: outcome.error ?? null,
    });
  }

  async listImpersonationSessions() {
    return this.prisma.session.findMany({
      where: {
        impersonatedBy: { not: null },
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        impersonatedBy: true,
        impersonationReason: true,
        impersonatedAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeImpersonationSessions(ids?: string[]) {
    const { count } = await this.prisma.session.deleteMany({
      where: {
        impersonatedBy: { not: null },
        ...(ids?.length ? { id: { in: ids } } : {}),
      },
    });
    await this.sessionCache.invalidate();

    return count;
  }

  async createUserSession(
    user: User,
    options?: {
      ttlMs?: number;
      impersonatedBy?: string;
      impersonationReason?: string | null;
    }
  ) {
    const token = nanoid(IDAlphabet, 64);

    const expiresAt = new Date(
      Date.now() + (options?.ttlMs ?? (await this.sessionTtlMs()))
    );

    const [{ id: sessionId, createdAt }] = await Promise.all([
      this.prisma.session.create({
        data: {
          token,
          expiresAt,
          ...(options?.impersonatedBy ?
            {
              impersonatedBy: options.impersonatedBy,
              impersonationReason: options.impersonationReason,
              impersonatedAt: new Date(),
            }
          : {}),
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      }),
    ]);

    return {
      user,
      token,
      sessionId,
      createdAt,
      expiresAt,
      totpEnabled: user.totpEnabled,
      impersonated: !!options?.impersonatedBy,
    };
  }

  async sendWebsiteLogin(email: string) {
    Validator.login.parse({ email });

    const user = await this.userService.getUserByEmailWithPassword(email);

    if (!user) {
      return;
    }

    const lastSendTimeStamp = (user.properties as unknown as Property[]).find(
      property => property?.key === USER_PROPERTY_LAST_LOGIN_LINK_SEND
    );

    if (
      lastSendTimeStamp &&
      parseInt(lastSendTimeStamp.value) >
        Date.now() - ONE_MINUTE_IN_MILLISECONDS
    ) {
      logger('mutation.public').warn(
        'User with ID %s requested Login Link multiple times in one minute time window',
        user.id
      );

      return email;
    }

    const resetPwdSetting = await this.settingsService.settingByName(
      SettingName.RESET_PASSWORD_JWT_EXPIRES_MIN
    );

    const resetPwd =
      (resetPwdSetting?.value as number) ??
      parseInt(process.env.RESET_PASSWORD_JWT_EXPIRES_MIN ?? '');

    if (!resetPwd) {
      throw new Error('No value set for RESET_PASSWORD_JWT_EXPIRES_MIN');
    }

    const remoteTemplate = await this.mailContext.getUserTemplateId(
      UserEvent.LOGIN_LINK
    );

    await this.mailContext.sendMail({
      mailTemplateId: remoteTemplate,
      recipient: user,
      optionalData: {},
      mailType: mailLogType.UserFlow,
    });

    await this.userAuthenticationService.updateUserLastLoginLinkSend(user.id);
  }

  async sendPasswordResetEmail(email: string) {
    const validation = Validator.login.safeParse({ email });
    if (!validation.success) {
      throw new BadRequestException('Invalid email address.');
    }

    // Check if the PASSWORD_RESET template is configured
    const remoteTemplate = await this.mailContext.getUserTemplateId(
      UserEvent.PASSWORD_RESET,
      false
    );

    if (!remoteTemplate) {
      throw new BadRequestException(
        'Password reset is not configured. Please contact your administrator.'
      );
    }

    const user = await this.userService.getUserByEmailWithPassword(email);

    // Silently succeed if user doesn't exist (anti-enumeration)
    if (!user) {
      return email;
    }

    await this.mailContext.sendMail({
      mailTemplateId: remoteTemplate,
      recipient: user,
      optionalData: {},
      mailType: mailLogType.UserFlow,
      jwtOverride: await this.jwtService.generateJWT({
        id: user.id,
        expiresInMinutes: 60, // 1 hour
        audience: 'password-reset',
      }),
    });

    return email;
  }

  async resetPasswordWithToken(token: string, password: string) {
    let userId: string;
    try {
      userId = await this.jwtService.verifyJWT(token, 'password-reset');
    } catch {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    if (!userId) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    try {
      await this.userService.validatePassword(password);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        message || 'Password does not meet the requirements.'
      );
    }

    await this.userService.updateUserPassword(userId, password);

    return true;
  }

  async sendJWTLogin(email: string) {
    email = email.toLowerCase();
    await Validator.login.parse({ email });

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: unselectPassword,
    });

    if (!user) {
      return email;
    }

    const remoteTemplate = await this.mailContext.getUserTemplateId(
      UserEvent.LOGIN_LINK
    );

    await this.mailContext.sendMail({
      mailTemplateId: remoteTemplate,
      recipient: user,
      optionalData: {},
      mailType: mailLogType.UserFlow,
    });

    return email;
  }

  async createJWTForWebsiteLogin(userId: string) {
    const expiresInMinutes = 1;

    const expiresAt = new Date(
      new Date().getTime() + expiresInMinutes * 60 * 1000
    );

    const token = await this.jwtService.generateJWT({
      id: userId,
      expiresInMinutes,
      audience: 'preview',
    });

    return {
      token,
      expiresAt,
    };
  }
}
