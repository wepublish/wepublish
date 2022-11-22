import {PrismaClient} from '@prisma/client'

export const getOwnNewsroom = async (
  hostURL: string,
  websiteURL: string,
  newsroom: PrismaClient['newsroom']
) => {
  const profile =
    (await newsroom.findFirst({where: {isSelf: true}})) ??
    (await newsroom.create({
      data: {
        name: 'Add your newsroom name here',
        callToActionText: [],
        isSelf: true
      }
    }))

  return {...profile, hostURL, websiteURL}
}
