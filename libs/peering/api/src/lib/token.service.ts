import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateTokenInput, UpdateTokenInput } from './token.model';
import * as crypto from 'crypto';

export function generateToken() {
  return crypto.randomBytes(48).toString('base64');
}

@Injectable()
export class TokenService {
  constructor(private prisma: PrismaClient) {}

  async getTokens() {
    return this.prisma.token.findMany({});
  }

  async createToken(input: CreateTokenInput) {
    return this.prisma.token.create({
      data: {
        name: input.name,
        roleIDs: input.roleIDs ?? [],
        token: generateToken(),
      },
    });
  }

  async updateToken({ id, ...data }: UpdateTokenInput) {
    return this.prisma.token.update({
      where: { id },
      data,
    });
  }

  async deleteToken(id: string) {
    return this.prisma.token.delete({
      where: { id },
    });
  }
}
