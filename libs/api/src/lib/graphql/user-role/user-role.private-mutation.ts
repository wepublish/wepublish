import {Context} from '../../context'
import {authorise} from '../permissions'
import {CanCreateUserRole, CanDeleteUserRole} from '@wepublish/permissions/api'
import {Prisma, PrismaClient} from '@prisma/client'

export const deleteUserRoleById = async (
  id: string,
  authenticate: Context['authenticate'],
  userRole: PrismaClient['userRole']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteUserRole, roles)

  const role = await userRole.findUnique({
    where: {id}
  })

  if (role?.systemRole) {
    throw new Error('Can not delete SystemRoles')
  }

  return userRole.delete({
    where: {
      id
    }
  })
}

export const createUserRole = (
  input: Omit<Prisma.UserRoleUncheckedCreateInput, 'modifiedAt' | 'systemRole'>,
  authenticate: Context['authenticate'],
  userRole: PrismaClient['userRole']
) => {
  const {roles} = authenticate()
  authorise(CanCreateUserRole, roles)

  return userRole.create({
    data: {...input, systemRole: false}
  })
}

export const updateUserRole = async (
  id: string,
  input: Omit<Prisma.UserRoleUncheckedUpdateInput, 'modifiedAt' | 'systemRole'>,
  authenticate: Context['authenticate'],
  userRole: PrismaClient['userRole']
) => {
  const {roles} = authenticate()
  authorise(CanCreateUserRole, roles)

  const role = await userRole.findUnique({
    where: {id}
  })

  if (role?.systemRole) {
    throw new Error('Can not change SystemRoles')
  }

  return userRole.update({
    where: {
      id
    },
    data: input
  })
}
