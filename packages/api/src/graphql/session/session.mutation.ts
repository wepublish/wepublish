import {Context} from '../../context'
import {PrismaClient} from '@prisma/client'

export const revokeSessionByToken = (
  authenticateUser: Context['authenticateUser'],
  sessionClient: PrismaClient['session']
) => {
  const session = authenticateUser()

  return session
    ? sessionClient.delete({
        where: {
          token: session.token
        }
      })
    : Promise.resolve()
}
