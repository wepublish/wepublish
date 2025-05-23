import {
  CommentAuthorType,
  CommentItemType,
  CommentRejectionReason,
  CommentState
} from '@prisma/client'
import {AuthSessionType} from '@wepublish/authentication/api'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {unselectPassword} from '@wepublish/authentication/api'
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {GraphQLDateTime} from 'graphql-scalars'
import {Context} from '../../context'
import {
  CalculatedRating,
  Comment,
  CommentRevision,
  CommentSort,
  PublicComment,
  PublicCommentSort
} from '../../db/comment'
import {createProxyingResolver} from '../../utility'
import {
  GraphQLCommentRating,
  GraphQLCommentRatingSystemAnswer
} from '../comment-rating/comment-rating'
import {GraphQLPageInfo} from '../common'
import {GraphQLImage} from '../image'
import {GraphQLTag} from '../tag/tag'
import {GraphQLPublicUser, GraphQLUser} from '../user'
import {
  getCalculatedRatingsForComment,
  getPublicChildrenCommentsByParentId
} from './comment.public-queries'
import {userCommentRating} from '../comment-rating/comment-rating.public-queries'

export const GraphQLCommentState = new GraphQLEnumType({
  name: 'CommentState',
  values: {
    [CommentState.approved]: {value: CommentState.approved},
    [CommentState.pendingApproval]: {value: CommentState.pendingApproval},
    [CommentState.pendingUserChanges]: {value: CommentState.pendingUserChanges},
    [CommentState.rejected]: {value: CommentState.rejected}
  }
})

export const GraphQLCommentRejectionReason = new GraphQLEnumType({
  name: 'CommentRejectionReason',
  values: {
    [CommentRejectionReason.misconduct]: {value: CommentRejectionReason.misconduct},
    [CommentRejectionReason.spam]: {value: CommentRejectionReason.spam}
  }
})

export const GraphQLCommentAuthorType = new GraphQLEnumType({
  name: 'CommentAuthorType',
  values: {
    [CommentAuthorType.author]: {value: CommentAuthorType.author},
    [CommentAuthorType.team]: {value: CommentAuthorType.team},
    [CommentAuthorType.verifiedUser]: {value: CommentAuthorType.verifiedUser},
    [CommentAuthorType.guestUser]: {value: CommentAuthorType.guestUser}
  }
})

export const GraphQLCommentItemType = new GraphQLEnumType({
  name: 'CommentItemType',
  values: {
    [CommentItemType.article]: {value: CommentItemType.article},
    [CommentItemType.page]: {value: CommentItemType.page}
  }
})

export const GraphQLCommentSort = new GraphQLEnumType({
  name: 'CommentSort',
  values: {
    [CommentSort.ModifiedAt]: {value: CommentSort.ModifiedAt},
    [CommentSort.CreatedAt]: {value: CommentSort.CreatedAt}
  }
})

export const GraphQLPublicCommentSort = new GraphQLEnumType({
  name: 'CommentSort',
  values: {
    [PublicCommentSort.Rating]: {value: PublicCommentSort.Rating}
  }
})

export const GraphQLCommentFilter = new GraphQLInputObjectType({
  name: 'CommentFilter',
  fields: {
    item: {type: GraphQLString},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))},
    states: {type: new GraphQLList(new GraphQLNonNull(GraphQLCommentState))},
    itemType: {type: GraphQLCommentItemType},
    itemID: {type: GraphQLString}
  }
})

export const GraphQLCommentRevision = new GraphQLObjectType<CommentRevision, Context>({
  name: 'CommentRevision',
  fields: {
    text: {type: GraphQLRichText},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLCommentRevisionUpdateInput = new GraphQLInputObjectType({
  name: 'CommentRevisionUpdateInput',
  fields: {
    text: {type: GraphQLRichText},
    title: {type: GraphQLString},
    lead: {type: GraphQLString}
  }
})

export const GraphQLCommentRatingOverrideUpdateInput = new GraphQLInputObjectType({
  name: 'CommentRatingOverrideUpdateInput',
  fields: {
    answerId: {type: new GraphQLNonNull(GraphQLString)},
    value: {type: GraphQLInt}
  }
})

export const GraphQLPublicCommentUpdateInput = new GraphQLInputObjectType({
  name: 'CommentUpdateInput',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLString)},
    text: {type: GraphQLRichText},
    title: {type: GraphQLString},
    lead: {type: GraphQLString}
  }
})

export const GraphQLChallengeInput = new GraphQLInputObjectType({
  name: 'ChallengeInput',
  fields: {
    challengeID: {
      type: GraphQLString
    },
    challengeSolution: {
      type: new GraphQLNonNull(GraphQLString)
    }
  }
})

export const GraphQLPublicCommentInput = new GraphQLInputObjectType({
  name: 'CommentInput',
  fields: {
    parentID: {type: GraphQLString},
    guestUsername: {type: GraphQLString},
    challenge: {
      type: GraphQLChallengeInput
    },
    itemID: {type: new GraphQLNonNull(GraphQLString)},
    itemType: {
      type: new GraphQLNonNull(GraphQLCommentItemType)
    },
    title: {type: GraphQLString},

    text: {
      type: new GraphQLNonNull(GraphQLRichText)
    }
  }
})

export const GraphQLoverriddenRating = new GraphQLObjectType<CalculatedRating, Context>({
  name: 'overriddenRating',
  fields: {
    answerId: {type: new GraphQLNonNull(GraphQLString)},
    value: {type: GraphQLInt}
  }
})

export const GraphQLComment: GraphQLObjectType<Comment, Context> = new GraphQLObjectType<
  Comment,
  Context
>({
  name: 'Comment',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLString)},
    guestUsername: {type: GraphQLString},
    guestUserImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({guestUserImageID}, _, {prisma: {image}}) =>
        guestUserImageID
          ? image.findUnique({
              where: {
                id: guestUserImageID
              }
            })
          : null
      )
    },
    user: {
      type: GraphQLUser,
      resolve: createProxyingResolver(({userID}, _, {prisma: {user}}) =>
        userID
          ? user.findUnique({
              where: {
                id: userID
              },
              select: unselectPassword
            })
          : null
      )
    },
    tags: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLTag))),
      resolve: createProxyingResolver(async ({id}, _, {prisma: {tag}}) => {
        const tags = await tag.findMany({
          where: {
            comments: {
              some: {
                commentId: id
              }
            }
          }
        })

        return tags
      })
    },
    authorType: {type: new GraphQLNonNull(GraphQLCommentAuthorType)},
    itemID: {type: new GraphQLNonNull(GraphQLString)},
    itemType: {
      type: new GraphQLNonNull(GraphQLCommentItemType)
    },
    parentComment: {
      type: GraphQLComment,
      resolve: createProxyingResolver(({parentID}, _, {prisma: {comment}}) =>
        parentID
          ? comment.findUnique({
              where: {
                id: parentID
              },
              include: {
                revisions: {orderBy: {createdAt: 'asc'}}
              }
            })
          : null
      )
    },
    revisions: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLCommentRevision)))
    },
    source: {
      type: GraphQLString
    },
    state: {type: new GraphQLNonNull(GraphQLCommentState)},
    rejectionReason: {type: GraphQLCommentRejectionReason},
    featured: {type: GraphQLBoolean},
    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    overriddenRatings: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLoverriddenRating))
    }
  })
})

export const GraphQLCalculatedRating = new GraphQLObjectType<CalculatedRating, Context>({
  name: 'CalculatedRating',
  fields: {
    count: {type: new GraphQLNonNull(GraphQLInt)},
    total: {type: new GraphQLNonNull(GraphQLInt)},
    mean: {type: new GraphQLNonNull(GraphQLFloat)},
    answer: {type: new GraphQLNonNull(GraphQLCommentRatingSystemAnswer)}
  }
})

export const GraphQLPublicComment: GraphQLObjectType<PublicComment, Context> =
  new GraphQLObjectType<PublicComment, Context>({
    name: 'Comment',
    fields: () => ({
      id: {type: new GraphQLNonNull(GraphQLString)},
      parentID: {type: GraphQLString},
      guestUsername: {type: GraphQLString},
      guestUserImage: {
        type: GraphQLImage,
        resolve: createProxyingResolver(({guestUserImageID}, _, {prisma: {image}}) =>
          guestUserImageID ? image.findUnique({where: {id: guestUserImageID}}) : null
        )
      },
      user: {
        type: GraphQLPublicUser,
        resolve: createProxyingResolver(({userID}, _, {prisma: {user}}) =>
          userID
            ? user.findUnique({
                where: {
                  id: userID
                },
                select: unselectPassword
              })
            : null
        )
      },
      tags: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLTag))),
        resolve: createProxyingResolver(async ({id}, _, {prisma: {taggedComments}}) => {
          const tags = await taggedComments.findMany({
            where: {
              commentId: id
            },
            include: {
              tag: true
            }
          })

          return tags.map(({tag}) => tag)
        })
      },
      authorType: {type: new GraphQLNonNull(GraphQLCommentAuthorType)},

      itemID: {type: new GraphQLNonNull(GraphQLString)},
      itemType: {
        type: new GraphQLNonNull(GraphQLCommentItemType)
      },

      children: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicComment))),
        resolve: createProxyingResolver(({id}, _, {session, prisma: {comment}}) => {
          const userId = session?.type === AuthSessionType.User ? session.user.id : null

          return getPublicChildrenCommentsByParentId(id, userId, comment)
        })
      },

      title: {type: GraphQLString},
      lead: {type: GraphQLString},
      text: {type: GraphQLRichText},

      state: {type: new GraphQLNonNull(GraphQLCommentState)},
      source: {type: GraphQLString},

      rejectionReason: {type: GraphQLString},
      featured: {type: GraphQLBoolean},
      createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
      url: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: createProxyingResolver(async (comment, args, {urlAdapter, loaders}, info) => {
          const item =
            comment.itemType === 'article'
              ? null // @TODO: await loaders.publicArticles.load(comment.itemID)
              : comment.itemType === 'page'
              ? null // @TODO: await loaders.publicPagesByID.load(comment.itemID)
              : null

          if (!item) {
            return ''
          }

          return await urlAdapter.getCommentURL(item, comment)
        })
      },
      modifiedAt: {
        type: GraphQLDateTime,
        resolve: createProxyingResolver(({revisions}) => {
          return revisions?.length ? revisions[revisions?.length - 1].createdAt : undefined
        })
      },
      calculatedRatings: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLCalculatedRating))),
        resolve: createProxyingResolver(
          async (
            {calculatedRatings, id},
            _,
            {prisma: {commentRating}, loaders: {commentRatingSystemAnswers}}
          ) => {
            if (calculatedRatings) {
              return calculatedRatings
            }

            const [answers, ratings] = await Promise.all([
              commentRatingSystemAnswers.load(1),
              commentRating.findMany({
                where: {
                  commentId: id
                }
              })
            ])

            return getCalculatedRatingsForComment(answers, ratings)
          }
        )
      },
      overriddenRatings: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLoverriddenRating))),
        resolve: comment => comment.overriddenRatings.filter(ratings => ratings.value != null) ?? []
      },
      userRatings: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLCommentRating))),
        resolve: ({id}, _, {optionalAuthenticateUser, prisma: {commentRating}}) =>
          userCommentRating(id, optionalAuthenticateUser, commentRating)
      }
    })
  })

export const GraphQLCommentConnection = new GraphQLObjectType({
  name: 'CommentConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLComment)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublicCommentConnection = new GraphQLObjectType({
  name: 'CommentConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicComment)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLCommentResolver = {
  __resolveReference: async (reference: {id: string}, {loaders}: Context) => {
    const {id} = reference
    const comment = await loaders.commentsById.load(id)

    if (!comment) {
      throw new Error('Comment not found')
    }

    return comment
  }
}
