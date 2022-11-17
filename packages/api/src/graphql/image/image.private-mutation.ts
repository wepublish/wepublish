import {Prisma, PrismaClient} from '@prisma/client'
import {FileUpload} from 'graphql-upload'
import {Context} from '../../context'
import {authorise, CanCreateImage, CanDeleteImage} from '../permissions'

export const deleteImageById = async (
  id: string,
  authenticate: Context['authenticate'],
  image: PrismaClient['image'],
  mediaAdapter: Context['mediaAdapter']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteImage, roles)

  const [deletedImage] = await Promise.all([
    image.delete({
      where: {
        id
      }
    }),
    mediaAdapter.deleteImage(id)
  ])

  return deletedImage
}

export type CreateImageInput = {
  file: Promise<FileUpload>
  focalPoint: Prisma.FocalPointUncheckedCreateWithoutImageInput
} & Omit<Prisma.ImageUncheckedCreateInput, 'modifiedAt' | 'focalPoint'>

export const createImage = async (
  input: CreateImageInput,
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

      focalPoint: {
        create: focalPoint
      }
    }
  })
}

export const updateImage = (
  id: string,
  input: Omit<Prisma.ImageUncheckedUpdateInput, 'modifiedAt' | 'createdAt'>,
  authenticate: Context['authenticate'],
  image: PrismaClient['image']
) => {
  const {roles} = authenticate()
  authorise(CanCreateImage, roles)

  return image.update({
    where: {id},
    data: input
  })
}
