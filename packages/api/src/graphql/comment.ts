import {
  CommentAuthorType,
  CommentItemType,
  CommentRejectionReason,
  CommentState
} from '@prisma/client'
import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLString
} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {Context} from '../context'
import {CommentRevision, PublicComment, Comment, CommentSort} from '../db/comment'
import {unselectPassword} from '../db/user'
import {createProxyingResolver} from '../utility'
import {getPublicChildrenCommentsByParentId} from './comment/comment.public-queries'
import {GraphQLPageInfo} from './common'
import {GraphQLRichText} from './richText'
import {GraphQLPublicUser, GraphQLUser} from './user'

export const GraphQLCommentState = new GraphQLEnumType({
  name: 'CommentState',
  values: {
    Approved: {value: CommentState.approved},
    PendingApproval: {value: CommentState.pendingApproval},
    PendingUserChanges: {value: CommentState.pendingUserChanges},
    Rejected: {value: CommentState.rejected}
  }
})

export const GraphQLCommentRejectionReason = new GraphQLEnumType({
  name: 'CommentRejectionReason',
  values: {
    Misconduct: {value: CommentRejectionReason.misconduct},
    Spam: {value: CommentRejectionReason.spam}
  }
})

export const GraphQLCommentAuthorType = new GraphQLEnumType({
  name: 'CommentAuthorType',
  values: {
    Author: {value: CommentAuthorType.author},
    Team: {value: CommentAuthorType.team},
    VerifiedUser: {value: CommentAuthorType.verifiedUser}
  }
})

export const GraphQLCommentItemType = new GraphQLEnumType({
  name: 'CommentItemType',
  values: {
    Article: {value: CommentItemType.article},
    PeerArticle: {value: CommentItemType.peerArticle},
    Page: {value: CommentItemType.page}
  }
})

export const GraphQLCommentSort = new GraphQLEnumType({
  name: 'CommentSort',
  values: {
    ModifiedAt: {value: CommentSort.ModifiedAt},
    CreatedAt: {value: CommentSort.CreatedAt}
  }
})

export const GraphQLCommentFilter = new GraphQLInputObjectType({
  name: 'CommentFilter',
  fields: {
    states: {type: GraphQLList(GraphQLNonNull(GraphQLCommentState))}
  }
})

export const GraphQLCommentRevision = new GraphQLObjectType<CommentRevision, Context>({
  name: 'CommentRevision',
  fields: {
    text: {type: GraphQLNonNull(GraphQLRichText)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLPublicCommentUpdateInput = new GraphQLInputObjectType({
  name: 'CommentUpdateInput',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    text: {
      type: new GraphQLNonNull(GraphQLRichText)
    }
  }
})

export const GraphQLChallengeInput = new GraphQLInputObjectType({
  name: 'ChallengeInput',
  fields: {
    challengeID: {
      type: GraphQLNonNull(GraphQLString)
    },
    challengeSolution: {
      type: GraphQLNonNull(GraphQLString)
    }
  }
})

export const GraphQLPublicCommentInput = new GraphQLInputObjectType({
  name: 'CommentInput',
  fields: {
    parentID: {type: GraphQLID},
    guestUsername: {type: GraphQLString},
    challenge: {
      type: GraphQLChallengeInput
    },
    itemID: {type: GraphQLNonNull(GraphQLID)},
    itemType: {
      type: GraphQLNonNull(GraphQLCommentItemType)
    },
    peerId: {type: GraphQLID},

    text: {
      type: new GraphQLNonNull(GraphQLRichText)
      // resolve: createProxyingResolver(({ text }, args, { loaders }, info) => {
      //   return [];
      //   if (text[0].children[0].text.length > 1000) {
      //     throw new Error(`Comment Length should be maximum of 1000 characters`)
      //   }
      // }
    }
  }
})

export const GraphQLComment: GraphQLObjectType<Comment, Context> = new GraphQLObjectType<
  Comment,
  Context
>({
  name: 'Comment',
  fields: () => ({
    id: {type: GraphQLNonNull(GraphQLID)},
    guestUsername: {type: GraphQLString},
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
    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)},
    itemID: {type: GraphQLNonNull(GraphQLID)},
    itemType: {
      type: GraphQLNonNull(GraphQLCommentItemType)
    },
    parentComment: {
      type: GraphQLComment,
      resolve: createProxyingResolver(({parentID}, _, {prisma: {comment}}) =>
        parentID
          ? comment.findUnique({
              where: {
                id: parentID
              }
            })
          : null
      )
    },
    revisions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLCommentRevision)))
    },
    state: {type: GraphQLNonNull(GraphQLCommentState)},
    rejectionReason: {type: GraphQLCommentRejectionReason},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)}
  })
})

export const GraphQLPublicComment: GraphQLObjectType<
  PublicComment,
  Context
> = new GraphQLObjectType<PublicComment, Context>({
  name: 'Comment',
  fields: () => ({
    id: {type: GraphQLNonNull(GraphQLID)},
    parentID: {type: GraphQLID},
    guestUsername: {type: GraphQLString},
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
    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)},

    itemID: {type: GraphQLNonNull(GraphQLID)},
    itemType: {
      type: GraphQLNonNull(GraphQLCommentItemType)
    },

    children: {
      type: GraphQLList(GraphQLPublicComment),
      resolve: createProxyingResolver(({id, userID}, _, {prisma: {comment}}) =>
        getPublicChildrenCommentsByParentId(id, userID ?? null, comment)
      )
    },

    text: {type: GraphQLNonNull(GraphQLRichText)},

    state: {type: GraphQLNonNull(GraphQLCommentState)},

    rejectionReason: {type: GraphQLString},

    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)}
  })
})

export const GraphQLCommentConnection = new GraphQLObjectType({
  name: 'CommentConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLComment)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublicCommentConnection = new GraphQLObjectType({
  name: 'CommentConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicComment)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})
