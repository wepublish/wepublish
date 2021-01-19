import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLInt
} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {Context} from '../context'
import {
  CommentAuthorType,
  CommentItemType,
  CommentRejectionReason,
  CommentRevision,
  CommentState,
  PublicComment
} from '../db/comment'
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

export const GraphQLPublicCommentInput = new GraphQLInputObjectType({
  name: 'CommentInput',
  fields: {
    parentID: {type: GraphQLID},

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

export const GraphQLComment = new GraphQLObjectType<Comment, Context>({
  name: 'Comment',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    userID: {type: GraphQLNonNull(GraphQLUser)},
    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)},

    itemID: {type: GraphQLNonNull(GraphQLID)},
    itemType: {
      type: GraphQLNonNull(GraphQLCommentItemType)
    },

    parentID: {type: GraphQLID},

    revisions: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLCommentRevision)))},

    state: {type: GraphQLNonNull(GraphQLCommentState)},

    rejectionReason: {type: GraphQLCommentRejectionReason},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLPublicComment: GraphQLObjectType<
  PublicComment,
  Context
> = new GraphQLObjectType<PublicComment, Context>({
  name: 'Comment',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    parentID: {type: GraphQLID},

    userID: {type: GraphQLNonNull(GraphQLPublicUser)},
    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)},

    itemID: {type: GraphQLNonNull(GraphQLID)},
    itemType: {
      type: GraphQLNonNull(GraphQLCommentItemType)
    },

    text: {type: GraphQLNonNull(GraphQLRichText)},

    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
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
