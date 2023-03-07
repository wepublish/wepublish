import {PrismaClient} from '@prisma/client'

export const getNavigations = (navigation: PrismaClient['navigation']) => {
  return navigation.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      links: true
    }
  })
}
