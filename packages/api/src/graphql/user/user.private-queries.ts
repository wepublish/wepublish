import {Context} from '../../context'
import {SessionType} from '../../db/session'
import {CanGetUser, authorise, CanGetUsers} from '../permissions'
import {UserInputError} from '../../error'
import {PrismaClient} from '@prisma/client'
import {UserFilter, UserSort} from '../../db/user'
import {getUsers} from './user.queries'

export const getMe = (authenticate: Context['authenticate']) => {
  const session = authenticate()

  return session?.type === SessionType.User ? session.user : null
}

export const getUserById = (
  id: string,
  authenticate: Context['authenticate'],
  user: PrismaClient['user']
) => {
  const {roles} = authenticate()
  authorise(CanGetUser, roles)

  if (!id) {
    throw new UserInputError('You must provide `id`')
  }

  return user.findUnique({
    where: {
      id
    }
  })
}

export const getAdminUsers = async (
  filter: Partial<UserFilter>,
  sortedField: UserSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  user: PrismaClient['user']
) => {
  const {roles} = authenticate()
  authorise(CanGetUsers, roles)

  return getUsers(filter, sortedField, order, cursorId, skip, take, user)
}
