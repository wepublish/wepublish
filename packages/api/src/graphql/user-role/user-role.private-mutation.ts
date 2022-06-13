import {Context} from '../../context'
import {authorise, CanCreateUserRole, CanDeleteUserRole} from '../permissions'
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
    data: {...input, systemRole: false, modifiedAt: new Date()}
  })
}
