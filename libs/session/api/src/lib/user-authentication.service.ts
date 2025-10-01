import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { UserService } from '@wepublish/user/api';
import { USER_PROPERTY_LAST_LOGIN_LINK_SEND } from '@wepublish/api';
import { PrismaClient } from '@prisma/client';
import { logger } from '@wepublish/utils/api';

@Injectable()
export class UserAuthenticationService {
  constructor(private userService: UserService, private prisma: PrismaClient) {}

  async authenticateUserWithEmailAndPassword(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email.toLowerCase());
    if (!user) {
      return null;
    }

    const theSame = await bcrypt.compare(password, user.password);
    if (!theSame) {
      return null;
    }

    return user;
  }

  async getUserByEmail(email: string) {
    return this.userService.getUserByEmail(email);
  }

  async updateUserLastLoginLinkSend(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          properties: {
            deleteMany: {
              key: USER_PROPERTY_LAST_LOGIN_LINK_SEND,
            },
            create: {
              key: USER_PROPERTY_LAST_LOGIN_LINK_SEND,
              public: false,
              value: `${Date.now()}`,
            },
          },
        },
      });
    } catch (error) {
      logger('mutation.public').warn(
        error as Error,
        'Updating User with ID %s failed',
        userId
      );
    }
  }
}
