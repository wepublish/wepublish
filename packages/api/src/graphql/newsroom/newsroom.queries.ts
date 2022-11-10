import {PrismaClient} from '@prisma/client'

export const getNewsroom = async (
  hostURL: string,
  websiteURL: string,
  newsroom: PrismaClient['newsroom']
) => {
  // @TODO: move fallback to seed
  const profile = (await newsroom.findFirst({})) ?? {
    name: '',
    themeColor: '',
    themeFontColor: '',
    callToActionURL: '',
    callToActionText: [],
    callToActionImageID: '',
    callToActionImageURL: ''
  }

  return {...profile, hostURL, websiteURL}
}
