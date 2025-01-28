import {PrismaClient} from '@prisma/client'

export const getImportedEventsIds = async (event: PrismaClient['event']) => {
  const externalEventsIds = event
    .findMany({
      where: {
        externalSourceId: {
          not: null
        }
      }
    })
    .then(res => res.map(single => single.externalSourceId))

  return externalEventsIds
}
