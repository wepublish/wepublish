import {Context} from '../../context'
import {ImageFilter, ImageSort} from '../../db/image'
import {authorise} from '../permissions'
import {CanGetImage, CanGetImages} from '@wepublish/permissions/api'
import {PrismaClient} from '@prisma/client'
import {getImages} from './image.queries'

export const getImageById = (
  id: string,
  authenticate: Context['authenticate'],
  imageLoader: Context['loaders']['images']
) => {
  const {roles} = authenticate()
  authorise(CanGetImage, roles)

  return imageLoader.load(id)
}

export const getAdminImages = async (
  filter: Partial<ImageFilter>,
  sortedField: ImageSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  image: PrismaClient['image']
) => {
  const {roles} = authenticate()
  authorise(CanGetImages, roles)

  return getImages(filter, sortedField, order, cursorId, skip, take, image)
}
