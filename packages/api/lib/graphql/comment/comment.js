"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLPublicCommentConnection = exports.GraphQLCommentConnection = exports.GraphQLPublicComment = exports.GraphQLCalculatedRating = exports.GraphQLComment = exports.GraphQLoverriddenRating = exports.GraphQLPublicCommentInput = exports.GraphQLChallengeInput = exports.GraphQLPublicCommentUpdateInput = exports.GraphQLCommentRatingOverrideUpdateInput = exports.GraphQLCommentRevisionUpdateInput = exports.GraphQLCommentRevision = exports.GraphQLCommentFilter = exports.GraphQLPublicCommentSort = exports.GraphQLCommentSort = exports.GraphQLCommentItemType = exports.GraphQLCommentAuthorType = exports.GraphQLCommentRejectionReason = exports.GraphQLCommentState = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const comment_1 = require("../../db/comment");
const user_1 = require("../../db/user");
const utility_1 = require("../../utility");
const comment_public_queries_1 = require("./comment.public-queries");
const common_1 = require("../common");
const richText_1 = require("../richText");
const user_2 = require("../user");
const tag_1 = require("../tag/tag");
const image_1 = require("../image");
const comment_rating_1 = require("../comment-rating/comment-rating");
exports.GraphQLCommentState = new graphql_1.GraphQLEnumType({
    name: 'CommentState',
    values: {
        Approved: { value: client_1.CommentState.approved },
        PendingApproval: { value: client_1.CommentState.pendingApproval },
        PendingUserChanges: { value: client_1.CommentState.pendingUserChanges },
        Rejected: { value: client_1.CommentState.rejected }
    }
});
exports.GraphQLCommentRejectionReason = new graphql_1.GraphQLEnumType({
    name: 'CommentRejectionReason',
    values: {
        Misconduct: { value: client_1.CommentRejectionReason.misconduct },
        Spam: { value: client_1.CommentRejectionReason.spam }
    }
});
exports.GraphQLCommentAuthorType = new graphql_1.GraphQLEnumType({
    name: 'CommentAuthorType',
    values: {
        Author: { value: client_1.CommentAuthorType.author },
        Team: { value: client_1.CommentAuthorType.team },
        VerifiedUser: { value: client_1.CommentAuthorType.verifiedUser },
        GuestUser: { value: client_1.CommentAuthorType.guestUser }
    }
});
exports.GraphQLCommentItemType = new graphql_1.GraphQLEnumType({
    name: 'CommentItemType',
    values: {
        Article: { value: client_1.CommentItemType.article },
        PeerArticle: { value: client_1.CommentItemType.peerArticle },
        Page: { value: client_1.CommentItemType.page }
    }
});
exports.GraphQLCommentSort = new graphql_1.GraphQLEnumType({
    name: 'CommentSort',
    values: {
        ModifiedAt: { value: comment_1.CommentSort.ModifiedAt },
        CreatedAt: { value: comment_1.CommentSort.CreatedAt }
    }
});
exports.GraphQLPublicCommentSort = new graphql_1.GraphQLEnumType({
    name: 'CommentSort',
    values: {
        RATING: { value: comment_1.PublicCommentSort.Rating }
    }
});
exports.GraphQLCommentFilter = new graphql_1.GraphQLInputObjectType({
    name: 'CommentFilter',
    fields: {
        item: { type: graphql_1.GraphQLID },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID)) },
        states: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentState)) },
        itemType: { type: exports.GraphQLCommentItemType },
        itemID: { type: graphql_1.GraphQLID }
    }
});
exports.GraphQLCommentRevision = new graphql_1.GraphQLObjectType({
    name: 'CommentRevision',
    fields: {
        text: { type: richText_1.GraphQLRichText },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) }
    }
});
exports.GraphQLCommentRevisionUpdateInput = new graphql_1.GraphQLInputObjectType({
    name: 'CommentRevisionUpdateInput',
    fields: {
        text: { type: richText_1.GraphQLRichText },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLCommentRatingOverrideUpdateInput = new graphql_1.GraphQLInputObjectType({
    name: 'CommentRatingOverrideUpdateInput',
    fields: {
        answerId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        value: { type: graphql_1.GraphQLInt }
    }
});
exports.GraphQLPublicCommentUpdateInput = new graphql_1.GraphQLInputObjectType({
    name: 'CommentUpdateInput',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        text: {
            type: new graphql_1.GraphQLNonNull(richText_1.GraphQLRichText)
        }
    }
});
exports.GraphQLChallengeInput = new graphql_1.GraphQLInputObjectType({
    name: 'ChallengeInput',
    fields: {
        challengeID: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)
        },
        challengeSolution: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)
        }
    }
});
exports.GraphQLPublicCommentInput = new graphql_1.GraphQLInputObjectType({
    name: 'CommentInput',
    fields: {
        parentID: { type: graphql_1.GraphQLID },
        guestUsername: { type: graphql_1.GraphQLString },
        challenge: {
            type: exports.GraphQLChallengeInput
        },
        itemID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        itemType: {
            type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentItemType)
        },
        title: { type: graphql_1.GraphQLString },
        peerId: { type: graphql_1.GraphQLID },
        text: {
            type: new graphql_1.GraphQLNonNull(richText_1.GraphQLRichText)
        }
    }
});
exports.GraphQLoverriddenRating = new graphql_1.GraphQLObjectType({
    name: 'overriddenRating',
    fields: {
        answerId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        value: { type: graphql_1.GraphQLInt }
    }
});
exports.GraphQLComment = new graphql_1.GraphQLObjectType({
    name: 'Comment',
    fields: () => ({
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        guestUsername: { type: graphql_1.GraphQLString },
        guestUserImage: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ guestUserImageID }, _, { prisma: { image } }) => guestUserImageID
                ? image.findUnique({
                    where: {
                        id: guestUserImageID
                    }
                })
                : null)
        },
        user: {
            type: user_2.GraphQLUser,
            resolve: (0, utility_1.createProxyingResolver)(({ userID }, _, { prisma: { user } }) => userID
                ? user.findUnique({
                    where: {
                        id: userID
                    },
                    select: user_1.unselectPassword
                })
                : null)
        },
        tags: {
            type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(tag_1.GraphQLTag)),
            resolve: (0, utility_1.createProxyingResolver)(async ({ id }, _, { prisma: { taggedComments } }) => {
                const tags = await taggedComments.findMany({
                    where: {
                        commentId: id
                    },
                    include: {
                        tag: true
                    }
                });
                return tags.map(({ tag }) => tag);
            })
        },
        authorType: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentAuthorType) },
        itemID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        itemType: {
            type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentItemType)
        },
        peerId: { type: graphql_1.GraphQLID },
        parentComment: {
            type: exports.GraphQLComment,
            resolve: (0, utility_1.createProxyingResolver)(({ parentID }, _, { prisma: { comment } }) => parentID
                ? comment.findUnique({
                    where: {
                        id: parentID
                    },
                    include: {
                        revisions: { orderBy: { createdAt: 'asc' } }
                    }
                })
                : null)
        },
        revisions: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentRevision)))
        },
        source: {
            type: graphql_1.GraphQLString
        },
        state: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentState) },
        rejectionReason: { type: exports.GraphQLCommentRejectionReason },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        overriddenRatings: {
            type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLoverriddenRating))
        }
    })
});
exports.GraphQLCalculatedRating = new graphql_1.GraphQLObjectType({
    name: 'CalculatedRating',
    fields: {
        count: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        total: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        mean: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLFloat) },
        answer: { type: comment_rating_1.GraphQLCommentRatingSystemAnswer }
    }
});
exports.GraphQLPublicComment = new graphql_1.GraphQLObjectType({
    name: 'Comment',
    fields: () => ({
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        parentID: { type: graphql_1.GraphQLID },
        guestUsername: { type: graphql_1.GraphQLString },
        guestUserImage: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ guestUserImageID }, _, { prisma: { image } }) => guestUserImageID ? image.findUnique({ where: { id: guestUserImageID } }) : null)
        },
        user: {
            type: user_2.GraphQLPublicUser,
            resolve: (0, utility_1.createProxyingResolver)(({ userID }, _, { prisma: { user } }) => userID
                ? user.findUnique({
                    where: {
                        id: userID
                    },
                    select: user_1.unselectPassword
                })
                : null)
        },
        tags: {
            type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(tag_1.GraphQLTag)),
            resolve: (0, utility_1.createProxyingResolver)(async ({ id }, _, { prisma: { taggedComments } }) => {
                const tags = await taggedComments.findMany({
                    where: {
                        commentId: id
                    },
                    include: {
                        tag: true
                    }
                });
                return tags.map(({ tag }) => tag);
            })
        },
        authorType: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentAuthorType) },
        itemID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        itemType: {
            type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentItemType)
        },
        peerId: { type: graphql_1.GraphQLID },
        children: {
            type: (0, graphql_1.GraphQLList)(exports.GraphQLPublicComment),
            resolve: (0, utility_1.createProxyingResolver)(({ id, userID }, _, { prisma: { comment } }) => (0, comment_public_queries_1.getPublicChildrenCommentsByParentId)(id, userID !== null && userID !== void 0 ? userID : null, comment))
        },
        title: { type: graphql_1.GraphQLString },
        lead: { type: graphql_1.GraphQLString },
        text: { type: richText_1.GraphQLRichText },
        state: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentState) },
        source: { type: graphql_1.GraphQLString },
        rejectionReason: { type: graphql_1.GraphQLString },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        calculatedRatings: {
            type: (0, graphql_1.GraphQLList)(exports.GraphQLCalculatedRating)
        },
        overriddenRatings: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLoverriddenRating))),
            resolve: comment => { var _a, _b; return (_b = (_a = comment.overriddenRatings) === null || _a === void 0 ? void 0 : _a.filter(ratings => ratings.value != null)) !== null && _b !== void 0 ? _b : []; }
        }
    })
});
exports.GraphQLCommentConnection = new graphql_1.GraphQLObjectType({
    name: 'CommentConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLComment))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLPublicCommentConnection = new graphql_1.GraphQLObjectType({
    name: 'CommentConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPublicComment))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
//# sourceMappingURL=comment.js.map