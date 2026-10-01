import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthSessionType, AuthSession } from './auth-session';
import { unselectPassword } from './unselect-password';
import { addPredefinedPermissions } from '@wepublish/permissions/api';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import {
  SESSION_CACHE_NAMESPACE,
  SESSION_CACHE_TTL_SECONDS,
  sessionCacheKey,
} from './session-cache';

@Injectable()
export class AuthenticationService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  public getUserSession(token: string): Promise<AuthSession | null> {
    return this.kv.getOrLoadNs(
      SESSION_CACHE_NAMESPACE,
      sessionCacheKey('user', token),
      () => this.loadUserSession(token),
      SESSION_CACHE_TTL_SECONDS
    );
  }

  public getPeerSession(token: string): Promise<AuthSession | null> {
    return this.kv.getOrLoadNs(
      SESSION_CACHE_NAMESPACE,
      sessionCacheKey('peer', token),
      () => this.loadPeerSession(token),
      SESSION_CACHE_TTL_SECONDS
    );
  }

  private async loadUserSession(token: string): Promise<AuthSession | null> {
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
      return {
        type: AuthSessionType.User,
        id: session.id,
        token: session.token,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        impersonatedBy: session.impersonatedBy,
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

  private async loadPeerSession(token: string): Promise<AuthSession | null> {
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
      return session.expiresAt > new Date();
    }

    return true;
  }
}
