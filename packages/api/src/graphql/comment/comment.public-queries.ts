import {Comment, CommentState, PrismaClient} from '@prisma/client'
import {PublicCommentSort} from '../../db/comment'
import {sortWith, descend, ascend} from 'ramda'

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

const sortCommentsByRating = (orderFn: typeof ascend) =>
  sortWith<Comment & {ratings: CalculatedRating[]}>([
    orderFn(({ratings}: Comment & {ratings: CalculatedRating[]}) =>
      ratings.reduce((ratingsTotal, rating) => ratingsTotal + rating.mean, 0)
    ),
    ascend(({createdAt}: Comment) => createdAt)
  ])

export const getPublicCommentsForItemById = async (
  itemId: string,
  userId: string | null,
  sort: PublicCommentSort | null,
  order: 1 | -1,
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
        ratings: true,
        overriddenRatings: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  ])

  const commentsWithRating = comments.map(({revisions, ratings, ...comment}) => ({
    text: revisions[revisions.length - 1].text,
    ...comment,
    ratings: answers.map(answer => {
      const ratingValues = ratings
        .filter(rating => rating.answerId === answer.id)
        .map(rating => rating.value)

      const total = ratingValues.reduce((value, rating) => value + rating, 0)
      const mean = total / Math.max(ratingValues.length, 1)

      return {
        answerId: answer.id,
        count: ratingValues.length,
        mean,
        total
      } as CalculatedRating
    })
  }))

  if (sort === PublicCommentSort.Rating) {
    if (order === 1) {
      return sortCommentsByRating(ascend)(commentsWithRating)
    }

    return sortCommentsByRating(descend)(commentsWithRating)
  }

  // no sorting needed as comments already come sorted by creation
  return commentsWithRating
}
