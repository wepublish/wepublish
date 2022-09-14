import {
  Prisma,
  PrismaClient,
  CommentItemType,
  CommentState,
  CommentAuthorType
} from '@prisma/client'
import {Context} from '../../context'
import {authorise, CanTakeActionOnComment, CanUpdateComments} from '../permissions'
import {RichTextNode} from '../richText'

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

interface CommentRevisionInput {
  text?: RichTextNode[]
  title?: string
  lead?: string
}

export const updateComment = async (
  commentId: string,
  revision: CommentRevisionInput | undefined,
  userID: string,
  guestUsername: string,
  guestUserImageID: string,
  source: string,
  tagIds: string[] | undefined,
  authenticate: Context['authenticate'],
  commentClient: PrismaClient['comment']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateComments, roles)

  return commentClient.update({
    where: {id: commentId},
    data: {
      userID,
      guestUsername,
      guestUserImageID,
      source,
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
  parentID: string | undefined | null,
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
      parentID,
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
