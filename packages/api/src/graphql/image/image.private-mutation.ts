import {Context} from '../../context'
import {authorise, CanDeleteImage} from '../permissions'
import {PrismaClient} from '@prisma/client'

export const deleteImageById = (
  id: string,
  authenticate: Context['authenticate'],
  image: PrismaClient['image'],
  mediaAdapter: Context['mediaAdapter']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteImage, roles)

  return Promise.all([
    image.delete({
      where: {
        id
      }
    }),
    mediaAdapter.deleteImage(id)
  ])
}
