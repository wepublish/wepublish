import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthSessionType, AuthSession } from './auth-session';
import { unselectPassword } from './unselect-password';
import { addPredefinedPermissions } from '@wepublish/permissions/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  loadPlaceholderEmailPatterns,
  matchesPlaceholderEmail,
} from '@wepublish/utils/api';
import { isSessionRestricted } from './session-restriction';

@Injectable()
export class AuthenticationService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  public async getPlaceholderEmailPatterns(): Promise<string[]> {
    return this.kv.getOrLoadNs(
      'placeholder-email',
      'patterns',
      () => loadPlaceholderEmailPatterns(this.prisma),
      60
    );
  }

  public async isPlaceholderEmail(
    email: string | null | undefined
  ): Promise<boolean> {
    if (!email) {
      return false;
    }

    return matchesPlaceholderEmail(
      email,
      await this.getPlaceholderEmailPatterns()
    );
  }

  public async getUserSession(token: string): Promise<AuthSession | null> {
    const session = await this.prisma.session.findFirst({
      where: {
        token,
      },
      include: {
        user: {
          select: unselectPassword,
        },
      },
    });

    if (session && session.user) {
      const placeholderEmail = await this.isPlaceholderEmail(
        session.user.email
      );

      return {
        type: AuthSessionType.User,
        id: session.id,
        token: session.token,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        origin: session.origin,
        placeholderEmail,
        restricted: isSessionRestricted({
          origin: session.origin,
          placeholderEmail,
          emailVerifiedAt: session.user.emailVerifiedAt,
          sessionCreatedAt: session.createdAt,
        }),
        user: session.user,
        roles: (
          await this.prisma.userRole.findMany({
            where: {
              id: {
                in: session.user.roleIDs,
              },
            },
          })
        ).map(addPredefinedPermissions),
      };
    }

    return null;
  }

  public async getPeerSession(token: string): Promise<AuthSession | null> {
    const tokenMatch = await this.prisma.token.findFirst({
      where: {
        token,
      },
    });

    if (tokenMatch) {
      return {
        type: AuthSessionType.Token,
        id: tokenMatch.id,
        name: tokenMatch.name,
        token: tokenMatch.token,
        roles: (
          await this.prisma.userRole.findMany({
            where: {
              id: {
                in: tokenMatch.roleIDs,
              },
            },
          })
        ).map(addPredefinedPermissions),
      };
    }

    return null;
  }

  public isSessionValid(session: AuthSession | null) {
    if (!session) {
      return false;
    }

    if (session.type === AuthSessionType.User) {
      return session.expiresAt > new Date() && session.user.active;
    }

    return true;
  }

  public async revokeUserSessions(
    userId: string,
    options?: { exceptToken?: string }
  ) {
    const { count } = await this.prisma.session.deleteMany({
      where: {
        userID: userId,
        ...(options?.exceptToken ?
          { token: { not: options.exceptToken } }
        : {}),
      },
    });

    return count;
  }
}
