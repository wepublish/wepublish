import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList
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
    id: {type: GraphQLNonNull(GraphQLID)},
    text: {type: GraphQLRichText},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)}
  }
})

export const GraphQLCommentRevisionInput = new GraphQLInputObjectType({
  name: 'CommentRevisionInput',
  fields: {
    text: {type: GraphQLRichText}
  }
})

export const GraphQLCommentInput = new GraphQLInputObjectType({
  name: 'CommentInput',
  fields: {
    siteID: {type: GraphQLID},
    userID: {type: GraphQLNonNull(GraphQLID)},
    peerID: {type: GraphQLID},
    permalink: {type: GraphQLString},

    articleID: {type: GraphQLID},
    imageID: {type: GraphQLID},

    revisions: {type: GraphQLNonNull(GraphQLList(GraphQLCommentRevisionInput))},
    parentID: {type: GraphQLID},

    status: {
      type: GraphQLNonNull(GraphQLCommentStatus),
      defaultValue: GraphQLCommentStatus.getValue('PENDING_APPROVAL')
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
    siteID: {type: GraphQLID},
    userID: {type: GraphQLNonNull(GraphQLID)},
    peerID: {type: GraphQLID},
    permalink: {type: GraphQLString},

    articleID: {type: GraphQLID},
    imageID: {type: GraphQLID},

    revisions: {type: GraphQLNonNull(GraphQLList(GraphQLCommentRevision))},
    parentID: {type: GraphQLID},

    status: {type: GraphQLNonNull(GraphQLCommentStatus)},
    rejectionReason: {type: GraphQLCommentRejectionReason},
    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)}
  }
})

export const GraphQLPublicComment = new GraphQLObjectType<Comment, Context>({
  name: 'Comment',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    siteID: {type: GraphQLID},
    userID: {type: GraphQLNonNull(GraphQLID)},
    peerID: {type: GraphQLID},
    permalink: {type: GraphQLString},

    articleID: {type: GraphQLID},
    imageID: {type: GraphQLID},

    revisions: {type: GraphQLNonNull(GraphQLList(GraphQLCommentRevision))},
    parentID: {type: GraphQLID},

    authorType: {type: GraphQLNonNull(GraphQLCommentAuthorType)}
  }
})

// TODO: not sure the need for this
export const GraphQLCommentConnection = new GraphQLObjectType({
  name: 'CommentConnection',
  fields: {
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})
