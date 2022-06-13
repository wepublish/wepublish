import {Prisma, PrismaClient} from '@prisma/client'
import {FileUpload} from 'graphql-upload'
import {Context} from '../../context'
import {authorise, CanCreateImage, CanDeleteImage} from '../permissions'

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

export const createImage = async (
  input: {file: Promise<FileUpload>} & Omit<Prisma.ImageUncheckedCreateInput, 'modifiedAt'>,
  authenticate: Context['authenticate'],
  mediaAdapter: Context['mediaAdapter'],
  imageClient: PrismaClient['image']
) => {
  const {roles} = authenticate()
  authorise(CanCreateImage, roles)

  const {file, filename, title, description, tags, source, link, license, focalPoint} = input
  const {id, ...image} = await mediaAdapter.uploadImage(file)

  return imageClient.create({
    data: {
      id,
      ...image,

      filename: filename ?? image.filename,
      title,
      description,
      tags,

      source,
      link,
      license,

      focalPoint,
      modifiedAt: new Date()
    }
  })
}
