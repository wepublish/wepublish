import {Context} from '../../context'
import {AuthSessionType} from '@wepublish/authentication/api'
import {CanGetUser, CanGetUsers} from '@wepublish/permissions/api'
import {authorise} from '../permissions'
import {UserInputError} from '../../error'
import {PrismaClient} from '@prisma/client'
import {UserFilter, UserSort} from '../../db/user'
import {unselectPassword} from '@wepublish/user/api'
import {getUsers} from './user.queries'

export const getMe = (authenticate: Context['authenticate']) => {
  const session = authenticate()

  return session?.type === AuthSessionType.User ? session.user : null
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
    },
    select: unselectPassword
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
