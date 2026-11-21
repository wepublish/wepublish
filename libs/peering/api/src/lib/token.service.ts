import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { CreateTokenInput, UpdateTokenInput } from './token.model';
import * as crypto from 'crypto';

export function generateToken() {
  return crypto.randomBytes(48).toString('base64');
}

@Injectable()
export class TokenService {
  constructor(
    private prisma: PrismaClient,
    private sessionCache: SessionCacheInvalidator
  ) {}

  async getTokens() {
    return this.prisma.token.findMany({});
  }

  async createToken({ name, roleIDs = [] }: CreateTokenInput) {
    await this.assertRolesExist(roleIDs);

    return this.prisma.token.create({
      data: { name, roleIDs, token: generateToken() },
    });
  }

  async updateToken({ id, name, roleIDs }: UpdateTokenInput) {
    if (roleIDs) {
      await this.assertRolesExist(roleIDs);
    }

    const token = await this.prisma.token.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(roleIDs !== undefined && { roleIDs }),
      },
    });
    // peer sessions are cached with their roles; changed roles apply at once
    await this.sessionCache.invalidate();

    return token;
  }

  async deleteToken(id: string) {
    const token = await this.prisma.token.delete({
      where: { id },
    });
    await this.sessionCache.invalidate();

    return token;
  }

  private async assertRolesExist(roleIDs: string[]) {
    if (!roleIDs.length) {
      return;
    }

    const found = await this.prisma.userRole.findMany({
      where: { id: { in: roleIDs } },
      select: { id: true },
    });
    const known = new Set(found.map(role => role.id));
    const unknown = roleIDs.filter(id => !known.has(id));

    if (unknown.length) {
      throw new BadRequestException(`Unknown user role: ${unknown.join(', ')}`);
    }
  }
}
