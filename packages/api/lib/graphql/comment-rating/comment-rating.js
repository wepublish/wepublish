"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLUpdateCommentRatingSystemAnswer = exports.GraphQLFullCommentRatingSystem = exports.GraphQLCommentRatingSystemWithAnswers = exports.GraphQLCommentRating = exports.GraphQLCommentRatingSystemAnswer = exports.GraphQLRatingSystemType = exports.GraphQLCommentRatingSystem = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
exports.GraphQLCommentRatingSystem = new graphql_1.GraphQLObjectType({
    name: 'CommentRatingSystem',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        name: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLRatingSystemType = new graphql_1.GraphQLEnumType({
    name: 'RatingSystemType',
    values: {
        STAR: { value: client_1.RatingSystemType.star }
    }
});
exports.GraphQLCommentRatingSystemAnswer = new graphql_1.GraphQLObjectType({
    name: 'CommentRatingSystemAnswer',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        ratingSystemId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        answer: { type: graphql_1.GraphQLString },
        type: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLRatingSystemType) }
    }
});
exports.GraphQLCommentRating = new graphql_1.GraphQLObjectType({
    name: 'CommentRating',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        userId: { type: graphql_1.GraphQLID },
        commentId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        value: { type: graphql_1.GraphQLInt },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        fingerprint: { type: graphql_1.GraphQLString },
        disabled: { type: graphql_1.GraphQLBoolean },
        answer: { type: exports.GraphQLCommentRatingSystemAnswer }
    }
});
exports.GraphQLCommentRatingSystemWithAnswers = new graphql_1.GraphQLObjectType({
    name: 'CommentRatingSystemWithAnswers',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        name: { type: graphql_1.GraphQLString },
        answers: {
            type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentRatingSystemAnswer))
        }
    }
});
exports.GraphQLFullCommentRatingSystem = new graphql_1.GraphQLObjectType({
    name: 'FullCommentRatingSystem',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        name: { type: graphql_1.GraphQLString },
        answers: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLCommentRatingSystemAnswer)))
        }
    }
});
exports.GraphQLUpdateCommentRatingSystemAnswer = new graphql_1.GraphQLInputObjectType({
    name: 'UpdateCommentRatingSystemAnswer',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        type: { type: exports.GraphQLRatingSystemType },
        answer: { type: graphql_1.GraphQLString }
    }
});
//# sourceMappingURL=comment-rating.js.map