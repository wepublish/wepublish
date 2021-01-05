import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
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
    Approved: {value: CommentStatus.Approved},
    PendingApproval: {value: CommentStatus.PendingApproval},
    PendingUserChanges: {value: CommentStatus.PendingUserChanges},
    Rejected: {value: CommentStatus.Rejected}
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
    [CommentAuthorType.Author]: {value: CommentAuthorType.Author},
    [CommentAuthorType.Team]: {value: CommentAuthorType.Team},
    [CommentAuthorType.VerifiedUser]: {value: CommentAuthorType.VerifiedUser}
  }
})

export const GraphQLCommentRevision = new GraphQLObjectType<CommentRevision, Context>({
  name: 'CommentRevision',
  fields: {
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
    userID: {type: GraphQLNonNull(GraphQLID)},
    peerID: {type: GraphQLID},

    itemId: {type: GraphQLNonNull(GraphQLID)},

    revisions: {type: GraphQLNonNull(GraphQLList(GraphQLCommentRevisionInput))},
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
    peerID: {type: GraphQLID},

    itemId: {type: GraphQLNonNull(GraphQLID)},

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

    userID: {type: GraphQLNonNull(GraphQLID)},
    peerID: {type: GraphQLID},

    itemId: {type: GraphQLNonNull(GraphQLID)},

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
