import {CommentState, PrismaClient} from '@prisma/client'

export const getPublicChildrenCommentsByParentId = (
  parentId: string,
  userId: string | null,
  comment: PrismaClient['comment']
) =>
  comment.findMany({
    where: {
      AND: [
        {parentID: parentId},
        {OR: [userId ? {userID: userId} : {}, {state: CommentState.approved}]}
      ]
    },
    orderBy: {
      modifiedAt: 'desc'
    }
  })

export const getPublicCommentsForItemById = async (
  itemId: string,
  userId: string | null,
  comment: PrismaClient['comment']
) => {
  const comments = await comment.findMany({
    where: {
      OR: [
        {itemID: itemId, state: CommentState.approved, parentID: null},
        userId ? {itemID: itemId, userID: userId, parentID: null} : {}
      ]
    }
  })

  return comments.map(({revisions, ...comment}) => ({
    text: revisions[revisions.length - 1],
    ...comment
  }))
}
