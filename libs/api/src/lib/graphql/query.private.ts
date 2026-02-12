import { SortOrder } from '@wepublish/utils/api';
import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { Context } from '../context';

import { GraphQLSortOrder } from './common';

import { GraphQLPeerProfile } from './peer';
import {
  getAdminPeerProfile,
  getRemotePeerProfile,
} from './peer-profile/peer-profile.private-queries';
import {
  GraphQLFullPoll,
  GraphQLPollConnection,
  GraphQLPollFilter,
  GraphQLPollSort,
} from './poll/poll';
import { PollSort, getPolls } from './poll/poll.private-queries';
import { getPoll } from './poll/poll.public-queries';

export const GraphQLQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
    // Peering
    // =======

    remotePeerProfile: {
      type: GraphQLPeerProfile,
      args: {
        hostURL: { type: new GraphQLNonNull(GraphQLString) },
        token: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (
        root,
        { hostURL, token },
        { authenticate, prisma: { setting } },
        info
      ) => getRemotePeerProfile(hostURL, token, authenticate, info, setting),
    },

    peerProfile: {
      type: new GraphQLNonNull(GraphQLPeerProfile),
      resolve: (
        root,
        args,
        { authenticate, hostURL, websiteURL, prisma: { peerProfile } }
      ) => getAdminPeerProfile(hostURL, websiteURL, authenticate, peerProfile),
    },

    // Polls
    // =======

    polls: {
      type: GraphQLPollConnection,
      args: {
        cursor: { type: GraphQLString },
        take: { type: GraphQLInt, defaultValue: 10 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        filter: { type: GraphQLPollFilter },
        sort: { type: GraphQLPollSort, defaultValue: PollSort.OpensAt },
        order: { type: GraphQLSortOrder, defaultValue: SortOrder.Descending },
      },
      resolve: (
        root,
        { cursor, take, skip, filter, sort, order },
        { authenticate, prisma: { poll } }
      ) =>
        getPolls(filter, sort, order, cursor, skip, take, authenticate, poll),
    },

    poll: {
      type: GraphQLFullPoll,
      args: {
        id: { type: GraphQLString },
      },
      resolve: (root, { id }, { prisma: { poll } }) => getPoll(id, poll),
    },
  },
});
