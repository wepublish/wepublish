import { Poll, PollAnswer, PollExternalVote, PollExternalVoteSource, PollVote, Prisma } from '@prisma/client';
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType, GraphQLScalarType } from 'graphql';
import { Context } from '../../context';
import { ConnectionResult } from '../../db/common';
export declare const VoteValue: GraphQLScalarType;
export declare const GraphQLPoll: GraphQLObjectType<Poll, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPollAnswer: GraphQLObjectType<PollAnswer, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPollAnswerWithVoteCount: GraphQLObjectType<PollAnswer & {
    _count: Prisma.PollAnswerCountOutputType;
}, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPollVote: GraphQLObjectType<PollVote, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPollExternalVote: GraphQLObjectType<PollExternalVote, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPollExternalVoteSource: GraphQLObjectType<PollExternalVoteSource, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPollConnection: GraphQLObjectType<ConnectionResult<Poll>, Context, {
    [key: string]: any;
}>;
export declare const GraphQLPollFilter: GraphQLInputObjectType;
export declare const GraphQLPollSort: GraphQLEnumType;
export declare const GraphQLPollWithAnswers: GraphQLObjectType<Poll, Context, {
    [key: string]: any;
}>;
export declare const GraphQLFullPoll: GraphQLObjectType<Poll, Context, {
    [key: string]: any;
}>;
export declare const GraphQLUpdatePollAnswer: GraphQLInputObjectType;
export declare const GraphQLUpdatePollExternalVote: GraphQLInputObjectType;
export declare const GraphQLUpdatePollExternalVoteSources: GraphQLInputObjectType;
//# sourceMappingURL=poll.d.ts.map