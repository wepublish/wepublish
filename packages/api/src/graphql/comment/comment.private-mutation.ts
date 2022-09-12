import {
  Prisma,
  PrismaClient,
  CommentItemType,
  CommentState,
  CommentAuthorType
} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanTakeActionOnComment, CanUpdateComments} from '../permissions'
import {CommentRevisionUpdateInput} from '@wepublish/editor/dist/client/api'

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
  revision: CommentRevisionUpdateInput | undefined,
  userID: string,
  guestUsername: string,
  tagIds: string[] | undefined,
  authenticate: Context['authenticate'],
  commentClient: PrismaClient['comment']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateComments, roles)

  // todo: fis as unknown as string
  return commentClient.update({
    where: {id: commentId},
    data: {
      guestUsername,
      userID,
      revisions: revision
        ? {
            create: {
              text: (revision.text as unknown) as string,
              title: revision.title,
              lead: revision.lead
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
  text: string | undefined,
  tagIds: string[] | undefined,
  authenticate: Context['authenticate'],
  commentClient: PrismaClient['comment']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateComments, roles)

  return commentClient.create({
    data: {
      state: CommentState.pendingApproval,
      authorType: CommentAuthorType.team,
      itemID: itemId,
      itemType,
      revisions: text
        ? {
            create: {
              text
            }
          }
        : undefined,
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
