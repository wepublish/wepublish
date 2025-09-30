import { Prisma, PrismaClient, UserEvent } from '@prisma/client';
import { Context } from '../../context';
import { hashPassword } from '../../db/user';
import { unselectPassword } from '@wepublish/authentication/api';
import { EmailAlreadyInUseError } from '../../error';
import { Validator } from '../../validator';
import { authorise } from '../permissions';
import {
  CanCreateUser,
  CanDeleteUser,
  CanResetUserPassword,
} from '@wepublish/permissions';
import { createUser, CreateUserInput } from './user.mutation';
import { mailLogType } from '@wepublish/mail/api';

export const deleteUserById = (
  id: string,
  authenticate: Context['authenticate'],
  user: PrismaClient['user']
) => {
  const { roles } = authenticate();
  authorise(CanDeleteUser, roles);

  return user.delete({
    where: {
      id,
    },
    select: unselectPassword,
  });
};

export const createAdminUser = async (
  input: CreateUserInput,
  authenticate: Context['authenticate'],
  hashCostFactor: Context['hashCostFactor'],
  prisma: PrismaClient,
  mailContext: Context['mailContext']
) => {
  const { roles } = authenticate();
  authorise(CanCreateUser, roles);

  input.email =
    input.email ? (input.email as string).toLowerCase() : input.email;

  const userExists = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (userExists) throw new EmailAlreadyInUseError();

  return createUser(input, hashCostFactor, prisma, mailContext);
};

type UpdateUserInput = Prisma.UserUncheckedUpdateInput & {
  properties: Prisma.MetadataPropertyCreateManyUserInput[];
  address: Prisma.UserAddressUncheckedCreateWithoutUserInput | null;
};

export const updateAdminUser = async (
  id: string,
  { properties, address, ...input }: UpdateUserInput,
  authenticate: Context['authenticate'],
  user: PrismaClient['user']
) => {
  const { roles } = authenticate();
  authorise(CanCreateUser, roles);

  input.email =
    input.email ? (input.email as string).toLowerCase() : input.email;
  await Validator.createUser.parse(input);
  await Validator.createAddress.parse(address);

  return user.update({
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
      properties: {
        deleteMany: {
          userId: id,
        },
        createMany: {
          data: properties,
        },
      },
    },
    select: unselectPassword,
  });
};

export const resetUserPassword = async (
  id: string,
  password: string,
  sendMail: boolean,
  hashCostFactor: number,
  authenticate: Context['authenticate'],
  mailContext: Context['mailContext'],
  userClient: PrismaClient['user']
) => {
  const { roles } = authenticate();
  authorise(CanResetUserPassword, roles);

  const user = await userClient.update({
    where: { id },
    data: {
      password: await hashPassword(password, hashCostFactor),
    },
    select: unselectPassword,
  });

  if (sendMail && user) {
    const remoteTemplate = await mailContext.getUserTemplateName(
      UserEvent.PASSWORD_RESET
    );

    await mailContext.sendMail({
      externalMailTemplateId: remoteTemplate,
      recipient: user,
      optionalData: {},
      mailType: mailLogType.UserFlow,
    });
  }

  return user;
};
