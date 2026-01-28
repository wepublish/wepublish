import {
  Poll,
  PollAnswer,
  PollExternalVote,
  PollExternalVoteSource,
  Prisma,
} from '@prisma/client';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLError,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLString,
  Kind,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Context } from '../../context';
import { ConnectionResult } from '../../db/common';
import { GraphQLPageInfo } from '../common';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { PollSort } from './poll.private-queries';

const validateVoteValue = (voteValue: unknown): number => {
  if (typeof voteValue !== 'number') {
    throw new GraphQLError(`Value is not a number: ${voteValue}`);
  }

  if (voteValue < 0) {
    throw new GraphQLError(`Value can not be below 0.`);
  }

  return voteValue;
};

export const VoteValue = new GraphQLScalarType({
  name: 'VoteValue',
  description: 'A valid vote value',
  serialize: validateVoteValue,
  parseValue: validateVoteValue,
  parseLiteral: ast => {
    if (ast.kind !== Kind.INT) {
      throw new GraphQLError(
        `Query error: Can only parse numbers as vote values but got a: ${ast.kind}`
      );
    }

    return validateVoteValue(ast.value);
  },
});

export const GraphQLPoll = new GraphQLObjectType<Poll, Context>({
  name: 'Poll',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    question: { type: GraphQLString },
    opensAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    closedAt: { type: GraphQLDateTime },
  },
});

export const GraphQLPollAnswer = new GraphQLObjectType<PollAnswer, Context>({
  name: 'PollAnswer',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    pollId: { type: new GraphQLNonNull(GraphQLString) },
    answer: { type: GraphQLString },
  },
});

export const GraphQLPollAnswerWithVoteCount = new GraphQLObjectType<
  PollAnswer & {
    _count: Prisma.PollAnswerCountOutputType;
  },
  Context
>({
  name: 'PollAnswerWithVoteCount',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    pollId: { type: new GraphQLNonNull(GraphQLString) },
    answer: { type: GraphQLString },
    votes: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve: pollAnswer => pollAnswer._count.votes,
    },
  },
});

export const GraphQLPollExternalVote = new GraphQLObjectType<
  PollExternalVote,
  Context
>({
  name: 'PollExternalVote',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    answerId: { type: new GraphQLNonNull(GraphQLString) },
    amount: { type: new GraphQLNonNull(VoteValue) },
  },
});

export const GraphQLPollExternalVoteSource = new GraphQLObjectType<
  PollExternalVoteSource,
  Context
>({
  name: 'PollExternalVoteSource',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    source: { type: GraphQLString },
    voteAmounts: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPollExternalVote))
      ),
    },
  },
});

export const GraphQLPollConnection = new GraphQLObjectType<
  ConnectionResult<Poll>,
  Context
>({
  name: 'PollConnection',
  fields: {
    nodes: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPoll))
      ),
    },
    pageInfo: { type: new GraphQLNonNull(GraphQLPageInfo) },
    totalCount: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

export const GraphQLPollFilter = new GraphQLInputObjectType({
  name: 'PollFilter',
  fields: {
    openOnly: { type: GraphQLBoolean },
  },
});

export const GraphQLPollSort = new GraphQLEnumType({
  name: 'PollSort',
  values: {
    [PollSort.OpensAt]: { value: PollSort.OpensAt },
    [PollSort.CreatedAt]: { value: PollSort.CreatedAt },
    [PollSort.ModifiedAt]: { value: PollSort.ModifiedAt },
  },
});

export const GraphQLPollWithAnswers = new GraphQLObjectType<Poll, Context>({
  name: 'PollWithAnswers',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    question: { type: GraphQLString },
    opensAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    closedAt: { type: GraphQLDateTime },
    answers: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLPollAnswer)),
    },
  },
});

export const GraphQLFullPoll = new GraphQLObjectType<Poll, Context>({
  name: 'FullPoll',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    question: { type: GraphQLString },
    opensAt: { type: new GraphQLNonNull(GraphQLDateTime) },
    closedAt: { type: GraphQLDateTime },
    infoText: { type: GraphQLRichText },

    answers: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPollAnswerWithVoteCount))
      ),
    },

    externalVoteSources: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLPollExternalVoteSource))
      ),
    },
  },
});

export const GraphQLUpdatePollAnswer = new GraphQLInputObjectType({
  name: 'UpdatePollAnswer',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    answer: { type: GraphQLString },
  },
});

export const GraphQLUpdatePollExternalVote = new GraphQLInputObjectType({
  name: 'UpdatePollExternalVote',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    amount: { type: VoteValue },
  },
});

export const GraphQLUpdatePollExternalVoteSources = new GraphQLInputObjectType({
  name: 'UpdatePollExternalVoteSources',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    source: { type: GraphQLString },
    voteAmounts: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLUpdatePollExternalVote)),
    },
  },
});
