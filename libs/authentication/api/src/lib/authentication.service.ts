import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthSessionType, AuthSession } from './auth-session';
import { unselectPassword } from './unselect-password';
import { addPredefinedPermissions } from '@wepublish/permissions/api';

@Injectable()
export class AuthenticationService {
  constructor(private prisma: PrismaClient) {}

  public async getSessionByToken(token: string): Promise<AuthSession | null> {
    const [tokenMatch, session] = await Promise.all([
      this.prisma.token.findFirst({
        where: {
          token,
        },
      }),
      this.prisma.session.findFirst({
        where: {
          token,
        },
      }),
    ]);

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

    if (session) {
      const user = await this.prisma.user.findUnique({
        where: {
          id: session.userID,
        },
        select: unselectPassword,
      });

      if (!user) {
        return null;
      }

      return {
        type: AuthSessionType.User,
        id: session.id,
        token: session.token,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        user,
        roles: (
          await this.prisma.userRole.findMany({
            where: {
              id: {
                in: user.roleIDs,
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
