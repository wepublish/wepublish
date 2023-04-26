import {CommentRatingSystemAnswer, Comment, CommentState, PrismaClient} from '@prisma/client'
import {PublicCommentSort} from '../../db/comment'
import {sortWith, descend, ascend} from 'ramda'

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
      revisions: {orderBy: {createdAt: 'asc'}},
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

const sortCommentsByRating = (orderFn: typeof ascend) =>
  sortWith<Comment & {calculatedRatings: CalculatedRating[]}>([
    orderFn(({calculatedRatings}: Comment & {calculatedRatings: CalculatedRating[]}) =>
      calculatedRatings.reduce(
        (ratingsTotal, calculatedRating) => ratingsTotal + calculatedRating.mean,
        0
      )
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
        revisions: {orderBy: {createdAt: 'asc'}},
        ratings: true,
        overriddenRatings: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  ])

  const commentsWithRating = comments.map(({revisions, ratings, ...comment}) => ({
    title: revisions.length ? revisions[revisions.length - 1].title : null,
    lead: revisions.length ? revisions[revisions.length - 1].lead : null,
    text: revisions.length ? revisions[revisions.length - 1].text : null,
    revisions,
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

  if (sort === PublicCommentSort.Rating) {
    if (order === 1) {
      return sortCommentsByRating(ascend)(commentsWithRating)
    }

    return sortCommentsByRating(descend)(commentsWithRating)
  }

  // no sorting needed as comments already come sorted by creation
  return commentsWithRating
}
