import {Context} from '../../context'
import {authorise, CanDeleteUser} from '../permissions'
import {PrismaClient} from '@prisma/client'

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
