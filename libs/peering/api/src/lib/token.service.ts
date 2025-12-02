import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateTokenInput } from './token.model';
import nanoid from 'nanoid/generate';

const IDAlphabet =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateToken() {
  return nanoid(IDAlphabet, 32);
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
