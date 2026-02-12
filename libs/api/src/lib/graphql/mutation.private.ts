import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import { Context } from '../context';

import { GraphQLPeerProfile, GraphQLPeerProfileInput } from './peer';
import { upsertPeerProfile } from './peer-profile/peer-profile.private-mutation';
import {
  GraphQLFullPoll,
  GraphQLPollAnswer,
  GraphQLPollAnswerWithVoteCount,
  GraphQLPollExternalVoteSource,
  GraphQLPollWithAnswers,
  GraphQLUpdatePollAnswer,
  GraphQLUpdatePollExternalVoteSources,
} from './poll/poll';
import {
  createPoll,
  createPollAnswer,
  createPollExternalVoteSource,
  deletePoll,
  deletePollAnswer,
  deletePollExternalVoteSource,
  updatePoll,
} from './poll/poll.private-mutation';
import { GraphQLRichText } from '@wepublish/richtext/api';

export const GraphQLAdminMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    // Peering
    // =======

    updatePeerProfile: {
      type: new GraphQLNonNull(GraphQLPeerProfile),
      args: { input: { type: new GraphQLNonNull(GraphQLPeerProfileInput) } },
      resolve: (
        root,
        { input },
        { hostURL, authenticate, prisma: { peerProfile } }
      ) => upsertPeerProfile(input, hostURL, authenticate, peerProfile),
    },

    // Poll
    // ==========

    createPoll: {
      type: GraphQLPollWithAnswers,
      args: {
        opensAt: { type: GraphQLDateTime },
        closedAt: { type: GraphQLDateTime },
        question: { type: GraphQLString },
      },
      resolve: (root, input, { authenticate, prisma: { poll } }) =>
        createPoll(input, authenticate, poll),
    },

    createPollAnswer: {
      type: GraphQLPollAnswer,
      args: {
        pollId: { type: new GraphQLNonNull(GraphQLString) },
        answer: { type: GraphQLString },
      },
      resolve: (
        root,
        { pollId, answer },
        { authenticate, prisma: { pollExternalVoteSource, pollAnswer } }
      ) =>
        createPollAnswer(
          pollId,
          answer,
          authenticate,
          pollExternalVoteSource,
          pollAnswer
        ),
    },

    createPollExternalVoteSource: {
      type: GraphQLPollExternalVoteSource,
      args: {
        pollId: { type: new GraphQLNonNull(GraphQLString) },
        source: { type: GraphQLString },
      },
      resolve: (
        root,
        { pollId, source },
        { authenticate, prisma: { pollExternalVoteSource, pollAnswer } }
      ) =>
        createPollExternalVoteSource(
          pollId,
          source,
          authenticate,
          pollAnswer,
          pollExternalVoteSource
        ),
    },

    updatePoll: {
      type: GraphQLFullPoll,
      args: {
        pollId: { type: new GraphQLNonNull(GraphQLString) },
        opensAt: { type: GraphQLDateTime },
        closedAt: { type: GraphQLDateTime },
        question: { type: GraphQLString },
        infoText: { type: GraphQLRichText },
        answers: {
          type: new GraphQLList(new GraphQLNonNull(GraphQLUpdatePollAnswer)),
        },
        externalVoteSources: {
          type: new GraphQLList(
            new GraphQLNonNull(GraphQLUpdatePollExternalVoteSources)
          ),
        },
      },
      resolve: (
        root,
        { pollId, answers, externalVoteSources, ...pollInput },
        { authenticate, prisma: { poll } }
      ) =>
        updatePoll(
          pollId,
          pollInput,
          answers,
          externalVoteSources,
          authenticate,
          poll
        ),
    },

    deletePoll: {
      type: GraphQLFullPoll,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { poll } }) =>
        deletePoll(id, authenticate, poll),
    },

    deletePollAnswer: {
      type: GraphQLPollAnswerWithVoteCount,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (root, { id }, { authenticate, prisma: { pollAnswer } }) =>
        deletePollAnswer(id, authenticate, pollAnswer),
    },

    deletePollExternalVoteSource: {
      type: GraphQLPollExternalVoteSource,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (
        root,
        { id },
        { authenticate, prisma: { pollExternalVoteSource } }
      ) =>
        deletePollExternalVoteSource(id, authenticate, pollExternalVoteSource),
    },
  },
});
