"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLUpdatePollExternalVoteSources = exports.GraphQLUpdatePollExternalVote = exports.GraphQLUpdatePollAnswer = exports.GraphQLFullPoll = exports.GraphQLPollWithAnswers = exports.GraphQLPollSort = exports.GraphQLPollFilter = exports.GraphQLPollConnection = exports.GraphQLPollExternalVoteSource = exports.GraphQLPollExternalVote = exports.GraphQLPollVote = exports.GraphQLPollAnswerWithVoteCount = exports.GraphQLPollAnswer = exports.GraphQLPoll = exports.VoteValue = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const common_1 = require("../common");
const poll_private_queries_1 = require("./poll.private-queries");
const validateVoteValue = (voteValue) => {
    if (typeof voteValue !== 'number') {
        throw new graphql_1.GraphQLError(`Value is not a number: ${voteValue}`);
    }
    if (voteValue < 0) {
        throw new graphql_1.GraphQLError(`Value can not be below 0.`);
    }
    return voteValue;
};
exports.VoteValue = new graphql_1.GraphQLScalarType({
    name: 'VoteValue',
    description: 'A valid vote value',
    serialize: validateVoteValue,
    parseValue: validateVoteValue,
    parseLiteral: ast => {
        if (ast.kind !== graphql_1.Kind.INT) {
            throw new graphql_1.GraphQLError(`Query error: Can only parse numbers as vote values but got a: ${ast.kind}`);
        }
        return validateVoteValue(ast.value);
    }
});
exports.GraphQLPoll = new graphql_1.GraphQLObjectType({
    name: 'Poll',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        question: { type: graphql_1.GraphQLString },
        opensAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        closedAt: { type: graphql_iso_date_1.GraphQLDateTime }
    }
});
exports.GraphQLPollAnswer = new graphql_1.GraphQLObjectType({
    name: 'PollAnswer',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        pollId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        answer: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLPollAnswerWithVoteCount = new graphql_1.GraphQLObjectType({
    name: 'PollAnswerWithVoteCount',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        pollId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        answer: { type: graphql_1.GraphQLString },
        votes: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt),
            resolve: pollAnswer => pollAnswer._count.votes
        }
    }
});
exports.GraphQLPollVote = new graphql_1.GraphQLObjectType({
    name: 'PollVote',
    fields: {
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        fingerprint: { type: graphql_1.GraphQLString },
        disabled: { type: graphql_1.GraphQLBoolean }
    }
});
exports.GraphQLPollExternalVote = new graphql_1.GraphQLObjectType({
    name: 'PollExternalVote',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        answerId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        amount: { type: exports.VoteValue }
    }
});
exports.GraphQLPollExternalVoteSource = new graphql_1.GraphQLObjectType({
    name: 'PollExternalVoteSource',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        source: { type: graphql_1.GraphQLString },
        voteAmounts: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPollExternalVote)) }
    }
});
exports.GraphQLPollConnection = new graphql_1.GraphQLObjectType({
    name: 'PollConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPoll))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLPollFilter = new graphql_1.GraphQLInputObjectType({
    name: 'PollFilter',
    fields: {
        openOnly: { type: graphql_1.GraphQLBoolean }
    }
});
exports.GraphQLPollSort = new graphql_1.GraphQLEnumType({
    name: 'PollSort',
    values: {
        OPENS_AT: { value: poll_private_queries_1.PollSort.OpensAt },
        CREATED_AT: { value: poll_private_queries_1.PollSort.CreatedAt },
        MODIFIED_AT: { value: poll_private_queries_1.PollSort.ModifiedAt }
    }
});
exports.GraphQLPollWithAnswers = new graphql_1.GraphQLObjectType({
    name: 'PollWithAnswers',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        question: { type: graphql_1.GraphQLString },
        opensAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        closedAt: { type: graphql_iso_date_1.GraphQLDateTime },
        answers: {
            type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPollAnswer))
        }
    }
});
exports.GraphQLFullPoll = new graphql_1.GraphQLObjectType({
    name: 'FullPoll',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        question: { type: graphql_1.GraphQLString },
        opensAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        closedAt: { type: graphql_iso_date_1.GraphQLDateTime },
        answers: {
            type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPollAnswerWithVoteCount))
        },
        externalVoteSources: {
            type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPollExternalVoteSource))
        }
    }
});
exports.GraphQLUpdatePollAnswer = new graphql_1.GraphQLInputObjectType({
    name: 'UpdatePollAnswer',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        answer: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLUpdatePollExternalVote = new graphql_1.GraphQLInputObjectType({
    name: 'UpdatePollExternalVote',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        amount: { type: exports.VoteValue }
    }
});
exports.GraphQLUpdatePollExternalVoteSources = new graphql_1.GraphQLInputObjectType({
    name: 'UpdatePollExternalVoteSources',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        source: { type: graphql_1.GraphQLString },
        voteAmounts: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLUpdatePollExternalVote)) }
    }
});
//# sourceMappingURL=poll.js.map