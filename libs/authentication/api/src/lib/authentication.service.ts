import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthSessionType, AuthSession } from './auth-session';
import { unselectPassword } from './unselect-password';
import { addPredefinedPermissions } from '@wepublish/permissions/api';

@Injectable()
export class AuthenticationService {
  constructor(private prisma: PrismaClient) {}

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
      return {
        type: AuthSessionType.User,
        id: session.id,
        token: session.token,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
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
      return session.expiresAt > new Date();
    }

    return true;
  }
}
