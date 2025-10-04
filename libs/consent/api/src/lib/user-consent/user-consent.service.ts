import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserSession } from '@wepublish/authentication/api';
import {
  UserConsent,
  UserConsentFilter,
  UserConsentInput,
} from './user-consent.model';

@Injectable()
export class UserConsentService {
  constructor(private prisma: PrismaClient) {}

  async userConsentList(filter?: UserConsentFilter) {
    const data = await this.prisma.userConsent.findMany({
      where: {
        value: filter?.value,
        consent: {
          name: filter?.name,
          slug: filter?.slug,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true,
        consent: true,
      },
    });

    return data;
  }

  async userConsent(id: string): Promise<UserConsent> {
    const data = await this.prisma.userConsent.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
        consent: true,
      },
    });

    if (!data) {
      throw new NotFoundException(`UserConsent with id ${id} not found`);
    }

    return data;
  }

  async createUserConsent(userConsent: UserConsentInput): Promise<UserConsent> {
    const created = await this.prisma.userConsent.create({
      data: userConsent,
      include: { user: true, consent: true },
    });

    return created;
  }

  async updateUserConsent(
    id: string,
    value: boolean,
    user: UserSession
  ): Promise<UserConsent> {
    const toUpdate = await this.prisma.userConsent.findFirst({
      where: { id },
      include: { user: true },
    });

    // only allow updating for admin or affected user
    if (
      !user.user.roleIDs.includes('admin') &&
      user.user.id !== toUpdate?.user.id
    ) {
      throw new ForbiddenException(`Unauthorized`);
    }

    const updated = await this.prisma.userConsent.update({
      where: { id },
      data: {
        value,
      },
      include: { user: true, consent: true },
    });

    return updated;
  }

  async deleteUserConsent(id: string, user: UserSession): Promise<UserConsent> {
    const toDelete = await this.prisma.userConsent.findFirst({
      where: { id },
      include: { user: true },
    });

    // only allow deleting for admin or affected user
    if (
      !user.user.roleIDs.includes('admin') &&
      user.user.id !== toDelete?.user.id
    ) {
      throw new ForbiddenException(`Unauthorized`);
    }

    const deleted = await this.prisma.userConsent.delete({
      where: { id },
      include: { user: true, consent: true },
    });

    return deleted;
  }
}
