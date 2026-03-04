import { Injectable } from '@nestjs/common';
import { compare as bcryptCompare } from '@node-rs/bcrypt';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import { UserService } from '@wepublish/user/api';
import { PrismaClient } from '@prisma/client';
import {
  logger,
  USER_PROPERTY_LAST_LOGIN_LINK_SEND,
} from '@wepublish/utils/api';

@Injectable()
export class UserAuthenticationService {
  constructor(
    private userService: UserService,
    private prisma: PrismaClient
  ) {}

  async authenticateUserWithEmailAndPassword(email: string, password: string) {
    const user = await this.userService.getUserByEmailWithPassword(
      email.toLowerCase()
    );

    if (!user) {
      return null;
    }

    const isLegacyBcrypt = user.password.startsWith('$2');
    let isValid: boolean;

    if (isLegacyBcrypt) {
      isValid = await bcryptCompare(password, user.password);
    } else {
      isValid = await argon2Verify(user.password, password);
    }

    if (!isValid) {
      return null;
    }

    // Re-hash legacy bcrypt passwords to argon2 on successful login
    if (isLegacyBcrypt) {
      const newHash = await argon2Hash(password);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });
    }

    return user;
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
