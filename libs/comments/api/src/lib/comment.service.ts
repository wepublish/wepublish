import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {SortOrder} from '@wepublish/utils/api'
import {
  CalculatedRating,
  CommentRatingSystemAnswer,
  CommentState,
  PublicCommentSort,
  RatingSystemType
} from './comment.model'

export interface CommentWithRevisions {
  title: string | null
  lead: string | null
  text: string | null

  [key: string]: any
}

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaClient) {}

  async getRatingSystem() {
    return this.prisma.commentRatingSystem.findFirst({
      include: {
        answers: true
      }
    })
  }

  async userCommentRating(commentId: string, userId: string | null) {
    if (!userId) {
      return []
    }

    return this.prisma.commentRating.findMany({
      where: {
        commentId,
        userId
      },
      include: {
        answer: true
      }
    })
  }

  mapCommentToPublicComment(comment: any): CommentWithRevisions {
    const {revisions} = comment

    return {
      title: revisions.length ? revisions[revisions.length - 1].title : null,
      lead: revisions.length ? revisions[revisions.length - 1].lead : null,
      text: revisions.length ? revisions[revisions.length - 1].text : null,
      ...comment
    }
  }

  async getPublicChildrenCommentsByParentId(parentId: string, userId: string | null) {
    const comments = await this.prisma.comment.findMany({
      where: {
        AND: [
          {parentID: parentId},
          {OR: [userId ? {userID: userId} : {}, {state: CommentState.Approved}]}
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

    return comments.map(this.mapCommentToPublicComment)
  }

  getCalculatedRatingsForComment(
    answers: CommentRatingSystemAnswer[],
    ratings: any[]
  ): CalculatedRating[] {
    return answers.map(answer => {
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
  }

  sortCommentsByRating(ascending: boolean) {
    return (comments: any[]) => {
      return [...comments].sort((a, b) => {
        const totalA = a.calculatedRatings.reduce(
          (total: number, rating: CalculatedRating) => total + rating.mean,
          0
        )
        const totalB = b.calculatedRatings.reduce(
          (total: number, rating: CalculatedRating) => total + rating.mean,
          0
        )
        const ratingDiff = ascending ? totalA - totalB : totalB - totalA

        if (ratingDiff === 0) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }

        return ratingDiff
      })
    }
  }

  async getPublicCommentsForItemById(
    itemId: string,
    userId: string | null,
    sort: PublicCommentSort | null,
    order: SortOrder
  ) {
    const ratingSystem = await this.getRatingSystem()

    const answers: CommentRatingSystemAnswer[] = (ratingSystem?.answers || []).map(answer => ({
      id: answer.id,
      ratingSystemId: answer.ratingSystemId,
      answer: answer.answer,
      type: answer.type as unknown as RatingSystemType
    }))

    const comments = await this.prisma.comment.findMany({
      where: {
        OR: [
          {itemID: itemId, state: CommentState.Approved, parentID: null},
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

    const commentsWithRating = comments.map(comment => {
      return {
        ...this.mapCommentToPublicComment(comment),
        calculatedRatings: this.getCalculatedRatingsForComment(answers, comment.ratings || []),
        tags: comment.tags?.map((t: any) => t.tag) || [],
        featured: !!comment.featured
      }
    })

    const topComments = commentsWithRating.filter(comment => comment.featured)
    let otherComments = commentsWithRating.filter(comment => !comment.featured)

    if (sort === PublicCommentSort.rating) {
      const isAscending = order === SortOrder.Ascending
      otherComments = this.sortCommentsByRating(isAscending)(otherComments)
    }

    return [...topComments, ...otherComments]
  }
}
