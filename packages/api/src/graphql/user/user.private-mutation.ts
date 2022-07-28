import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanCreateUser, CanDeleteUser} from '../permissions'
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
