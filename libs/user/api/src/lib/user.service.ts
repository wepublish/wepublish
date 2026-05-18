import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { differenceInMinutes } from 'date-fns';
import { Prisma, PrismaClient, UserEvent } from '@prisma/client';
import { hash as argon2Hash } from '@node-rs/argon2';
import { Validator } from '@wepublish/user';
import { unselectPassword } from '@wepublish/authentication/api';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { UserDataloaderService } from './user-dataloader.service';
import {
  CreateUserInput,
  UpdateUserInput,
  UserFilter,
  UserListArgs,
  UserSort,
} from './user.model';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import * as crypto from 'crypto';
import { HibpService } from './hibp.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext,
    private hibpService: HibpService
  ) {}

  @PrimeDataLoader(UserDataloaderService)
  async getUserByEmailWithPassword(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email: {
          mode: 'insensitive',
          equals: email,
        },
      },
      include: {
        address: true,
        paymentProviderCustomers: true,
      },
    });
  }

  @PrimeDataLoader(UserDataloaderService)
  async getUsers({
    filter,
    sort = UserSort.CreatedAt,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: UserListArgs) {
    const where = createUserFilter(filter ?? {});
    const orderBy = createUserOrder(sort, order);

    const [totalCount, users] = await Promise.all([
      this.prisma.user.count({
        where,
        orderBy,
      }),
      this.prisma.user.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
        select: unselectPassword,
      }),
    ]);

    const nodes = users.slice(0, getMaxTake(take));
    const firstUser = nodes[0];
    const lastUser = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = users.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstUser?.id,
        endCursor: lastUser?.id,
      },
    };
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
    return await argon2Hash(password);
  }

  async validatePassword(password: string) {
    await Validator.password.parseAsync(password);

    if (await this.hibpService.isPasswordPwned(password)) {
      throw new BadRequestException(
        'This password has appeared in a data breach and cannot be used. Please choose a different password.'
      );
    }
  }

  @PrimeDataLoader(UserDataloaderService)
  async createUser({
    password,
    address,
    properties,
    skipMail,
    ...input
  }: CreateUserInput) {
    if (password) {
      await this.validatePassword(password);
    }
    const hashedPassword = await this.hashPassword(
      password ?? crypto.randomBytes(48).toString('base64')
    );
    input.email = input.email.toLowerCase();
    await Validator.createUser.parse(input);
    await Validator.createAddress.parse(address);

    const recipient = await this.prisma.user.create({
      data: {
        ...input,
        active: true,
        password: hashedPassword,
        properties: properties as any,
        address: {
          create: address ?? {},
        },
      },
      select: unselectPassword,
    });

    if (!skipMail) {
      const externalMailTemplateId = await this.mailContext.getUserTemplateName(
        UserEvent.ACCOUNT_CREATION,
        false
      );

      await this.mailContext.sendMail({
        externalMailTemplateId,
        recipient,
        optionalData: {},
        mailType: mailLogType.SystemMail,
      });
    }

    return recipient;
  }

  @PrimeDataLoader(UserDataloaderService)
  async updateUser({ id, address, properties, ...input }: UpdateUserInput) {
    if (input.email) {
      input.email = (input.email as string).toLowerCase();
    }

    await Validator.updateUser.parse(input);
    await Validator.createAddress.parse(address);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...input,
        address:
          address ?
            {
              upsert: {
                create: address,
                update: address,
              },
            }
          : undefined,
        properties: properties as any,
      },
      select: unselectPassword,
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: {
        id,
      },
      select: unselectPassword,
    });
  }

  @PrimeDataLoader(UserDataloaderService)
  async resetPassword(id: string, password?: string) {
    if (password) {
      await this.validatePassword(password);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        password: await this.hashPassword(
          password ?? crypto.randomBytes(48).toString('base64')
        ),
      },
      select: unselectPassword,
    });
  }

  private static readonly EMAIL_CHANGE_EXPIRY_MINUTES = 60;

  @PrimeDataLoader(UserDataloaderService)
  async requestEmailChange(userId: string, newEmail: string) {
    newEmail = newEmail.toLowerCase();
    await Validator.login.parse({ email: newEmail });

    const existing = await this.prisma.user.findFirst({
      where: {
        email: { equals: newEmail, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new BadRequestException('Email is already in use.');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: newEmail,
        pendingEmailAt: new Date(),
      },
      select: unselectPassword,
    });

    const externalMailTemplateId = await this.mailContext.getUserTemplateName(
      UserEvent.EMAIL_CHANGE,
      false
    );

    await this.mailContext.sendMail({
      externalMailTemplateId,
      recipient: user,
      optionalData: { newEmail },
      mailType: mailLogType.UserFlow,
    });

    return user;
  }

  @PrimeDataLoader(UserDataloaderService)
  async confirmEmailChange(userId: string, newEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: unselectPassword,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.pendingEmail || !user.pendingEmailAt) {
      throw new BadRequestException('No pending email change.');
    }

    if (user.pendingEmail.toLowerCase() !== newEmail.toLowerCase()) {
      throw new BadRequestException(
        'Email address does not match the pending email change.'
      );
    }

    const minutesElapsed = differenceInMinutes(new Date(), user.pendingEmailAt);

    if (minutesElapsed > UserService.EMAIL_CHANGE_EXPIRY_MINUTES) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { pendingEmail: null, pendingEmailAt: null },
      });

      throw new BadRequestException(
        'Email change request has expired. Please request a new change.'
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: user.pendingEmail,
        emailVerifiedAt: new Date(),
        pendingEmail: null,
        pendingEmailAt: null,
      },
      select: unselectPassword,
    });
  }
}

export const createUserOrder = (
  field: UserSort,
  sortOrder: SortOrder
): Prisma.UserFindManyArgs['orderBy'] => {
  switch (field) {
    case UserSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case UserSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case UserSort.Name:
      return {
        name: graphQLSortOrderToPrisma(sortOrder),
      };

    case UserSort.FirstName:
      return {
        firstName: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createUserRoleFilter = (
  filter: Partial<UserFilter>
): Prisma.UserWhereInput => {
  if (filter?.userRole) {
    return {
      roleIDs: {
        hasSome: filter.userRole,
      },
    };
  }

  return {};
};

const createNameFilter = (
  filter: Partial<UserFilter>
): Prisma.UserWhereInput => {
  if (filter?.name) {
    return {
      name: {
        contains: filter.name,
        mode: 'insensitive',
      },
    };
  }

  return {};
};
const createUserNameFilter = (
  filter: Partial<UserFilter>
): Prisma.UserWhereInput => {
  const splitedString = (filter.text || '').split(' ');

  if (splitedString.length === 1) {
    return {
      OR: [
        {
          firstName: {
            contains: splitedString[0],
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: splitedString[0],
            mode: 'insensitive',
          },
        },
      ],
    };
  } else if (splitedString.length === 2) {
    return {
      // Double word first / last names
      OR: [
        {
          firstName: {
            contains: `${splitedString[0]} ${splitedString[1]}`,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: `${splitedString[0]} ${splitedString[1]}`,
            mode: 'insensitive',
          },
        },
        // Single word first and lastname
        {
          AND: [
            {
              firstName: {
                contains: splitedString[0],
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: splitedString[1],
                mode: 'insensitive',
              },
            },
          ],
        },
        {
          AND: [
            {
              firstName: {
                contains: splitedString[1],
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: splitedString[0],
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };
  } else {
    return {
      OR: [
        {
          // Filter start with double firstname and ends with single or multi-word lastname
          AND: [
            {
              firstName: {
                contains: `${splitedString[0]} ${splitedString[1]}`,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: splitedString.slice(2).join(' '),
                mode: 'insensitive',
              },
            },
          ],
        },
        {
          // Filter start with single firstname and ends with multi-word lastname
          AND: [
            {
              firstName: {
                contains: `${splitedString[0]}`,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: splitedString.slice(1).join(' '),
                mode: 'insensitive',
              },
            },
          ],
        },
        // Filter start with double lastname and ends with single or multi-word firstname
        {
          AND: [
            {
              name: {
                contains: `${splitedString[0]} ${splitedString[1]}`,
                mode: 'insensitive',
              },
            },
            {
              firstName: {
                contains: splitedString.slice(2).join(' '),
                mode: 'insensitive',
              },
            },
          ],
        },
        // Filter start with single lastname and ends with multi-word firstname
        {
          AND: [
            {
              name: {
                contains: `${splitedString[0]}`,
                mode: 'insensitive',
              },
            },
            {
              firstName: {
                contains: splitedString.slice(2).join(' '),
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };
  }
};

const createTextFilter = (
  filter: Partial<UserFilter>
): Prisma.UserWhereInput => {
  if (filter?.text) {
    return {
      OR: [
        {
          email: {
            contains: filter.text,
            mode: 'insensitive',
          },
        },
        {
          address: {
            OR: [
              {
                streetAddress: {
                  contains: filter.text,
                  mode: 'insensitive',
                },
              },
              {
                streetAddressNumber: {
                  contains: filter.text,
                  mode: 'insensitive',
                },
              },
              {
                zipCode: {
                  contains: filter.text,
                  mode: 'insensitive',
                },
              },
              {
                city: {
                  contains: filter.text,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
        createUserNameFilter(filter),
      ],
    };
  }

  return {};
};

export const createUserFilter = (
  filter: Partial<UserFilter>
): Prisma.UserWhereInput => {
  return {
    AND: [
      createNameFilter(filter),
      createTextFilter(filter),
      createUserRoleFilter(filter),
    ],
  };
};
