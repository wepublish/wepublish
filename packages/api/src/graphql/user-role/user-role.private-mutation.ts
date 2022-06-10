import {Context} from '../../context'
import {authorise, CanDeleteUserRole} from '../permissions'
import {PrismaClient} from '@prisma/client'

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
