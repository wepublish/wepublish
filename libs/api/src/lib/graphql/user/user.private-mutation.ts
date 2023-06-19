import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {hashPassword} from '../../db/user'
import {unselectPassword} from '@wepublish/user/api'
import {EmailAlreadyInUseError} from '../../error'
import {SendMailType} from '../../mails/mailContext'
import {Validator} from '../../validator'
import {authorise} from '../permissions'
import {CanCreateUser, CanDeleteUser, CanResetUserPassword} from '@wepublish/permissions/api'
import {createUser, CreateUserInput} from './user.mutation'

export const deleteUserById = (
  id: string,
  authenticate: Context['authenticate'],
  user: PrismaClient['user']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteUser, roles)

  return user.delete({
    where: {
      id
    },
    select: unselectPassword
  })
}

export const createAdminUser = async (
  input: CreateUserInput,
  authenticate: Context['authenticate'],
  hashCostFactor: Context['hashCostFactor'],
  user: PrismaClient['user']
) => {
  const {roles} = authenticate()
  authorise(CanCreateUser, roles)

  input.email = input.email ? (input.email as string).toLowerCase() : input.email
  await Validator.createUser().parse(input)

  const userExists = await user.findUnique({
    where: {email: input.email}
  })

  if (userExists) throw new EmailAlreadyInUseError()

  return createUser(input, hashCostFactor, user)
}

type UpdateUserInput = Prisma.UserUncheckedUpdateInput & {
  properties: Prisma.MetadataPropertyCreateManyUserInput[]
  address: Prisma.UserAddressUncheckedCreateWithoutUserInput | null
}

export const updateAdminUser = async (
  id: string,
  {properties, address, ...input}: UpdateUserInput,
  authenticate: Context['authenticate'],
  user: PrismaClient['user']
) => {
  const {roles} = authenticate()
  authorise(CanCreateUser, roles)

  input.email = input.email ? (input.email as string).toLowerCase() : input.email
  await Validator.createUser().parse(input)

  return user.update({
    where: {id},
    data: {
      ...input,
      address: address
        ? {
            upsert: {
              create: address,
              update: address
            }
          }
        : undefined,
      properties: {
        deleteMany: {
          userId: id
        },
        createMany: {
          data: properties
        }
      }
    },
    select: unselectPassword
  })
}

export const resetUserPassword = async (
  id: string,
  password: string,
  sendMail: boolean,
  hashCostFactor: number,
  authenticate: Context['authenticate'],
  mailContext: Context['mailContext'],
  userClient: PrismaClient['user']
) => {
  const {roles} = authenticate()
  authorise(CanResetUserPassword, roles)

  const user = await userClient.update({
    where: {id},
    data: {
      password: await hashPassword(password, hashCostFactor)
    },
    select: unselectPassword
  })

  if (sendMail && user) {
    await mailContext.sendMail({
      type: SendMailType.PasswordReset,
      recipient: user.email,
      data: {
        user
      }
    })
  }

  return user
}
