import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateTokenInput } from './token.model';
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
      data: { ...input, token: generateToken() },
    });
  }

  async deleteToken(id: string) {
    return this.prisma.token.delete({
      where: { id },
    });
  }
}
