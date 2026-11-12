import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  AuditLogAction,
  AuditLogActorType,
  PrismaClient,
  User,
} from '@prisma/client';
import { AuditLogService } from '@wepublish/audit-log/api';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { UserService } from '@wepublish/user/api';
import { SessionService } from './session.service';
import { WepublishIdentityService } from './wepublish-identity.service';
import {
  WEPUBLISH_LOGIN_AUTHORIZATION_URL,
  WEPUBLISH_LOGIN_SCOPE,
  refusalOf,
  wepublishLoginConfig,
  type WepublishIdentity,
} from './wepublish-login';

const MUTATION = 'createSessionWithWepublishLogin';
const MAX_NAME_LENGTH = 50;
const ROLE_IDS = ['admin'];

const namesOf = (identity: WepublishIdentity) =>
  identity.lastName ?
    {
      firstName: identity.firstName?.slice(0, MAX_NAME_LENGTH) ?? null,
      name: identity.lastName.slice(0, MAX_NAME_LENGTH),
    }
  : {
      firstName: null,
      name: (identity.name ?? identity.email).slice(0, MAX_NAME_LENGTH),
    };

@Injectable()
export class WepublishLoginService {
  constructor(
    private prisma: PrismaClient,
    private identity: WepublishIdentityService,
    private userService: UserService,
    private sessionService: SessionService,
    private sessionCache: SessionCacheInvalidator,
    private auditLog: AuditLogService
  ) {}

  client() {
    const config = wepublishLoginConfig(process.env);

    return config ?
        {
          authorizationUrl: WEPUBLISH_LOGIN_AUTHORIZATION_URL,
          clientId: config.clientId,
          redirectUri: config.redirectUri,
          scope: WEPUBLISH_LOGIN_SCOPE,
        }
      : null;
  }

  async createSession(code: string, codeVerifier: string) {
    const config = wepublishLoginConfig(process.env);

    if (!config) {
      throw new ForbiddenException('The We.Publish login is off here');
    }

    const identity = await this.identity.signIn({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      code,
      codeVerifier,
    });

    const refusal = refusalOf(identity, config.role);

    if (refusal) {
      await this.recordSignIn({ email: identity.email, error: refusal });
      throw new ForbiddenException(refusal);
    }

    const existing =
      (await this.prisma.user.findUnique({
        where: { wepublishLoginSubject: identity.subject },
      })) ??
      (await this.prisma.user.findFirst({
        where: { email: { equals: identity.email, mode: 'insensitive' } },
      }));

    const user =
      existing ?
        await this.connectAndReset(existing, identity)
      : await this.createUser(identity);

    const session = await this.sessionService.createUserSession(user);

    await this.recordSignIn({ user, sessionId: session.sessionId });

    return session;
  }

  private async connectAndReset(user: User, identity: WepublishIdentity) {
    const connecting = user.wepublishLoginSubject !== identity.subject;

    if (connecting) {
      await this.connect(user, identity);
    }

    const names = namesOf(identity);
    const resetting =
      !user.active ||
      user.roleIDs.length !== ROLE_IDS.length ||
      user.roleIDs.some(roleId => !ROLE_IDS.includes(roleId)) ||
      (user.firstName ?? null) !== names.firstName ||
      user.name !== names.name;

    const result =
      resetting ?
        await this.userService.updateUser({
          id: user.id,
          ...names,
          roleIDs: ROLE_IDS,
          active: true,
        })
      : user;

    if (connecting || resetting) {
      await this.recordUser(AuditLogAction.update, result);
    }

    return result;
  }

  private async createUser(identity: WepublishIdentity) {
    const user = await this.userService.createUser({
      email: identity.email,
      ...namesOf(identity),
      flair: null,
      active: true,
      emailVerifiedAt: new Date(),
      roleIDs: ROLE_IDS,
      properties: [],
      skipMail: true,
    });

    await this.connect(user, identity);
    await this.recordUser(AuditLogAction.create, user);

    return user;
  }

  private async connect(user: Pick<User, 'id'>, identity: WepublishIdentity) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { wepublishLoginSubject: identity.subject },
      }),
      this.prisma.session.deleteMany({ where: { userID: user.id } }),
    ]);
    await this.sessionCache.invalidate();
  }

  private recordUser(action: AuditLogAction, user: Pick<User, 'id' | 'email'>) {
    return this.auditLog.record({
      mutation: MUTATION,
      action,
      entity: 'User',
      recordId: user.id,
      actorType: AuditLogActorType.user,
      userId: user.id,
      userEmail: user.email,
      sessionId: null,
      success: true,
      errorMessage: null,
    });
  }

  private recordSignIn({
    user,
    email,
    sessionId,
    error,
  }: {
    user?: Pick<User, 'id' | 'email'>;
    email?: string;
    sessionId?: string;
    error?: string;
  }) {
    return this.auditLog.record({
      mutation: MUTATION,
      action: AuditLogAction.other,
      entity: 'Session',
      recordId: sessionId ?? null,
      actorType: AuditLogActorType.user,
      userId: user?.id ?? null,
      userEmail: user?.email ?? email ?? null,
      sessionId: sessionId ?? null,
      success: !error,
      errorMessage: error ?? null,
    });
  }
}
