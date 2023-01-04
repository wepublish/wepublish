import {TagType, PrismaClient} from '@prisma/client'
import {authorise, CanCreateTag, CanDeleteTag, CanUpdateTag} from '../permissions'
import {Context} from '../../context'

export const createTag = (
  tag: string,
  type: TagType,
  authenticate: Context['authenticate'],
  tagClient: PrismaClient['tag']
) => {
  const {roles} = authenticate()
  authorise(CanCreateTag, roles)

  return tagClient.create({
    data: {
      tag,
      type
    }
  })
}

export const deleteTag = (
  tagId: string,
  authenticate: Context['authenticate'],
  tagClient: PrismaClient['tag']
) => {
  const {roles} = authenticate()
  authorise(CanDeleteTag, roles)

  return tagClient.delete({
    where: {
      id: tagId
    }
  })
}

export const updateTag = (
  tagId: string,
  tag: string,
  authenticate: Context['authenticate'],
  tagClient: PrismaClient['tag']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateTag, roles)

  return tagClient.update({
    where: {
      id: tagId
    },
    data: {
      tag
    }
  })
}
