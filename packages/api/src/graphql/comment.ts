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
  CommentStatus,
  PublicComment
} from '../db/comment'
import {GraphQLPageInfo} from './common'
import {GraphQLRichText} from './richText'
export const GraphQLCommentStatus = new GraphQLEnumType({
  name: 'CommentStatus',
  values: {
    [CommentStatus.Approved]: {value: CommentStatus.Approved},
    [CommentStatus.PendingApproval]: {value: CommentStatus.PendingApproval},
    [CommentStatus.PendingUserChanges]: {value: CommentStatus.PendingUserChanges},
    [CommentStatus.Rejected]: {value: CommentStatus.Rejected}
  }
})

export const GraphQLCommentRejectionReason = new GraphQLEnumType({
  name: 'CommentRejectionReason',
  values: {
    [CommentRejectionReason.Misconduct]: {value: CommentRejectionReason.Misconduct},
    [CommentRejectionReason.Spam]: {value: CommentRejectionReason.Spam}
  }
})

export const GraphQLCommentAuthorType = new GraphQLEnumType({
  name: 'CommentAuthorType',
  values: {
    [CommentAuthorType.Author]: {value: CommentAuthorType.Author},
    [CommentAuthorType.Team]: {value: CommentAuthorType.Team},
    [CommentAuthorType.VerifiedUser]: {value: CommentAuthorType.VerifiedUser}
  }
})

export const GraphQLCommentItemType = new GraphQLEnumType({
  name: 'CommentItemType',
  values: {
    [CommentItemType.Article]: {value: CommentItemType.Article},
    [CommentItemType.Page]: {value: CommentItemType.Page}
  }
})

export const GraphQLCommentFilter = new GraphQLInputObjectType({
  name: 'CommentFilter',
  fields: {
    title: {type: GraphQLString},
    status: {type: GraphQLCommentStatus}
  }
})

export const GraphQLCommentRevision = new GraphQLObjectType<CommentRevision, Context>({
  name: 'CommentRevision',
  fields: {
    text: {type: GraphQLNonNull(GraphQLRichText)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLCommentRevisionInput = new GraphQLInputObjectType({
  name: 'CommentRevisionInput',
  fields: {
    text: {type: GraphQLNonNull(GraphQLRichText)}
  }
})

export const GraphQLCommentInput = new GraphQLInputObjectType({
  name: 'CommentInput',
  fields: {
    userID: {type: GraphQLNonNull(GraphQLID)},

    itemID: {type: GraphQLNonNull(GraphQLID)},
    itemType: {
      type: GraphQLNonNull(GraphQLCommentItemType),
      defaultValue: GraphQLCommentStatus.getValue(CommentItemType.Article)
    },

    revisions: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLCommentRevisionInput)))},
    parentID: {type: GraphQLID},

    status: {
      type: GraphQLNonNull(GraphQLCommentStatus),
      defaultValue: GraphQLCommentStatus.getValue(CommentStatus.PendingApproval)
    },
    rejectionReason: {type: GraphQLCommentRejectionReason},
    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)}
  }
})

export const GraphQLComment = new GraphQLObjectType<Comment, Context>({
  name: 'Comment',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    userID: {type: GraphQLNonNull(GraphQLID)},

    itemID: {type: GraphQLNonNull(GraphQLID)},
    itemType: {
      type: GraphQLNonNull(GraphQLCommentItemType)
    },

    revisions: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLCommentRevision)))},
    parentID: {type: GraphQLID},

    status: {type: GraphQLNonNull(GraphQLCommentStatus)},
    rejectionReason: {type: GraphQLCommentRejectionReason},
    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)}
  }
})

export const GraphQLPublicComment: GraphQLObjectType<
  PublicComment,
  Context
> = new GraphQLObjectType<PublicComment, Context>({
  name: 'PublicComment',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    userID: {type: GraphQLNonNull(GraphQLID)},

    revisions: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLCommentRevision)))},
    parentID: {type: GraphQLID},

    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)}
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
