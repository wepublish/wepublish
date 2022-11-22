// peer profile
import {PrismaClient} from '@prisma/client'
import {getOwnNewsroom} from './newsroom.queries'
import {DisabledNewsroomError, UserInputError} from '../../error'
import {Context} from '../../context'

export const getPublicPeerProfile = async (
  hostURL: string,
  websiteURL: string,
  newsroom: PrismaClient['newsroom']
) => getOwnNewsroom(hostURL, websiteURL, newsroom)

export const getNewsroomByIdOrSlug = async (
  id: string | null,
  slug: string | null,
  newsroomClient: Context['loaders']['newsroom'],
  newsroomBySlug: Context['loaders']['newsroomBySlug']
) => {
  if ((!id && !slug) || (id && slug)) {
    throw new UserInputError('You must provide either `id` or `slug`.')
  }

  const newsroom = id ? await newsroomClient.load(id) : await newsroomBySlug.load(slug!)

  if (newsroom?.isDisabled) {
    throw new DisabledNewsroomError()
  }

  return newsroom
}
