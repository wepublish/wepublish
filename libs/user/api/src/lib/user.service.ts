import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { differenceInMinutes, differenceInSeconds } from 'date-fns';
import {
  CommentItemType,
  Prisma,
  PrismaClient,
  UserEvent,
} from '@prisma/client';
import { hash as argon2Hash } from '@node-rs/argon2';
import { Validator } from '@wepublish/user';
import {
  AuthenticationService,
  SessionCacheInvalidator,
  unselectPassword,
} from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
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
import {
  MailchimpContactService,
  MailContext,
  mailLogType,
} from '@wepublish/mail/api';
import * as crypto from 'crypto';
import { HibpService } from './hibp.service';

const COMMENT_AUTHOR_FIELDS = [
  'name',
  'firstName',
  'flair',
  'userImageID',
] as const;

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext,
    private hibpService: HibpService,
    private mailchimpContactService: MailchimpContactService,
    private authenticationService: AuthenticationService,
    private sessionCache: SessionCacheInvalidator,
    private publicContentCache: PublicContentCacheInvalidator
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

  async updateUserPassword(
    userId: string,
    password: string,
    { keepSessionId }: { keepSessionId?: string } = {}
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: await this.hashPassword(password),
      },
      select: unselectPassword,
    });
    await this.endSessions(userId, keepSessionId);
    await this.sessionCache.invalidate();

    return user;
  }

  private async endSessions(userId: string, keepSessionId?: string) {
    await this.prisma.session.deleteMany({
      where: {
        userID: userId,
        ...(keepSessionId ? { id: { not: keepSessionId } } : {}),
      },
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

    if (
      await this.prisma.user.findUnique({
        where: { email: input.email },
      })
    ) {
      throw new BadRequestException('Email already in use');
    }

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
      const mailTemplateId = await this.mailContext.getUserTemplateId(
        UserEvent.ACCOUNT_CREATION,
        false
      );

      await this.mailContext.sendMail({
        mailTemplateId,
        recipient,
        optionalData: {},
        mailType: mailLogType.SystemMail,
      });
    }

    return recipient;
  }

  @PrimeDataLoader(UserDataloaderService)
  async updateUser({
    id,
    address,
    properties,
    firstName,
    name,
    birthday,
    email,
    emailVerifiedAt,
    userImageID,
    roleIDs,
    flair,
    active,
    note,
    totpExempt,
  }: UpdateUserInput) {
    const input = {
      firstName,
      name,
      birthday,
      email,
      emailVerifiedAt,
      userImageID,
      roleIDs,
      flair,
      active,
      note,
      totpExempt,
    };

    if (input.email) {
      input.email = (input.email as string).toLowerCase();
    }

    await Validator.updateUser.parse(input);
    await Validator.createAddress.parse(address);

    const changesCommentAuthor = COMMENT_AUTHOR_FIELDS.some(
      field => input[field] !== undefined
    );
    const previousUser =
      input.email || changesCommentAuthor ?
        await this.prisma.user.findUnique({
          where: { id },
          select: {
            email: true,
            name: true,
            firstName: true,
            flair: true,
            userImageID: true,
          },
        })
      : null;

    const user = await this.prisma.user.update({
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
    await this.sessionCache.invalidate();

    if (
      previousUser &&
      COMMENT_AUTHOR_FIELDS.some(field => previousUser[field] !== user[field])
    ) {
      await this.publicContentCache.invalidateComments();
    }

    if (input.email && previousUser) {
      await this.mailchimpContactService.updateContactEmail(
        user.id,
        previousUser.email,
        user.email
      );
    }

    if (active === false) {
      await this.authenticationService.revokeUserSessions(user.id);
    }

    return user;
  }

  async deleteUser(id: string) {
    const commentedItems = await this.prisma.comment.findMany({
      where: { userID: id },
      select: { itemID: true, itemType: true },
      distinct: ['itemID', 'itemType'],
    });

    const user = await this.prisma.user.delete({
      where: {
        id,
      },
      select: unselectPassword,
    });
    await this.sessionCache.invalidate();

    if (commentedItems.length) {
      await this.publicContentCache.invalidateComments(
        true,
        ...(await this.commentedArticles(commentedItems))
      );
    }

    return user;
  }

  private async commentedArticles(
    items: { itemID: string; itemType: CommentItemType }[]
  ) {
    const articleIds = items
      .filter(({ itemType }) => itemType === CommentItemType.article)
      .map(({ itemID }) => itemID);

    if (!articleIds.length) {
      return [];
    }

    return this.prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, slug: true },
    });
  }

  @PrimeDataLoader(UserDataloaderService)
  async resetPassword(id: string, password?: string) {
    if (password) {
      await this.validatePassword(password);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        password: await this.hashPassword(
          password ?? crypto.randomBytes(48).toString('base64')
        ),
      },
      select: unselectPassword,
    });
    await this.endSessions(id);
    await this.sessionCache.invalidate();

    return user;
  }

  private static readonly EMAIL_CHANGE_EXPIRY_MINUTES = 60;

  private static readonly EMAIL_CHANGE_REQUEST_COOLDOWN_SECONDS = 60;

  private hashEmailChangeToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async sendEmailConfirmation(
    userId: string,
    targetEmail: string,
    event: typeof UserEvent.EMAIL_CHANGE | typeof UserEvent.EMAIL_VERIFICATION
  ) {
    const mailTemplateId = await this.mailContext.getUserTemplateId(
      event,
      false
    );

    if (!mailTemplateId) {
      throw new BadRequestException(
        'Email confirmation is not configured. Please contact your administrator.'
      );
    }

    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pendingEmailAt: true },
    });

    if (
      current?.pendingEmailAt &&
      differenceInSeconds(new Date(), current.pendingEmailAt) <
        UserService.EMAIL_CHANGE_REQUEST_COOLDOWN_SECONDS
    ) {
      throw new BadRequestException(
        'Please wait a moment before requesting another confirmation email.'
      );
    }

    const token = crypto.randomBytes(32).toString('base64url');

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: targetEmail,
        pendingEmailAt: new Date(),
        pendingEmailTokenHash: this.hashEmailChangeToken(token),
      },
      select: unselectPassword,
    });
    await this.sessionCache.invalidate();

    await this.mailContext.sendMail({
      mailTemplateId,
      recipient: user,
      recipientEmailOverride: targetEmail,
      optionalData: { newEmail: targetEmail },
      mailType: mailLogType.UserFlow,
      jwtOverride: token,
    });

    return user;
  }

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

    return this.sendEmailConfirmation(userId, newEmail, UserEvent.EMAIL_CHANGE);
  }

  @PrimeDataLoader(UserDataloaderService)
  async requestEmailVerification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.sendEmailConfirmation(
      userId,
      user.email,
      UserEvent.EMAIL_VERIFICATION
    );
  }

  @PrimeDataLoader(UserDataloaderService)
  async confirmEmailChange(
    token: string,
    options?: { exceptSessionToken?: string }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { pendingEmailTokenHash: this.hashEmailChangeToken(token) },
      select: unselectPassword,
    });

    if (!user?.pendingEmail || !user.pendingEmailAt) {
      throw new BadRequestException('Invalid or expired confirmation link.');
    }

    const minutesElapsed = differenceInMinutes(new Date(), user.pendingEmailAt);

    if (minutesElapsed > UserService.EMAIL_CHANGE_EXPIRY_MINUTES) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          pendingEmailAt: null,
          pendingEmailTokenHash: null,
        },
      });
      await this.sessionCache.invalidate();

      throw new BadRequestException(
        'Email change request has expired. Please request a new change.'
      );
    }

    let updatedUser;

    try {
      updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.pendingEmail,
          emailVerifiedAt: new Date(),
          pendingEmail: null,
          pendingEmailAt: null,
          pendingEmailTokenHash: null,
        },
        select: unselectPassword,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email is already in use.');
      }

      throw error;
    }

    await this.authenticationService.revokeUserSessions(user.id, {
      exceptToken: options?.exceptSessionToken,
    });
    await this.sessionCache.invalidate();

    if (user.email !== updatedUser.email) {
      await this.mailchimpContactService.updateContactEmail(
        updatedUser.id,
        user.email,
        updatedUser.email
      );
    }

    return updatedUser;
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

    case UserSort.SubscriptionCount:
      // many users share the same count, tie-break on id for stable paging
      return [
        { subscriptions: { _count: graphQLSortOrderToPrisma(sortOrder) } },
        { id: graphQLSortOrderToPrisma(sortOrder) },
      ];
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
