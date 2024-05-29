import {
  Comment,
  CommentRating,
  CommentRatingSystemAnswer,
  CommentState,
  CommentsRevisions,
  PrismaClient
} from '@prisma/client'
import {ascend, descend, sortWith} from 'ramda'
import {Context} from '../../context'
import {CalculatedRating, PublicCommentSort} from '../../db/comment'
import {SortOrder} from '@wepublish/utils/api'

export const mapCommentToPublicComment = (comment: Comment & {revisions: CommentsRevisions[]}) => {
  const {revisions} = comment

  return {
    title: revisions.length ? revisions[revisions.length - 1].title : null,
    lead: revisions.length ? revisions[revisions.length - 1].lead : null,
    text: revisions.length ? revisions[revisions.length - 1].text : null,
    revisions,
    ...comment
  }
}

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
      overriddenRatings: true
    }
  })

  return comments.map(mapCommentToPublicComment)
}

export const getCalculatedRatingsForComment = (
  answers: CommentRatingSystemAnswer[],
  ratings: CommentRating[]
) =>
  answers.map(answer => {
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
  order: SortOrder,
  commentRatingSystemAnswers: Context['loaders']['commentRatingSystemAnswers'],
  comment: PrismaClient['comment']
) => {
  const [answers, comments] = await Promise.all([
    commentRatingSystemAnswers.load(1),
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

  const commentsWithRating = comments.map(({ratings, ...comment}) => ({
    ...mapCommentToPublicComment(comment),
    calculatedRatings: getCalculatedRatingsForComment(answers, ratings)
  }))

  if (sort === PublicCommentSort.Rating) {
    if (order === SortOrder.Ascending) {
      return sortCommentsByRating(ascend)(commentsWithRating)
    }

    return sortCommentsByRating(descend)(commentsWithRating)
  }

  // no sorting needed as comments already come sorted by creation
  return commentsWithRating
}
