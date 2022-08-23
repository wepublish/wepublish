import {
  Prisma,
  PrismaClient,
  CommentItemType,
  CommentState,
  CommentAuthorType
} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanTakeActionOnComment, CanUpdateComments} from '../permissions'

export const takeActionOnComment = (
  id: string,
  input: Pick<Prisma.CommentUncheckedUpdateInput, 'state' | 'rejectionReason'>,
  authenticate: Context['authenticate'],
  comment: PrismaClient['comment']
) => {
  const {roles} = authenticate()
  authorise(CanTakeActionOnComment, roles)

  return comment.update({
    where: {id},
    data: input,
    include: {
      revisions: true
    }
  })
}

export const updateComment = async (
  commentId: string,
  text: string | undefined,
  tagIds: string[] | undefined,
  authenticate: Context['authenticate'],
  commentClient: PrismaClient['comment']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateComments, roles)

  return commentClient.update({
    where: {id: commentId},
    data: {
      revisions: text
        ? {
            create: {
              text
            }
          }
        : undefined,
      tags: tagIds
        ? {
            connectOrCreate: tagIds.map(tagId => ({
              where: {
                commentId_tagId: {
                  commentId,
                  tagId
                }
              },
              create: {
                tagId
              }
            })),
            deleteMany: {
              commentId,
              tagId: {
                notIn: tagIds
              }
            }
          }
        : undefined
    },
    include: {
      revisions: true
    }
  })
}

export const createAdminComment = async (
  itemId: string,
  itemType: CommentItemType,
  text: string,
  tagIds: string[] | undefined,
  authenticate: Context['authenticate'],
  commentClient: PrismaClient['comment']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateComments, roles)

  return commentClient.create({
    data: {
      state: CommentState.approved,
      authorType: CommentAuthorType.team,
      itemID: itemId,
      itemType,
      revisions: {
        create: {
          text
        }
      },
      tags: {
        create: tagIds?.map(tagId => ({
          tagId
        }))
      }
    },
    include: {
      revisions: true
    }
  })
}
