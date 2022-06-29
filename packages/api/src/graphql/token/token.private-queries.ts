import {Context} from '../../context'
import {PrismaClient} from '@prisma/client'

export const getTokens = (
  authenticateUser: Context['authenticateUser'],
  token: PrismaClient['token']
) => {
  authenticateUser()

  return token.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
}
