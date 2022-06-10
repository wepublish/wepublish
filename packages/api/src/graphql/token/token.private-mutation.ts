import {Context} from '../../context'
import {authorise, CanDeleteToken} from '../permissions'
import {PrismaClient} from '@prisma/client'

export const deleteTokenById = (
  id: string,
  authenticate: Context['authenticate'],
  token: PrismaClient['token']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteToken, roles)

  return token.delete({
    where: {
      id
    }
  })
}
