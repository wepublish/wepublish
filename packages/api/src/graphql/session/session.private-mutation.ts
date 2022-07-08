import {Context} from '../../context'
import {PrismaClient} from '@prisma/client'

export const revokeSessionById = (
  id: string,
  authenticateUser: Context['authenticateUser'],
  session: PrismaClient['session']
) => {
  const {user} = authenticateUser()

  return session.deleteMany({
    where: {
      id,
      userID: user.id
    }
  })
}
