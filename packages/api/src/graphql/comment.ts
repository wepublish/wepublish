import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt
} from 'graphql'
import {GraphQLDateTime} from 'graphql-iso-date'
import {Context} from '../context'
import {
  CommentAuthorType,
  CommentRejectionReason,
  CommentRevision,
  CommentStatus
} from '../db/comment'
import {GraphQLRichText} from './richText'

export const GraphQLCommentStatus = new GraphQLEnumType({
  name: 'CommentStatus',
  values: {
    APPROVED: {value: CommentStatus.Approved},
    PENDING_APPROVAL: {value: CommentStatus.PendingApproval},
    PENDING_USER_CHANGES: {value: CommentStatus.PendingUserChanges},
    REJECTED: {value: CommentStatus.Rejected}
  }
})

export const GraphQLCommentRejectionReason = new GraphQLEnumType({
  name: 'CommentRejectionReason',
  values: {
    MISCONDUCT: {value: CommentRejectionReason.Misconduct},
    SPAM: {value: CommentRejectionReason.Spam}
  }
})

export const GraphQLCommentAuthorType = new GraphQLEnumType({
  name: 'CommentAuthorType',
  values: {
    Admin: {value: CommentAuthorType.Admin},
    ArticleAuthor: {value: CommentAuthorType.ArticleAuthor},
    Journalist: {value: CommentAuthorType.Journalist},
    Moderator: {value: CommentAuthorType.Moderator},
    PeerUser: {value: CommentAuthorType.PeerUser},
    VerifiedUser: {value: CommentAuthorType.VerifiedUser}
  }
})

export const GraphQLCommentRevision = new GraphQLObjectType<CommentRevision, Context>({
  name: 'CommentRevision',
  fields: {
    ID: {type: GraphQLNonNull(GraphQLID)},
    text: {type: GraphQLNonNull(GraphQLRichText)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLCommentRevisionInput = new GraphQLInputObjectType({
  name: 'CommentRevisionInput',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    text: {type: GraphQLNonNull(GraphQLRichText)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLDateTime}
  }
})

export const GraphQLCommentInput = new GraphQLInputObjectType({
  name: 'CommentInput',
  fields: {
    siteID: {type: GraphQLNonNull(GraphQLID)},
    userID: {type: GraphQLNonNull(GraphQLID)},
    permalink: {type: GraphQLNonNull(GraphQLString)},

    articleID: {type: GraphQLNonNull(GraphQLID)},
    imageID: {type: GraphQLNonNull(GraphQLID)},

    peerID: {type: GraphQLNonNull(GraphQLID)},

    revisions: {type: GraphQLNonNull(GraphQLCommentRevisionInput)},
    parentID: {type: GraphQLNonNull(GraphQLID)},

    status: {type: GraphQLNonNull(GraphQLCommentStatus)},
    rejectionReason: {type: GraphQLNonNull(GraphQLCommentRejectionReason)},
    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLDateTime}
  }
})

export const GraphQLComment = new GraphQLObjectType<Comment, Context>({
  name: 'Comment',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

// TODO: not sure the need for this
export const GraphQLCommentConnection = new GraphQLObjectType({
  name: 'CommentConnection',
  fields: {
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})
