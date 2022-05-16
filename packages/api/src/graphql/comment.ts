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
import {
  CommentAuthorType,
  CommentItemType,
  CommentRejectionReason,
  CommentRevision,
  CommentState,
  PublicComment,
  Comment,
  CommentSort
} from '../db/comment'
import {createProxyingResolver} from '../utility'
import {GraphQLPageInfo} from './common'
import {GraphQLRichText} from './richText'
import {GraphQLPublicUser, GraphQLUser} from './user'

export const GraphQLCommentState = new GraphQLEnumType({
  name: 'CommentState',
  values: {
    Approved: {value: CommentState.Approved},
    PendingApproval: {value: CommentState.PendingApproval},
    PendingUserChanges: {value: CommentState.PendingUserChanges},
    Rejected: {value: CommentState.Rejected}
  }
})

export const GraphQLCommentRejectionReason = new GraphQLEnumType({
  name: 'CommentRejectionReason',
  values: {
    Misconduct: {value: CommentRejectionReason.Misconduct},
    Spam: {value: CommentRejectionReason.Spam}
  }
})

export const GraphQLCommentAuthorType = new GraphQLEnumType({
  name: 'CommentAuthorType',
  values: {
    Author: {value: CommentAuthorType.Author},
    Team: {value: CommentAuthorType.Team},
    VerifiedUser: {value: CommentAuthorType.VerifiedUser}
  }
})

export const GraphQLCommentItemType = new GraphQLEnumType({
  name: 'CommentItemType',
  values: {
    Article: {value: CommentItemType.Article},
    Page: {value: CommentItemType.Page}
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
    state: {type: GraphQLCommentState}
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
      resolve: createProxyingResolver(({userID}, _, {dbAdapter}) => {
        if (userID) return dbAdapter.user.getUserByID(userID)
        return null
      })
    },
    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)},
    itemID: {type: GraphQLNonNull(GraphQLID)},
    itemType: {
      type: GraphQLNonNull(GraphQLCommentItemType)
    },
    parentComment: {
      type: GraphQLComment,
      resolve: createProxyingResolver(({parentID}, _, {dbAdapter}) => {
        if (parentID) return dbAdapter.comment.getCommentById(parentID)
        return null
      })
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
      resolve: createProxyingResolver(({userID}, _, {dbAdapter}) => {
        if (userID) return dbAdapter.user.getUserByID(userID)
        return null
      })
    },
    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)},

    itemID: {type: GraphQLNonNull(GraphQLID)},
    itemType: {
      type: GraphQLNonNull(GraphQLCommentItemType)
    },

    children: {
      type: GraphQLList(GraphQLPublicComment),
      resolve: createProxyingResolver(({id, userID}, _, {dbAdapter}) => {
        return dbAdapter.comment.getPublicChildrenCommentsByParentId(id, userID)
      })
    },

    text: {type: GraphQLNonNull(GraphQLRichText)},

    state: {type: GraphQLNonNull(GraphQLString)},

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
