import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {hashPassword, unselectPassword} from '../../db/user'
import {SendMailType} from '../../mails/mailContext'
import {authorise, CanCreateUser, CanDeleteUser, CanResetUserPassword} from '../permissions'
import {createUser} from './user.mutation'

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
    }
  })
}

export const createAdminUser = (
  input: Omit<Prisma.UserUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  hashCostFactor: Context['hashCostFactor'],
  user: PrismaClient['user']
) => {
  const {roles} = authenticate()
  authorise(CanCreateUser, roles)

  return createUser(input, hashCostFactor, user)
}

export const updateAdminUser = (
  id: string,
  input: Pick<
    Prisma.UserUncheckedUpdateInput,
    | 'name'
    | 'firstName'
    | 'preferredName'
    | 'address'
    | 'active'
    | 'properties'
    | 'email'
    | 'emailVerifiedAt'
    | 'roleIDs'
  >,
  authenticate: Context['authenticate'],
  user: PrismaClient['user']
) => {
  const {roles} = authenticate()
  authorise(CanCreateUser, roles)

  return user.update({
    where: {id},
    data: input
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
