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
    },
    include: {
      revisions: true
    }
  })

export type CalculatedRating = {
  answerId: string
  count: number
  mean: number
  total: number
}

export const getPublicCommentsForItemById = async (
  itemId: string,
  userId: string | null,
  commentRatingSystemAnswer: PrismaClient['commentRatingSystemAnswer'],
  comment: PrismaClient['comment']
) => {
  const [answers, comments] = await Promise.all([
    commentRatingSystemAnswer.findMany(),
    comment.findMany({
      where: {
        OR: [
          {itemID: itemId, state: CommentState.approved, parentID: null},
          userId ? {itemID: itemId, userID: userId, parentID: null} : {}
        ]
      },
      include: {
        revisions: true,
        ratings: true
      }
    })
  ])

  return comments.map(({revisions, ratings, ...comment}) => ({
    title: revisions.length ? revisions[revisions.length - 1].title : null,
    lead: revisions.length ? revisions[revisions.length - 1].lead : null,
    text: revisions.length ? revisions[revisions.length - 1].text : null,
    ...comment,
    ratings: answers.map(answer => {
      const sortedRatings = ratings
        .filter(rating => rating.answerId === answer.id)
        .map(rating => rating.value)
        .sort((a, b) => a - b)

      const total = sortedRatings.reduce((value, rating) => value + rating, 0)
      const mean = total / Math.max(sortedRatings.length, 1)

      return {
        answerId: answer.id,
        count: sortedRatings.length,
        mean,
        total
      } as CalculatedRating
    })
  }))
}
