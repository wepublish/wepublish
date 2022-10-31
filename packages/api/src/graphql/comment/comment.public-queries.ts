import {CommentRatingSystemAnswer, CommentState, PrismaClient} from '@prisma/client'

export const getPublicChildrenCommentsByParentId = async (
  parentId: string,
  userId: string | null,
  comment: PrismaClient['comment']
) => {
  const comments = await comment.findMany({
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
      revisions: true,
      tags: true
    }
  })

  return comments.map(comment => {
    const revisions = comment.revisions
    return {
      ...comment,
      title: revisions.length ? revisions[revisions.length - 1].title : null,
      lead: revisions.length ? revisions[revisions.length - 1].lead : null,
      text: revisions.length ? revisions[revisions.length - 1].text : null
    }
  })
}

export type CalculatedRating = {
  count: number
  mean: number
  total: number
  answer: CommentRatingSystemAnswer
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
    calculatedRatings: answers.map(answer => {
      const sortedRatings = ratings
        .filter(rating => rating.answerId === answer.id)
        .map(rating => rating.value)
        .sort((a, b) => a - b)

      const total = sortedRatings.reduce((value, rating) => value + rating, 0)
      const mean = total / Math.max(sortedRatings.length, 1)

      return {
        answer,
        count: sortedRatings.length,
        mean,
        total
      } as CalculatedRating
    })
  }))
}
