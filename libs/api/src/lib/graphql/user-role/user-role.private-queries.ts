import {PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {UserRoleFilter, UserRoleSort} from '../../db/userRole'
import {UserInputError} from '../../error'
import {authorise} from '../permissions'
import {CanGetUserRole, CanGetUserRoles} from '@wepublish/permissions/api'
import {getUserRoles} from './user-role.queries'

export const getUserRoleById = (
  id: string,
  authenticate: Context['authenticate'],
  userRoleLoader: Context['loaders']['userRolesByID']
) => {
  const {roles} = authenticate()
  authorise(CanGetUserRole, roles)

  if (id == null) {
    throw new UserInputError('You must provide `id`')
  }

  return userRoleLoader.load(id)
}

export const getAdminUserRoles = async (
  filter: Partial<UserRoleFilter>,
  sortedField: UserRoleSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  userRole: PrismaClient['userRole']
) => {
  const {roles} = authenticate()
  authorise(CanGetUserRoles, roles)

  return getUserRoles(filter, sortedField, order, cursorId, skip, take, userRole)
}
