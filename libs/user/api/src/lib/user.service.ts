import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CreateUserInput } from './user.input';
import { Validator } from '@wepublish/user';
import { unselectPassword } from '@wepublish/authentication/api';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaClient) {}

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        properties: true,
      },
    });
  }

  async updateUserPassword(userId: string, password: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: await this.hashPassword(password),
      },
      select: unselectPassword,
    });
  }

  private async hashPassword(password: string) {
    const hashCostFactor = 12;
    return await bcrypt.hash(password, hashCostFactor);
  }

  async createUser(input: CreateUserInput) {
    const {
      name,
      firstName,
      email,
      address,
      birthday,
      password,
      properties,
      active,
    } = input;
    const userExists = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: unselectPassword,
    });

    if (userExists) {
      throw new BadRequestException(`Email already in use`);
    }

    const hashedPassword = await this.hashPassword(password);
    input.email = input.email.toLowerCase();
    Validator.createUser.parse(input);
    Validator.createAddress.parse(address);

    return this.prisma.user.create({
      data: {
        name,
        firstName,
        email,
        birthday,
        emailVerifiedAt: null,
        active,
        roleIDs: [],
        password: hashedPassword,
        properties: {
          createMany: {
            data: properties ?? [],
          },
        },
        address: {
          create: address ?? {},
        },
      },
      select: unselectPassword,
    });
  }
}
