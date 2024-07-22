import {
  Comment,
  CommentRating,
  CommentRatingSystemAnswer,
  CommentState,
  CommentsRevisions,
  PrismaClient,
  Tag
} from '@prisma/client'
import {ascend, sortWith} from 'ramda'
import {Context} from '../../context'
import {CalculatedRating, PublicCommentSort} from '../../db/comment'
import {SortOrder} from '@wepublish/utils/api'

export interface CommentWithTags extends Comment {
  tags: {tag: Tag}[]
  calculatedRatings: CalculatedRating[]
  title: string | null
  lead: string | null
  text: string | null
  revisions: CommentsRevisions[]
}

export const mapCommentToPublicComment = (comment: Comment & {revisions: CommentsRevisions[]}) => {
  const {revisions} = comment
  return {
    title: revisions.length ? revisions[revisions.length - 1].title : null,
    lead: revisions.length ? revisions[revisions.length - 1].lead : null,
    text: revisions.length ? revisions[revisions.length - 1].text : null,
    revisions,
    ...comment
  } as CommentWithTags
}

export const getPublicChildrenCommentsByParentId = async (
  parentId: string,
  userId: string | null,
  comment: PrismaClient['comment']
) => {
  const comments = (await comment.findMany({
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
  })) as (Comment & {revisions: CommentsRevisions[]})[]

  return comments.map(mapCommentToPublicComment)
}

export const getCalculatedRatingsForComment = (
  answers: CommentRatingSystemAnswer[],
  ratings: CommentRating[]
): CalculatedRating[] =>
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
    }
  })

const sortCommentsByRating = (ascending: boolean) =>
  sortWith<CommentWithTags>([
    ({calculatedRatings: a}, {calculatedRatings: b}) => {
      const totalA = a.reduce((total, rating) => total + rating.mean, 0)
      const totalB = b.reduce((total, rating) => total + rating.mean, 0)
      return ascending ? totalA - totalB : totalB - totalA
    },
    ascend(({createdAt}) => new Date(createdAt).getTime())
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
        overriddenRatings: true,
        tags: {include: {tag: true}}
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  ])

  const commentsWithRating: CommentWithTags[] = comments.map(({ratings, tags, ...comment}) => ({
    ...mapCommentToPublicComment(comment),
    calculatedRatings: getCalculatedRatingsForComment(answers, ratings),
    tags: tags || []
  }))

  const topComments = commentsWithRating.filter(comment =>
    comment.tags.some(({tag}) => tag.tag === 'Top Kommentar')
  )
  let otherComments = commentsWithRating.filter(
    comment => !comment.tags.some(({tag}) => tag.tag === 'Top Kommentar')
  )

  if (sort === PublicCommentSort.Rating) {
    const isAscending = order === SortOrder.Ascending
    otherComments = sortCommentsByRating(isAscending)(otherComments)
  }

  return [...topComments, ...otherComments]
}
